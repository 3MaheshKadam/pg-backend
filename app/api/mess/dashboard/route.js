import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess"; // You might need to link user to mess first
import MessSubscription from "@/models/MessSubscription";
import MessPlan from "@/models/MessPlan";
import MessOrder from "@/models/MessOrder";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

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

    // Count today's orders
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysOrders = await MessOrder.countDocuments({
        ownerId,
        orderDate: { $gte: startOfDay, $lte: endOfDay }
    });

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

        // Fetch the owner's mess to get the menu
        const activeMess = await Mess.findOne({ ownerId: auth.userId });

        const todayMenu = [];
        if (activeMess && activeMess.todayMenu) {
            const { breakfast, lunch, dinner, special } = activeMess.todayMenu;
            if (breakfast) todayMenu.push({ meal: 'Breakfast', time: '7:00 AM - 10:00 AM', items: breakfast, icon: 'sunny-outline' });
            if (lunch) todayMenu.push({ meal: 'Lunch', time: '12:00 PM - 3:00 PM', items: lunch, icon: 'restaurant-outline' });
            if (dinner) todayMenu.push({ meal: 'Dinner', time: '7:00 PM - 10:00 PM', items: dinner, icon: 'moon-outline' });
            if (special) todayMenu.push({ meal: 'Special', time: 'All Day', items: special, icon: 'star-outline' });
        }

        // Fetch Recent Orders
        const recentOrdersRaw = await MessOrder.find({ ownerId: auth.userId })
            .sort({ orderDate: -1 })
            .limit(5);

        const recentOrders = recentOrdersRaw.map(order => ({
            id: order._id,
            customerName: order.customerName,
            planName: order.planName,
            status: order.status,
            time: order.timeSlot || new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        return NextResponse.json({
            stats,
            todayMenu,
            recentOrders,
            performance: {
                totalOrders: stats.todaysOrders, // Placeholder logic for now
                ordersGrowth: 0,
                newSubscribers: stats.totalSubscribers,
                subscribersGrowth: 0
            },
            subscriptionRate: {
                percentage: Math.min(stats.totalSubscribers, 100), // Placeholder logic
                subscribed: stats.totalSubscribers,
                capacityLeft: 100 - Math.min(stats.totalSubscribers, 100)
            }
        });

    } catch (error) {
        console.error("Dashboard Config Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
