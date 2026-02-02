import Link from "next/link";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess";
import { verifyAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const mess = await Mess.findOne({ ownerId: auth.userId });
        if (!mess) {
            return NextResponse.json({ message: "Mess not found" }, { status: 404 });
        }

        return NextResponse.json({
            // Return defaults if undefined
            breakfast: mess.todayMenu?.breakfast || "",
            lunch: mess.todayMenu?.lunch || "",
            dinner: mess.todayMenu?.dinner || "",
            special: mess.todayMenu?.special || ""
        });

    } catch (error) {
        console.error("Fetch Menu Error", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Find owner's mess and update todayMenu
        const updatedMess = await Mess.findOneAndUpdate(
            { ownerId: auth.userId },
            {
                $set: {
                    todayMenu: {
                        breakfast: body.breakfast || "",
                        lunch: body.lunch || "",
                        dinner: body.dinner || "",
                        special: body.special || ""
                    }
                }
            },
            { new: true }
        );

        if (!updatedMess) {
            return NextResponse.json({ message: "Mess not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Menu updated", menu: updatedMess.todayMenu });

    } catch (error) {
        console.error("Update Menu Error", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
