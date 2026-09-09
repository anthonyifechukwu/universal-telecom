/* =========================================
   TRUECELL CUSTOMER CHAT
   Requires login. Talks to the real backend
   so messages actually reach admin, and the
   same conversation shows up on any device
   the customer logs into.
========================================= */


/* =========================================
   AUTH GUARD — must be logged in to chat
========================================= */

if (!TC.requireLogin()) {
    // requireLogin() already redirected to the login page.
    // Throwing stops the rest of this script from running.
    throw new Error("Redirecting to login.");
}

// Admin and customer sessions live in the same browser storage on this
// site. If an admin is logged in here (e.g. testing both roles in one
// browser), block this page clearly instead of silently sending
// messages "as" the admin's own account — the backend also enforces
// this, but this gives an honest message instead of a confusing failure.
const currentChatUser = TC.getUser();

if (currentChatUser && currentChatUser.role !== "customer") {
    alert("You're logged in as an admin. Please log in with a customer account to use this chat, or log out first.");
    window.location.href = "phone-login.html";
    throw new Error("Blocked: non-customer account on customer chat page.");
}


/* =========================================
   ELEMENTS
========================================= */

const chatForm = document.querySelector("#chat-form");
const messageInput = document.querySelector("#message-input");
const messagesContainer = document.querySelector("#chat-messages");
const sendButton = document.querySelector("#send-button");
const quickButtons = document.querySelectorAll(".quick-btn");
const menuButton = document.querySelector(".chat-menu-button");
const chatMenu = document.querySelector("#chat-menu");
const clearChatButton = document.querySelector("#clear-chat");
const typingIndicator = document.querySelector("#typing-indicator");
const attachmentButton = document.querySelector("#attachment-button");
const fileInput = document.querySelector("#file-input");
const attachmentPreview = document.querySelector("#attachment-preview");
const attachmentName = document.querySelector("#attachment-name");
const removeAttachment = document.querySelector("#remove-attachment");


/* =========================================
   STATE
========================================= */

let knownMessageIds = new Set();
let pollTimer = null;

// Persists per-device so "Clear Chat" survives a page refresh, not just
// the current session — messages sent/received before this time are
// hidden from view (but never deleted from the server).
const CLEAR_TIMESTAMP_KEY = "tc_chat_cleared_before";

function getClearTimestamp() {
    return localStorage.getItem(CLEAR_TIMESTAMP_KEY);
}

function isHiddenByClear(message) {
    const clearedBefore = getClearTimestamp();
    if (!clearedBefore) return false;
    return new Date(message.createdAt) <= new Date(clearedBefore);
}


/* =========================================
   LOAD CONVERSATION FROM SERVER
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadConversation();
    startPolling();
    prefillPendingMessage();

});


// If the customer clicked "Message Admin About This" from the cart page,
// the message is waiting here — pre-fill it (not auto-send) so they can
// review and edit before sending it themselves.
function prefillPendingMessage() {

    const pending = localStorage.getItem("tc_pending_chat_message");

    if (pending && messageInput) {
        messageInput.value = pending;
        localStorage.removeItem("tc_pending_chat_message");
        messageInput.focus();
    }

}


async function loadConversation() {

    try {

        const data = await TC.getMyMessages();

        messagesContainer.innerHTML = "";
        knownMessageIds = new Set();

        data.messages
            .filter(msg => !isHiddenByClear(msg))
            .forEach(msg => renderMessage(msg));

        scrollToBottom();

    } catch (error) {

        if (error.message === "NOT_LOGGED_IN" || !TC.isLoggedIn()) {
            window.location.href = "phone-login.html?redirect=phone-chat.html";
            return;
        }

        renderSystemNotice("Could not load your conversation. Pull to refresh or check your connection.");

    }

}


/* =========================================
   POLL FOR NEW ADMIN REPLIES
========================================= */

function startPolling() {

    if (pollTimer) {
        clearInterval(pollTimer);
    }

    pollTimer = setInterval(async () => {

        // Skip polling while the tab isn't visible — no point spending a
        // request on a page nobody's looking at, and it eases load on
        // the database connection.
        if (document.hidden) return;

        try {

            const data = await TC.getMyMessages();

            data.messages.forEach(msg => {

                if (!knownMessageIds.has(msg._id) && !isHiddenByClear(msg)) {
                    renderMessage(msg);
                }

            });

        } catch (error) {
            // Silent fail on background polling — don't interrupt the user.
        }

    }, 10000);

}

window.addEventListener("beforeunload", () => {

    if (pollTimer) {
        clearInterval(pollTimer);
    }

});


/* =========================================
   SEND MESSAGE
========================================= */

chatForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    messageInput.value = "";
    messageInput.focus();

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {

        const data = await TC.sendMyMessage(message);
        renderMessage(data.message);

    } catch (error) {

        if (error.message === "NOT_LOGGED_IN" || !TC.isLoggedIn()) {
            window.location.href = "phone-login.html?redirect=phone-chat.html";
            return;
        }

        renderSystemNotice("Your message could not be sent. Please try again.");
        messageInput.value = message;

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }

    }

});


/* =========================================
   QUICK ACTIONS
========================================= */

quickButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const message = button.dataset.message;

        if (!message) {
            return;
        }

        try {

            const data = await TC.sendMyMessage(message);
            renderMessage(data.message);

        } catch (error) {

            if (error.message === "NOT_LOGGED_IN" || !TC.isLoggedIn()) {
                window.location.href = "phone-login.html?redirect=phone-chat.html";
            }

        }

    });

});


/* =========================================
   RENDER A MESSAGE FROM THE SERVER
========================================= */

function renderMessage(msg) {

    if (knownMessageIds.has(msg._id)) {
        return;
    }

    knownMessageIds.add(msg._id);

    if (msg.sender === "customer") {
        addCustomerMessage(msg.text, msg.createdAt);
    } else {
        addSupportMessage(msg.text, msg.createdAt);
    }

}


/* =========================================
   ADD CUSTOMER MESSAGE (own bubble)
========================================= */

function addCustomerMessage(message, time) {

    const messageElement = document.createElement("div");

    messageElement.className = "message customer-message";

    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-bubble">
                <p>${escapeHTML(message)}</p>
            </div>
            <span class="message-time">
                ${formatTime(time)}
            </span>
        </div>
    `;

    messagesContainer.appendChild(messageElement);
    scrollToBottom();

}


/* =========================================
   ADD SUPPORT MESSAGE (admin reply)
========================================= */

function addSupportMessage(message, time) {

    const messageElement = document.createElement("div");

    messageElement.className = "message support-message";

    messageElement.innerHTML = `
        <div class="message-avatar">
            <img src="image/logo.png" alt="TrueCell Support">
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <p>${escapeHTML(message)}</p>
            </div>
            <span class="message-time">
                ${formatTime(time)}
            </span>
        </div>
    `;

    messagesContainer.appendChild(messageElement);
    scrollToBottom();

}


/* =========================================
   SYSTEM / ERROR NOTICE
========================================= */

function renderSystemNotice(text) {

    const el = document.createElement("div");
    el.className = "message system-message";
    el.innerHTML = `<div class="message-content"><div class="message-bubble" style="opacity:.75;"><p>${escapeHTML(text)}</p></div></div>`;
    messagesContainer.appendChild(el);
    scrollToBottom();

}


/* =========================================
   TYPING INDICATOR (shown briefly on send)
========================================= */

function showTyping() {

    if (!typingIndicator) {
        return;
    }

    typingIndicator.classList.add("active");
    scrollToBottom();

}

function hideTyping() {

    if (!typingIndicator) {
        return;
    }

    typingIndicator.classList.remove("active");

}


/* =========================================
   CHAT MENU
========================================= */

if (menuButton) {

    menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        chatMenu.classList.toggle("active");
    });

}

document.addEventListener("click", (event) => {

    if (chatMenu && !chatMenu.contains(event.target) && !menuButton.contains(event.target)) {
        chatMenu.classList.remove("active");
    }

});


/* =========================================
   CLEAR CHAT (visual only — history stays on
   the server so admin still sees everything)
========================================= */

if (clearChatButton) {

    clearChatButton.addEventListener("click", () => {

        const confirmed = confirm("Clear this conversation from your screen? Support will still see the full history.");

        if (!confirmed) {
            return;
        }

        messagesContainer.innerHTML = "";

        // Persisted so this stays cleared across refreshes and polling —
        // only messages sent/received AFTER this moment will show again.
        localStorage.setItem(CLEAR_TIMESTAMP_KEY, new Date().toISOString());

    });

}


/* =========================================
   ATTACHMENT BUTTON (UI only for now —
   file upload endpoint not wired yet)
========================================= */

if (attachmentButton) {

    attachmentButton.addEventListener("click", () => {
        fileInput.click();
    });

}

if (fileInput) {

    fileInput.addEventListener("change", () => {

        const file = fileInput.files[0];

        if (!file) {
            return;
        }

        attachmentName.textContent = file.name;
        attachmentPreview.classList.add("active");

    });

}

if (removeAttachment) {

    removeAttachment.addEventListener("click", () => {
        fileInput.value = "";
        attachmentPreview.classList.remove("active");
    });

}


/* =========================================
   ENTER KEY
========================================= */

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }

});


/* =========================================
   TIME FORMAT
========================================= */

function formatTime(time) {

    return new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}


/* =========================================
   SCROLL TO BOTTOM
========================================= */

function scrollToBottom() {

    setTimeout(() => {

        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth"
        });

    }, 50);

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(text) {

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;

}
