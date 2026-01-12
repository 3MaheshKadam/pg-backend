import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";

/* ===========================
   GET SINGLE LISTING
=========================== */
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const listing = await PGListing.findById(params.id);

    if (!listing || listing.status === "deleted") {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

/* ===========================
   UPDATE LISTING
=========================== */
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();

    const updatedListing = await PGListing.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        type: body.type,
        location: body.location,
        address: body.address,
        totalRooms: Number(body.totalRooms),
        pricing: {
          rent: Number(body.rent),
          deposit: Number(body.deposit),
        },
        amenities: body.amenities,
        description: body.description,
        status: body.status, // active / inactive
      },
      { new: true }
    );

    if (!updatedListing) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}

/* ===========================
   SOFT DELETE LISTING
=========================== */
export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const deleted = await PGListing.findByIdAndUpdate(
      params.id,
      { status: "deleted" },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Listing deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}
