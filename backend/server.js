require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ensureAdminAccount = require("./config/ensureAdmin");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Disable Express's automatic ETag generation for API responses. By
// default Express adds an ETag header to every JSON response, which
// makes the browser send conditional requests on repeat visits and can
// get a 304 "Not Modified" back — a perfectly valid HTTP response, but
// one that was being incorrectly treated as an error on the frontend
// (fetch()'s response.ok is only true for 200-299, so a 304 was wrongly
// triggering "could not load" failures even though the request actually
// succeeded). There's already a proper server-side cache with correct
// invalidation for this data — browser-level HTTP caching on top of
// that was only causing confusion, not adding value.
app.set("etag", false);
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

connectDB().then(() => {
    ensureAdminAccount().catch((error) => {
        console.error("Could not auto-create admin account:", error.message);
    });
});

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim());

app.use(
    cors({
        origin: allowedOrigins.includes("*") ? true : allowedOrigins,
        credentials: true
    })
);

// Raised from a small default because product images are sent as base64
// data (no separate file-hosting service is wired up yet — see README).
app.use(express.json({ limit: "15mb" }));

// Logs every request with how long it took to respond. If something is
// ever slow again, this makes it immediately obvious in the terminal
// which exact endpoint is the problem, instead of having to guess from
// a browser error alone.
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const ms = Date.now() - start;
        const marker = ms > 3000 ? " ⚠ SLOW" : "";
        console.log(`${req.method} ${req.originalUrl} — ${res.statusCode} (${ms}ms)${marker}`);
    });
    next();
});

// ---- Health check (useful for hosting providers + uptime pings) ----
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

// ---- 404 handler ----
app.use((req, res) => {
    res.status(404).json({ message: "Not found." });
});

// ---- Error handler (catches anything unexpected) ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Universal Telecom API running on port ${PORT}`);
});
