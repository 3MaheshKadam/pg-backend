import mongoose from "mongoose";

const PGBookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Additional user info snapshot
        userInfo: {
            name: String,
            phone: String,
            email: String,
            gender: String,
            address: String,
            emergencyName: String,
            emergencyContact: String
        },

        financials: {
            rent: Number,
            deposit: Number
        },

        pgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PGListing",
            required: true
        },

        // Denormalized for efficient Owner Queries
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PGRoom"
            // Optional initially if booking is just for "Double Sharing" generally
        },

        roomType: {
            type: String,
            required: true // "Double Sharing"
        },

        requestedDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending"
        },
    },
    { timestamps: true }
);

export default mongoose.models.PGBooking ||
    mongoose.model("PGBooking", PGBookingSchema);
