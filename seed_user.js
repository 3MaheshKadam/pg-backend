const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb://127.0.0.1:27017/mahesh_pg_backend";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: "1234567890" },
    role: { type: String, enum: ["user", "admin", "owner"], default: "user" },
    status: { type: String, default: "active" },
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedUser() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        const email = "pritesh@gmail.com";
        const password = "123456"; // The password user mentioned

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log("User already exists, updating password...");
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            existing.password = hash;
            existing.status = "active"; // Ensure active
            await existing.save();
            console.log("User updated.");
        } else {
            console.log("Creating new user...");
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            await User.create({
                email,
                password: hash,
                name: "Pritesh User",
                phone: "9876543210",
                role: "user",
                status: "active"
            });
            console.log("User created successfully.");
        }

    } catch (error) {
        console.error("Error seeding:", error);
    } finally {
        await mongoose.disconnect();
    }
}

seedUser();
