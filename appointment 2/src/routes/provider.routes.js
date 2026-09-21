const express = require("express");

const {
    createProvider,
    getProviders,
    getProviderById,
    deleteProvider,
} = require("../controllers/provider.controller");

const { validate } = require("../middlewares/validate");
const { idParamSchema } = require("../validations/common.validation");
const { createProviderSchema } = require("../validations/provider.validation");

const router = express.Router();

router.post("/", validate(createProviderSchema), createProvider);
router.get("/", getProviders);
router.get("/:id", validate(idParamSchema), getProviderById);
router.delete("/:id", validate(idParamSchema), deleteProvider);

module.exports = router;
