import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import Mess from "@/models/Mess";
import User from "@/models/User";

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Force add 'approved: true' to ALL PGs, even if field is missing
        const pgs = await PGListing.updateMany(
            {},
            { $set: { approved: true, status: "active" } }
        );

        // 2. Force add 'approved: true' to ALL Messes
        const messes = await Mess.updateMany(
            {},
            { $set: { approved: true } }
        );

        // 3. Force activate Owners
        const users = await User.updateMany(
            { role: { $in: ["PG_OWNER", "MESS_OWNER"] } },
            { $set: { status: "active" } }
        );

        return NextResponse.json({
            message: "Data Fixed and Approved!",
            updatedPGs: pgs.modifiedCount || pgs.matchedCount,
            updatedMesses: messes.modifiedCount || messes.matchedCount,
            updatedUsers: users.modifiedCount || users.matchedCount
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
