import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(req) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authRecord = await verifyAuth();
        if (!authRecord) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        const { userId } = authRecord;

        // 2. Parse Body
        const body = await req.json();
        const { name, phone, address, gender, profileImage } = body;

        // 3. Update User Logic (Dynamic Set)
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (gender && ["male", "female", "other"].includes(gender)) updateData.gender = gender;
        if (profileImage) updateData.profileImage = profileImage;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json(
            { message: "Server Error", error: error.message },
            { status: 500 }
        );
    }
}
