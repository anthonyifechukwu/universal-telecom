/* =========================================
   ADMIN MESSAGES INBOX
========================================= */

const container = document.getElementById("chat-admin-container");
const listItemsEl = document.getElementById("conversation-items");
const loadingEl = document.getElementById("conversations-loading");
const emptyEl = document.getElementById("conversations-empty");
const errorEl = document.getElementById("conversations-error");
const errorMessageEl = document.getElementById("conversations-error-message");
const retryBtn = document.getElementById("conversations-retry-btn");
const searchInput = document.getElementById("conversation-search-input");

const threadEmptyState = document.getElementById("thread-empty-state");
const threadActive = document.getElementById("thread-active");
const threadMessagesEl = document.getElementById("thread-messages");
const threadCustomerName = document.getElementById("thread-customer-name");
const threadCustomerBusiness = document.getElementById("thread-customer-business");
const threadViewInquiriesLink = document.getElementById("thread-view-inquiries-link");
const threadDeleteCustomerBtn = document.getElementById("thread-delete-customer-btn");
const replyForm = document.getElementById("thread-reply-form");
const replyInput = document.getElementById("thread-reply-input");
const replySendBtn = document.getElementById("thread-reply-send");
const backToListBtn = document.getElementById("back-to-list-btn");
const sidebarUnreadCount = document.getElementById("sidebar-unread-count");

let conversations = [];
let activeCustomerId = null;
let activeCustomerName = "";
let pollTimer = null;
let knownMessageIds = new Set();


/* =========================================
   LOAD CONVERSATIONS
========================================= */

async function loadConversations() {

    loadingEl.hidden = false;
    emptyEl.hidden = true;
    errorEl.hidden = true;

    try {

        const data = await TC.adminListConversations();
        conversations = data.conversations || [];

        loadingEl.hidden = true;

        renderConversationList(conversations);
        updateSidebarBadge();

        // Deep link support: admin-chat.html?customer=<id>
        const params = new URLSearchParams(window.location.search);
        const preselect = params.get("customer");

        if (preselect) {
            openConversation(preselect);
        }

    } catch (error) {

        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorMessageEl.textContent = error.message || "Could not load conversations.";

    }

}

function updateSidebarBadge() {

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    if (totalUnread > 0) {
        sidebarUnreadCount.hidden = false;
        sidebarUnreadCount.textContent = totalUnread;
    } else {
        sidebarUnreadCount.hidden = true;
    }

}


/* =========================================
   RENDER CONVERSATION LIST
========================================= */

function renderConversationList(list) {

    listItemsEl.innerHTML = "";

    if (list.length === 0) {
        emptyEl.hidden = false;
        return;
    }

    emptyEl.hidden = true;

    list.forEach(conversation => {

        const li = document.createElement("li");
        li.className = "conversation-item" + (conversation.unreadCount > 0 ? " unread" : "");
        li.dataset.customerId = conversation.customerId;

        if (String(conversation.customerId) === String(activeCustomerId)) {
            li.classList.add("active");
        }

        const initials = getInitials(conversation.fullName);
        const preview = conversation.lastSender === "admin"
            ? `You: ${conversation.lastMessage}`
            : conversation.lastMessage;

        li.innerHTML = `
            <div class="conversation-avatar">${initials}</div>
            <div class="conversation-item-body">
                <div class="conversation-item-top">
                    <strong>${escapeHTML(conversation.fullName)}</strong>
                    <span>${formatRelativeTime(conversation.lastAt)}</span>
                </div>
                <div class="conversation-item-preview">${escapeHTML(preview)}</div>
            </div>
            ${conversation.unreadCount > 0 ? '<span class="unread-dot"></span>' : ""}
        `;

        li.addEventListener("click", () => openConversation(conversation.customerId));

        listItemsEl.appendChild(li);

    });

}

function getInitials(name) {

    if (!name) return "?";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("");

}


/* =========================================
   SEARCH / FILTER
========================================= */

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const term = searchInput.value.trim().toLowerCase();

        const filtered = conversations.filter(c =>
            (c.fullName || "").toLowerCase().includes(term) ||
            (c.businessName || "").toLowerCase().includes(term)
        );

        renderConversationList(filtered);

    });

}


/* =========================================
   OPEN A CONVERSATION
========================================= */

