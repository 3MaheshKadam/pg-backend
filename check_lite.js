const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

async function check() {
    await mongoose.connect(MONGODB_URI);
    const Mess = mongoose.model('Mess', new mongoose.Schema({ ownerId: mongoose.Schema.Types.ObjectId }, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));

    const u = await User.findOne({ email: "ganesh@gmail.com" });
    if (u) {
        const m = await Mess.findOne({ ownerId: u._id });
        console.log("MESSDATA:", m ? JSON.stringify({ id: m._id, name: m.messName, approved: m.approved, owner: m.ownerId }) : "NONE");
    } else { console.log("User not found"); }
    mongoose.connection.close();
}
check();
