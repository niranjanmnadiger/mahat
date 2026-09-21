import "dotenv/config";

import app from "./app";
import connectDB from "./config/db";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Shut down cleanly so in-flight requests are not cut off.
        const shutdown = (signal: string): void => {
            console.log(`\n${signal} received, shutting down...`);
            server.close(() => process.exit(0));
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error(
            "Server startup failed:",
            error instanceof Error ? error.message : error
        );
        process.exit(1);
    }
}

void startServer();
