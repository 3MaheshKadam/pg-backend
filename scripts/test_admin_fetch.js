const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/pending',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            if (res.statusCode >= 400) {
                console.error(`Status Code: ${res.statusCode}`);
                return;
            }

            const json = JSON.parse(data);
            console.log("--- PGs in Pending ---");

            if (json.pgs && json.pgs.length > 0) {
                // Check Latest one
                const latestInfo = json.pgs[json.pgs.length - 1];
                console.log("ID:", latestInfo._id);
                console.log("Rent Min:", latestInfo.pricing?.rentMin);
                console.log("Rent Max:", latestInfo.pricing?.rentMax);
                console.log("ID Proof:", latestInfo.documents?.idProof);
                console.log("Prop Proof:", latestInfo.documents?.propertyProof);
            } else {
                console.log("No pending PGs found in response.");
            }

        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
