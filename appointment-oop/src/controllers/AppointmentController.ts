import type { Request, RequestHandler, Response } from "express";
import type { AppointmentFilters } from "../repositories/AppointmentRepository";
import type { AppointmentService } from "../services/AppointmentService";
import type { AppointmentStatus } from "../types/common";
import type { CreateAppointmentBody } from "../validations/appointment.validation";
import { asyncHandler } from "../utils/asyncHandler";
import { BaseController } from "./BaseController";

export class AppointmentController extends BaseController {
    public constructor(private readonly appointmentService: AppointmentService) {
        super();
    }

    public readonly create: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const body = this.body<CreateAppointmentBody>(req);
        const appointment = await this.appointmentService.create(body);
        this.created(res, appointment);
    });

    public readonly list: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const filters = this.query<AppointmentFilters>(req);
        this.ok(res, await this.appointmentService.list(filters));
    });

    public readonly getById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        this.ok(res, await this.appointmentService.getById(this.id(req)));
    });

    public readonly reschedule: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const { startTime } = this.body<{ startTime: Date }>(req);
        this.ok(res, await this.appointmentService.reschedule(this.id(req), startTime));
    });

    public readonly changeStatus: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        const { status } = this.body<{ status: AppointmentStatus }>(req);
        this.ok(res, await this.appointmentService.changeStatus(this.id(req), status));
    });

    public readonly remove: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
        await this.appointmentService.remove(this.id(req));
        this.deleted(res);
    });
}
