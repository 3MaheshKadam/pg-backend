import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGBooking from "@/models/PGBooking";
import PGListing from "@/models/PGListing"; // To verify existence
import { verifyAuth } from "@/lib/auth"; // Optional if we want to link to logged in user

export async function POST(req) {
  try {
    await dbConnect();

    // Optional: Get User ID if logged in, else use a placeholder or fail
    // For a public app, usually user must be logged in to book
    let userId;
    try {
      const auth = await verifyAuth();
      userId = auth.userId;
    } catch (e) {
      // If strict auth required: return NextResponse.json({message: "Login required"}, {status: 401});
      // If guest checkout supported (unlikely for PG), generate temp ID
      // We will assume Login Required for Booking
      return NextResponse.json({ message: "Please login to book" }, { status: 401 });
    }

    const body = await req.json();
    const {
      listingId,
      roomType,
      moveInDate,
      name,
      phone,
      email,
      address,
      emergencyName,
      emergencyContact,
      rent,
      deposit
    } = body;

    // Verify PG
    const pg = await PGListing.findById(listingId);
    if (!pg) {
      return NextResponse.json({ message: "PG Listing not found" }, { status: 404 });
    }

    const newBooking = await PGBooking.create({
      userId, // Linked to the authenticated user
      pgId: listingId,
      ownerId: pg.ownerId, // Capture Owner ID for isolation
      roomType,
      requestedDate: new Date(moveInDate),
      userInfo: {
        name,
        phone,
        email,
        address,
        emergencyName,
        emergencyContact
      },
      financials: {
        rent,
        deposit
      },
      status: "pending"
    });

    return NextResponse.json({
      message: "Booking request sent successfully",
      bookingId: newBooking._id
    }, { status: 201 });

  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    // 1. Verify Auth
    const auth = await verifyAuth();
    if (!auth || !auth.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch User's Bookings
    const bookings = await PGBooking.find({ userId: auth.userId })
      .populate("pgId", "name location pricing") // Populate PG Name
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(b => {
      // Calculate Dates assuming monthly cycle for UI display
      const start = new Date(b.requestedDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 30); // Default 30 days cycle

      const now = new Date();
      // If subscription hasn't started yet, daysLeft should be total duration (from start date)
      // Otherwise, it's from today.
      const calcFrom = now < start ? start : now;
      const diffTime = end - calcFrom;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: b._id,
        pgName: b.pgId?.name || "Unknown PG",
        location: b.pgId?.location,
        roomType: b.roomType,
        status: b.status,
        date: start.toISOString().split('T')[0], // Kept for backward compat
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        rent: b.financials?.rent
      };
    });

    return NextResponse.json(formattedBookings);

  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
