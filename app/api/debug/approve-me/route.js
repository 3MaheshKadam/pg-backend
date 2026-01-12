import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import mongoose from "mongoose";

export async function GET(req) {
    try {
        await dbConnect();
        const ownerId = "695d4e4025dad1463670b591";

        const res = await PGListing.updateMany(
            { ownerId: ownerId },
            { $set: { approved: true, status: "active" } }
        );

        return NextResponse.json({
            message: "Fixed Approval Status",
            result: res
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
