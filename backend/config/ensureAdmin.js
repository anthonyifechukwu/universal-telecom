const User = require("../models/User");

// Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env and makes sure
// that account exists and has admin rights. Safe to run every time the
// server starts — it only creates the account once, and never overwrites
// an existing password.
async function ensureAdminAccount() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_NAME || "Admin";

    if (!email || !password) {
        console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin auto-create.");
        return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
        if (existing.role !== "admin") {
            existing.role = "admin";
            await existing.save();
            console.log(`Upgraded ${email} to admin.`);
        }
        return;
    }

    await User.create({
        fullName,
        email,
        password,
        role: "admin"
    });

    console.log(`Admin account created from .env: ${email}`);
}

module.exports = ensureAdminAccount;
