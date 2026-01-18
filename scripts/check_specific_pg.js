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

// Minimal Schema
const PGListingSchema = new mongoose.Schema({}, { strict: false });
const PGListing = mongoose.models.PGListing || mongoose.model('PGListing', PGListingSchema);

async function checkLatest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let output = "";
        console.log("Checking Latest PG...");
        const pg = await PGListing.findOne().sort({ createdAt: -1 });
        if (pg) {
            output += `Found Latest PG ID: ${pg._id}\n`;
            output += `Rent Min: ${pg.pricing?.rentMin}\n`;
            output += `Rent Max: ${pg.pricing?.rentMax}\n`;
            output += `ID Proof: ${pg.documents?.idProof}\n`;
            output += `Property Proof: ${pg.documents?.propertyProof}\n`;
        } else {
            output += "No PGs found.\n";
        }
        fs.writeFileSync(path.resolve(__dirname, 'debug_output.txt'), output);
        console.log("Output written to debug_output.txt");
    } catch (e) {
        console.error(e);
        fs.writeFileSync(path.resolve(__dirname, 'debug_output.txt'), "Error: " + e.message);
    }
    finally { await mongoose.disconnect(); }
}

checkLatest();
