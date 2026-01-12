import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import PGRoom from "@/models/PGRoom";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const pg = await PGListing.findById(id).populate("ownerId", "name phone");

        if (!pg) {
            return NextResponse.json({ message: "PG not found" }, { status: 404 });
        }

        // Strict Check: Must be approved to be viewed publicly
        if (!pg.approved) {
            return NextResponse.json({ message: "PG not accessible" }, { status: 403 });
        }

        // Fetch Real Rooms
        const rooms = await PGRoom.find({ pgId: id, status: "active" });

        // Map amenities object to requested array format
        const amenitiesList = [];
        if (pg.amenities.wifi) amenitiesList.push({ name: "WiFi", available: true, icon: "wifi" });
        if (pg.amenities.ac) amenitiesList.push({ name: "AC", available: true, icon: "snow" });
        if (pg.amenities.food) amenitiesList.push({ name: "Food", available: true, icon: "restaurant" });

        return NextResponse.json({
            id: pg._id,
            name: pg.name,
            location: pg.location,
            address: pg.address,
            price: `₹${pg.pricing.rentMin}`,
            deposit: `₹${pg.pricing.deposit}`,
            rating: 4.5,
            reviews: 124,
            type: pg.type,
            owner: pg.ownerId?.name || "PG Owner",
            ownerPhone: pg.ownerId?.phone || "N/A",
            description: pg.description,
            amenities: amenitiesList,
            rooms: rooms.map(r => ({
                id: r._id,
                type: r.type,
                price: `₹${r.price}`,
                status: r.status, // Added field
                available: r.capacity - r.occupied,
                amenities: r.amenities || []
            })),
            rules: ["No smoking", "Gate closes at 10 PM"],
            reviewsList: [
                { id: 1, name: "User A", rating: 5, comment: "Great place!", date: "2 days ago" }
            ]
        });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
