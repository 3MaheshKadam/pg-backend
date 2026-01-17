import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Favorite from "@/models/Favorite";
import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
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

        const body = await req.json();
        const { listingId, type } = body; // type: "PG" or "MESS"

        if (!listingId || !type) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine correct model name for reference
        const onModel = type === "PG" ? "PGListing" : "Mess";

        // 2. Check existence
        const existing = await Favorite.findOne({
            user: userId,
            item: listingId,
        });

        if (existing) {
            // Toggle OFF: Remove
            await Favorite.findByIdAndDelete(existing._id);
            return NextResponse.json({
                isFavorite: false,
                message: "Removed from favorites"
            });
        } else {
            // Toggle ON: Create
            await Favorite.create({
                user: userId,
                item: listingId,
                onModel,
                type // Storing "PG" or "MESS" as well as per schema
            });
            return NextResponse.json({
                isFavorite: true,
                message: "Added to favorites"
            });
        }

    } catch (error) {
        console.error("Toggle Favorite Error:", error);
        return NextResponse.json(
            { message: "Server Error" },
            { status: 500 }
        );
    }
}
