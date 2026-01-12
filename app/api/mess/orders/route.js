import { NextResponse } from "next/server";

// MOCK DATA for now, as we don't have an Order Model yet
// Ideally, you would create an Order Model similar to Booking but for Meals
const orders = [
    {
        id: "order_1",
        customer: "Rahul Sharma",
        plan: "Full Day Meal",
        meals: ["Breakfast", "Lunch"],
        type: "Veg",
        status: "active",
        time: "8:00 AM - 8:00 PM",
        date: "2024-01-20",
        rating: 5
    },
    {
        id: "order_2",
        customer: "Amit Verma",
        plan: "Dinner Only",
        meals: ["Dinner"],
        type: "Non-Veg",
        status: "completed",
        time: "8:00 PM",
        date: "2024-01-19",
        rating: 4
    }
];

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";

    // filtering logic (Mock)
    let filtered = orders;
    if (tab === "completed") filtered = orders.filter(o => o.status === "completed");
    if (tab === "active") filtered = orders.filter(o => o.status === "active");

    return NextResponse.json(filtered);
}

export async function PATCH(req, { params }) {
    // Update status logic
    const body = await req.json();
    return NextResponse.json({ message: "Order status updated", status: body.status });
}
