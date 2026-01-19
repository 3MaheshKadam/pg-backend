import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Mess from "@/models/Mess";
import bcrypt from "bcryptjs";
import Link from "next/link"; // Unused but keeping structure
// import { saveFile } from "@/lib/upload"; // Removed saveFile import

export async function POST(req) {
    try {
        await dbConnect();
        const formData = await req.formData();

        // DEBUG LOGS
        console.log("----- MESS ONBOARDING REQ RECEIVED -----");
        const logData = {};
        formData.forEach((value, key) => logData[key] = value);
        console.log("FormData:", JSON.stringify(logData, null, 2));

        // Extractions
        const ownerName = formData.get("ownerName");
        const email = formData.get("email");
        const phone = formData.get("phone");
        const password = formData.get("password"); // REQUIRED

        // Mess Details
        const messName = formData.get("messName");
        const address = formData.get("address");
        const monthlyPrice = formData.get("monthlyPrice");
        const servingCapacity = formData.get("servingCapacity");

        // JSON fields
        let foodTypes = [];
        let mealTypes = {};
        try {
            foodTypes = JSON.parse(formData.get("foodTypes") || "[]");
            mealTypes = JSON.parse(formData.get("mealTypes") || "{}");
        } catch (e) { console.log("JSON Parse Error", e); }

        // Files
        const licenseFile = formData.get("license");

        if (!ownerName || !email || !password || !messName) {
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
                role: "MESS_OWNER",
                status: "pending" // Explicitly pending
            });
        }

        // 2. Upload License - HANDLED BY CLIENT (Cloudinary)
        // We expect URL string now, not File.
        const licenseUrl = licenseFile; // Assuming this is now passed as URL string

        // 3. Create Mess
        const newMess = await Mess.create({
            name: messName,
            address,
            contact: {
                email,
                phone
            },
            ownerId: user._id,
            pricing: {
                monthlyPrice: Number(monthlyPrice) || 0
            },
            capacity: {
                servingCapacity: Number(servingCapacity) || 0
            },
            foodTypes, // ["veg", "nonveg"]
            mealTypes, // { breakfast: true... }
            license: licenseUrl,
            approved: false
        });



        console.log("Mess Onboarding Success:", {
            userId: user._id,
            messId: newMess._id,
            message: "Mess Onboarding Request Submitted Successfully"
        });

        return NextResponse.json({
            message: "Mess Onboarding Request Submitted Successfully",
            userId: user._id,
            messId: newMess._id
        }, { status: 201 });

    } catch (error) {
        console.error("Mess Onboard Error:", error);
        return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
    }
}
