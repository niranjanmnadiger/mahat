const express = require("express");

const {
    createCustomer,
    getCustomers,
    getCustomerById,
    deleteCustomer,
} = require("../controllers/customer.controller");

const { validate } = require("../middlewares/validate");
const { idParamSchema } = require("../validations/common.validation");
const { createCustomerSchema } = require("../validations/customer.validation");

const router = express.Router();

router.post("/", validate(createCustomerSchema), createCustomer);
router.get("/", getCustomers);
router.get("/:id", validate(idParamSchema), getCustomerById);
router.delete("/:id", validate(idParamSchema), deleteCustomer);

module.exports = router;
