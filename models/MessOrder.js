import mongoose from "mongoose";

const MessOrderSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mess", // Optional linking
        },
        customerName: {
            type: String,
            required: true,
        },
        planName: {
            type: String,
            default: "Standard Plan",
        },
        meals: {
            type: [String], // ["Breakfast", "Lunch"]
            required: true,
        },
        type: {
            type: String,
            enum: ["Veg", "Non-Veg"],
            default: "Veg"
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"], // 'active' means scheduled for today, 'completed' means delivered
            default: "active",
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        timeSlot: {
            type: String, // e.g., "8:00 AM - 9:00 AM"
        }
    },
    { timestamps: true }
);

export default mongoose.models.MessOrder || mongoose.model("MessOrder", MessOrderSchema);
