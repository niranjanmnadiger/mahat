import { Router } from "express";

import {
    createService,
    deleteService,
    getServiceById,
    getServices,
} from "../controllers/service.controller";

import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validations/common.validation";
import { createServiceSchema, listServiceSchema } from "../validations/service.validation";

const router = Router();

router.post("/", validate(createServiceSchema), createService);
router.get("/", validate(listServiceSchema), getServices);
router.get("/:id", validate(idParamSchema), getServiceById);
router.delete("/:id", validate(idParamSchema), deleteService);

export default router;
