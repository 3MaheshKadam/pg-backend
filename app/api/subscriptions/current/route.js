import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import OwnerSubscription from "@/models/OwnerSubscription";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();

        // Auth Check
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Efficient: Check User Model First
        const User = (await import("@/models/User")).default;
        const user = await User.findById(auth.userId);

        // Lazy Expiry Check
        if (!user || user.subscriptionStatus !== "active" || (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())) {
            return NextResponse.json({ hasActiveSubscription: false });
        }

        // Fetch Plan Details (Double Check)
        const activeSub = await OwnerSubscription.findOne({
            ownerId: auth.userId,
            status: "active",
            validTill: { $gte: new Date() }
        }).populate("planId", "name features");

        if (!activeSub) return NextResponse.json({ hasActiveSubscription: false });

        const daysLeft = Math.ceil((new Date(activeSub.validTill) - new Date()) / (1000 * 60 * 60 * 24));

        return NextResponse.json({
            hasActiveSubscription: true,
            planName: activeSub.planId?.name,
            daysLeft,
            validTill: activeSub.validTill.toISOString().split('T')[0],
            features: activeSub.planId?.features || []
        });

    } catch (error) {
        console.error("Fetch Current Sub Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
