const express = require("express");

const {
    createService,
    getServices,
    deleteService,
} = require("../controllers/service.controller");

const router = express.Router();

router.post("/", createService);
router.get("/", getServices);
router.delete("/:id", deleteService);

module.exports = router;

// collectyion - service - which provider , customer and appointment - 4 