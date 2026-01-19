const mongoose = require('mongoose');
require('dotenv').config();

async function fixApproval() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        const User = mongoose.model('User', new mongoose.Schema({ status: String, role: String }));
        const PGListing = mongoose.model('PGListing', new mongoose.Schema({ ownerId: mongoose.Schema.Types.ObjectId, approved: Boolean, status: String }));
        const Mess = mongoose.model('Mess', new mongoose.Schema({ ownerId: mongoose.Schema.Types.ObjectId, approved: Boolean }));

        // 1. Find all Approved Owners
        const approvedOwners = await User.find({ status: 'approved' });
        const pgOwnerIds = approvedOwners.filter(u => u.role === 'PG_OWNER').map(u => u._id);
        const messOwnerIds = approvedOwners.filter(u => u.role === 'MESS_OWNER').map(u => u._id);

        console.log(`Found ${pgOwnerIds.length} approved PG owners and ${messOwnerIds.length} approved Mess owners.`);

        // 2. Update PG Listings
        const pgResult = await PGListing.updateMany(
            { ownerId: { $in: pgOwnerIds } },
            { $set: { approved: true, status: 'active' } }
        );
        console.log(`Updated ${pgResult.modifiedCount} PG listings.`);

        // 3. Update Mess Listings
        const messResult = await Mess.updateMany(
            { ownerId: { $in: messOwnerIds } },
            { $set: { approved: true } }
        );
        console.log(`Updated ${messResult.modifiedCount} Mess listings.`);

    } catch (err) {
        console.error("Fix Script Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

fixApproval();
