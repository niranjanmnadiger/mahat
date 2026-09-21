import type { Request, RequestHandler, Response } from "express";
import type { ProviderService } from "../services/ProviderService";
import type { CreateProviderBody } from "../validations/provider.validation";
import { asyncHandler } from "../utils/asyncHandler";
import { BaseController } from "./BaseController";

export class ProviderController extends BaseController {
    public constructor(private readonly providerService: ProviderService) {
        super();
    }

    public readonly create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const provider = await this.providerService.create(this.body<CreateProviderBody>(req));
        this.created(res, provider);
    });

    public readonly list: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
        this.ok(res, await this.providerService.list());
    });

    public readonly getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        this.ok(res, await this.providerService.getById(this.id(req)));
    });

    public readonly remove: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        await this.providerService.remove(this.id(req));
        this.deleted(res);
    });
}
