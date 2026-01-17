import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PlatformPlan from "@/models/PlatformPlan";

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const updatedPlan = await PlatformPlan.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        if (!updatedPlan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json(updatedPlan);
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        // Soft Delete
        const updatedPlan = await PlatformPlan.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!updatedPlan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Plan deactivated successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
