import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess";

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
