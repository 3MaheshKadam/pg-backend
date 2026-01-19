import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import User from "@/models/User"; // Ensure User model is registered
import PGRoom from "@/models/PGRoom";

export async function GET(req) {
    try {
        await dbConnect();

        // Optional: Filter by Location or Type via query params
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const type = searchParams.get("type");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const amenities = searchParams.get("amenities"); // comma separated

        const query = {
            approved: true,
            status: "active"
        };

        if (search) {
            query.$or = [
                { location: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } } // Added address search
            ];
        }

        if (type) {
            // Basic case-insensitive match for type (Boys, Girls, Co-living)
            query.type = { $regex: new RegExp(`^${type}$`, "i") };
        }

        if (minPrice || maxPrice) {
            query["pricing.rentMin"] = {};
            if (minPrice) query["pricing.rentMin"].$gte = Number(minPrice);
            if (maxPrice) query["pricing.rentMin"].$lte = Number(maxPrice);
        }

        if (amenities) {
            const amenitiesList = amenities.split(",");
            amenitiesList.forEach(amenity => {
                query[`amenities.${amenity.trim()}`] = true;
            });
        }

        // 1. Fetch Listings
        const pgs = await PGListing.find(query)
            .populate("ownerId", "status") // Fetch Owner Status only
            .sort({ createdAt: -1 });

        // 2. Filter: Only show if Owner is ALSO active/approved
        const validPgs = pgs.filter(pg => {
            return pg.ownerId && (pg.ownerId.status === "approved" || pg.ownerId.status === "active");
        });

        // 3. Enrich with Real Room Counts (Async)
        const enrichedPgs = await Promise.all(validPgs.map(async (pg) => {
            const roomCount = await PGRoom.countDocuments({ pgId: pg._id, status: 'active' });

            return {
                id: pg._id,
                name: pg.name,
                location: pg.location,
                price: `₹${pg.pricing.rentMin}/month`,
                rating: 4.5, // Mock
                reviews: 124, // Mock
                type: pg.type,
                amenities: Object.keys(pg.amenities).filter(k => pg.amenities[k]), // ["wifi", "ac"]
                availability: `${pg.totalBeds} beds total`, // Capacity
                roomCount: roomCount, // Real count of added rooms
                description: pg.description
            };
        }));

        return NextResponse.json(enrichedPgs);

    } catch (error) {
        console.error("Fetch Public PGs Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
