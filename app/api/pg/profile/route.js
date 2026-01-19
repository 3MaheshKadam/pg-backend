import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Verify Auth
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Owner's PG
        const pg = await PGListing.findOne({ ownerId: auth.userId });

        if (!pg) {
            return NextResponse.json({ message: "No PG Listing found for this owner" }, { status: 404 });
        }

        // Lazy Sync: If Owner is approved by Admin but PG isn't synced yet
        if (!pg.approved || pg.status !== 'active') {
            const User = (await import("@/models/User")).default;
            const user = await User.findById(auth.userId);
            if (user && user.status === 'approved') {
                pg.approved = true;
                pg.status = 'active';
                await pg.save();
                console.log(`[Lazy Sync] PG Listing ${pg._id} activated for Approved Owner ${auth.userId}`);
            }
        }

        return NextResponse.json(pg);

    } catch (error) {
        console.error("Fetch Owner Profile Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
