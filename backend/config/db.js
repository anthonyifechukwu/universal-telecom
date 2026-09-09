const mongoose = require("mongoose");

// By default, Mongoose queues up queries indefinitely while it's not
// connected, waiting for a connection that might never succeed. That
// makes the app LOOK like it's just "loading forever" with no error —
// this was likely the cause of pages that spin endlessly. Failing fast
// instead means a broken connection shows a real error immediately.
mongoose.set("bufferCommands", false);

async function connectDB() {
    // Support either name so existing .env files don't break
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
        console.error("Missing MONGO_URI in environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 20000, // generous enough for an Atlas free-tier cluster waking from idle
            family: 4 // force IPv4 — some ISPs/networks have slow or broken IPv6 routing to Atlas,
                      // which causes exactly this pattern: queries that are slow and get progressively
                      // worse over a session as the driver keeps retrying/falling back
        });
        console.log("MongoDB connected:", mongoose.connection.host);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
