import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessPlan from "@/models/MessPlan";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const plan = await MessPlan.findById(params.id);

    if (!plan || plan.status === "deleted") {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}


export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();

    const updatedPlan = await MessPlan.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        type: body.type,
        meals: body.meals,
        pricing: {
          price: Number(body.price),
          durationDays: Number(body.duration),
        },
        description: body.description,
        status: body.status, // active / inactive
      },
      { new: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}


export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const deletedPlan = await MessPlan.findByIdAndUpdate(
      params.id,
      { status: "deleted" },
      { new: true }
    );

    if (!deletedPlan) {
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Plan deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}
