import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess";
import User from "@/models/User"; // Ensure User model is registered

export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const type = searchParams.get("type"); // veg, non-veg

        const query = {
            approved: true,
            // Mess doesn't exact have 'status' field like PG, approved is enough or check schema
        };

        if (search) {
            query.$or = [
                { address: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } }
            ];
        }

        if (type) {
            // type matches 'veg' or 'nonveg' in foodTypes array
            if (type.toLowerCase() === "veg") {
                // Check if it includes 'veg' but implies strict veg? 
                // Usually means foodTypes contains "veg" and NOT "nonveg" if strict?
                // Or just contains "veg"? 
                // Based on req "veg | non-veg", let's assume filtering by available food type.
                query.foodTypes = { $in: ["veg"] };
            } else if (type.toLowerCase() === "non-veg" || type.toLowerCase() === "nonveg") {
                query.foodTypes = { $in: ["nonveg"] };
            }
        }

        const messes = await Mess.find(query)
            .populate("ownerId", "status")
            .sort({ createdAt: -1 });

        // Filter: Check Owner Status
        const validMesses = messes.filter(m => {
            return m.ownerId && (m.ownerId.status === "approved" || m.ownerId.status === "active");
        });

        const formattedMesses = validMesses.map(m => ({
            id: m._id,
            name: m.name,
            location: m.address, // Mapping address to location
            price: m.pricing?.monthlyPrice ? `₹${m.pricing.monthlyPrice}/month` : "₹3,500/month",
            rating: 4.6, // Mock
            reviews: 234, // Mock
            type: m.foodTypes.includes("nonveg") ? "Both" : "Veg",
            meals: Object.keys(m.mealTypes).filter(k => m.mealTypes[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            subscribers: "120 active", // Mock
            subscriptionStatus: m.subscriptionStatus || "inactive"
        }));

        return NextResponse.json(formattedMesses);

    } catch (error) {
        console.error("Fetch Public Messes Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Check if user already has a mess
        const existingMess = await Mess.findOne({ ownerId: auth.userId });
        if (existingMess) {
            return NextResponse.json({ message: "You already have a mess listing" }, { status: 400 });
        }

        const body = await req.json();
        // Validation (simplified, rely on schema or client for full validation)
        if (!body.name || !body.address) {
            return NextResponse.json({ message: "Name and Address are required" }, { status: 400 });
        }

        const newMess = await Mess.create({
            ...body,
            ownerId: auth.userId,
            approved: false // Default to pending
        });

        return NextResponse.json({ message: "Mess created successfully", mess: newMess }, { status: 201 });

    } catch (error) {
        console.error("Create Mess Error:", error);
        return NextResponse.json({ message: "Failed to create mess" }, { status: 500 });
    }
}
