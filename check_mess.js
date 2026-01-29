const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

async function checkMess() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String
        }, { strict: false }));
        const Mess = mongoose.model('Mess', new mongoose.Schema({}, { strict: false })); // Fully flexible

        const user = await User.findOne({ email: "ganesh@gmail.com" });
        if (!user) {
            console.log("User ganesh not found");
            return;
        }
        console.log("User Found:", user._id);

        const mess = await Mess.findOne({ ownerId: user._id });
        if (mess) {
            console.log("Mess Found (Full):", JSON.stringify(mess, null, 2));
        } else {
            console.log("NO Mess found for this user.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
}

checkMess();
