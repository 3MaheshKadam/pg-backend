const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

async function fixMess() {
    try {
        await mongoose.connect(MONGODB_URI);

        const User = mongoose.model('User', new mongoose.Schema({
            email: String
        }, { strict: false }));
        const Mess = mongoose.model('Mess', new mongoose.Schema({
            ownerId: mongoose.Schema.Types.ObjectId,
        }, { strict: false }));

        const user = await User.findOne({ email: "ganesh@gmail.com" });
        if (!user) { console.log("User not found"); return; }

        const mess = await Mess.findOne({ ownerId: user._id });
        if (mess) {
            console.log("Updating Mess:", mess._id);

            // Fix missing fields
            mess.messName = "Jay Ganesh Mess";
            mess.address = "Pune";
            mess.type = "Veg";
            mess.status = "approved";
            mess.approved = true;

            await mess.save();
            console.log("Mess updated successfully.");
        } else {
            console.log("Mess not found to update.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
}

fixMess();
