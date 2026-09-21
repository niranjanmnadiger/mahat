import type { AppointmentController } from "../controllers/AppointmentController";
import { RequestValidator } from "../middlewares/RequestValidator";
import {
    changeStatusBody,
    createAppointmentBody,
    listAppointmentQuery,
    rescheduleBody,
} from "../validations/appointment.validation";
import { idParams } from "../validations/common.validation";
import { BaseRoutes } from "./BaseRoutes";

export class AppointmentRoutes extends BaseRoutes {
    public constructor(private readonly controller: AppointmentController) {
        super();
        this.register();
    }

    protected register(): void {
        this.router.post("/", RequestValidator.validate({ body: createAppointmentBody }), this.controller.create);
        this.router.get("/", RequestValidator.validate({ query: listAppointmentQuery }), this.controller.list);
        this.router.get("/:id", RequestValidator.validate({ params: idParams }), this.controller.getById);

        // PATCH, not PUT: each one changes a single aspect and runs its own
        // rules. Separate routes also keep the rules separate - rescheduling
        // re-runs the clash check, a status change does not need to.
        this.router.patch(
            "/:id/reschedule",
            RequestValidator.validate({ params: idParams, body: rescheduleBody }),
            this.controller.reschedule
        );
        this.router.patch(
            "/:id/status",
            RequestValidator.validate({ params: idParams, body: changeStatusBody }),
            this.controller.changeStatus
        );

        this.router.delete("/:id", RequestValidator.validate({ params: idParams }), this.controller.remove);
    }
}
