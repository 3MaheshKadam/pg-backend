import mongoose from "mongoose";

const MessPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Veg", "Non-Veg", "Both"],
      required: true,
      default: "Veg",
    },

    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },

    pricing: {
      price: {
        type: Number,
        required: true,
      },
      durationDays: {
        type: Number, // 7, 14, 30, 90
        required: true,
        default: 30,
      },
    },

    description: {
      type: String,
      required: true,
      minlength: 10, // Reduced slightly to be less restrictive
    },

    status: {
      type: String,
      enum: ["active", "inactive", "deleted"], // Soft delete support
      default: "active",
    },

    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Optional: Virtual for 'id' if you wanted to resolve _id -> id globally, 
// but we'll handle it in API for explicit control.

export default mongoose.models.MessPlan ||
  mongoose.model("MessPlan", MessPlanSchema);
