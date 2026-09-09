const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        quoteId: {
            type: String,
            required: true,
            unique: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        businessName: {
            type: String,
            required: true,
            trim: true
        },
        contactPerson: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        product: {
            type: String,
            default: ""
        },
        brand: {
            type: String,
            default: ""
        },
        storage: {
            type: String,
            default: ""
        },
        colour: {
            type: String,
            default: ""
        },
        quantity: {
            type: Number,
            default: 1
        },
        // Free-text field — populated from the customer's own words when
        // an inquiry is auto-created from a chat message, or left blank
        // for inquiries submitted through the structured quote form.
        message: {
            type: String,
            default: ""
        },
        // Tracks how this inquiry was created, so admin can tell the
        // difference between a formal quote request and one that was
        // auto-generated from a customer starting a chat conversation.
        source: {
            type: String,
            enum: ["quote_form", "chat"],
            default: "quote_form"
        },
        status: {
            type: String,
            enum: ["new", "replied", "resolved"],
            default: "new"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
