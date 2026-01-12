const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Manually parse .env to avoid dependency
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, "..", ".env"); // Look in parent root
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split(/\r?\n/).forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
            console.log("Loaded .env manually");
        }
    } catch (e) {
        console.log("Could not load .env, using defaults");
    }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pg_app_db";

async function approveAll() {
    try {
        console.log("Connecting to:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        // Define minimal schemas (strict: false allows updating fields not in valid schema if absolutely needed, but better to target known fields)
        const pgSchema = new mongoose.Schema({}, { strict: false });
        const messSchema = new mongoose.Schema({}, { strict: false });
        const userSchema = new mongoose.Schema({}, { strict: false });

        // Use existing collection names if known, Mongoose pluralizes by default
        // PGListing -> pglistings
        // Mess -> messes
        // User -> users

        const PGListing = mongoose.model("PGListing", pgSchema);
        const Mess = mongoose.model("Mess", messSchema);
        const User = mongoose.model("User", userSchema);

        // 1. Approve PGs
        const pgRes = await PGListing.updateMany(
            {},
            { $set: { approved: true, status: "active" } }
        );
        console.log(`Updated PGs: ${pgRes.modifiedCount} (Matched: ${pgRes.matchedCount})`);

        // 2. Approve Messes
        const messRes = await Mess.updateMany(
            {},
            { $set: { approved: true } }
        );
        console.log(`Updated Messes: ${messRes.modifiedCount} (Matched: ${messRes.matchedCount})`);

        // 3. Approve Users (Owners)
        const userRes = await User.updateMany(
            { role: { $in: ["PG_OWNER", "MESS_OWNER"] } },
            { $set: { status: "active" } }
        );
        console.log(`Updated Owners: ${userRes.modifiedCount} (Matched: ${userRes.matchedCount})`);

        console.log("All entities approved! Frontend lists should now populate.");
        process.exit(0);

    } catch (error) {
        console.error("Error approving entities:", error);
        process.exit(1);
    }
}

approveAll();
