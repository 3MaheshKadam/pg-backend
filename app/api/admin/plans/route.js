import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PlatformPlan from "@/models/PlatformPlan";
import { verifyAuth } from "@/lib/auth"; // Assuming strict admin auth wraps these usually

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        const query = {};
        if (type) query.type = type;

        const plans = await PlatformPlan.find(query).sort({ price: 1 });

        return NextResponse.json(plans);
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        // Basic Validation
        if (!body.name || !body.price || !body.type) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const newPlan = await PlatformPlan.create(body);

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
