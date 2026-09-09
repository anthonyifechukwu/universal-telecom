/**
 * OPTIONAL — the server now auto-creates the admin account on startup
 * from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in your .env file.
 * Use this script only if you need to create an EXTRA admin account
 * manually.
 *
 * Usage (from the backend/ folder, after `npm install` and setting up .env):
 *   node scripts/createAdmin.js "Your Name" admin@yourdomain.com "a-strong-password"
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
    const [fullName, email, password] = process.argv.slice(2);

    if (!fullName || !email || !password) {
        console.log('Usage: node scripts/createAdmin.js "Full Name" email@example.com "password"');
        process.exit(1);
    }

    if (password.length < 6) {
        console.log("Password must be at least 6 characters.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
        existing.role = "admin";
        existing.fullName = fullName;
        await existing.save();
        console.log(`Existing account ${email} upgraded to admin.`);
    } else {
        await User.create({
            fullName,
            email,
            password,
            role: "admin"
        });
        console.log(`Admin account created: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((error) => {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
});
