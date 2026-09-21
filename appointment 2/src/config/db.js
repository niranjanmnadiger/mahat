const mongoose = require("mongoose");

async function connectDB() {
    if (!process.env.MONGO_URL) {
        console.error("MONGO_URL is not set. Copy .env.example to .env first.");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
