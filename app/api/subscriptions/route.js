import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessSubscription from "@/models/MessSubscription";
import Mess from "@/models/Mess";
import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
    try {
        await dbConnect();

        let userId;
        try {
            const auth = await verifyAuth();
            userId = auth.userId;
        } catch (e) {
            return NextResponse.json({ message: "Please login to subscribe" }, { status: 401 });
        }

        const body = await req.json();
        const {
            messId,
            planId,
            planName,
            price,
            startDate,
            customerName,
            phone,
            email,
            address
        } = body;

        // Verify Mess
        const mess = await Mess.findById(messId);
        if (!mess) {
            return NextResponse.json({ message: "Mess not found" }, { status: 404 });
        }

        // Calculate End Date (Mocking 30 days for now, ideally comes from plan details)
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 30);

        const newSubscription = await MessSubscription.create({
            messId,
            ownerId: mess.ownerId, // Capture Owner ID for isolation
            plan: {
                planId: Number(planId),
                name: planName,
                meals: ["Lunch", "Dinner"], // Defaulting, should come from selected plan details
                duration: "30 days",
                price: Number(price.replace(/[^0-9]/g, '')) // Remove non-numeric chars
            },
            startDate: start,
            endDate: end,
            type: "Veg", // Default
            personalInfo: {
                name: customerName,
                phone,
                email,
                address
            },
            payment: {
                amount: Number(price.replace(/[^0-9]/g, '')),
                paymentStatus: "paid" // Assuming immediate payment mock
            },
            status: "active",
            createdBy: userId
        });

        return NextResponse.json({
            message: "Subscription active!",
            subscriptionId: newSubscription._id
        }, { status: 201 });

    } catch (error) {
        console.error("Subscription Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const subs = await MessSubscription.find({ createdBy: auth.userId })
            .populate("messId", "name address")
            .sort({ createdAt: -1 });

        const formattedSubs = subs.map(s => ({
            id: s._id,
            messName: s.messId?.name || "Unknown Mess",
            planName: s.plan.name,
            status: s.status,
            startDate: s.startDate.toISOString().split('T')[0],
            endDate: s.endDate.toISOString().split('T')[0]
        }));

        return NextResponse.json(formattedSubs);

    } catch (error) {
        console.error("Fetch Sub Error", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
