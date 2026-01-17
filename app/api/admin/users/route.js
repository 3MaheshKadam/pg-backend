import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import PGListing from "@/models/PGListing";
import Mess from "@/models/Mess";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_dev";

// Helper to verify Admin
async function isAdmin(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.role === "ADMIN";
    } catch (error) {
        return false;
    }
}

// GET: List all users (Optionally filtered by role/status/subscription)
export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");
        const status = searchParams.get("status");

        // New Filter: Subscription Status (active/expired)
        const subStatus = searchParams.get("subStatus");

        // Check Admin Authorization
        if (!(await isAdmin(req))) {
            return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
        }

        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;

        // Direct DB Filtering (Efficient)
        if (subStatus) query.subscriptionStatus = subStatus;

        // Fetch Users - Now sorting by Subscription Expiry is possible too!
        const users = await User.find(query)
            .select("-password")
            .sort({ subscriptionExpiry: -1, createdAt: -1 });

        // Lazy Load Plan Name + Check Expiry
        const usersWithSub = await Promise.all(users.map(async (user) => {
            // Lazy Status Check (Edge case: Status says active but date expired today)
            let currentStatus = user.subscriptionStatus || "inactive";
            if (currentStatus === "active" && user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
                currentStatus = "expired";
            }

            // Only fetch plan details if active
            let planName = null;
            if (currentStatus === "active") {
                const sub = await import("@/models/OwnerSubscription").then(mod => mod.default.findOne({
                    ownerId: user._id,
                    status: "active"
                }).sort({ createdAt: -1 }).populate("planId", "name"));
                if (sub) planName = sub.planId?.name;
            }

            return {
                ...user.toObject(),
                subscription: {
                    status: currentStatus.toUpperCase(),
                    planName: planName,
                    validTill: user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toISOString().split('T')[0] : null
                }
            };
        }));

        return NextResponse.json({ users: usersWithSub });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// PATCH: Approve or Reject a user
export async function PATCH(req) {
    try {
        await dbConnect();

        // Check Admin Authorization
        if (!(await isAdmin(req))) {
            return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
        }

        const { userId, action } = await req.json(); // action: "approve" or "reject"

        if (!userId || !["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { message: "Invalid request. Provide userId and action ('approve' or 'reject')" },
                { status: 400 }
            );
        }

        const newStatus = action === "approve" ? "approved" : "rejected";

        const user = await User.findByIdAndUpdate(
            userId,
            { status: newStatus },
            { new: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // --- SYNC STATUS WITH LISTINGS/MESS ---
        // If User is approved, we should also activate their Listings/Mess
        if (newStatus === "approved") {
            if (user.role === "PG_OWNER") {
                await PGListing.updateMany({ ownerId: user._id }, { status: "active" });
            } else if (user.role === "MESS_OWNER") {
                await Mess.updateMany({ ownerId: user._id }, { approved: true });
            }
        } else if (newStatus === "rejected") {
            // If rejected, we disable them
            if (user.role === "PG_OWNER") {
                await PGListing.updateMany({ ownerId: user._id }, { status: "inactive" });
            } else if (user.role === "MESS_OWNER") {
                await Mess.updateMany({ ownerId: user._id }, { approved: false });
            }
        }

        return NextResponse.json({
            message: `User ${newStatus} successfully. Associated listings updated.`,
            user,
        });
    } catch (error) {
        console.error("Admin Action Error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
