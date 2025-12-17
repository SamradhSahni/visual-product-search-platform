// server/src/routes/search.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
const searchController = require("../controllers/search.controller");

router.post("/image", upload.single("image"), searchController.searchByImage);

module.exports = router;
