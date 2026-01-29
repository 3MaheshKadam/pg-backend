import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGBooking from "@/models/PGBooking";
import PGListing from "@/models/PGListing";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const query = { ownerId: auth.userId }; // Strict Owner Filter
        if (status && status !== "all") query.status = status;

        const bookings = await PGBooking.find(query)
            .sort({ createdAt: -1 })
            .populate("userId", "name phone gender email"); // Assuming user fields

        const formattedBookings = bookings.map(booking => ({
            id: booking._id,
            user: {
                name: booking.userInfo?.name || booking.userId?.name || "Unknown",
                email: booking.userInfo?.email || booking.userId?.email || "N/A",
                phone: booking.userInfo?.phone || booking.userId?.phone || "N/A",
                gender: booking.userInfo?.gender || "N/A",
                address: booking.userInfo?.address || "N/A",
                emergencyContact: booking.userInfo?.emergencyContact ?
                    `${booking.userInfo.emergencyName || ''} (${booking.userInfo.emergencyContact})` : "N/A"
            },
            roomType: booking.roomType,
            requestedDate: booking.requestedDate.toISOString().split('T')[0],
            status: booking.status,
            documents: booking.documents // Pass documents to frontend
        }));

        return NextResponse.json(formattedBookings);

    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
