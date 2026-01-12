import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGBooking from "@/models/PGBooking";
import PGRoom from "@/models/PGRoom";

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params; // Next.js 15
        const body = await req.json();
        const { status, roomNumber } = body;

        const updates = { status };

        // If Approved and Room Number provided, find room and link it
        if (status === "approved" && roomNumber) {
            const room = await PGRoom.findOne({ roomNumber }); // Should filter by PG ID too realistically
            if (room) {
                updates.roomId = room._id;
                // Increment room occupancy? Needs logic but out of scope for simple API
                room.occupied += 1;
                await room.save();
            }
        }

        const updatedBooking = await PGBooking.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );

        if (!updatedBooking) {
            return NextResponse.json({ message: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json(updatedBooking);

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
