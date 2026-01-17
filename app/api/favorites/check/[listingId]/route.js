import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Favorite from "@/models/Favorite";
import { verifyAuth } from "@/lib/auth";

export async function GET(req, { params }) {
    try {
        // Await params first
        const resolvedParams = await params;
        const { listingId } = resolvedParams;

        await dbConnect();

        // 1. Auth Check
        const authRecord = await verifyAuth();
        if (!authRecord) {
            // If not logged in, obviously not favorite (or we can return 401, but usually false is safer for UI checks)
            return NextResponse.json({ isFavorite: false });
        }
        const { userId } = authRecord;

        // 2. Check
        const exists = await Favorite.exists({ user: userId, item: listingId });

        return NextResponse.json({ isFavorite: !!exists });

    } catch (error) {
        console.error("Check Favorite Error:", error);
        return NextResponse.json(
            { message: "Server Error" },
            { status: 500 }
        );
    }
}
