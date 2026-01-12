import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function saveFile(file, folder = "uploads") {
    if (!file) return null;

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", folder);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${uuidv4()}${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL (relative path)
        return `/${folder}/${filename}`;
    } catch (error) {
        console.error("Error saving file:", error);
        throw new Error("File upload failed");
    }
}
