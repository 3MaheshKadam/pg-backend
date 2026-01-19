import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Verify Auth
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Owner's Mess
        const mess = await Mess.findOne({ ownerId: auth.userId });

        if (!mess) {
            return NextResponse.json({ message: "No Mess Listing found for this owner" }, { status: 404 });
        }

        // Lazy Sync: If Owner is approved by Admin but Mess isn't synced yet
        if (!mess.approved) {
            const User = (await import("@/models/User")).default;
            const user = await User.findById(auth.userId);
            if (user && user.status === 'approved') {
                mess.approved = true;
                await mess.save();
                console.log(`[Lazy Sync] Mess Listing ${mess._id} activated for Approved Owner ${auth.userId}`);
            }
        }

        return NextResponse.json(mess);

    } catch (error) {
        console.error("Fetch Mess Profile Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
