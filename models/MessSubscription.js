import mongoose from "mongoose";

const MessSubscriptionSchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
    },

    // Denormalized for efficient Owner Queries
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      meals: {
        type: [String], // Breakfast, Lunch, Dinner
        required: true,
      },
      duration: {
        type: String, // "30 days"
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },

    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    type: { // Veg/Non-Veg
      type: String,
      enum: ["Veg", "Non-Veg", "Both"],
      default: "Veg"
    },

    personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      address: {
        type: String,
        // required: true, // Made optional as per user request
      },
    },

    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired"],
      default: "pending",
    },

    payment: {
      amount: {
        type: Number,
        required: true,
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.MessSubscription ||
  mongoose.model("MessSubscription", MessSubscriptionSchema);
