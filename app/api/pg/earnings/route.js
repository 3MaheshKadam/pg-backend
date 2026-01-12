import { NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth";

export async function GET(req) {
    // 1. Verify Auth
    const auth = await verifyAuth();
    if (!auth || !auth.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock Earnings Data (Real logic requires Payment/Transaction model filtering by ownerId)
    const earnings = {
        totalRevenue: 1200000,
        currentMonth: 120000,
        lastMonth: 115000,
        growth: 4.5,
        history: [
            { month: "Jan", amount: 115000 },
            { month: "Feb", amount: 120000 }
        ]
    };

    return NextResponse.json(earnings);
}
