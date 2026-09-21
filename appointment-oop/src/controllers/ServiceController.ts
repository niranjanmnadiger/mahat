import type { Request, RequestHandler, Response } from "express";
import type { ServiceService } from "../services/ServiceService";
import type { CreateServiceBody } from "../validations/service.validation";
import { asyncHandler } from "../utils/asyncHandler";
import { BaseController } from "./BaseController";

export class ServiceController extends BaseController {
    public constructor(private readonly serviceService: ServiceService) {
        super();
    }

    public readonly create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const body = this.body<CreateServiceBody>(req);
        const service = await this.serviceService.create(body as never);
        this.created(res, service);
    });

    public readonly list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const { providerId } = this.query<{ providerId?: string }>(req);
        this.ok(res, await this.serviceService.list(providerId));
    });

    public readonly getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        this.ok(res, await this.serviceService.getById(this.id(req)));
    });

    public readonly remove: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        await this.serviceService.remove(this.id(req));
        this.deleted(res);
    });
}
