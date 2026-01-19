import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Mess from "@/models/Mess";
import MessPlan from "@/models/MessPlan";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const mess = await Mess.findById(id).populate("ownerId", "name phone");

        if (!mess) {
            return NextResponse.json({ message: "Mess not found" }, { status: 404 });
        }

        // Strict Check: Must be approved
        if (!mess.approved) {
            return NextResponse.json({ message: "Mess not accessible" }, { status: 403 });
        }

        // Fetch Real Plans
        const realPlans = await MessPlan.find({ messId: id, status: "active" });

        return NextResponse.json({
            id: mess._id,
            name: mess.name,
            location: mess.address, // mapping
            address: mess.address,
            price: mess.pricing?.monthlyPrice ? `₹${mess.pricing.monthlyPrice}` : "₹4500",
            rating: 4.6,
            reviews: 234,
            type: mess.foodTypes.includes("nonveg") ? "Both" : "Veg",
            owner: mess.ownerId?.name || "Mess Owner",
            ownerPhone: mess.contact?.phone || "N/A",
            description: mess.details?.description || "Healthy and hygienic homemade food.",

            // Raw Fields for Edit Screen
            license: mess.license,
            pricing: mess.pricing,
            capacity: mess.capacity,
            foodTypes: mess.foodTypes,
            mealTypes: mess.mealTypes,

            plans: realPlans.map(p => ({
                id: p._id,
                name: p.name,
                price: `₹${p.pricing.price}`,
                status: p.status, // Added field
                meals: Object.keys(p.meals)
                    .filter(k => p.meals[k])
                    .map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                duration: `${p.pricing.durationDays} days`
            })),

            todayMenu: [
                { meal: "Lunch", items: "Dal, Rice, Roti", time: "1 PM" }
            ],
            features: [
                { name: "Hygienic", available: true, icon: "shield" }
            ]
        });

    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Check if Mess exists
        const mess = await Mess.findById(id);
        if (!mess) {
            return NextResponse.json({ message: "Mess not found" }, { status: 404 });
        }

        // Update Fields
        // We use $set to only update provided fields
        const updates = {};
        if (body.name) updates.name = body.name;
        if (body.address) updates.address = body.address;

        // Complex objects - simpler to just replace if provided or use merge logic if needed.
        // For now, replacing the object if provided is safer for complete updates.
        if (body.pricing) {
            updates.pricing = { ...mess.pricing, ...body.pricing };
        }
        if (body.capacity) {
            updates.capacity = { ...mess.capacity, ...body.capacity };
        }
        if (body.foodTypes) updates.foodTypes = body.foodTypes;
        if (body.mealTypes) updates.mealTypes = body.mealTypes;
        if (body.license) updates.license = body.license; // Cloudinary URL update
        if (body.description) {
            updates["details.description"] = body.description;
        }

        const updatedMess = await Mess.findByIdAndUpdate(id, { $set: updates }, { new: true });

        return NextResponse.json({
            message: "Mess Profile Updated Successfully",
            mess: updatedMess
        });

    } catch (error) {
        console.error("Mess Update Error:", error);
        return NextResponse.json({ message: "Update Failed", error: error.message }, { status: 500 });
    }
}
