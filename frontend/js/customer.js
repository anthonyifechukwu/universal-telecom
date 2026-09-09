/* =========================================
   ADMIN — CUSTOMERS
   Real registered accounts pulled from the
   backend. The old version of this file
   shipped with an entirely fake, hardcoded
   customer list and a mock chat window —
   both replaced here. Messaging a customer
   now opens the real conversation in
   admin-chat.html.
========================================= */

const customersList = document.getElementById("customers-list");
const customerCountEl = document.getElementById("customer-count");
const totalCustomersEl = document.getElementById("total-customers");
const searchInput = document.getElementById("customer-search");

let allCustomers = [];


/* =========================================
   LOAD
========================================= */

async function loadCustomers() {

    customersList.innerHTML = `
        <div class="empty-customers">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <h3>Loading customers...</h3>
        </div>
    `;

    try {

        const [customersData, conversationsData] = await Promise.all([
            TC.adminListCustomers(),
            TC.adminListConversations()
        ]);

        allCustomers = customersData.customers || [];
        const conversations = conversationsData.conversations || [];
        const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        totalCustomersEl.textContent = allCustomers.length;
        customerCountEl.textContent = allCustomers.length;

        showSidebarBadge("sidebar-customers-badge", allCustomers.length);
        showSidebarBadge("sidebar-messages-badge", unreadMessages);

        renderCustomers(allCustomers);

    } catch (error) {

        customersList.innerHTML = `
            <div class="empty-customers">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Could not load customers</h3>
                <p>${escapeHTML(error.message || "Please try again.")}</p>
            </div>
        `;

    }

}


/* =========================================
   RENDER
========================================= */

function renderCustomers(list) {

    if (list.length === 0) {

        customersList.innerHTML = `
            <div class="empty-customers">
                <i class="fa-solid fa-users"></i>
                <h3>No customers yet</h3>
                <p>Registered customers will appear here.</p>
            </div>
        `;

        return;

    }

    customersList.innerHTML = "";

    list.forEach(customer => {
        customersList.appendChild(buildCustomerCard(customer));
    });

}

function buildCustomerCard(customer) {

    const card = document.createElement("div");
    card.className = "customer-card";

    const initials = getInitials(customer.fullName);

    card.innerHTML = `
        <div class="customer-avatar">${initials}</div>
        <div class="customer-card-info">
            <div class="customer-card-top">
                <span class="customer-name">${escapeHTML(customer.fullName)}</span>
                <span class="customer-time">${formatRelativeTime(customer.createdAt)}</span>
            </div>
            <div class="customer-preview">
                ${escapeHTML(customer.businessName || customer.email)}
            </div>
        </div>
        <button type="button" class="customer-delete-btn" title="Delete customer">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    card.querySelector(".customer-delete-btn").addEventListener("click", (event) => {
        event.stopPropagation();
        handleDeleteCustomer(customer);
    });

    card.addEventListener("click", () => {
        window.location.href = `admin-chat.html?customer=${customer._id}`;
    });

    return card;

}


/* =========================================
   SEARCH
========================================= */

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const term = searchInput.value.trim().toLowerCase();

        const filtered = allCustomers.filter(c =>
            (c.fullName || "").toLowerCase().includes(term) ||
            (c.businessName || "").toLowerCase().includes(term) ||
            (c.email || "").toLowerCase().includes(term)
        );

        renderCustomers(filtered);

    });

}


/* =========================================
   HELPERS
========================================= */

/* =========================================
   DELETE CUSTOMER
========================================= */

async function handleDeleteCustomer(customer) {

    const confirmed = confirm(
        `Delete ${customer.fullName}'s account? This permanently removes their login, chat history, and every quote request they've submitted. This can't be undone.`
    );

    if (!confirmed) return;

    try {

        await TC.adminDeleteCustomer(customer._id);
        allCustomers = allCustomers.filter(c => c._id !== customer._id);
        totalCustomersEl.textContent = allCustomers.length;
        customerCountEl.textContent = allCustomers.length;
        renderCustomers(allCustomers);

    } catch (error) {

        alert(error.message || "Could not delete this customer.");

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
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

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
   FILTER BUTTONS (All / Online / Unread)
   Online + Unread require presence-tracking
   and read-state we don't have yet, so for
   now they just show everyone — noted as a
   known simplification rather than faking data.
========================================= */

document.querySelectorAll(".filter-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        renderCustomers(allCustomers);

    });

});


/* =========================================
   INIT
========================================= */

loadCustomers();
