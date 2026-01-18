const mongoose = require('mongoose');

// Config from fix_pritesh.js
const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";
const TEST_OWNER_ID = "695d4e4025dad1463670b591"; // Using the ID you used in previous fixes

const seedOrders = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const MessOrder = mongoose.model('MessOrder', new mongoose.Schema({}, { strict: false }));

        console.log(`Seeding orders for Owner: ${TEST_OWNER_ID}`);

        const orders = [
            {
                ownerId: TEST_OWNER_ID,
                customerName: "Rohan Das",
                planName: "Monthly Veg",
                meals: ["Lunch", "Dinner"],
                type: "Veg",
                status: "active",
                orderDate: new Date(),
                timeSlot: "12:00 PM - 1:00 PM"
            },
            {
                ownerId: TEST_OWNER_ID,
                customerName: "Priya Singh",
                planName: "Weekly Non-Veg",
                meals: ["Dinner"],
                type: "Non-Veg",
                status: "completed",
                orderDate: new Date(Date.now() - 86400000), // Yesterday
                timeSlot: "8:00 PM - 9:00 PM"
            }
        ];

        const res = await MessOrder.create(orders);
        console.log(`Successfully created ${res.length} orders.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedOrders();
