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

        // 1. Find the booking
        const booking = await PGBooking.findById(id);
        if (!booking) {
            return NextResponse.json({ message: "Booking not found" }, { status: 404 });
        }

        // 2. If status is changing to 'approved'
        if (status === 'approved' && booking.status !== 'approved') {

            let room;

            // 3. Determine Room
            if (booking.roomId) {
                // Case A: Booking already has a room linked
                room = await PGRoom.findById(booking.roomId);
            } else if (roomNumber) {
                // Case B: Explicit room selection
                room = await PGRoom.findOne({ roomNumber, pgId: booking.pgId });
            } else {
                // Case C: Auto-Assign - Find ANY available room of requested type
                // This handles the "Confirm" button case where frontend doesn't send room info
                const potentialRooms = await PGRoom.find({
                    pgId: booking.pgId,
                    type: booking.roomType,
                    status: "active"
                });

                // Find first room with space
                room = potentialRooms.find(r => (r.capacity - r.occupied) > 0);
            }

            if (!room) {
                return NextResponse.json({ message: `No available ${booking.roomType} rooms found in this PG! Cannot approve.` }, { status: 400 });
            }

            // 4. Check Availability & Link
            const available = room.capacity - room.occupied;

            if (available > 0) {
                // Link if not linked
                booking.roomId = room._id;

                // 5. Increment occupied
                room.occupied = room.occupied + 1;
                await room.save();

                // 6. Update booking status
                booking.status = 'approved';
                await booking.save();

                return NextResponse.json({
                    message: "Booking approved and assigned to Room " + room.roomNumber,
                    booking
                });
            } else {
                return NextResponse.json({ message: "Selected room is already full!" }, { status: 400 });
            }
        }

        // Handle other status updates
        const updatedBooking = await PGBooking.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        return NextResponse.json(updatedBooking);

    } catch (error) {
        console.error("Booking Update Error:", error);
        return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
    }
}
