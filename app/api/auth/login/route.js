import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_dev";

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        console.log("Login Request:", body);
        const { email, password } = body;

        // 1. Validation
        if (!email || !password) {
            return NextResponse.json(
                { message: "Please provide email and password" },
                { status: 400 }
            );
        }

        // 2. Find User
        // We explicitly select password because it might be excluded in default queries (though in Mongoose it's usually included unless select: false)
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 3. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 4. Check Status (Approval Workflow)
        if (user.status === "pending") {
            return NextResponse.json(
                { message: "Your account is pending approval by the admin." },
                { status: 403 }
            );
        }

        if (user.status === "rejected") {
            return NextResponse.json(
                { message: "Your account has been rejected. Please contact support." },
                { status: 403 }
            );
        }

        // 5. Generate Token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 6. Return Response
        return NextResponse.json(
            {
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    phone: user.phone,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
