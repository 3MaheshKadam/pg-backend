import mongoose from "mongoose";

const PGListingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Boys", "Girls", "Co-living"],
      required: true,
    },

    location: {
      type: String, // Area (Kothrud, Pune)
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },

    totalRooms: {
      type: Number,
      required: true,
    },
    totalBeds: {
      type: Number,
      default: 0,
    },

    pricing: {
      rentMin: {
        type: Number,
        required: true,
      },
      rentMax: {
        type: Number,
        default: 0,
      },
      deposit: {
        type: Number,
        required: true,
      },
    },

    amenities: {
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      food: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "active",
    },

    approved: {
      type: Boolean,
      default: false
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "inactive"
    }
  },
  { timestamps: true }
);

export default mongoose.models.PGListing ||
  mongoose.model("PGListing", PGListingSchema);
