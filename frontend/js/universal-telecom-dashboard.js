/* =====================================================
   UNIVERSAL TELECOM ADMIN DASHBOARD — REAL DATA
   Previous version was almost entirely fake: hardcoded
   stat numbers, a fabricated "customer interest" chart
   with made-up analytics, a "Most Requested Products"
   panel with invented inquiry counts, fake recent
   orders, fake activity feed, and a broken logout that
   didn't use the real auth system. All replaced with
   real data from the backend, or removed outright where
   no real tracking system exists to back the claim.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    const mobileMenuBtns = document.querySelectorAll(".mobile-menu-btn");
    const search = document.querySelector(".dashboard-search input");
    const logoutBtn = document.querySelector(".logout-btn");

    function openSidebar() {
        sidebar?.classList.add("active");
        overlay?.classList.add("active");
    }

    function closeSidebar() {
        sidebar?.classList.remove("active");
        overlay?.classList.remove("active");
    }

    mobileMenuBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            sidebar?.classList.contains("active") ? closeSidebar() : openSidebar();
        });
    });

    overlay?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            if (window.innerWidth <= 1000) closeSidebar();
        });
    });

    document.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            search?.focus();
        }
        if (event.key === "Escape") closeSidebar();
    });

    /* Current date */
    const date = document.querySelector("#currentDate");
    if (date) {
        date.textContent = new Date().toLocaleDateString("en-NG", {
            weekday: "short", month: "short", day: "numeric", year: "numeric"
        });
    }

    /* Welcome message uses the real logged-in admin's name */
    const welcomeHeading = document.querySelector("#welcome-heading");
    const currentUser = TC.getUser();
    if (welcomeHeading && currentUser) {
        welcomeHeading.textContent = `Welcome back, ${currentUser.fullName.split(" ")[0]} 👋`;
    }

    /* Real logout, using the actual auth system instead of stale keys */
    logoutBtn?.addEventListener("click", () => {
        if (!confirm("Are you sure you want to logout?")) return;
        TC.logout("login.html");
    });

    loadDashboardData();

});


/* =========================================
   LOAD ALL REAL DASHBOARD DATA
========================================= */

async function loadDashboardData() {

    try {

        const [inquiriesData, productsData, customersData, conversationsData] = await Promise.all([
            TC.adminListInquiries(),
            TC.adminListProducts(),
            TC.adminListCustomers(),
            TC.adminListConversations()
        ]);

        const inquiries = inquiriesData.inquiries || [];
        const products = productsData.products || [];
        const customers = customersData.customers || [];
        const conversations = conversationsData.conversations || [];

        const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const activeConversations = conversations.length;
        const pendingInquiries = inquiries.filter(i => i.status === "new").length;

        renderStats({ inquiries, products, customers, activeConversations });
        renderQuickActionCounts({ pendingInquiries, unreadMessages, productCount: products.length });
        renderSidebarBadges({ customerCount: customers.length, pendingInquiries, unreadMessages });
        renderTopbarBadge(unreadMessages);
        renderRecentInquiries(inquiries.slice(0, 5));
        renderLowStock(products);
        renderActivityFeed(inquiries, products);

    } catch (error) {

        console.error("Dashboard load failed:", error);

        document.querySelectorAll(".dashboard-loading").forEach(el => {
            el.innerHTML = `
                <p style="color:#dc2626; font-size:13px; margin-bottom:8px;">
                    Could not load data. ${error.message || ""}
                </p>
                <button type="button" onclick="loadDashboardData()" style="padding:6px 14px; border:none; border-radius:6px; background:#0b7cff; color:#fff; font-size:12px; cursor:pointer;">
                    Retry
                </button>
            `;
        });

    }

}


/* =========================================
   STAT CARDS
========================================= */

function renderStats({ inquiries, products, customers, activeConversations }) {

    setText("stat-inquiries", inquiries.length);
    setText("stat-conversations", activeConversations);
    setText("stat-customers", customers.length);
    setText("stat-products", products.length);

    const lowStockCount = products.filter(p => (p.stock || 0) > 0 && p.stock <= 5).length;

    if (lowStockCount > 0) {
        setText("stat-low-stock-note", `${lowStockCount} low in stock`);
    }

}


/* =========================================
   QUICK ACTION COUNTS
========================================= */

function renderQuickActionCounts({ pendingInquiries, unreadMessages, productCount }) {

    setText("qa-inquiries-count", `${pendingInquiries} pending inquir${pendingInquiries === 1 ? "y" : "ies"}`);
    setText("qa-messages-count", unreadMessages > 0 ? `${unreadMessages} unread messages` : "No unread messages");
    setText("qa-products-count", `${productCount} product${productCount === 1 ? "" : "s"}`);

}


/* =========================================
   SIDEBAR BADGES
========================================= */

