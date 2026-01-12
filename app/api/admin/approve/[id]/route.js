import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Mess from "@/models/Mess";
import PGListing from "@/models/PGListing";

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { type, status } = body; // type: "user" | "mess" | "pg", status: "approved" | "rejected"

        if (!id || !type || !status) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        let updatedEntity;

        if (type === "user") {
            updatedEntity = await User.findByIdAndUpdate(id, { status }, { new: true });

            // Cascade: If User is Approved, also Approve their Business (PG or Mess)
            if (status === "approved") {
                // Try finding PG first
                const pg = await PGListing.findOne({ ownerId: id });
                if (pg) {
                    await PGListing.findByIdAndUpdate(pg._id, { approved: true, status: "active" });
                } else {
                    // Try finding Mess
                    const mess = await Mess.findOne({ ownerId: id });
                    if (mess) {
                        await Mess.findByIdAndUpdate(mess._id, { approved: true }); // Mess doesn't explicitly use "status" for active same way, usually just 'approved'
                    }
                }
            }
        }
        if (type === "mess") {
            const isApproved = status === "approved";
            updatedEntity = await Mess.findByIdAndUpdate(id, { approved: isApproved }, { new: true });

            // Cascade: Activate the Owner if Mess is approved
            if (isApproved && updatedEntity.ownerId) {
                await User.findByIdAndUpdate(updatedEntity.ownerId, { status: "approved" });
            }
        }
        else if (type === "pg") {
            const isApproved = status === "approved";
            // Also set status to active if approved
            const updateData = { approved: isApproved };
            if (isApproved) updateData.status = "active";

            updatedEntity = await PGListing.findByIdAndUpdate(id, updateData, { new: true });

            // Cascade: Activate the Owner if PG is approved
            if (isApproved && updatedEntity.ownerId) {
                await User.findByIdAndUpdate(updatedEntity.ownerId, { status: "approved" });
            }
        }
        else {
            return NextResponse.json({ message: "Invalid type" }, { status: 400 });
        }

        if (!updatedEntity) {
            return NextResponse.json({ message: "Entity not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Approved successfully", entity: updatedEntity });

    } catch (error) {
        console.error("Admin Approve Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
