import type { CustomerController } from "../controllers/CustomerController";
import { RequestValidator } from "../middlewares/RequestValidator";
import { idParams } from "../validations/common.validation";
import { createCustomerBody } from "../validations/customer.validation";
import { BaseRoutes } from "./BaseRoutes";

export class CustomerRoutes extends BaseRoutes {
    public constructor(private readonly controller: CustomerController) {
        super();
        this.register();
    }

    protected register(): void {
        this.router.post("/", RequestValidator.validate({ body: createCustomerBody }), this.controller.create);
        this.router.get("/", this.controller.list);
        this.router.get("/:id", RequestValidator.validate({ params: idParams }), this.controller.getById);
        this.router.delete("/:id", RequestValidator.validate({ params: idParams }), this.controller.remove);
    }
}
