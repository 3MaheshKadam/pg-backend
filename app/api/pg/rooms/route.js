import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGRoom from "@/models/PGRoom";
import PGListing from "@/models/PGListing";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        // 1. Verify Auth
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const query = { ownerId: auth.userId }; // Strict Owner Filter
        if (type) query.type = type;

        const rooms = await PGRoom.find(query);

        const formattedRooms = rooms.map(room => ({
            id: room._id,
            roomNumber: room.roomNumber,
            type: room.type,
            price: room.price,
            capacity: room.capacity,
            occupied: room.occupied,
            amenities: room.amenities,
            status: room.status,
            images: room.images
        }));

        return NextResponse.json(formattedRooms);

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}



export async function POST(req) {
    try {
        await dbConnect();

        // 1. Verify Auth
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch PG owned by this user
        const pg = await PGListing.findOne({ ownerId: auth.userId });

        if (!pg) {
            return NextResponse.json({ message: "PG Listing not found for this user" }, { status: 404 });
        }

        // 3. Strict Approval Check
        if (!pg.approved) {
            return NextResponse.json({ message: "PG is not approved by Admin yet" }, { status: 403 });
        }

        const body = await req.json();
        const {
            roomNumber,
            type,
            price,
            capacity,
            amenities,
            description,
            images
        } = body;

        const newRoom = await PGRoom.create({
            pgId: pg._id, // Real PG ID
            ownerId: auth.userId, // Link to Owner for double verification
            roomNumber,
            roomNumber,
            type,
            price,
            capacity,
            amenities,
            description,
            images
        });

        return NextResponse.json(newRoom, { status: 201 });

    } catch (error) {
        console.error("Create Room Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
