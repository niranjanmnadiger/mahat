import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
    const url = process.env.MONGO_URL;

    if (!url) {
        console.error("MONGO_URL is not set. Copy .env.example to .env first.");
        process.exit(1);
    }

    try {
        await mongoose.connect(url);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error instanceof Error ? error.message : error
        );
        process.exit(1);
    }
}

export default connectDB;
