import type { Request, Response } from "express";

/**
 * Shared response helpers so every controller returns the same envelope.
 *
 * `protected` means subclasses can use these and nothing else can. A route
 * cannot call `controller.ok(...)` from outside.
 */
export abstract class BaseController {
    protected ok<T>(res: Response, data: T): void {
        res.status(200).json({ success: true, data });
    }

    protected created<T>(res: Response, data: T): void {
        res.status(201).json({ success: true, data });
    }

    /** 200 with `data: null`, so the frontend can treat every response the same way. */
    protected deleted(res: Response): void {
        res.status(200).json({ success: true, data: null });
    }

    /** Reads what RequestValidator parsed. Never reaches for raw req.body. */
    protected body<T>(req: Request): T {
        return req.validated?.body as T;
    }

    protected query<T>(req: Request): T {
        return (req.validated?.query ?? {}) as T;
    }

    protected id(req: Request): string {
        return (req.validated?.params as { id: string }).id;
    }
}
