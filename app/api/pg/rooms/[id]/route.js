import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGRoom from "@/models/PGRoom";

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const updatedRoom = await PGRoom.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        if (!updatedRoom) {
            return NextResponse.json({ message: "Room not found" }, { status: 404 });
        }

        return NextResponse.json(updatedRoom);

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const deletedRoom = await PGRoom.findByIdAndDelete(id);

        if (!deletedRoom) {
            return NextResponse.json({ message: "Room not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Room deleted successfully" });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
