const Message = require("../models/Message");
const User = require("../models/User");
const Inquiry = require("../models/Inquiry");

function generateQuoteId() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `PH-${y}${m}${d}-${rand}`;
}

// GET /api/messages/mine  (customer fetches their own conversation)
async function getMyConversation(req, res) {
    try {
        const messages = await Message.find({ customer: req.user._id }).sort({ createdAt: 1 });

        // Mark admin messages as read now that the customer has opened the chat
        await Message.updateMany(
            { customer: req.user._id, sender: "admin", readByCustomer: false },
            { readByCustomer: true }
        );

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ message: "Could not load conversation.", error: error.message });
    }
}

// POST /api/messages/mine  (customer sends a message to admin)
// Also keeps a real Inquiry record in sync with the conversation, using
// the customer's real registered info, so every chat shows up in the
// admin Inquiries page too — not just formal quote-form submissions.
async function sendMyMessage(req, res) {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message cannot be empty." });
        }

        const message = await Message.create({
            customer: req.user._id,
            sender: "customer",
            senderName: req.user.fullName,
            text: text.trim(),
            readByCustomer: true
        });

        await syncInquiryFromChat(req.user, text.trim());

        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ message: "Could not send message.", error: error.message });
    }
}

// Finds this customer's most recent still-open inquiry (any source) and
// updates its message with what they just said, marking it "new" again
// so admin sees it needs attention. If they have no open inquiry yet,
// creates one from their real account details.
async function syncInquiryFromChat(user, latestText) {

    const existing = await Inquiry.findOne({
        customer: user._id,
        status: { $ne: "resolved" }
    }).sort({ createdAt: -1 });

    if (existing) {
        existing.message = latestText;
        existing.status = "new";
        await existing.save();
        return existing;
    }

    let quoteId = generateQuoteId();
    // eslint-disable-next-line no-await-in-loop
    while (await Inquiry.findOne({ quoteId })) {
        quoteId = generateQuoteId();
    }

    return Inquiry.create({
        quoteId,
        customer: user._id,
        businessName: user.businessName || user.fullName,
        contactPerson: user.fullName,
        email: user.email,
        phone: user.phone,
        message: latestText,
        source: "chat"
    });

}

// GET /api/admin/conversations  (admin: list every customer who has messaged, most recent first)
async function listConversations(req, res) {
    try {
        const latest = await Message.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$customer",
                    lastMessage: { $first: "$text" },
                    lastSender: { $first: "$sender" },
                    lastAt: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$sender", "customer"] }, { $eq: ["$readByAdmin", false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastAt: -1 } }
        ]);

        const customerIds = latest.map((item) => item._id);
        // role: "customer" specifically — without this, a leftover message
        // record from before admin/customer sessions were separated (where
        // an admin's own account got mistakenly treated as "the customer")
        // would show up here as a phantom conversation that can never be
        // deleted through the customer-delete endpoint, since it isn't
        // actually a customer account.
        const customers = await User.find({ _id: { $in: customerIds }, role: "customer" });
        const customerMap = new Map(customers.map((c) => [String(c._id), c]));

        const conversations = latest
            .filter((item) => customerMap.has(String(item._id)))
            .map((item) => {
                const customer = customerMap.get(String(item._id));
                return {
                    customerId: customer._id,
                    fullName: customer.fullName,
                    businessName: customer.businessName,
                    email: customer.email,
                    phone: customer.phone,
                    lastMessage: item.lastMessage,
                    lastSender: item.lastSender,
                    lastAt: item.lastAt,
                    unreadCount: item.unreadCount
                };
            });

        res.json({ conversations });
    } catch (error) {
        res.status(500).json({ message: "Could not load conversations.", error: error.message });
    }
}

// GET /api/admin/conversations/:customerId  (admin: full thread with one customer)
async function getConversationForAdmin(req, res) {
    try {
        const { customerId } = req.params;

        const customer = await User.findOne({ _id: customerId, role: "customer" });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const messages = await Message.find({ customer: customerId }).sort({ createdAt: 1 });

        await Message.updateMany(
            { customer: customerId, sender: "customer", readByAdmin: false },
            { readByAdmin: true }
        );

        res.json({
            customer: customer.toSafeObject(),
            messages
        });
    } catch (error) {
        res.status(500).json({ message: "Could not load conversation.", error: error.message });
    }
}

// POST /api/admin/conversations/:customerId  (admin replies to a customer)
async function replyToCustomer(req, res) {
    try {
        const { customerId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message cannot be empty." });
        }

        const customer = await User.findOne({ _id: customerId, role: "customer" });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const message = await Message.create({
            customer: customerId,
            sender: "admin",
            senderName: req.user.fullName || "Support",
            text: text.trim(),
            readByAdmin: true
        });

        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ message: "Could not send reply.", error: error.message });
    }
}

module.exports = {
    getMyConversation,
    sendMyMessage,
    listConversations,
    getConversationForAdmin,
    replyToCustomer
};
