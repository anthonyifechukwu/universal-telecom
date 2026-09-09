const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );
}

// POST /api/auth/register
async function register(req, res) {
    try {
        const { fullName, businessName, email, phone, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Full name, email and password are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });

        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists. Please log in instead." });
        }

        const user = await User.create({
            fullName,
            businessName,
            email,
            phone,
            password,
            role: "customer"
        });

        const token = signToken(user);

        res.status(201).json({
            message: "Account created successfully.",
            token,
            user: user.toSafeObject()
        });
    } catch (error) {
        res.status(500).json({ message: "Registration failed.", error: error.message });
    }
}

// POST /api/auth/login  (works for both customers and admins)
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const matches = await user.comparePassword(password);

        if (!matches) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = signToken(user);

        res.json({
            message: "Login successful.",
            token,
            user: user.toSafeObject()
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed.", error: error.message });
    }
}

// GET /api/auth/me
async function me(req, res) {
    res.json({ user: req.user.toSafeObject() });
}

// PATCH /api/auth/me — lets a logged-in user (customer or seller) update
// their own real fields. Email is intentionally not editable here, since
// it's how they log in.
async function updateMe(req, res) {
    try {
        const { fullName, phone, businessName } = req.body;

        if (fullName !== undefined) {
            if (!fullName.trim()) {
                return res.status(400).json({ message: "Full name can't be empty." });
            }
            req.user.fullName = fullName.trim();
        }

        if (phone !== undefined) req.user.phone = phone.trim();
        if (businessName !== undefined) req.user.businessName = businessName.trim();

        await req.user.save();

        res.json({ message: "Profile updated.", user: req.user.toSafeObject() });
    } catch (error) {
        res.status(500).json({ message: "Could not update profile.", error: error.message });
    }
}

module.exports = { register, login, me, updateMe };
