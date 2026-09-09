const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, me, updateMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Slow down brute-force attempts on login without affecting normal use
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: "Too many login attempts. Please try again in a few minutes." }
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);

module.exports = router;
