import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
    try {
        await dbConnect();
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json(
                { message: "Please provide phone and OTP" },
                { status: 400 }
            );
        }

        // MOCK OTP LOGIC
        // In a real app, you would check a database or Redis for the stored OTP linked to this phone.
        const MOCK_OTP = "123456";

        if (otp !== MOCK_OTP) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            );
        }

        // Find User (Optional: only if you want to perform actions like setting isVerified: true)
        // const user = await User.findOne({ phone });
        // if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        // Return Success
        return NextResponse.json(
            { message: "OTP Verified Successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("OTP Error:", error);
        return NextResponse.json(
            { message: "Server Error", error: error.message },
            { status: 500 }
        );
    }
}
