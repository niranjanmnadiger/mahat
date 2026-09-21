import { Router } from "express";

import {
    createCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomers,
} from "../controllers/customer.controller";

import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validations/common.validation";
import { createCustomerSchema } from "../validations/customer.validation";

const router = Router();

router.post("/", validate(createCustomerSchema), createCustomer);
router.get("/", getCustomers);
router.get("/:id", validate(idParamSchema), getCustomerById);
router.delete("/:id", validate(idParamSchema), deleteCustomer);

export default router;
