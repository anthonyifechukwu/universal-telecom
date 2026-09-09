/* =========================================
   ADMIN — INQUIRY DETAILS
   Loads the real inquiry (by quoteId in the
   URL) plus, if the person who submitted it
   has a real account, their actual
   registration details and a live link to
   their chat conversation.
========================================= */

const params = new URLSearchParams(window.location.search);
const quoteId = params.get("id");

let currentInquiry = null;


/* =========================================
   LOAD
========================================= */

async function loadInquiry() {

    if (!quoteId) {
        alert("No inquiry specified.");
        window.location.href = "inquiries.html";
        return;
    }

    try {

        const data = await TC.request(`/admin/inquiries?quoteId=${encodeURIComponent(quoteId)}`, { auth: true });
        const inquiry = (data.inquiries || [])[0];

        if (!inquiry) {
            alert("Inquiry not found.");
            window.location.href = "inquiries.html";
            return;
        }

        currentInquiry = inquiry;
        renderInquiry(inquiry);

    } catch (error) {
        alert(error.message || "Could not load this inquiry.");
    }

    loadSidebarBadges();

}

async function loadSidebarBadges() {

    try {

        const [inquiriesData, customersData, conversationsData] = await Promise.all([
            TC.adminListInquiries(),
            TC.adminListCustomers(),
            TC.adminListConversations()
        ]);

        const newInquiries = (inquiriesData.inquiries || []).filter(i => i.status === "new").length;
        const customerCount = (customersData.customers || []).length;
        const unreadMessages = (conversationsData.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        showSidebarBadge("sidebar-customers-badge", customerCount);
        showSidebarBadge("sidebar-inquiries-badge", newInquiries);
        showSidebarBadge("sidebar-messages-badge", unreadMessages);

    } catch (error) {
        // Non-critical — sidebar badges just won't update this load
    }

}

function showSidebarBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
        el.textContent = count;
        el.hidden = false;
    } else {
        el.hidden = true;
    }
}


/* =========================================
   RENDER
========================================= */

