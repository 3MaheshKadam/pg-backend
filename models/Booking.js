// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    //   required: true,
    },

    roomType: {
      type: String,
      enum: ["Single", "Double", "Triple"],
      required: true,
    },

    moveInDate: {
      type: Date,
      required: true,
    },

    personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      address: {
        type: String,
      },
    },

    emergencyContact: {
      name: {
        type: String,
      },
      phone: {
        type: String,
      },
    },

    payment: {
      monthlyRent: {
        type: Number,
        required: true,
      },
      securityDeposit: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

delete mongoose.models.Booking;

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);

export async function GET() {
  try {
    await dbConnect();
    const bookings = await Booking.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
