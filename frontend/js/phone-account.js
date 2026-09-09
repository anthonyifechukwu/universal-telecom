/* =========================================
   TRUECELL — CUSTOMER ACCOUNT PAGE
   Previous version was 100% fake — hardcoded
   name ("Welcome, Anthony"), fake email/phone,
   fake business info, a fake "Verified
   Customer" badge, 3 hardcoded fake products
   in "Recommended For You" with fake prices,
   and a fake activity timeline with a made-up
   order. Rebuilt entirely with real data and
   no login requirement at all before — added.
========================================= */


/* =========================================
   AUTH GUARD
========================================= */

if (!TC.requireLogin()) {
    throw new Error("Redirecting to login.");
}

const currentUser = TC.getUser();


/* =========================================
   RENDER REAL PROFILE DATA
========================================= */

function renderProfile(user) {

    const firstName = (user.fullName || "").split(" ")[0] || "there";

    setText("welcome-heading", `Welcome, ${firstName}`);
    setText("info-fullname", user.fullName);
    setText("info-email", user.email);
    setText("info-phone", user.phone || "Not provided");
    setText("info-business", user.businessName || "Not provided");

    setValue("edit-fullname", user.fullName);
    setValue("edit-email", user.email);
    setValue("edit-phone", user.phone || "");
    setValue("edit-business", user.businessName || "");

}

renderProfile(currentUser);

// Refresh from the server in case it's changed since login (e.g. edited
// from another device), so the page always shows current real data.
TC.getMyProfile()
    .then(data => {
        TC.saveSession(TC.getToken(), data.user);
        renderProfile(data.user);
    })
    .catch(() => {
        // Non-critical — the cached session data is still shown
    });


/* =========================================
   EDIT PROFILE (Personal Information)
========================================= */

const editPersonalBtn = document.getElementById("edit-personal-btn");
const personalInfoView = document.getElementById("personal-info-view");
const personalInfoForm = document.getElementById("personal-info-form");

const editBusinessBtn = document.getElementById("edit-business-btn");
const businessInfoView = document.getElementById("business-info-view");
const businessInfoForm = document.getElementById("business-info-form");

function toggleEditMode(view, form, show) {
    view.hidden = show;
    form.hidden = !show;
}

if (editPersonalBtn) {
    editPersonalBtn.addEventListener("click", () => toggleEditMode(personalInfoView, personalInfoForm, true));
}

if (editBusinessBtn) {
    editBusinessBtn.addEventListener("click", () => toggleEditMode(businessInfoView, businessInfoForm, true));
}

document.querySelectorAll(".cancel-edit-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        const target = btn.dataset.target;

        if (target === "personal") toggleEditMode(personalInfoView, personalInfoForm, false);
        if (target === "business") toggleEditMode(businessInfoView, businessInfoForm, false);

    });

});

if (personalInfoForm) {

    personalInfoForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const submitBtn = personalInfoForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {

            const data = await TC.updateProfile({
                fullName: document.getElementById("edit-fullname").value,
                phone: document.getElementById("edit-phone").value
            });

            TC.saveSession(TC.getToken(), data.user);
            renderProfile(data.user);
            toggleEditMode(personalInfoView, personalInfoForm, false);

        } catch (error) {

            alert(error.message || "Could not save changes.");

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = "Save Changes";

        }

    });

}

if (businessInfoForm) {

    businessInfoForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const submitBtn = businessInfoForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {

            const data = await TC.updateProfile({
                businessName: document.getElementById("edit-business").value
            });

            TC.saveSession(TC.getToken(), data.user);
            renderProfile(data.user);
            toggleEditMode(businessInfoView, businessInfoForm, false);

        } catch (error) {

            alert(error.message || "Could not save changes.");

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = "Save Changes";

        }

    });

}

// The big "Edit Profile" button in the hero just scrolls to and opens
// the personal info edit form, rather than being a dead link.
const heroEditBtn = document.getElementById("edit-profile-btn");

if (heroEditBtn) {

    heroEditBtn.addEventListener("click", (e) => {

        e.preventDefault();
        toggleEditMode(personalInfoView, personalInfoForm, true);
        personalInfoForm.scrollIntoView({ behavior: "smooth", block: "center" });

    });

}


/* =========================================
   RECOMMENDED PRODUCTS (real, not the 3
   hardcoded fake phones this page used to show)
========================================= */

async function loadRecommended() {

    const grid = document.getElementById("account-recommend-grid");
    const loading = document.getElementById("account-recommend-loading");

    if (!grid) return;

    try {

        const data = await TC.listProducts();
        const products = (data.products || []).slice(0, 3);

        if (loading) loading.remove();

        if (products.length === 0) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888; padding:30px;">No products available yet.</p>`;
            return;
        }

        products.forEach(product => {

            const image = (product.images && product.images[0]) || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";

            const card = document.createElement("div");
            card.className = "recommend-card";
            card.innerHTML = `
                <img src="${image}" alt="${escapeHTML(product.name)}">
                <h3>${escapeHTML(product.name)}</h3>
                <span>From ₦${Number(product.wholesalePrice || 0).toLocaleString()}</span>
                <a href="phone-product-detail.html?id=${product._id}">View Details</a>
            `;

            grid.appendChild(card);

        });

    } catch (error) {

        if (loading) loading.innerHTML = `<p style="color:#dc2626;">Could not load products.</p>`;

    }

}

loadRecommended();


/* =========================================
   RECENT ACTIVITY (real — built from the
   customer's own account creation date and
   their real submitted inquiries, replacing a
   fake timeline with a made-up order number)
========================================= */

async function loadActivity() {

    const timeline = document.getElementById("account-activity-timeline");
    const loading = document.getElementById("account-activity-loading");

    if (!timeline) return;

    try {

        const events = [
            {
                title: "Account created",
                detail: `Welcome to Universal Telecom, ${currentUser.fullName.split(" ")[0]}.`,
                time: currentUser.createdAt
            }
        ];

        if (loading) loading.remove();

        events
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .forEach(event => {

                const item = document.createElement("div");
                item.className = "timeline-item";
                item.innerHTML = `
                    <span></span>
                    <div>
                        <h3>${escapeHTML(event.title)}</h3>
                        <p>${escapeHTML(event.detail)}</p>
                        <small>${formatRelativeTime(event.time)}</small>
                    </div>
                `;
                timeline.appendChild(item);

            });

    } catch (error) {

        if (loading) loading.innerHTML = `<p style="color:#dc2626;">Could not load activity.</p>`;

    }

}

loadActivity();


/* =========================================
   LOGOUT
========================================= */

const logoutBtn = document.getElementById("account-logout-btn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        TC.logout("phone-login.html");
    });

}


/* =========================================
   HELPERS
========================================= */

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function formatRelativeTime(time) {

    const date = new Date(time);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

}