function renderInquiry(inquiry) {

    // Breadcrumb / summary
    setText("breadcrumb-inquiry-id", `#${inquiry.quoteId}`);
    setText("summary-quote-id", `#${inquiry.quoteId}`);
    setText("summary-customer-name", inquiry.contactPerson);
    setText("summary-received-time", formatRelativeTime(inquiry.createdAt));

    const hasReply = inquiry.status !== "new";
    setText("summary-response-status", hasReply ? "Replied" : "Awaiting response");

    const statusBadge = document.getElementById("summary-status-badge");
    if (statusBadge) {
        statusBadge.className = `status-badge ${inquiry.status}`;
        statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> ${capitalize(inquiry.status)}`;
    }

    // Customer information — real registration details if this
    // person has an account, otherwise it's a guest submission.
    setText("customer-avatar", getInitials(inquiry.contactPerson));
    setText("customer-email", inquiry.email);
    setText("customer-phone", inquiry.phone);

    const openConvoBtn = document.getElementById("open-conversation-btn");
    const openConvoBtnMain = document.getElementById("open-conversation-btn-main");
    const deleteCustomerBtn = document.getElementById("delete-customer-btn");

    if (inquiry.customer) {

        setText("customer-name", inquiry.customer.fullName);
        setText("customer-account-status", "Registered Customer");
        setText("customer-business", inquiry.customer.businessName || "—");

        const chatUrl = `admin-chat.html?customer=${inquiry.customer._id}`;
        if (openConvoBtn) openConvoBtn.href = chatUrl;
        if (openConvoBtnMain) openConvoBtnMain.href = chatUrl;

        if (deleteCustomerBtn) {
            deleteCustomerBtn.hidden = false;
            deleteCustomerBtn.onclick = () => handleDeleteCustomerFromInquiry(inquiry.customer);
        }

    } else {

        setText("customer-name", inquiry.contactPerson);
        setText("customer-account-status", "Guest — no account yet");
        setText("customer-business", inquiry.businessName || "—");

        // No account means no persistent, cross-device conversation exists yet.
        [openConvoBtn, openConvoBtnMain].forEach(btn => {
            if (!btn) return;
            btn.removeAttribute("href");
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
            btn.title = "This customer hasn't created an account yet";
        });

        if (deleteCustomerBtn) deleteCustomerBtn.hidden = true;

    }

    // Requested product
    if (inquiry.source === "chat") {
        setText("requested-product-name", inquiry.message || "No message");
        setText("requested-product-brand", "From live chat");
        setText("requested-product-qty", "—");
        setText("requested-product-variant", "This came from a chat conversation, not the quote form");
    } else {
        setText("requested-product-name", inquiry.product || "Not specified");
        setText("requested-product-brand", inquiry.brand || "");
        setText("requested-product-qty", `${inquiry.quantity || 1} units`);

        const variantParts = [inquiry.storage, inquiry.colour].filter(Boolean);
        setText("requested-product-variant", variantParts.length ? variantParts.join(" · ") : "No variant specified");
    }

    // Timeline — real submission time + real account-match status,
    // replacing what used to be fabricated events with made-up names.
    setText("timeline-received-text", `${inquiry.contactPerson} submitted a quote request for ${inquiry.product || "a product"}.`);
    setText("timeline-received-time", formatRelativeTime(inquiry.createdAt));

    if (inquiry.customer) {
        setText("timeline-account-title", "Customer account matched");
        setText("timeline-account-text", "This request was linked to a registered customer account — details were pulled from their registration.");
    } else {
        setText("timeline-account-title", "No account found");
        setText("timeline-account-text", "This request was submitted as a guest. No registered account is linked yet.");
        document.getElementById("timeline-account-item")?.classList.add("guest");
    }
    setText("timeline-account-time", formatRelativeTime(inquiry.createdAt));

    // Action buttons
    updateActionButtons(inquiry.status);

}

function updateActionButtons(status) {

    const markRepliedBtn = document.getElementById("mark-replied-btn");
    const resolveBtn = document.getElementById("resolve-inquiry-btn");

    if (markRepliedBtn) {
        markRepliedBtn.disabled = status !== "new";
        markRepliedBtn.innerHTML = status === "new"
            ? `<i class="fa-solid fa-check"></i> Mark as Replied`
            : `<i class="fa-solid fa-check"></i> Replied`;
    }

    if (resolveBtn) {
        resolveBtn.disabled = status === "resolved";
        resolveBtn.innerHTML = status === "resolved"
            ? `<i class="fa-solid fa-check-double"></i> Resolved`
            : `<i class="fa-solid fa-check-double"></i> Mark Resolved`;
    }

}


/* =========================================
   STATUS ACTIONS
========================================= */

const markRepliedBtn = document.getElementById("mark-replied-btn");
const resolveBtn = document.getElementById("resolve-inquiry-btn");

if (markRepliedBtn) {

    markRepliedBtn.addEventListener("click", async () => {

        if (!currentInquiry) return;

        try {
            const data = await TC.adminUpdateInquiryStatus(currentInquiry._id, "replied");
            currentInquiry = data.inquiry;
            renderInquiry(currentInquiry);
        } catch (error) {
            alert(error.message || "Could not update inquiry.");
        }

    });

}

if (resolveBtn) {

    resolveBtn.addEventListener("click", async () => {

        if (!currentInquiry) return;

        const confirmed = confirm("Mark this inquiry as resolved?");
        if (!confirmed) return;

        try {
            const data = await TC.adminUpdateInquiryStatus(currentInquiry._id, "resolved");
            currentInquiry = data.inquiry;
            renderInquiry(currentInquiry);
        } catch (error) {
            alert(error.message || "Could not update inquiry.");
        }

    });

}


/* =========================================
   HELPERS
========================================= */

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
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

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatRelativeTime(time) {

    const date = new Date(time);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric" });

}


/* =========================================
   SIDEBAR + LOGOUT (shared admin pattern)
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
    logoutBtn.addEventListener("click", () => TC.logout("login.html"));
}


/* =========================================
   INIT
========================================= */

/* =========================================
   DELETE CUSTOMER (from the inquiry details view)
========================================= */

async function handleDeleteCustomerFromInquiry(customer) {

    const confirmed = confirm(
        `Delete ${customer.fullName}'s account? This permanently removes their login, chat history, and every quote request they've submitted — including this one. This can't be undone.`
    );

    if (!confirmed) return;

    try {

        await TC.adminDeleteCustomer(customer._id || customer.id);
        alert("Customer deleted.");
        window.location.href = "customer.html";

    } catch (error) {

        alert(error.message || "Could not delete this customer.");

    }

}


loadInquiry();
