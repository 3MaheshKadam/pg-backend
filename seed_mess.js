const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

async function seedMess() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({
            email: String
        }, { strict: false }));

        // Define minimal Mess schema
        const messSchema = new mongoose.Schema({
            ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            messName: { type: String, required: true },
            address: { type: String, default: "Address not set" },
            type: { type: String, default: "Veg" }, // Veg, Non-Veg, Both
            status: { type: String, default: 'approved' }, // Auto approve for fix
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }, { strict: false });

        const Mess = mongoose.model('Mess', messSchema);

        // 1. Find User
        const user = await User.findOne({ email: "pritesh@gmail.com" });
        if (!user) {
            console.log("User pritesh not found");
            return;
        }
        console.log("Found User ID:", user._id);

        // 2. Check if Mess already exists
        const existing = await Mess.findOne({ ownerId: user._id });
        if (existing) {
            console.log("Mess already exists:", existing._id);
            return;
        }

        // 3. Create Mess
        const newMess = await Mess.create({
            ownerId: user._id,
            messName: "Pritesh's Mess",
            address: "123 Main St, Pune",
            type: "Veg/Non-Veg",
            description: "Best home cooked food",
            status: "approved"
        });

        console.log("Created Mess:", newMess._id);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
}

seedMess();
