const BASE_URL = "http://localhost:3000";

async function verify() {
    try {
        // 1. Login Logic
        console.log("1. Logging in...");
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@gmail.com",
                password: "admin@123",
            }),
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed with ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in. Token received.");

        // 2. Mock a PATCH request to /api/admin/users/[fake_id] to see if it hits the route
        // We expect 404 "User not found" from the Logic, NOT 404 "Not Found" from the Router.
        // Or 400 "Invalid action".
        // The previous error was 404 HTML (likely) or 404 route not found.

        console.log("\n2. Testing PATCH /api/admin/users/123456789012345678901234 (Fake ID)...");
        const patchRes = await fetch(`${BASE_URL}/api/admin/users/123456789012345678901234`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ action: "approve" })
        });

        console.log(`PATCH Response Status: ${patchRes.status}`);
        const patchJson = await patchRes.json();
        console.log("PATCH Response:", patchJson);

        if (patchRes.status === 404 && patchJson.message === "User not found") {
            console.log("SUCCESS: Route matched, logic executed (User not found is expected for fake ID).");
        } else if (patchRes.status === 200) {
            console.log("SUCCESS: User updated (Unexpected validation success but route works).");
        } else {
            console.log("UNKNOWN: Check if this is a route 404 or logic 404.");
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verify();
