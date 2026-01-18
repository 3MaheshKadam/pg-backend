const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.resolve(__dirname, '..', '.env');
function parseEnv(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
        const envConfig = fs.readFileSync(filePath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            const key = parts[0]?.trim();
            let value = parts.slice(1).join('=').trim();

            if (key && value) {
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
}

parseEnv(envPath);
// Try .env.local as override
parseEnv(path.resolve(__dirname, '..', '.env.local'));

// Define Schema inline to avoid import issues
const PGListingSchema = new mongoose.Schema({
    name: String,
    type: String,
    location: String,
    amenities: Object,
    pricing: Object,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: String,
    approved: Boolean
});

const UserSchema = new mongoose.Schema({
    name: String,
    status: String
});

const PGListing = mongoose.models.PGListing || mongoose.model('PGListing', PGListingSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found in .env or .env.local");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const pgs = await PGListing.find({}).populate('ownerId');
        console.log(`Found ${pgs.length} PGs.`);

        pgs.forEach(pg => {
            console.log("--------------------------------------------------");
            console.log(`ID: ${pg._id}`);
            console.log(`Name: "${pg.name}"`);
            console.log(`Type: "${pg.type}"`);
            console.log(`Status: ${pg.status}`);
            console.log(`Approved: ${pg.approved}`);
            console.log(`Amenities: ${JSON.stringify(pg.amenities)}`);

            const owner = pg.ownerId;
            if (owner) {
                console.log(`Owner: ${owner.name} (Status: ${owner.status})`);
            } else {
                console.log("Owner: NULL (Or failed to populate)");
            }
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
