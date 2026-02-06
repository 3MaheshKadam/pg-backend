import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessPlan from "@/models/MessPlan";
import { verifyAuth } from "@/lib/auth";

// Helper to Format ID
const formatPlan = (plan) => ({
    id: plan._id.toString(),
    name: plan.name,
    type: plan.type,
    meals: plan.meals,
    pricing: plan.pricing,
    price: plan.pricing?.price,
    duration: plan.pricing?.durationDays,
    description: plan.description,
    status: plan.status,
    messId: plan.messId,
    createdAt: plan.createdAt
});

// GET: Fetch Single Plan
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const plan = await MessPlan.findById(id);

        if (!plan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json(formatPlan(plan));

    } catch (error) {
        console.error("Fetch Plan Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

// Shared Update Logic
async function updateMessPlan(req, params) {
    try {
        await dbConnect();
        const { id } = await params; // Ensure params is awaited
        const body = await req.json();

        // Destructure ALL possible inputs
        const {
            name,
            type,
            price,
            duration,
            description,
            meals,
            status
        } = body;

        const updates = {};
        if (name) updates.name = name;
        if (type) updates.type = type;
        if (description) updates.description = description;
        if (status) updates.status = status;

        if (meals) {
            if (meals.breakfast !== undefined) updates["meals.breakfast"] = meals.breakfast;
            if (meals.lunch !== undefined) updates["meals.lunch"] = meals.lunch;
            if (meals.dinner !== undefined) updates["meals.dinner"] = meals.dinner;
        }

        if (price !== undefined) updates["pricing.price"] = Number(price);
        if (duration !== undefined) updates["pricing.durationDays"] = Number(duration);

        const updatedPlan = await MessPlan.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedPlan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Plan updated successfully",
            plan: formatPlan(updatedPlan)
        });

    } catch (error) {
        console.error("Update Plan Error Full:", error);
        return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    return updateMessPlan(req, params);
}

export async function PATCH(req, { params }) {
    return updateMessPlan(req, params);
}

// DELETE: Soft Delete
export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const deletedPlan = await MessPlan.findByIdAndUpdate(
            id,
            { status: "deleted" },
            { new: true }
        );

        if (!deletedPlan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Plan deactivated successfully" });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
