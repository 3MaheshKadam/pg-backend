import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGRoom from "@/models/PGRoom";
import PGBooking from "@/models/PGBooking";
import PGListing from "@/models/PGListing";
import User from "@/models/User";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth";

// Helper for Stats
async function getStats(ownerId) {
    // 1. Total Listings
    const totalListings = await PGListing.countDocuments({ ownerId });

    // 2. Total Rooms & Beds
    const rooms = await PGRoom.find({ ownerId });
    const totalRooms = rooms.length;

    let totalBeds = 0;
    let occupiedBeds = 0;

    rooms.forEach(room => {
        totalBeds += room.capacity;
        occupiedBeds += room.occupied;
    });

    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 3. Tenants (Bookings approved)
    const approvedBookings = await PGBooking.find({ ownerId, status: "approved" });
    const totalTenants = approvedBookings.length;
    const pendingComplaints = 0;

    // 4. Revenue Calculation (Sum of rent from approved bookings)
    // Assuming rent is stored as Number or String with symbols. Ideally store as Number.
    // If stored as string "₹8000", need to parse.
    let monthlyRevenue = 0;
    approvedBookings.forEach(booking => {
        if (booking.rent) {
            const rentVal = typeof booking.rent === 'number' ? booking.rent : Number(booking.rent.toString().replace(/[^0-9]/g, ''));
            if (!isNaN(rentVal)) monthlyRevenue += rentVal;
        }
    });

    // 5. PG Name (Get first listing name or fall back)
    const firstListing = await PGListing.findOne({ ownerId });
    const pgName = firstListing ? firstListing.name : "";

    return {
        pgName,
        totalListings,
        totalRooms,
        totalBeds,
        availableBeds,
        occupancyRate,
        totalTenants,
        monthlyRevenue,
        pendingComplaints,
        rating: 4.5 // Placeholder for now, or calculate from reviews
    };
}

export async function GET(req) {
    try {
        await dbConnect();

        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Pass ownerId to getStats
        const stats = await getStats(auth.userId);

        // Recent Bookings
        // Recent Bookings
        const recentBookingsRaw = await PGBooking.find({ ownerId: auth.userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "name"); // Assuming User model has name

        const recentBookings = recentBookingsRaw.map(b => ({
            id: b._id,
            userName: b.userInfo?.name || "Unknown",
            roomType: b.roomType,
            status: b.status,
            date: b.requestedDate.toISOString().split('T')[0]
        }));

        return NextResponse.json({
            stats,
            recentBookings,
            occupancyChart: {
                filled: stats.totalBeds - stats.availableBeds,
                vacant: stats.availableBeds
            }
        });

    } catch (error) {
        console.error("PG Dashboard Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
