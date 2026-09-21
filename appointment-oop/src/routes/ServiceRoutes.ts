import type { ServiceController } from "../controllers/ServiceController";
import { RequestValidator } from "../middlewares/RequestValidator";
import { idParams } from "../validations/common.validation";
import { createServiceBody, listServiceQuery } from "../validations/service.validation";
import { BaseRoutes } from "./BaseRoutes";

export class ServiceRoutes extends BaseRoutes {
    public constructor(private readonly controller: ServiceController) {
        super();
        this.register();
    }

    protected register(): void {
        this.router.post("/", RequestValidator.validate({ body: createServiceBody }), this.controller.create);
        this.router.get("/", RequestValidator.validate({ query: listServiceQuery }), this.controller.list);
        this.router.get("/:id", RequestValidator.validate({ params: idParams }), this.controller.getById);
        this.router.delete("/:id", RequestValidator.validate({ params: idParams }), this.controller.remove);
    }
}
