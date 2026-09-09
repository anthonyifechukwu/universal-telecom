/* =========================================
   ADMIN INQUIRIES — REAL DATA
   Fetches actual quote requests from the
   backend instead of the hardcoded sample
   rows the page used to ship with.
========================================= */

const tbody = document.getElementById("inquiries-body");
const resultsCount = document.getElementById("results-count");
const totalInquiriesEl = document.getElementById("total-inquiries");
const searchInput = document.getElementById("inquiry-search");
const statusFilter = document.getElementById("status-filter");
const responseFilter = document.getElementById("response-filter");
const dateFilter = document.getElementById("date-filter");

let allInquiries = [];


/* =========================================
   LOAD
========================================= */

async function loadInquiries() {

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px;">Loading inquiries...</td></tr>`;

    try {

        const [inquiriesData, customersData, conversationsData] = await Promise.all([
            TC.adminListInquiries(),
            TC.adminListCustomers(),
            TC.adminListConversations()
        ]);

        allInquiries = inquiriesData.inquiries || [];
        const customerCount = (customersData.customers || []).length;
        const conversations = conversationsData.conversations || [];
        const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const newInquiries = allInquiries.filter(i => i.status === "new").length;

        totalInquiriesEl.textContent = allInquiries.length;

        showSidebarBadge("sidebar-customers-badge", customerCount);
        showSidebarBadge("sidebar-inquiries-badge", newInquiries);
        showSidebarBadge("sidebar-messages-badge", unreadMessages);

        applyFilters();

    } catch (error) {

        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:#dc2626;">
            ${escapeHTML(error.message || "Could not load inquiries.")}
        </td></tr>`;

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
   FILTER + SEARCH
========================================= */

function applyFilters() {

    const term = (searchInput.value || "").trim().toLowerCase();
    const status = statusFilter.value;
    const response = responseFilter.value;
    const dateRange = dateFilter.value;

    let filtered = allInquiries.filter(inquiry => {

        const matchesSearch = !term || [
            inquiry.quoteId,
            inquiry.businessName,
            inquiry.contactPerson,
            inquiry.email,
            inquiry.product
        ].some(field => (field || "").toLowerCase().includes(term));

        const matchesStatus = status === "all" || inquiry.status === status;

        const hasReply = inquiry.status !== "new";
        const matchesResponse = response === "all"
            || (response === "awaiting" && !hasReply)
            || (response === "replied" && hasReply);

        const matchesDate = matchesDateRange(inquiry.createdAt, dateRange);

        return matchesSearch && matchesStatus && matchesResponse && matchesDate;

    });

    renderRows(filtered);

}

function matchesDateRange(dateStr, range) {

    if (range === "all") return true;

    const date = new Date(dateStr);
    const now = new Date();

    if (range === "today") {
        return date.toDateString() === now.toDateString();
    }

    if (range === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
    }

    if (range === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo;
    }

    return true;

}

[searchInput, statusFilter, responseFilter, dateFilter].forEach(el => {
    const eventName = el === searchInput ? "input" : "change";
    el.addEventListener(eventName, applyFilters);
});


/* =========================================
   RENDER ROWS
========================================= */

function renderRows(list) {

    resultsCount.textContent = `${list.length} inquir${list.length === 1 ? "y" : "ies"}`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:#9ca3af;">No inquiries match your filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    list.forEach(inquiry => {
        tbody.appendChild(buildRow(inquiry));
    });

}

function buildRow(inquiry) {

    const tr = document.createElement("tr");
    tr.className = "inquiry-row";
    tr.dataset.inquiryId = inquiry.quoteId;
    tr.dataset.status = inquiry.status;

    const initials = getInitials(inquiry.contactPerson);
    const statusLabel = inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1);
    const hasReply = inquiry.status !== "new";

    // The customer field is populated (see backend) only when the person
    // who submitted this quote has a real account — guests won't have one.
    const chatLink = inquiry.customer
        ? `<a href="admin-chat.html?customer=${inquiry.customer._id || inquiry.customer}" class="view-inquiry-btn" title="Open conversation with this customer" style="margin-right:6px;"><i class="fa-regular fa-comments"></i></a>`
        : "";

    tr.innerHTML = `
        <td>
            <a href="inquiry-details.html?id=${encodeURIComponent(inquiry.quoteId)}" class="inquiry-id">
                #${escapeHTML(inquiry.quoteId)}
            </a>
        </td>
        <td>
            <div class="customer-cell">
                <div class="customer-avatar">${initials}</div>
                <div>
                    <strong>${escapeHTML(inquiry.contactPerson)}</strong>
                    <span>${escapeHTML(inquiry.email)}</span>
                </div>
            </div>
        </td>
        <td>
            <div class="product-cell">
                <strong>${escapeHTML(inquiry.product || (inquiry.source === "chat" ? "General inquiry" : "—"))}</strong>
                <span>${escapeHTML(inquiry.brand || (inquiry.source === "chat" ? truncate(inquiry.message, 40) : ""))}</span>
            </div>
        </td>
        <td>
            <strong class="quantity">${inquiry.source === "chat" ? "—" : `${inquiry.quantity || 1} units`}</strong>
        </td>
        <td>
            <span class="status-badge ${inquiry.status}">
                <i class="fa-solid fa-circle"></i>
                ${statusLabel}
            </span>
        </td>
        <td>
            <span class="response-badge ${hasReply ? "replied" : "awaiting"}">
                <i class="fa-regular fa-clock"></i>
                ${hasReply ? "Replied" : "Awaiting"}
            </span>
        </td>
        <td>
            <span class="received-time">${formatRelativeTime(inquiry.createdAt)}</span>
        </td>
        <td>
            ${chatLink}
            <a href="inquiry-details.html?id=${encodeURIComponent(inquiry.quoteId)}" class="view-inquiry-btn" aria-label="View inquiry ${inquiry.quoteId}">
                <i class="fa-solid fa-arrow-right"></i>
            </a>
        </td>
    `;

    return tr;

}


/* =========================================
   HELPERS
========================================= */

function getInitials(name) {

    if (!name) return "?";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("");

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

function truncate(text, length) {
    if (!text) return "";
    return text.length > length ? text.slice(0, length) + "…" : text;
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
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

loadInquiries();
