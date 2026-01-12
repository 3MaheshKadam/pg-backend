import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Mess from "@/models/Mess";
import PGListing from "@/models/PGListing";
import { verifyAuth } from "@/lib/auth"; // Assume we implemented this

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Verify Admin (Optional but recommended)
        /*
        const auth = await verifyAuth().catch(() => null);
        if (!auth || auth.role !== "ADMIN") {
             return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        */

        // 2. Fetch Pending Users (Owners)
        const pendingUsers = await User.find({ status: "pending" }).select("-password");

        // 3. Fetch Pending Messes
        const pendingMesses = await Mess.find({ approved: false }).populate("ownerId", "name email phone");

        // 4. Fetch Pending PGs
        const pendingPGs = await PGListing.find({ approved: false }).populate("ownerId", "name email phone");

        return NextResponse.json({
            users: pendingUsers,
            messes: pendingMesses,
            pgs: pendingPGs
        });

    } catch (error) {
        console.error("Admin Fetch Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
