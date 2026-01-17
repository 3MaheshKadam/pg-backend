import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();

        const authRecord = await verifyAuth();
        if (!authRecord) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findById(authRecord.userId).select("-password");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error("Fetch Me Error:", error);
        return NextResponse.json(
            { message: "Server Error" },
            { status: 500 }
        );
    }
}
