import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import PGListing from "@/models/PGListing";
import bcrypt from "bcryptjs";
import { saveFile } from "@/lib/upload";

export async function POST(req) {
    try {
        await dbConnect();
        const formData = await req.formData();

        // Extractions
        const ownerName = formData.get("ownerName");
        const email = formData.get("email");
        const phone = formData.get("phone");
        const password = formData.get("password"); // REQUIRED now

        // PG Details
        const pgName = formData.get("pgName");
        const address = formData.get("address");
        const location = formData.get("city"); // Mapping city to location
        const totalRooms = formData.get("totalRooms");
        const totalBeds = formData.get("totalBeds"); // Not in Listing Schema explicitly, might need update or map to logic.
        // For now, mapping to totalRooms since Schema has totalRooms.
        const rentMin = formData.get("rentMin");
        const rentMax = formData.get("rentMax"); // Listing schema has 'rent' (single value). We'll use rentMin as base rent.
        const facilities = formData.get("facilities"); // JSON string

        // Files
        const idProof = formData.get("idProof");
        const propertyProof = formData.get("propertyProof");

        if (!ownerName || !email || !password || !pgName || !address) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // 1. Create/Find User
        let user = await User.findOne({ email });
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await User.create({
                name: ownerName,
                email,
                phone,
                password: hashedPassword,
                role: "PG_OWNER",
                status: "pending" // Explicitly pending
            });
        } else {
            // If user exists, ensure they are authorized to add listings or handle appropriately. 
            // For simplicity, we proceed, but checking role might be good.
            if (user.role === "USER") {
                // Upgrade role? For now, keep as is or error.
                // Let's assume an existing user wants to become an owner.
                // user.role = "PG_OWNER"; 
                // await user.save();
            }
        }

        // 2. Upload Files
        // Note: Schema for PGListing doesn't have fields for these proofs yet.
        // If we need to store them, we should update the PGListing schema. 
        // FOR NOW: We upload them but might not save references if schema doesn't support.
        // Let's assume we just want to verify they upload.
        await saveFile(idProof, "proofs");
        await saveFile(propertyProof, "proofs");

        // 3. Create PG Listing
        let parsedAmenities = {};
        try {
            parsedAmenities = JSON.parse(facilities || "{}");
        } catch (e) { console.log("JSON Parse Error", e) }

        const newListing = await PGListing.create({
            name: pgName,
            type: "Co-living", // Defaulting, or need field
            location: location || address,
            address: address,
            totalRooms: Number(totalRooms) || 0,
            totalBeds: Number(totalBeds) || 0,
            pricing: {
                rentMin: Number(rentMin) || 0,
                rentMax: Number(rentMax) || 0,
                deposit: 0 // Default
            },
            amenities: parsedAmenities,
            description: `Owner: ${ownerName}, Located in ${location || address}`,
            ownerId: user._id,
            status: "inactive",
            approved: false // Explicitly require Admin Approval
        });

        return NextResponse.json({
            message: "PG Onboarding Request Submitted Successfully",
            userId: user._id,
            listingId: newListing._id
        }, { status: 201 });

    } catch (error) {
        console.error("PG Onboard Error:", error);
        return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
    }
}
