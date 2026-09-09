/* =========================================
   TRUECELL — SHARED API HELPER
   Include this BEFORE any page script that
   talks to the backend (login, register,
   chat, quote form).
========================================= */

// Auto-detects local testing vs the live site, so you don't have to
// remember to swap this by hand (this was the cause of "could not
// reach server" errors before — it was stuck on a placeholder URL).
// Once your backend is deployed, replace ONLY the line below marked PRODUCTION.
const API_BASE_URL = (() => {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocal) return "http://localhost:5000/api";
    return "https://universal-telecom.onrender.com/api"; // <-- PRODUCTION: replace after deploying
})();

// Admin pages (anything under /admin/) and customer-facing pages use
// COMPLETELY SEPARATE session storage. Without this, logging in as
// admin and customer in the same browser (which happens constantly
// during testing) overwrites one session with the other, and any page
// that only checks "is someone logged in" — rather than "is the RIGHT
// role logged in" — ends up behaving as whichever role logged in last.
// This was the real cause of admin/customer chat behaving like each
// other. Each scope now has its own token, so both can be logged in
// at the same time without interfering with each other at all.
const TC_SCOPE = window.location.pathname.includes("/admin/") ? "admin" : "customer";
const TC_TOKEN_KEY = `tc_${TC_SCOPE}_token`;
const TC_USER_KEY = `tc_${TC_SCOPE}_user`;

const TC = {

    getToken() {
        return localStorage.getItem(TC_TOKEN_KEY);
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(TC_USER_KEY)) || null;
        } catch (error) {
            return null;
        }
    },

    isLoggedIn() {
        return Boolean(this.getToken());
    },

    saveSession(token, user) {
        localStorage.setItem(TC_TOKEN_KEY, token);
        localStorage.setItem(TC_USER_KEY, JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem(TC_TOKEN_KEY);
        localStorage.removeItem(TC_USER_KEY);
    },

    logout(redirectTo) {
        this.clearSession();
        window.location.href = redirectTo || "phone-login.html";
    },

    // Core request helper. Automatically attaches the auth token if present
    // and throws a readable Error on failure.
    async request(path, { method = "GET", body, auth = false } = {}) {
        const headers = { "Content-Type": "application/json" };

        if (auth) {
            const token = this.getToken();

            if (!token) {
                throw new Error("NOT_LOGGED_IN");
            }

            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        // A hard timeout so a stuck request can never leave the UI
        // spinning forever with no feedback. 45s gives enough margin for
        // a slow cold-start (your last log showed responses taking up to
        // 31s even before the IPv4 fix) without cutting it off right at
        // the edge.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });
        } catch (networkError) {
            if (networkError.name === "AbortError") {
                throw new Error("The server took too long to respond. Please try again.");
            }
            throw new Error("Could not reach the server. Please check your connection and try again.");
        } finally {
            clearTimeout(timeoutId);
        }

        let data = {};

        try {
            data = await response.json();
        } catch (parseError) {
            data = {};
        }

        if (response.status === 401) {
            // Token missing/expired — force a fresh login
            this.clearSession();
            throw new Error(data.message || "Please log in again.");
        }

        // 304 (Not Modified) is a normal, successful HTTP response — it
        // means "use what you already have," not an error. response.ok
        // is only true for 200-299, so without this check a 304 would
        // wrongly be treated as a failure even though the request
        // actually succeeded. (The server now disables ETag/conditional
        // caching entirely, so this shouldn't happen anymore — this is
        // just a safety net in case it ever does.)
        if (!response.ok && response.status !== 304) {
            throw new Error(data.message || "Something went wrong. Please try again.");
        }

        return data;
    },

    /* ---------- Auth ---------- */

    register(payload) {
        return this.request("/auth/register", { method: "POST", body: payload });
    },

    login(payload) {
        return this.request("/auth/login", { method: "POST", body: payload });
    },

    getMyProfile() {
        return this.request("/auth/me", { auth: true });
    },

    updateProfile(payload) {
        return this.request("/auth/me", { method: "PATCH", auth: true, body: payload });
    },

    /* ---------- Customer chat ---------- */

    getMyMessages() {
        return this.request("/messages/mine", { auth: true });
    },

    sendMyMessage(text) {
        return this.request("/messages/mine", { method: "POST", auth: true, body: { text } });
    },

    /* ---------- Quote requests ---------- */

    submitInquiry(payload) {
        // Sent with auth if the customer happens to be logged in already,
        // but works for guests too — the backend accepts both.
        const token = this.getToken();
        return this.request("/inquiries", {
            method: "POST",
            body: payload,
            auth: Boolean(token)
        });
    },

    /* ---------- Admin ---------- */

    adminListConversations() {
        return this.request("/admin/conversations", { auth: true });
    },

    adminGetConversation(customerId) {
        return this.request(`/admin/conversations/${customerId}`, { auth: true });
    },

    adminReply(customerId, text) {
        return this.request(`/admin/conversations/${customerId}`, {
            method: "POST",
            auth: true,
            body: { text }
        });
    },

    adminListInquiries() {
        return this.request("/admin/inquiries", { auth: true });
    },

    adminUpdateInquiryStatus(id, status) {
        return this.request(`/admin/inquiries/${id}`, { method: "PATCH", auth: true, body: { status } });
    },

    /* ---------- Products (public, shop-facing) ---------- */

    listProducts(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(query ? `/products?${query}` : "/products");
    },

    getProduct(id) {
        return this.request(`/products/${id}`);
    },

    /* ---------- Products (admin CRUD) ---------- */

    adminListProducts() {
        return this.request("/admin/products", { auth: true });
    },

    adminCreateProduct(payload) {
        return this.request("/admin/products", { method: "POST", auth: true, body: payload });
    },

    adminUpdateProduct(id, payload) {
        return this.request(`/admin/products/${id}`, { method: "PUT", auth: true, body: payload });
    },

    adminDeleteProduct(id) {
        return this.request(`/admin/products/${id}`, { method: "DELETE", auth: true });
    },

    /* ---------- Customers (admin) ---------- */

    adminListCustomers() {
        return this.request("/admin/customers", { auth: true });
    },

    adminGetCustomer(id) {
        return this.request(`/admin/customers/${id}`, { auth: true });
    },

    adminDeleteCustomer(id) {
        return this.request(`/admin/customers/${id}`, { method: "DELETE", auth: true });
    }

};

/* =========================================
   AUTH GUARD
   Call TC.requireLogin() at the top of any
   page that a customer must be logged in to
   see (e.g. the chat page). Redirects to
   login and remembers where to send them back.
========================================= */
TC.requireLogin = function requireLogin() {
    if (!this.isLoggedIn()) {
        const returnTo = encodeURIComponent(window.location.pathname.split("/").pop());
        window.location.href = `phone-login.html?redirect=${returnTo}`;
        return false;
    }
    return true;
};
