import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: 6,
        },
        phone: {
            type: String,
            required: [true, "Please provide a phone number"],
        },
        address: {
            type: String,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        profileImage: {
            type: String, // URL from Cloudinary
        },
        role: {
            type: String,
            enum: ["USER", "PG_OWNER", "MESS_OWNER", "ADMIN"],
            default: "USER",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: function () {
                // Users are approved by default, Owners are pending
                return this.role === "USER" || this.role === "ADMIN" ? "approved" : "pending";
            },
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "inactive"
        },
        subscriptionExpiry: {
            type: Date
        }
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
