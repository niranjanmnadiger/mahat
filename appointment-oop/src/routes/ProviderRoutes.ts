import type { ProviderController } from "../controllers/ProviderController";
import { RequestValidator } from "../middlewares/RequestValidator";
import { idParams } from "../validations/common.validation";
import { createProviderBody } from "../validations/provider.validation";
import { BaseRoutes } from "./BaseRoutes";

export class ProviderRoutes extends BaseRoutes {
    public constructor(private readonly controller: ProviderController) {
        super();
        this.register();
    }

    protected register(): void {
        this.router.post("/", RequestValidator.validate({ body: createProviderBody }), this.controller.create);
        this.router.get("/", this.controller.list);
        this.router.get("/:id", RequestValidator.validate({ params: idParams }), this.controller.getById);
        this.router.delete("/:id", RequestValidator.validate({ params: idParams }), this.controller.remove);
    }
}
