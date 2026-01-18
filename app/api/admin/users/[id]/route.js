import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import PGListing from "@/models/PGListing";
import Mess from "@/models/Mess";
import { verifyAuth } from "@/lib/auth";

// Helper to handle user status update
async function updateUserStatus(userId, action) {
    const newStatus = action === "approve" ? "approved" : "rejected";

    const user = await User.findByIdAndUpdate(
        userId,
        { status: newStatus },
        { new: true }
    ).select("-password");

    if (!user) return null;

    // Sync Listings
    if (newStatus === "approved") {
        if (user.role === "PG_OWNER") {
            await PGListing.updateMany({ ownerId: user._id }, { status: "active" });
        } else if (user.role === "MESS_OWNER") {
            await Mess.updateMany({ ownerId: user._id }, { approved: true });
        }
    } else if (newStatus === "rejected") {
        if (user.role === "PG_OWNER") {
            await PGListing.updateMany({ ownerId: user._id }, { status: "inactive" });
        } else if (user.role === "MESS_OWNER") {
            await Mess.updateMany({ ownerId: user._id }, { approved: false });
        }
    }
    return user;
}



export async function GET(req, { params }) {
    try {
        await dbConnect();

        // 1. Auth Check
        /* 
        const decoded = await verifyAuth().catch(() => null);
        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        */

        const { id } = await params;
        const user = await User.findById(id).select("-password").lean();

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        let business = null;
        if (user.role === "PG_OWNER") {
            // Fetch PG details
            business = await PGListing.findOne({ ownerId: id }).lean();
        } else if (user.role === "MESS_OWNER") {
            // Fetch Mess details
            business = await Mess.findOne({ ownerId: id }).lean();
        }

        // Return User merged with Business info
        return NextResponse.json({
            ...user,
            business: business || null
        });

    } catch (error) {
        console.error("Fetch Owner Details Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        await dbConnect();

        // 1. Auth Check - Logged for debugging
        const decoded = await verifyAuth();
        if (!decoded || decoded.role !== "ADMIN") {
            console.error("Admin Auth Failed:", decoded ? `Role: ${decoded.role}` : "No Token");
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { id } = await params; // Next.js 15+ params are promises, assuming standard here or await it
        const { action } = await req.json();

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const user = await updateUserStatus(id, action);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: `User ${action}d successfully`, user });

    } catch (error) {
        console.error("Update User Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
