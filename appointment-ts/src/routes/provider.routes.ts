import { Router } from "express";

import {
    createProvider,
    deleteProvider,
    getProviderById,
    getProviders,
} from "../controllers/provider.controller";

import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validations/common.validation";
import { createProviderSchema } from "../validations/provider.validation";

const router = Router();

router.post("/", validate(createProviderSchema), createProvider);
router.get("/", getProviders);
router.get("/:id", validate(idParamSchema), getProviderById);
router.delete("/:id", validate(idParamSchema), deleteProvider);

export default router;
