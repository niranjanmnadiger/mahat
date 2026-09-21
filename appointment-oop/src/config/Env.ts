import dotenv from "dotenv";

dotenv.config();

/**
 * Reads and validates environment variables ONCE, at startup.
 *
 * Why a class with a private constructor and a static `load()`:
 * if anything is missing we want the process to die on boot with a clear
 * message, not to serve traffic and fail on the first database call. The
 * private constructor means nobody can build a half-configured Env by hand -
 * `Env.load()` is the only way in, and it either returns a complete object or
 * throws.
 */
export class Env {
    public readonly port: number;
    public readonly mongoUri: string;
    public readonly corsOrigin: string;
    public readonly nodeEnv: string;

    private constructor(port: number, mongoUri: string, corsOrigin: string, nodeEnv: string) {
        this.port = port;
        this.mongoUri = mongoUri;
        this.corsOrigin = corsOrigin;
        this.nodeEnv = nodeEnv;
    }

    /** Throws with the variable name if it is missing or blank. */
    private static require(name: string): string {
        const value = process.env[name];
        if (value === undefined || value.trim() === "") {
            throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`);
        }
        return value.trim();
    }

    private static optional(name: string, fallback: string): string {
        const value = process.env[name];
        return value === undefined || value.trim() === "" ? fallback : value.trim();
    }

    public static load(): Env {
        const rawPort = Env.optional("PORT", "3000");
        const port = Number(rawPort);

        if (!Number.isInteger(port) || port <= 0 || port > 65535) {
            throw new Error(`PORT must be a valid port number, received "${rawPort}"`);
        }

        return new Env(
            port,
            Env.require("MONGO_URI"),
            Env.optional("CORS_ORIGIN", "http://localhost:5173"),
            Env.optional("NODE_ENV", "development")
        );
    }

    public get isProduction(): boolean {
        return this.nodeEnv === "production";
    }
}
