import mongoose from "mongoose";

const MessSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
        },
        contact: {
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pricing: {
            monthlyPrice: { type: Number },
        },
        capacity: {
            servingCapacity: { type: Number },
        },
        foodTypes: {
            type: [String], // ["veg", "nonveg"]
            default: ["veg"],
        },
        mealTypes: {
            breakfast: { type: Boolean, default: false },
            lunch: { type: Boolean, default: false },
            dinner: { type: Boolean, default: false },
        },
        details: {
            // For any extra details or JSON strings parsed
            type: mongoose.Schema.Types.Mixed,
        },
        license: {
            type: String, // URL to uploaded license file
        },
        approved: {
            type: Boolean,
            default: false,
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "inactive"
        }
    },
    { timestamps: true }
);

export default mongoose.models.Mess || mongoose.model("Mess", MessSchema);
