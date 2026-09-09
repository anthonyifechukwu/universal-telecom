const Inquiry = require("../models/Inquiry");

function generateQuoteId() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `PH-${y}${m}${d}-${rand}`;
}

// POST /api/inquiries  (public — customer may or may not be logged in yet)
async function createInquiry(req, res) {
    try {
        const {
            businessName,
            contactPerson,
            email,
            phone,
            product,
            brand,
            storage,
            colour,
            quantity
        } = req.body;

        if (!businessName || !contactPerson || !email || !phone) {
            return res.status(400).json({ message: "Please complete all required fields." });
        }

        let quoteId = generateQuoteId();

        // Extremely unlikely, but guarantee uniqueness
        // eslint-disable-next-line no-await-in-loop
        while (await Inquiry.findOne({ quoteId })) {
            quoteId = generateQuoteId();
        }

        const inquiry = await Inquiry.create({
            quoteId,
            customer: req.user ? req.user._id : null,
            businessName,
            contactPerson,
            email,
            phone,
            product,
            brand,
            storage,
            colour,
            quantity: quantity ? Number(quantity) : 1
        });

        res.status(201).json({ message: "Quote request submitted.", inquiry });
    } catch (error) {
        res.status(500).json({ message: "Could not submit quote request.", error: error.message });
    }
}

// GET /api/admin/inquiries  (admin only)
// Supports ?quoteId=PH-... to fetch a single inquiry by its public quote ID
async function listInquiries(req, res) {
    try {
        const filter = {};

        if (req.query.quoteId) {
            filter.quoteId = req.query.quoteId;
        }

        const inquiries = await Inquiry.find(filter)
            .populate({ path: "customer", select: "fullName businessName email phone createdAt", match: { role: "customer" } })
            .sort({ createdAt: -1 });

        res.json({ inquiries });
    } catch (error) {
        res.status(500).json({ message: "Could not load inquiries.", error: error.message });
    }
}

// GET /api/admin/inquiries/:id  (admin only — lookup by Mongo _id)
async function getInquiryById(req, res) {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate({ path: "customer", select: "fullName businessName email phone createdAt", match: { role: "customer" } });

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found." });
        }

        res.json({ inquiry });
    } catch (error) {
        res.status(500).json({ message: "Could not load inquiry.", error: error.message });
    }
}

// PATCH /api/admin/inquiries/:id  (admin updates status)
async function updateInquiryStatus(req, res) {
    try {
        const { status } = req.body;
        const allowed = ["new", "replied", "resolved"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found." });
        }

        res.json({ inquiry });
    } catch (error) {
        res.status(500).json({ message: "Could not update inquiry.", error: error.message });
    }
}

module.exports = { createInquiry, listInquiries, getInquiryById, updateInquiryStatus };
