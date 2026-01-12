import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessSubscription from "@/models/MessSubscription";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      messId,
      planId,
      planName,
      meals,
      duration,
      price,
      startDate,
      name,
      phone,
      email,
      address,
    } = body;

    if (
      !messId ||
      planId === undefined ||
      !planName ||
      !startDate ||
      !name ||
      !phone ||
      !email ||
      !address
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const subscription = await MessSubscription.create({
      messId,
      plan: {
        planId,
        name: planName,
        meals,
        duration,
        price,
      },
      startDate: new Date(startDate),
      personalInfo: {
        name,
        phone,
        email,
        address,
      },
      payment: {
        amount: price,
      },
    });

    return NextResponse.json(
      {
        message: "Mess subscription created successfully",
        subscription,
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
    const subscriptions = await MessSubscription.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
