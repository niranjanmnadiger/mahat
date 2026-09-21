import { Router } from "express";

/**
 * Every route class owns one Express Router and registers its own paths.
 *
 * The constructor calls `register()`, which subclasses implement. So building
 * the object is enough - there is no "don't forget to call setup()" step, and
 * `router` is ready the moment the instance exists.
 */
export abstract class BaseRoutes {
    public readonly router: Router = Router();

    protected abstract register(): void;
}
