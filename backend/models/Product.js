const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        brand: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            trim: true,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        // Stored as base64 data URLs from the admin's file picker.
        // There's no separate image-hosting service wired up yet — see README.
        images: {
            type: [String],
            default: []
        },
        colors: {
            type: [String],
            default: []
        },
        storage: {
            type: String,
            default: ""
        },
        ram: {
            type: String,
            default: ""
        },
        network: {
            type: String,
            default: ""
        },
        processor: {
            type: String,
            default: ""
        },
        wholesalePrice: {
            type: Number,
            required: true,
            min: 0
        },
        moq: {
            type: Number,
            required: true,
            min: 1,
            default: 5
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        featured: {
            type: Boolean,
            default: false
        },
        flashDeal: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ["active", "hidden"],
            default: "active"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

