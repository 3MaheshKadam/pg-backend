import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessOrder from "@/models/MessOrder";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Auth Check - Mess Owners Only
        const auth = await verifyAuth();
        if (!auth || auth.role !== "MESS_OWNER") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const tab = searchParams.get("tab") || "all";

        // 2. Build Query
        const query = { ownerId: auth.userId };

        if (tab === "active") {
            query.status = "active";
            // Optional: Filter by today's date? 
            // query.orderDate = { $gte: new Date().setHours(0,0,0,0) };
        } else if (tab === "completed") {
            query.status = "completed";
        }

        // 3. Fetch from DB
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // If "active", usually implies today's pending orders
        // If "completed", usually implies history
        // Allowing 'all' to return everything sorted by date

        const orders = await MessOrder.find(query).sort({ orderDate: -1 });

        // 4. Format for Frontend
        const formattedOrders = orders.map(order => ({
            id: order._id,
            customer: order.customerName,
            plan: order.planName,
            meals: order.meals,
            type: order.type,
            status: order.status,
            time: order.timeSlot || "N/A",
            date: order.orderDate.toISOString().split('T')[0],
            rating: 5 // Placeholder
        }));

        return NextResponse.json(formattedOrders);

    } catch (error) {
        console.error("Fetch Orders Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || auth.role !== "MESS_OWNER") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { orderId, status } = body;

        // Note: Route logic used body for update, usually PATCH uses ID in URL.
        // Keeping it consistent with previous mock logic but adding validation.

        if (!orderId || !["active", "completed", "cancelled"].includes(status)) {
            return NextResponse.json({ message: "Invalid Request" }, { status: 400 });
        }

        const updatedOrder = await MessOrder.findOneAndUpdate(
            { _id: orderId, ownerId: auth.userId }, // Ensure ownership
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Order updated", order: updatedOrder });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
