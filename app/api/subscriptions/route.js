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

        // Calculate End Date
        let start;
        // Check if date is in DD/MM/YYYY format (contains /)
        if (startDate && startDate.includes('/')) {
            const [day, month, year] = startDate.split('/');
            // Check if parts are valid
            if (day && month && year) {
                start = new Date(`${year}-${month}-${day}`);
            } else {
                start = new Date(startDate); // Fallback
            }
        } else {
            // Assume Standard ISO YYYY-MM-DD
            start = new Date(startDate);
        }

        if (isNaN(start.getTime())) {
            return NextResponse.json({ message: "Invalid Date Format. Please use YYYY-MM-DD or DD/MM/YYYY" }, { status: 400 });
        }

        const end = new Date(start);
        end.setDate(start.getDate() + 30); // Default 30 days, should come from plan.duration ideally

        const newSubscription = await MessSubscription.create({
            messId,
            ownerId: mess.ownerId,
            plan: {
                planId, // Passed as string/ObjectId, schema handles it
                name: planName,
                meals: ["Lunch", "Dinner"],
                duration: "30 days",
                price: Number(String(price).replace(/[^0-9]/g, ''))
            },
            startDate: start,
            endDate: end,
            type: "Veg",
            personalInfo: {
                name: customerName,
                phone,
                email,
                address
            },
            payment: {
                amount: Number(String(price).replace(/[^0-9]/g, '')),
                paymentStatus: "paid"
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

        const formattedSubs = subs.map(s => {
            // Calculate Days Left
            const now = new Date();
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);

            // If subscription hasn't started yet, daysLeft should be total duration
            const calcFrom = now < start ? start : now;
            const diffTime = end - calcFrom;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                id: s._id,
                messName: s.messId?.name || "Unknown Mess",
                planName: s.plan.name,
                status: s.status,
                price: s.plan.price, // Added Price
                duration: s.plan.duration,
                startDate: s.startDate.toISOString().split('T')[0],
                endDate: s.endDate.toISOString().split('T')[0],
                daysLeft: daysLeft > 0 ? daysLeft : 0 // Calculated Days Left
            };
        });

        return NextResponse.json(formattedSubs);

    } catch (error) {
        console.error("Fetch Sub Error", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
