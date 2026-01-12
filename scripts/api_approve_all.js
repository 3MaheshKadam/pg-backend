// This script assumes 'npm run dev' is running on http://localhost:3000

async function autoApprove() {
    const BASE_URL = "http://localhost:3000/api";

    try {
        console.log("Fetching pending approvals...");
        const res = await fetch(`${BASE_URL}/admin/pending`);

        if (!res.ok) {
            throw new Error(`Failed to fetch pending: ${res.statusText}`);
        }

        const data = await res.json();
        const { users, messes, pgs } = data;

        console.log(`Found: ${users.length} Users, ${messes.length} Messes, ${pgs.length} PGs remaining.`);

        // Helper to approve
        const approve = async (id, type) => {
            const response = await fetch(`${BASE_URL}/admin/approve/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, status: "approved" })
            });
            if (response.ok) {
                console.log(`Approved ${type} ${id}`);
            } else {
                console.error(`Failed to approve ${type} ${id}:`, await response.text());
            }
        };

        // Parallel approvals
        await Promise.all([
            ...users.map(u => approve(u._id, "user")),
            ...messes.map(m => approve(m._id, "mess")),
            ...pgs.map(p => approve(p._id, "pg"))
        ]);

        console.log("Approvals done! Refresh your frontend.");

    } catch (error) {
        console.error("Script Error (Make sure server is running on port 3000):", error.message);
    }
}

autoApprove();
