import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import MessPlan from "@/models/MessPlan";
import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    try {
        await dbConnect();
        // Filter by type or search from query params
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const query = { ownerId: auth.userId, status: "active" };
        if (type) query.type = type;

        const plans = await MessPlan.find(query).sort({ createdAt: -1 });

        const formattedPlans = plans.map(plan => ({
            id: plan._id,
            name: plan.name,
            type: plan.type,
            price: plan.pricing.price,
            duration: plan.pricing.durationDays,
            description: plan.description,
            meals: Object.keys(plan.meals).filter(k => plan.meals[k]), // ["breakfast", "lunch"]
            status: plan.status,
            subscribers: 0 // Mock or calculate
        }));

        return NextResponse.json(formattedPlans);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}


import Mess from "@/models/Mess";

export async function POST(req) {
    try {
        await dbConnect();

        // 1. Verify Auth
        const auth = await verifyAuth();
        if (!auth || !auth.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Mess owned by this user
        const mess = await Mess.findOne({ ownerId: auth.userId });

        if (!mess) {
            return NextResponse.json({ message: "Mess not found for this user" }, { status: 404 });
        }

        // 3. Strict Approval Check
        if (!mess.approved) {
            return NextResponse.json({ message: "Mess is not approved by Admin yet" }, { status: 403 });
        }

        const body = await req.json();
        const {
            name,
            type, // Veg, Non-Veg, Both
            price,
            duration,
            description,
            meals, // { breakfast: true... }
        } = body;

        if (!name || !price || !description || !meals) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Helper to convert Array ["Breakfast", "Lunch"] -> Object { breakfast: true, lunch: true }
        // The Schema expects an Object, but Frontend might send Array.
        let mealsData = meals;
        if (Array.isArray(meals)) {
            mealsData = {
                breakfast: meals.some(m => m.toLowerCase() === "breakfast"),
                lunch: meals.some(m => m.toLowerCase() === "lunch"),
                dinner: meals.some(m => m.toLowerCase() === "dinner")
            };
        } else if (typeof meals === 'object') {
            // Already object, just ensure keys match if needed, or pass as is
            mealsData = meals;
        }

        const newPlan = await MessPlan.create({
            name,
            type: type || "Veg",
            meals: mealsData,
            pricing: {
                price: Number(price),
                durationDays: Number(duration) || 30,
            },
            description,
            messId: mess._id, // Real Mess ID from DB
            ownerId: auth.userId, // Explicitly set ownerId for filtering
            createdBy: auth.userId, // Track creator
            status: "active"
        });

        const formattedPlan = {
            id: newPlan._id,
            name: newPlan.name,
            type: newPlan.type,
            price: newPlan.pricing.price,
            duration: newPlan.pricing.durationDays,
            description: newPlan.description,
            meals: Object.keys(newPlan.meals).filter(k => newPlan.meals[k]),
            status: newPlan.status,
            subscribers: 0
        };

        return NextResponse.json(
            { message: "Mess plan created successfully", plan: formattedPlan },
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
