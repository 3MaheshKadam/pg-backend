import jwt from "jsonwebtoken";
import { headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_dev";

/**
 * Verifies the Bearer token from the request headers
 * @returns {Promise<{userId: string, role: string, email: string}>} Decoded user payload
 * @throws {Error} If token is missing or invalid
 */
export async function verifyAuth() {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}
