const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT sent by the frontend in the Authorization header
// and attaches the logged-in user to req.user.
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: "Please log in to continue." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Session invalid. Please log in again." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access only." });
    }
    next();
}

// Generic role guard — used to stop an admin's own session (which lives
// in the same browser localStorage as a customer's, since this is one
// site) from being usable on customer-only endpoints, and vice versa.
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: `This action requires a ${role} account.` });
        }
        next();
    };
}

// Attaches req.user if a valid token is present, but never blocks the request.
// Used for endpoints (like submitting a quote request) that work for guests too.
async function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        next();
    }
}

module.exports = { requireAuth, requireAdmin, requireRole, optionalAuth };
