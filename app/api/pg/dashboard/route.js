import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGRoom from "@/models/PGRoom";
import PGBooking from "@/models/PGBooking";
import PGListing from "@/models/PGListing";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth";

// Helper for Stats
async function getStats(ownerId) {
    // 1. Total Rooms & Beds
    // Query by ownerId as per security requirement
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

    // 2. Tenants (Bookings approved)
    // Filter by ownerId (added in Booking model)
    const totalTenants = await PGBooking.countDocuments({ ownerId, status: "approved" });
    const pendingComplaints = 0; // Need Complaint Model

    // 3. Revenue (Mock for now)
    const monthlyRevenue = 120000;

    return {
        totalRooms,
        totalBeds,
        availableBeds,
        occupancyRate,
        totalTenants,
        monthlyRevenue,
        pendingComplaints
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
