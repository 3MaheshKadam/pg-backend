const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = "mongodb+srv://maheshindalkardelxn_db_user:root123@pg-backend.rtooint.mongodb.net/?appName=pg-backend";

const checkData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const PGListing = mongoose.model('PGListing', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const pgs = await PGListing.find({});
        console.log("Total PGs:", pgs.length);
        console.log(JSON.stringify(pgs, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
