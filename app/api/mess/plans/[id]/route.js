import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessPlan from "@/models/MessPlan";
import { verifyAuth } from "@/lib/auth";

// Helper to Format ID
const formatPlan = (plan) => ({
    id: plan._id.toString(), // Ensure 'id' is always provided string
    name: plan.name,
    type: plan.type,
    meals: plan.meals,
    pricing: plan.pricing, // Nested object { price, durationDays }
    price: plan.pricing?.price, // Flattened for convenience if needed
    duration: plan.pricing?.durationDays, // Flattened
    description: plan.description,
    status: plan.status,
    messId: plan.messId,
    createdAt: plan.createdAt
});

// GET: Fetch Single Plan
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params; // Next.js 15 await

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

// PUT: Update Plan (Comprehensive)
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params; // Next.js 15 await
        const body = await req.json();

        // Destructure ALL possible inputs
        const {
            name,
            type,
            price,
            duration, // maps to pricing.durationDays
            description,
            meals, // object { breakfast: true... }
            status
        } = body;

        const updates = {};

        // Only update fields that are present
        if (name) updates.name = name;
        if (type) updates.type = type;
        if (description) updates.description = description;
        if (status) updates.status = status;

        // Handle Nested Objects (Merge logic usually preferred, but simple set works if strictly provided)
        if (meals) {
            // We set the whole object or specific keys. 
            // safer to set specific known keys to avoid bad data
            if (meals.breakfast !== undefined) updates["meals.breakfast"] = meals.breakfast;
            if (meals.lunch !== undefined) updates["meals.lunch"] = meals.lunch;
            if (meals.dinner !== undefined) updates["meals.dinner"] = meals.dinner;
        }

        // Handle Pricing (Nested)
        if (price !== undefined) updates["pricing.price"] = Number(price);
        if (duration !== undefined) updates["pricing.durationDays"] = Number(duration);

        const updatedPlan = await MessPlan.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true } // Return the NEW doc
        );

        if (!updatedPlan) {
            return NextResponse.json({ message: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Plan updated successfully",
            plan: formatPlan(updatedPlan) // Return normalized ID
        });

    } catch (error) {
        console.error("Update Plan Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

// DELETE: Soft Delete
export async function DELETE(req, { params }) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authRecord = await verifyAuth().catch(() => null);
        if (!authRecord) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params; // Next.js 15 await

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
