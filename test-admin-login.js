const BASE_URL = "http://localhost:3000";

async function testAdmin() {
    try {
        // 1. Run Seed
        console.log("1. Seeding Admin...");
        const seedRes = await fetch(`${BASE_URL}/api/test/seed`);
        console.log("Seed Status:", seedRes.status);
        const seedJson = await seedRes.json();
        console.log("Seed Response:", seedJson);

        // 2. Try Login
        console.log("\n2. Logging in...");
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@gmail.com",
                password: "admin@123",
            }),
        });

        console.log("Login Status:", loginRes.status);
        const loginJson = await loginRes.json();
        console.log("Login Response:", JSON.stringify(loginJson, null, 2));

    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testAdmin();
