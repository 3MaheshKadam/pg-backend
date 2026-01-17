import mongoose from "mongoose";

const OwnerSubscriptionSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlatformPlan",
            required: true,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validTill: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled"],
            default: "active",
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.models.OwnerSubscription ||
    mongoose.model("OwnerSubscription", OwnerSubscriptionSchema);
