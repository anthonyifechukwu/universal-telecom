const express = require("express");
const { getMyConversation, sendMyMessage } = require("../controllers/messageController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// These routes are for customers specifically. requireAuth alone isn't
// enough here — an admin is also a logged-in user, and since admin and
// customer sessions live in the same browser localStorage on this site,
// an admin's token could otherwise be used on these customer-only
// endpoints by accident (this was causing the admin's own account to
// show up as if it were a customer's chat).
router.use(requireAuth, requireRole("customer"));

router.get("/mine", getMyConversation);
router.post("/mine", sendMyMessage);

module.exports = router;
