import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await dbConnect();

        const email = "admin@gmail.com";
        const password = "admin@123";

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Check if user exists
        let admin = await User.findOne({ email });

        if (admin) {
            // Update existing
            admin.password = hashedPassword;
            admin.status = "approved";
            admin.role = "ADMIN"; // Ensure role is correct
            await admin.save();
            console.log("Admin updated");
        } else {
            // Create new
            admin = await User.create({
                name: "Super Admin",
                email,
                password: hashedPassword,
                phone: "0000000000",
                role: "ADMIN",
                status: "approved",
            });
            console.log("Admin created");
        }

        return NextResponse.json({ message: "Admin created/updated successfully", adminId: admin._id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