async function openConversation(customerId) {

    activeCustomerId = customerId;
    knownMessageIds = new Set();

    // Update selected state in the list
    document.querySelectorAll(".conversation-item").forEach(item => {
        item.classList.toggle("active", item.dataset.customerId === String(customerId));
    });

    threadEmptyState.hidden = true;
    threadActive.hidden = false;
    threadMessagesEl.innerHTML = `<div class="chat-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    // Mobile: switch to thread panel
    container.classList.add("show-thread");
    container.classList.remove("show-list");

    try {

        const data = await TC.adminGetConversation(customerId);

        threadCustomerName.textContent = data.customer.fullName;
        threadCustomerBusiness.textContent = data.customer.businessName || data.customer.email;
        threadViewInquiriesLink.href = `inquiries.html?customer=${customerId}`;
        activeCustomerName = data.customer.fullName;

        threadMessagesEl.innerHTML = "";
        data.messages.forEach(renderThreadMessage);
        scrollThreadToBottom();

        startPolling();

        // Clear the unread dot for this conversation locally
        const conv = conversations.find(c => String(c.customerId) === String(customerId));
        if (conv) conv.unreadCount = 0;
        updateSidebarBadge();

    } catch (error) {

        threadMessagesEl.innerHTML = `<div class="chat-state"><p>Could not load this conversation.</p></div>`;

    }

}

if (backToListBtn) {

    backToListBtn.addEventListener("click", () => {
        container.classList.remove("show-thread");
        container.classList.add("show-list");
    });

}


/* =========================================
   RENDER A MESSAGE BUBBLE
========================================= */

function renderThreadMessage(msg) {

    if (knownMessageIds.has(msg._id)) return;
    knownMessageIds.add(msg._id);

    const bubble = document.createElement("div");
    bubble.className = "admin-msg " + (msg.sender === "admin" ? "from-admin" : "from-customer");
    bubble.innerHTML = `
        ${escapeHTML(msg.text)}
        <span class="admin-msg-time">${formatTime(msg.createdAt)}</span>
    `;

    threadMessagesEl.appendChild(bubble);

}

function scrollThreadToBottom() {
    setTimeout(() => {
        threadMessagesEl.scrollTop = threadMessagesEl.scrollHeight;
    }, 50);
}


/* =========================================
   SEND REPLY
========================================= */

replyForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const text = replyInput.value.trim();
    if (!text || !activeCustomerId) return;

    replyInput.value = "";
    replySendBtn.disabled = true;

    try {

        const data = await TC.adminReply(activeCustomerId, text);
        renderThreadMessage(data.message);
        scrollThreadToBottom();

        // Bump this conversation to the top of the list locally
        const conv = conversations.find(c => String(c.customerId) === String(activeCustomerId));
        if (conv) {
            conv.lastMessage = text;
            conv.lastSender = "admin";
            conv.lastAt = new Date().toISOString();
        }
        renderConversationList(conversations);

    } catch (error) {

        alert(error.message || "Could not send reply.");
        replyInput.value = text;

    } finally {

        replySendBtn.disabled = false;

    }

});


/* =========================================
   POLL FOR NEW MESSAGES IN OPEN THREAD
========================================= */

function startPolling() {

    if (pollTimer) clearInterval(pollTimer);

    pollTimer = setInterval(async () => {

        if (!activeCustomerId) return;
        if (document.hidden) return;

        try {

            const data = await TC.adminGetConversation(activeCustomerId);
            data.messages.forEach(renderThreadMessage);

        } catch (error) {
            // Silent fail on background polling
        }

    }, 10000);

}

window.addEventListener("beforeunload", () => {
    if (pollTimer) clearInterval(pollTimer);
});


/* =========================================
   RETRY BUTTON
========================================= */

if (retryBtn) {
    retryBtn.addEventListener("click", loadConversations);
}


/* =========================================
   DELETE CUSTOMER (from the conversation view)
========================================= */

if (threadDeleteCustomerBtn) {

    threadDeleteCustomerBtn.addEventListener("click", async () => {

        if (!activeCustomerId) return;

        const confirmed = confirm(
            `Delete ${activeCustomerName || "this customer"}'s account? This permanently removes their login, this entire conversation, and every quote request they've submitted. This can't be undone.`
        );

        if (!confirmed) return;

        try {

            await TC.adminDeleteCustomer(activeCustomerId);

            conversations = conversations.filter(c => String(c.customerId) !== String(activeCustomerId));
            renderConversationList(conversations);
            updateSidebarBadge();

            activeCustomerId = null;
            threadActive.hidden = true;
            threadEmptyState.hidden = false;

            container.classList.remove("show-thread");
            container.classList.add("show-list");

        } catch (error) {

            alert(error.message || "Could not delete this customer.");

        }

    });

}


/* =========================================
   MOBILE SIDEBAR TOGGLE (shared admin pattern)
========================================= */

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

if (menuBtn && sidebar && sidebarOverlay) {

    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
    });

    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
    });

}

const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        TC.logout("login.html");
    });
}


/* =========================================
   HELPERS
========================================= */

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function formatTime(time) {
    return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelativeTime(time) {

    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;

    return date.toLocaleDateString([], { month: "short", day: "numeric" });

}


/* =========================================
   INIT
========================================= */

container.classList.add("show-list");
loadConversations();
