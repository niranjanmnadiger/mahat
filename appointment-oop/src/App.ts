import cors from "cors";
import express, { type Application } from "express";
import type { Container } from "./Container";
import { ErrorHandler } from "./middlewares/ErrorHandler";

/**
 * Builds the Express application: middleware, routes, error handling, in that
 * order. Order is not cosmetic - Express runs middleware in registration
 * order, so body parsing must come before routes, and the error handler must
 * come last or thrown errors sail past it.
 *
 * This class does not call `listen()`. Separating "the app" from "the running
 * server" is what makes the app testable with supertest, and it keeps
 * startup concerns (database, signals, ports) in Server.
 */
export class App {
    public readonly instance: Application;

    public constructor(
        private readonly container: Container,
        private readonly corsOrigin: string,
        isProduction: boolean
    ) {
        this.instance = express();
        const errorHandler = new ErrorHandler(isProduction);

        this.registerMiddleware();
        this.registerRoutes();

        // Must be last. A 404 handler before the routes would swallow everything.
        this.instance.use(errorHandler.notFound);
        this.instance.use(errorHandler.handle);
    }

    private registerMiddleware(): void {

        this.instance.set("etag", false);

        // The React app runs on a different port, so the browser needs this.
        this.instance.use(cors({ origin: this.corsOrigin }));
        this.instance.use(express.json({ limit: "100kb" }));

        this.instance.use((req, _res, next) => {
            console.log(`[http] ${req.method} ${req.originalUrl}`);
            next();
        });
    }

    private registerRoutes(): void {
        this.instance.get("/health", (_req, res) => {
            res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } });
        });

        this.instance.use("/customers", this.container.customerRoutes.router);
        this.instance.use("/providers", this.container.providerRoutes.router);
        this.instance.use("/services", this.container.serviceRoutes.router);
        this.instance.use("/appointments", this.container.appointmentRoutes.router);
    }
}
