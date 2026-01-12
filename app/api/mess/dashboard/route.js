import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess"; // You might need to link user to mess first
import MessSubscription from "@/models/MessSubscription";
import MessPlan from "@/models/MessPlan";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth";

// Helper to get stats (Dynamic)
async function getStats(ownerId) {
    const totalSubscribers = await MessSubscription.countDocuments({ ownerId, status: "active" });
    const activePlans = await MessPlan.countDocuments({ ownerId, status: "active" });

    // Dynamic Revenue Calculation (Sum of paid subscriptions)
    const revenueResult = await MessSubscription.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(ownerId),
                "payment.paymentStatus": "paid"
            }
        },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } }
    ]);

    const monthlyRevenue = revenueResult[0]?.total || 0;
    const todaysOrders = 0; // Dynamic Order model doesn't exist yet

    return {
        activePlans,
        totalSubscribers,
        todaysOrders,
        monthlyRevenue
    };
}

export async function GET(req) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Pass ownerId (userId) to getStats instead of messId
        const stats = await getStats(auth.userId);

        return NextResponse.json({
            stats,
            todayMenu: [], // Empty until Menu Module is built
            recentOrders: [], // Empty until Order Module is built
            performance: {
                totalOrders: 0,
                ordersGrowth: 0,
                newSubscribers: stats.totalSubscribers,
                subscribersGrowth: 0
            },
            subscriptionRate: {
                percentage: 0,
                subscribed: stats.totalSubscribers,
                capacityLeft: 0
            }
        });

    } catch (error) {
        console.error("Dashboard Config Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
