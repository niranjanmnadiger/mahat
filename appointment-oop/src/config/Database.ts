import mongoose from "mongoose";

/**
 * Owns the single Mongoose connection for the process.
 *
 * `connect()` is awaited before the HTTP server starts listening, so the API
 * never accepts a request it cannot serve. `disconnect()` exists so shutdown
 * closes the socket cleanly instead of letting the process hang.
 */
export class Database {
    private readonly uri: string;
    private connected = false;

    public constructor(uri: string) {
        this.uri = uri;
    }

    public async connect(): Promise<void> {
        if (this.connected) return;

        // Fail fast instead of buffering queries for 30s behind a dead server.
        mongoose.set("strictQuery", true);

        await mongoose.connect(this.uri, {
            serverSelectionTimeoutMS: 10_000,
        });

        this.connected = true;

        const { host, name } = mongoose.connection;
        console.log(`[db] connected to ${host}/${name}`);

        // Fires on connection loss AFTER the initial connect succeeded.
        mongoose.connection.on("error", (error) => {
            console.error("[db] connection error:", error);
        });
    }

    public async disconnect(): Promise<void> {
        if (!this.connected) return;
        await mongoose.disconnect();
        this.connected = false;
        console.log("[db] disconnected");
    }

    public get isConnected(): boolean {
        return this.connected;
    }
}
