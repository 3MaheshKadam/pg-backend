import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'onModel'
        },
        onModel: {
            type: String,
            required: true,
            enum: ['PGListing', 'Mess']
        },
        type: {
            type: String,
            enum: ['PG', 'MESS'], // redundancy but useful for quick filtering if needed, or rely on onModel
            // keeping it to match the prompt payload "type": "PG" | "MESS"
        }
    },
    { timestamps: true }
);

// Compound index to ensure unique favorites per user
FavoriteSchema.index({ user: 1, item: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
