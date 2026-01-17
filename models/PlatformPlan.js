import mongoose from "mongoose";

const PlatformPlanSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["PG_OWNER", "MESS_OWNER"],
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        durationDays: {
            type: Number,
            required: true,
            default: 30,
        },
        features: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.models.PlatformPlan ||
    mongoose.model("PlatformPlan", PlatformPlanSchema);
