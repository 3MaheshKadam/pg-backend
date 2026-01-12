import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name,
      type,
      location,
      address,
      totalRooms,
      rent,
      deposit,
      amenities,
      description,
    } = body;

    if (
      !name ||
      !type ||
      !location ||
      !address ||
      !totalRooms ||
      !rent ||
      !deposit ||
      !description
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const listing = await PGListing.create({
      name,
      type,
      location,
      address,
      totalRooms: Number(totalRooms),
      pricing: {
        rent: Number(rent),
        deposit: Number(deposit),
      },
      amenities,
      description,
    });

    return NextResponse.json(
      {
        message: "PG listing created successfully",
        listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    await dbConnect();

    const listings = await PGListing.find({ status: "active" })
      .sort({ createdAt: -1 });

    return NextResponse.json({ listings });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch PG listings" },
      { status: 500 }
    );
  }
}
