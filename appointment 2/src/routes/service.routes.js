const express = require("express");

const {
    createService,
    getServices,
    getServiceById,
    deleteService,
} = require("../controllers/service.controller");

const { validate } = require("../middlewares/validate");
const { idParamSchema } = require("../validations/common.validation");

const {
    createServiceSchema,
    listServiceSchema,
} = require("../validations/service.validation");

const router = express.Router();

router.post("/", validate(createServiceSchema), createService);
router.get("/", validate(listServiceSchema), getServices);
router.get("/:id", validate(idParamSchema), getServiceById);
router.delete("/:id", validate(idParamSchema), deleteService);

module.exports = router;
