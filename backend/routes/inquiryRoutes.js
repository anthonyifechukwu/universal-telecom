const express = require("express");
const { createInquiry } = require("../controllers/inquiryController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuth, createInquiry);

module.exports = router;
