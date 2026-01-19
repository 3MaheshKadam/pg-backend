const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Manually load .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        const key = parts[0]?.trim();
        let value = parts.slice(1).join('=').trim();
        if (key && value) {
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const PGListingSchema = new mongoose.Schema({ ownerId: mongoose.Schema.Types.ObjectId }, { strict: false });
// Remove model if exists to avoid schema issues
if (mongoose.models.PGListing) delete mongoose.models.PGListing;
const PGListing = mongoose.model('PGListing', PGListingSchema);

let TARGET_USER_ID = "696d27f1d31fcbf9251efa3c"; // ID from user logs

async function debug() {
    console.log("--- Debugging Owner API ---");

    // 1. Fetch the latest MESS OWNER ID to test
    /*
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const latestMessOwner = await User.findOne({ role: 'MESS_OWNER' }).sort({ createdAt: -1 });

        if (!latestMessOwner) {
            console.log("No MESS_OWNER found. Exiting debug.");
            await mongoose.disconnect();
            return;
        }

        TARGET_USER_ID = latestMessOwner._id.toString();
        console.log(`Testing with Mess Owner ID: ${TARGET_USER_ID}`);

        // Optional: Check for PGListing associated with this new TARGET_USER_ID
        const listing = await PGListing.findOne({ ownerId: TARGET_USER_ID });
        console.log(`[DB Check] Looking for PG with ownerId: ${TARGET_USER_ID}`);
        if (listing) {
            console.log("[DB Check] Found Associated PG:", listing._id);
            console.log("PG Details:", JSON.stringify(listing.toObject(), null, 2));
        } else {
            console.log("[DB Check] NO PG Found for this owner.");
        }

    } catch (e) {
        console.error("[DB Check] Error fetching MESS_OWNER or PGListing:", e);
        await mongoose.disconnect();
        return;
    } finally {
        await mongoose.disconnect(); // Disconnect after DB operations
    }
    */

    // HARDCODED ID FROM PREVIOUS LOGS (Mess Owner)
    TARGET_USER_ID = "696db665cc06e5adfff13458";
    console.log(`Testing with Hardcoded Mess Owner ID: ${TARGET_USER_ID}`);

    // 2. Hit the API (DETAIL VIEW)
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/users/${TARGET_USER_ID}`, // Check the DETAIL endpoint
        method: 'GET',
        headers: {} // Auth is temporarily disabled or not required here for my test if I commented check?
        // Wait, I commented out check in LIST API, but DETAIL API still has it?
        // Checking detail route... yes, verifyAuth is commented out in GET method. Good.
    };

    const logStream = fs.createWriteStream(path.resolve(__dirname, 'debug_owner.log'), { flags: 'a' });
    logStream.write(`\n--- Debug Run (Detail API) ${new Date().toISOString()} ---\n`);

    console.log(`\n[API Check] Requesting GET ${options.path}...`);
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            logStream.write(`[API Check] Status: ${res.statusCode}\n`);
            try {
                const json = JSON.parse(data);
                // Find our user
                if (json.users) {
                    const targetUser = json.users.find(u => u._id === TARGET_USER_ID);
                    if (targetUser) {
                        logStream.write(`[API Check] Found Target User in List:\n${JSON.stringify(targetUser, null, 2)}\n`);
                    } else {
                        logStream.write(`[API Check] Target User NOT found in list.\n`);
                    }
                } else {
                    logStream.write(`[API Check] Unexpected Response Structure: ${Object.keys(json)}\n`);
                }

            } catch (e) {
                logStream.write(`[API Check] Raw Body: ${data}\n`);
            }
        });
    });

    req.on('error', e => logStream.write(`[API Check] Request Failed: ${e.message}\n`));
    req.end();
}

debug();
