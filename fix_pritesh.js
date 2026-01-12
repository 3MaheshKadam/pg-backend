const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Hardcode URI if dotenv fails or just relies on the string you have
const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

const fixData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        // flexible schema to update any PGListing
        const PGListing = mongoose.model('PGListing', new mongoose.Schema({}, { strict: false }));

        const ownerId = "695d4e4025dad1463670b591"; // User ID from logs

        const res = await PGListing.updateMany(
            { ownerId: ownerId },
            { $set: { approved: true, status: "active" } }
        );

        console.log("Update Result:", res);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixData();
