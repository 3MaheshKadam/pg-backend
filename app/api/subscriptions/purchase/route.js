import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OwnerSubscription from "@/models/OwnerSubscription";
import PlatformPlan from "@/models/PlatformPlan";
import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
    try {
        await dbConnect();

        // Auth Check
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { planId, paymentMethod, transactionId } = body;

        // Verify Plan
        const plan = await PlatformPlan.findById(planId);
        if (!plan || !plan.isActive) {
            return NextResponse.json({ message: "Invalid or inactive plan" }, { status: 400 });
        }

        // Check for Existing Active Subscription
        // "Upgrade/Overlap" Logic: Expire the old one, start the new one immediately
        const activeSub = await OwnerSubscription.findOne({
            ownerId: auth.userId,
            status: "active",
            validTill: { $gt: new Date() }
        });

        if (activeSub) {
            // Mark old as cancelled/upgraded
            activeSub.status = "cancelled";
            await activeSub.save();
        }

        // Calculate Dates
        const validFrom = new Date();
        const validTill = new Date(validFrom);
        validTill.setDate(validFrom.getDate() + plan.durationDays);

        // Create Subscription
        const newSub = await OwnerSubscription.create({
            ownerId: auth.userId,
            planId: plan._id,
            validFrom,
            validTill,
            status: "active",
            paymentMethod,
            transactionId
        });

        // UPDATE USER MODEL (Denormalization for Performance)
        // This satisfies the requirement for efficient Admin filtering
        const User = (await import("@/models/User")).default;
        await User.findByIdAndUpdate(auth.userId, {
            subscriptionStatus: "active",
            subscriptionExpiry: validTill
        });

        // UPDATE LINKED MODELS (PG & Mess)
        // Ensure their status is also synced for easy frontend checks
        const PGListing = (await import("@/models/PGListing")).default;
        const Mess = (await import("@/models/Mess")).default;

        await PGListing.updateMany({ ownerId: auth.userId }, { subscriptionStatus: "active" });
        await Mess.updateMany({ ownerId: auth.userId }, { subscriptionStatus: "active" });

        return NextResponse.json({
            message: "Subscription active",
            subscriptionId: newSub._id,
            validFrom: validFrom.toISOString().split('T')[0],
            validTill: validTill.toISOString().split('T')[0],
            status: "active"
        }, { status: 201 });

    } catch (error) {
        console.error("Purchase Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
