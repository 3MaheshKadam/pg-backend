const mongoose = require('mongoose');

// Hardcoded from what we just wrote to .env
const MONGODB_URI = "mongodb://127.0.0.1:27017/mahesh_pg_backend";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "owner"], default: "user" },
    status: { type: String, default: "active" },
}, { strict: false });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function checkUser() {
    try {
        console.log("Connecting to:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        const email = "pritesh@gmail.com";
        const user = await User.findOne({ email });

        if (user) {
            console.log("User Found:", JSON.stringify(user, null, 2));
        } else {
            console.log("User NOT Found with email:", email);

            const count = await User.countDocuments();
            console.log(`Total users in DB: ${count}`);

            const allUsers = await User.find({}, 'email name role');
            console.log("Existing users:", allUsers.map(u => `${u.email} (${u.role})`));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
