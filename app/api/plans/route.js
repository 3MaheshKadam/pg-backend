import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PlatformPlan from "@/models/PlatformPlan";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role"); // PG_OWNER or MESS_OWNER

        const query = { isActive: true };
        if (role) query.type = role;

        const plans = await PlatformPlan.find(query).sort({ price: 1 });

        return NextResponse.json(plans);
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
