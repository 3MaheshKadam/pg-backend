// lib/dbConnect.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

console.log(MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    console.log("Connecting to MongoDB...");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
    console.log("MongoDB connection created.");
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
