import mongoose from "mongoose";

const PGRoomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: ["Single", "Double Sharing", "Triple Sharing"],
            required: true
        },

        price: {
            type: Number, // Per bed per month
            required: true,
        },

        capacity: {
            type: Number,
            required: true,
        },

        occupied: {
            type: Number,
            default: 0,
        },

        amenities: {
            type: [String], // ["WiFi", "AC", "Geyser"]
            default: []
        },

        description: {
            type: String,
            trim: true
        },

        images: {
            type: [String], // URLs of room images
            default: []
        },

        status: {
            type: String,
            enum: ["active", "maintenance", "filled"],
            default: "active",
        },

        // Link to the main PG Listing
        pgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PGListing",
        },

        // Link to Owner
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Prevent duplicate room numbers in the same PG
PGRoomSchema.index({ pgId: 1, roomNumber: 1 }, { unique: true, partialFilterExpression: { pgId: { $exists: true } } });

export default mongoose.models.PGRoom ||
    mongoose.model("PGRoom", PGRoomSchema);