function renderSidebarBadges({ customerCount, pendingInquiries, unreadMessages }) {

    showBadge("sidebar-customers-count", customerCount);
    showBadge("sidebar-inquiries-count", pendingInquiries);
    showBadge("sidebar-messages-count", unreadMessages);
    showBadge("sidebar-quotes-badge", pendingInquiries);

}

function showBadge(id, count) {

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
   TOPBAR NOTIFICATION BELL
========================================= */

function renderTopbarBadge(unreadMessages) {
    showBadge("topbar-unread-count", unreadMessages);
}


/* =========================================
   RECENT INQUIRIES (real data, replaces the
   fake chart + fake table that used to be here)
========================================= */

function renderRecentInquiries(inquiries) {

    const container = document.getElementById("dashboard-inquiries-list");
    if (!container) return;

    if (inquiries.length === 0) {
        container.innerHTML = `<p class="dashboard-empty-note">No quote requests yet.</p>`;
        return;
    }

    container.innerHTML = "";

    inquiries.forEach(inquiry => {

        const row = document.createElement("a");
        row.href = `inquiry-details.html?id=${encodeURIComponent(inquiry.quoteId)}`;
        row.className = "dashboard-mini-row";

        const statusClass = inquiry.status === "new" ? "processing" : inquiry.status === "replied" ? "shipped" : "delivered";

        row.innerHTML = `
            <div class="dashboard-mini-avatar">${getInitials(inquiry.contactPerson)}</div>
            <div class="dashboard-mini-info">
                <strong>${escapeHTML(inquiry.contactPerson)}</strong>
                <span>${escapeHTML(inquiry.product || "No product specified")} · ${inquiry.quantity || 1} units</span>
            </div>
            <span class="status-badge ${statusClass}"><i class="fa-solid fa-circle"></i> ${capitalize(inquiry.status)}</span>
            <time>${formatRelativeTime(inquiry.createdAt)}</time>
        `;

        container.appendChild(row);

    });

}


/* =========================================
   LOW STOCK (real — Product.stock is a real field)
========================================= */

function renderLowStock(products) {

    const container = document.getElementById("low-stock-list");
    if (!container) return;

    const lowStock = products
        .filter(p => (p.stock || 0) <= 5)
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 5);

    if (lowStock.length === 0) {
        container.innerHTML = `<p class="dashboard-empty-note">No products are low on stock.</p>`;
        return;
    }

    container.innerHTML = "";

    lowStock.forEach(product => {

        const image = (product.images && product.images[0]) || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=150&q=80";
        const stockLevel = product.stock || 0;
        const severity = stockLevel === 0 ? "critical" : stockLevel <= 2 ? "critical" : "warning";

        const item = document.createElement("div");
        item.className = "low-stock-item";
        item.innerHTML = `
            <div class="low-stock-image"><img src="${image}" alt="${escapeHTML(product.name)}"></div>
            <div class="low-stock-info">
                <strong>${escapeHTML(product.name)}</strong>
                <span>${escapeHTML(product.brand)}</span>
            </div>
            <div class="stock-number ${severity}">
                <strong>${stockLevel}</strong>
                <span>left</span>
            </div>
        `;

        container.appendChild(item);

    });

}


/* =========================================
   ACTIVITY FEED (built from real inquiries +
   real products, merged and sorted by time —
   replaces a fully fabricated activity list)
========================================= */

function renderActivityFeed(inquiries, products) {

    const container = document.getElementById("activity-list");
    if (!container) return;

    const events = [
        ...inquiries.map(i => ({
            type: "inquiry",
            time: i.createdAt,
            title: "New quote request",
            detail: `${i.contactPerson} — ${i.product || "product"} × ${i.quantity || 1} units`
        })),
        ...products.map(p => ({
            type: "product",
            time: p.createdAt,
            title: "Product added to inventory",
            detail: `${p.brand} ${p.name}`
        }))
    ]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 8);

    if (events.length === 0) {
        container.innerHTML = `<p class="dashboard-empty-note">No activity yet.</p>`;
        return;
    }

    container.innerHTML = "";

    events.forEach(event => {

        const icon = event.type === "inquiry" ? "fa-clipboard-question" : "fa-box";
        const iconClass = event.type === "inquiry" ? "order" : "customer";

        const item = document.createElement("div");
        item.className = "activity-item";
        item.innerHTML = `
            <div class="activity-icon ${iconClass}"><i class="fa-solid ${icon}"></i></div>
            <div class="activity-content">
                <p><strong>${escapeHTML(event.title)}</strong></p>
                <span>${escapeHTML(event.detail)}</span>
            </div>
            <time>${formatRelativeTime(event.time)}</time>
        `;

        container.appendChild(item);

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
    return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
}

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
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
