import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        console.log("Register Request:", body);
        const { name, email, password, phone, role } = body;

        // 1. Validation
        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { message: "Please provide all required fields" },
                { status: 400 }
            );
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 400 }
            );
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create User (Role & Status logic is handled in Model, but we pass role)
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || "USER", // Default to USER if not provided
            // Status will be set by the Model default function based on Role
        });

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    status: newUser.status,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
