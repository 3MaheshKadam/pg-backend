
async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: "rajesh@gmail.com",
                password: "rajesh"
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text.slice(0, 500)); // Print first 500 chars

    } catch (error) {
        console.error("Error:", error);
    }
}

testLogin();
