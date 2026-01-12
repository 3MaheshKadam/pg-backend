import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessSubscription from "@/models/MessSubscription";

export async function GET(req) {
    try {
        await dbConnect();
        // Filter by Mess ID (from Token in real app)
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // Optional filter

        // Mocking messId logic
        const query = {}; // Add messId: ...

        if (type) query.type = type;

        const subscriptions = await MessSubscription.find(query).sort({ createdAt: -1 });

        const formattedSubs = subscriptions.map(sub => {
            // Calculate Days Left
            const today = new Date();
            const end = new Date(sub.endDate);
            const diffTime = Math.abs(end - today);
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                id: sub._id,
                name: sub.personalInfo.name,
                phone: sub.personalInfo.phone,
                email: sub.personalInfo.email,
                planName: sub.plan.name,
                type: sub.type || "Veg",
                startDate: sub.startDate.toISOString().split('T')[0],
                endDate: sub.endDate.toISOString().split('T')[0],
                daysLeft: daysLeft > 0 ? daysLeft : 0,
                status: daysLeft > 0 ? "active" : "expired"
            };
        });

        return NextResponse.json(formattedSubs);

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
