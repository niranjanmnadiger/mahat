import { Env } from "./config/Env";
import { Server } from "./Server";

/**
 * The entry point, and the only top-level code in the project.
 * Everything else is a class waiting to be constructed.
 */
async function bootstrap(): Promise<void> {
    try {
        const env = Env.load(); // throws immediately if configuration is missing
        const server = new Server(env);
        await server.start();
    } catch (error) {
        console.error("[boot] failed to start:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

void bootstrap();
