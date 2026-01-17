const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

const listOwners = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String,
            _id: mongoose.Schema.Types.ObjectId
        }, { strict: false }));

        const owners = await User.find({ role: { $in: ['PG_OWNER', 'MESS_OWNER'] } });

        console.log(`Found ${owners.length} owners:`);
        owners.forEach(owner => {
            console.log(`- [${owner.role}] ${owner.name} (${owner.email}) ID: ${owner._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listOwners();
