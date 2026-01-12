import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessPlan from "@/models/MessPlan";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name,
      type,
      meals,
      price,
      duration,
      description,
      messId,
    } = body;

    if (
      !name ||
      !price ||
      !description ||
      !meals ||
      (!meals.breakfast && !meals.lunch && !meals.dinner)
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const plan = await MessPlan.create({
      name,
      type,
      meals,
      pricing: {
        price: Number(price),
        durationDays: Number(duration),
      },
      description,
      messId,
    });

    return NextResponse.json(
      {
        message: "Mess plan created successfully",
        plan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const plans = await MessPlan.find({ status: "active" })
      .sort({ createdAt: -1 });

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
