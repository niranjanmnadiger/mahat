import type { Request, RequestHandler, Response } from "express";
import type { CustomerService } from "../services/CustomerService";
import type { CreateCustomerBody } from "../validations/customer.validation";
import { asyncHandler } from "../utils/asyncHandler";
import { BaseController } from "./BaseController";

/**
 * Controllers do exactly three things: read the validated input, call one
 * service method, send the response. No business rules, no database, no
 * try/catch - asyncHandler forwards any rejection to the ErrorHandler.
 *
 * Every handler is an arrow-function PROPERTY. This is the single most common
 * class-based Express bug: `router.post("/", controller.create)` passes the
 * function without its object, so inside a normal method `this` would be
 * undefined and `this.customerService` would throw. Arrow properties bind
 * `this` when the instance is built, so detaching them is safe.
 */
export class CustomerController extends BaseController {
    public constructor(private readonly customerService: CustomerService) {
        super();
    }

    public readonly create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const data = this.body<CreateCustomerBody>(req);
        const customer = await this.customerService.create(data);
        this.created(res, customer);
    });

    public readonly list: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
        this.ok(res, await this.customerService.list());
    });

    public readonly getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        this.ok(res, await this.customerService.getById(this.id(req)));
    });

    public readonly remove: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        await this.customerService.remove(this.id(req));
        this.deleted(res);
    });
}
