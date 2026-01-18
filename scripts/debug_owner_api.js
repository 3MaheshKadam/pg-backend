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

const TARGET_USER_ID = "696d27f1d31fcbf9251efa3c"; // ID from user logs

async function debug() {
    console.log("--- Debugging Owner API ---");

    // 1. Check DB directly
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const listing = await PGListing.findOne({ ownerId: TARGET_USER_ID });
        console.log(`[DB Check] Looking for PG with ownerId: ${TARGET_USER_ID}`);
        if (listing) {
            console.log("[DB Check] Found Associated PG:", listing._id);
            console.log("PG Details:", JSON.stringify(listing.toObject(), null, 2));
        } else {
            console.log("[DB Check] NO PG Found for this owner.");
        }
    } catch (e) {
        console.error("[DB Check] Error:", e);
    } finally {
        await mongoose.disconnect();
    }

    // 2. Hit the API
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/users/${TARGET_USER_ID}`,
        method: 'GET',
    };

    const logStream = fs.createWriteStream(path.resolve(__dirname, 'debug_owner.log'), { flags: 'a' });
    logStream.write(`\n--- Debug Run ${new Date().toISOString()} ---\n`);

    console.log(`\n[API Check] Requesting GET ${options.path}...`);
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            logStream.write(`[API Check] Status: ${res.statusCode}\n`);
            try {
                const json = JSON.parse(data);
                logStream.write(`[API Check] Response: ${JSON.stringify(json, null, 2)}\n`);
            } catch (e) {
                logStream.write(`[API Check] Raw Body: ${data}\n`);
            }
        });
    });

    req.on('error', e => logStream.write(`[API Check] Request Failed: ${e.message}\n`));
    req.end();
}

debug();
