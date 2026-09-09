const User = require("../models/User");
const Inquiry = require("../models/Inquiry");
const Message = require("../models/Message");

// GET /api/admin/customers  (admin — real registered customers, not mock data)
async function listCustomers(req, res) {
    try {
        const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
        res.json({ customers });
    } catch (error) {
        res.status(500).json({ message: "Could not load customers.", error: error.message });
    }
}

// GET /api/admin/customers/:id  (admin — single customer with their activity)
async function getCustomerById(req, res) {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: "customer" });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const [inquiries, messageCount] = await Promise.all([
            Inquiry.find({ customer: customer._id }).sort({ createdAt: -1 }),
            Message.countDocuments({ customer: customer._id })
        ]);

        res.json({
            customer: customer.toSafeObject(),
            inquiries,
            messageCount
        });
    } catch (error) {
        res.status(500).json({ message: "Could not load customer.", error: error.message });
    }
}

// DELETE /api/admin/customers/:id  (admin — permanently remove a customer)
// Removes the account, their chat history, AND every quote request
// they've submitted — a full, complete removal so no trace of them
// remains anywhere in the admin panel (dashboard, inquiries list,
// customer list, etc). This can't be undone.
async function deleteCustomer(req, res) {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: "customer" });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        await Promise.all([
            User.findByIdAndDelete(customer._id),
            Message.deleteMany({ customer: customer._id }),
            Inquiry.deleteMany({ customer: customer._id })
        ]);

        res.json({ message: "Customer and all their records removed." });
    } catch (error) {
        res.status(500).json({ message: "Could not delete customer.", error: error.message });
    }
}

module.exports = { listCustomers, getCustomerById, deleteCustomer };
