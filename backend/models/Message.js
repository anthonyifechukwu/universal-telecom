const mongoose = require("mongoose");

// Every message belongs to a "conversation" which is simply the
// customer's user id. Admin replies reference the same customer id
// so the whole thread can be fetched with one query.
const messageSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        sender: {
            type: String,
            enum: ["customer", "admin"],
            required: true
        },
        senderName: {
            type: String,
            default: ""
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000
        },
        readByAdmin: {
            type: Boolean,
            default: false
        },
        readByCustomer: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
