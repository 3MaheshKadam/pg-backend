const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Config
const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";
const JWT_SECRET = "your_jwt_secret_key_dev"; // Matching the default in auth.js
const BASE_URL = "http://localhost:3000";

async function testSegregation() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(MONGODB_URI);

        // Models
        const User = mongoose.model('User', new mongoose.Schema({
            name: String, email: String, role: String
        }, { strict: false }));

        const MessSubscription = mongoose.model('MessSubscription', new mongoose.Schema({
            ownerId: mongoose.Schema.Types.ObjectId,
            personalInfo: { name: String }
        }, { strict: false }));

        // 2. Setup Test Data
        console.log("2. Setting up Test Data...");

        // Create Mock Owners IDs (don't need real users if we fake the token, 
        // BUT the API logic doesn't check User existence, just uses ID from token)
        const ownerA_Id = new mongoose.Types.ObjectId();
        const ownerB_Id = new mongoose.Types.ObjectId();

        // Create Subscriptions
        await MessSubscription.deleteMany({ "personalInfo.name": { $in: ["Sub_A", "Sub_B"] } });

        await MessSubscription.create([
            {
                ownerId: ownerA_Id,
                plan: { name: "Test Plan", price: 1000 }, // Min required fields to avoid validation errors if schema is strict? 
                // Schema has required fields, better use a minimal object that passes validation if possible
                // or relying on previous knowledge that strict: false might be used in some contexts, 
                // but checking the file content earlier, schema IS strict.
                // We need to match schema requirements.
                // Let's rely on the fact that we are injecting into DB directly.
                // Wait, if I use mongoose model with strict schema defined in this file, it will validate.
                // I will use strict: false for this test script model definition to bypass validation for speed.

                personalInfo: { name: "Sub_A", email: "a@test.com", phone: "123", address: "addr" },
                startDate: new Date(),
                endDate: new Date(),
                payment: { amount: 100 },
                status: "active"
            },
            {
                ownerId: ownerB_Id,
                personalInfo: { name: "Sub_B", email: "b@test.com", phone: "123", address: "addr" },
                startDate: new Date(),
                endDate: new Date(),
                payment: { amount: 100 },
                status: "active"
            }
        ]);

        console.log(`   Created Sub_A for Owner ${ownerA_Id}`);
        console.log(`   Created Sub_B for Owner ${ownerB_Id}`);

        // 3. Generate Token for Owner A
        const tokenA = jwt.sign(
            { userId: ownerA_Id, role: "MESS_OWNER" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // 4. Call API
        console.log("3. Calling API as Owner A...");
        const res = await fetch(`${BASE_URL}/api/mess/subscribers`, {
            headers: { "Authorization": `Bearer ${tokenA}` }
        });

        if (res.status !== 200) {
            throw new Error(`API failed with status ${res.status}`);
        }

        const data = await res.json();
        console.log("   API Response:", JSON.stringify(data, null, 2));

        // 5. Verification
        const hasSubA = data.some(s => s.name === "Sub_A");
        const hasSubB = data.some(s => s.name === "Sub_B");

        if (hasSubA && !hasSubB) {
            console.log("\nSUCCESS: Owner A sees Sub_A but NOT Sub_B.");
        } else {
            console.error("\nFAILURE: Segregation check failed.");
            console.error(`   Sees Sub_A: ${hasSubA}`);
            console.error(`   Sees Sub_B: ${hasSubB}`);
        }

        // Cleanup (Optional, but good practice)
        // await MessSubscription.deleteMany({ "personalInfo.name": { $in: ["Sub_A", "Sub_B"] } });
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testSegregation();
