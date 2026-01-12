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
