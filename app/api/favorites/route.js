import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Favorite from "@/models/Favorite";
import { verifyAuth } from "@/lib/auth";
import PGListing from "@/models/PGListing"; // Ensure models are registered
import Mess from "@/models/Mess"; // Ensure models are registered

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authRecord = await verifyAuth();
        if (!authRecord) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        const { userId } = authRecord;

        // 2. Fetch Favorites
        const favorites = await Favorite.find({ user: userId })
            .populate("item") // Dynamically populates based on onModel
            .sort({ createdAt: -1 });

        // 3. Transform / Filter
        // Filter out items that might have been deleted (populated item is null)
        const validFavorites = favorites.filter(f => f.item);

        const formattedFavorites = validFavorites.map(f => {
            const item = f.item;
            // Basic normalization of fields for UI
            return {
                favoriteId: f._id,
                listingId: item._id,
                type: f.type, // PG or MESS
                name: item.name,
                address: item.address,
                location: item.location || item.address, // Mess doesn't have location field separate usually
                price: f.type === "PG" ? item.pricing?.rentMin : item.pricing?.monthlyPrice,
                image: item.images?.[0] || null // Assuming images array (not in snippets but likely exists)
            };
        });

        return NextResponse.json(formattedFavorites);

    } catch (error) {
        console.error("Get Favorites Error:", error);
        return NextResponse.json(
            { message: "Server Error" },
            { status: 500 }
        );
    }
}
