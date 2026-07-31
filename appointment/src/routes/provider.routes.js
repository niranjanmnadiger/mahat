const express = require("express");

const {
    createProvider,
    getProviders,
    deleteProvider,
} = require("../controllers/provider.controller");

const router = express.Router();

router.post("/", createProvider);
router.get("/", getProviders);
router.delete("/:id", deleteProvider);

module.exports = router;