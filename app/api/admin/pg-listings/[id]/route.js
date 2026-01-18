import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PGListing from "@/models/PGListing";
import User from "@/models/User"; // Ensure registered

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const listing = await PGListing.findById(id).populate("ownerId", "name email phone status");

        if (!listing) {
            return NextResponse.json({ message: "PG Listing not found" }, { status: 404 });
        }

        return NextResponse.json({
            listing: {
                ...listing.toObject(),
                // Ensure specific fields are highlighted (though ...toObject() includes them)
                pricing: listing.pricing,
                documents: listing.documents
            }
        });

    } catch (error) {
        console.error("Admin PG Detail Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
