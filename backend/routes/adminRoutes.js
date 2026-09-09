const express = require("express");
const {
    listConversations,
    getConversationForAdmin,
    replyToCustomer
} = require("../controllers/messageController");
const { listInquiries, getInquiryById, updateInquiryStatus } = require("../controllers/inquiryController");
const {
    adminListProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");
const { listCustomers, getCustomerById, deleteCustomer } = require("../controllers/customerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Every route here requires a logged-in admin
router.use(requireAuth, requireAdmin);

router.get("/conversations", listConversations);
router.get("/conversations/:customerId", getConversationForAdmin);
router.post("/conversations/:customerId", replyToCustomer);

router.get("/inquiries", listInquiries);
router.get("/inquiries/:id", getInquiryById);
router.patch("/inquiries/:id", updateInquiryStatus);

router.get("/products", adminListProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/customers", listCustomers);
router.get("/customers/:id", getCustomerById);
router.delete("/customers/:id", deleteCustomer);

module.exports = router;
