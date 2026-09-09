/* =========================================
   TRUECELL — CART (REAL, localStorage-BACKED)
   There's no payment/checkout system on this
   site — wholesale pricing is confirmed through
   a quote request. This cart is a real staging
   list: add products here, then request one
   quote covering everything in it.
========================================= */

const TC_CART_KEY = "tc_cart";

const TCCart = {

    getItems() {
        try {
            return JSON.parse(localStorage.getItem(TC_CART_KEY)) || [];
        } catch (error) {
            return [];
        }
    },

    saveItems(items) {
        localStorage.setItem(TC_CART_KEY, JSON.stringify(items));
        this.updateBadge();
    },

    addItem({ name, brand, storage, colour, image, moq }) {

        const items = this.getItems();
        const qty = moq && Number(moq) > 0 ? Number(moq) : 1;

        const existing = items.find(item =>
            item.name === name && item.storage === storage && item.colour === colour
        );

        if (existing) {
            existing.quantity += qty;
        } else {
            items.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                brand: brand || "",
                storage: storage || "",
                colour: colour || "",
                image: image || "",
                quantity: qty
            });
        }

        this.saveItems(items);
        return items;

    },

    updateQuantity(id, quantity) {

        const items = this.getItems();
        const item = items.find(i => i.id === id);

        if (item) {
            item.quantity = Math.max(1, Number(quantity) || 1);
            this.saveItems(items);
        }

        return items;

    },

    removeItem(id) {
        const items = this.getItems().filter(i => i.id !== id);
        this.saveItems(items);
        return items;
    },

    clear() {
        this.saveItems([]);
    },

    count() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    updateBadge() {

        const count = this.count();

        document.querySelectorAll(".cart-count").forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? "" : "none";
        });

    }

};


/* =========================================
   CART PAGE RENDERING
   (Only runs if this page actually has a
   cart container — safe to load this file
   sitewide for the badge/addItem helpers.)
========================================= */

const cartItemsEl = document.getElementById("cart-items");
const cartEmptyState = document.getElementById("cart-empty-state");
const summarySection = document.getElementById("summary-section");
const summaryItemCount = document.getElementById("summary-item-count");
const summaryTotalUnits = document.getElementById("summary-total-units");
const requestQuoteBtn = document.getElementById("request-quote-from-cart");

function renderCartPage() {

    if (!cartItemsEl) return;

    const items = TCCart.getItems();

    if (items.length === 0) {

        cartEmptyState.hidden = false;
        cartItemsEl.innerHTML = "";
        if (summarySection) summarySection.hidden = true;
        return;

    }

    cartEmptyState.hidden = true;
    if (summarySection) summarySection.hidden = false;

    cartItemsEl.innerHTML = "";

    items.forEach(item => {
        cartItemsEl.appendChild(buildCartCard(item));
    });

    updateSummary(items);

}

function buildCartCard(item) {

    const card = document.createElement("div");
    card.className = "cart-card";
    card.dataset.itemId = item.id;

    const variant = [item.storage, item.colour].filter(Boolean).join(" • ") || "Standard";
    const image = item.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80";

    card.innerHTML = `
        <div class="product-image">
            <img src="${escapeAttr(image)}" alt="${escapeAttr(item.name)}">
        </div>

        <div class="product-details">

            <h2>${escapeHTML(item.name)}</h2>

            <p>${escapeHTML(item.brand)}</p>

            <span>${escapeHTML(variant)}</span>

            <div class="quantity-box">

                <button class="minus" type="button">
                    <i class="fa-solid fa-minus"></i>
                </button>

                <input type="number" value="${item.quantity}" min="1" class="qty-input">

                <button class="plus" type="button">
                    <i class="fa-solid fa-plus"></i>
                </button>

            </div>

            <button class="remove-btn" type="button">
                <i class="fa-solid fa-trash"></i>
                Remove
            </button>

        </div>
    `;

    card.querySelector(".minus").addEventListener("click", () => {
        const input = card.querySelector(".qty-input");
        const newQty = Math.max(1, Number(input.value) - 1);
        TCCart.updateQuantity(item.id, newQty);
        renderCartPage();
    });

    card.querySelector(".plus").addEventListener("click", () => {
        const input = card.querySelector(".qty-input");
        const newQty = Number(input.value) + 1;
        TCCart.updateQuantity(item.id, newQty);
        renderCartPage();
    });

    card.querySelector(".qty-input").addEventListener("change", (e) => {
        TCCart.updateQuantity(item.id, e.target.value);
        renderCartPage();
    });

    card.querySelector(".remove-btn").addEventListener("click", () => {
        TCCart.removeItem(item.id);
        renderCartPage();
    });

    return card;

}

function updateSummary(items) {

    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

    if (summaryItemCount) summaryItemCount.textContent = items.length;
    if (summaryTotalUnits) summaryTotalUnits.textContent = totalUnits;

}

if (requestQuoteBtn) {

    requestQuoteBtn.addEventListener("click", (e) => {

        e.preventDefault();

        const items = TCCart.getItems();

        if (items.length === 0) {
            window.location.href = "phone-quote.html";
            return;
        }

        // Build a clear summary of everything in the cart, ready to send
        // as a real chat message to admin.
        const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

        const lines = items.map(item => {
            const variant = [item.storage, item.colour].filter(Boolean).join(", ");
            return `• ${item.name}${variant ? ` (${variant})` : ""} — Qty: ${item.quantity}`;
        });

        const message =
`Hi, I'd like a wholesale quote for the following:

${lines.join("\n")}

Total units: ${totalUnits}

Please let me know your best pricing. Thank you.`;

        // Chat requires login — store the message so it survives the
        // register/login redirect chain, then pre-fill it on the chat
        // page once the customer arrives (reviewed and sent by them,
        // not auto-sent, so they can edit it first).
        localStorage.setItem("tc_pending_chat_message", message);

        if (!TC.isLoggedIn()) {
            window.location.href = "phone-register.html?redirect=phone-chat.html";
            return;
        }

        window.location.href = "phone-chat.html";

    });

}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function escapeAttr(text) {
    return (text || "").replace(/"/g, "&quot;");
}


/* =========================================
   INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    TCCart.updateBadge();
    renderCartPage();
    applyWishlistState();
});


/* =========================================
   WISHLIST (real, localStorage-based — same
   pattern as the cart, since there's no
   account-linked wishlist feature on the
   backend. Lets the heart button on product
   cards actually do something instead of
   being purely decorative.)
========================================= */

const TC_WISHLIST_KEY = "tc_wishlist";

const TCWishlist = {

    getIds() {
        try {
            return JSON.parse(localStorage.getItem(TC_WISHLIST_KEY)) || [];
        } catch (error) {
            return [];
        }
    },

    isSaved(productId) {
        return this.getIds().includes(productId);
    },

    toggle(productId) {

        let ids = this.getIds();

        if (ids.includes(productId)) {
            ids = ids.filter(id => id !== productId);
        } else {
            ids.push(productId);
        }

        localStorage.setItem(TC_WISHLIST_KEY, JSON.stringify(ids));
        return ids.includes(productId);

    }

};

// Whenever product cards render on a page (shop, homepage, etc.), mark
// any that are already saved so the heart shows filled instead of
// outline on page load, not just after clicking.
function applyWishlistState() {

    document.querySelectorAll(".product-card[data-product-id]").forEach(card => {

        const id = card.dataset.productId;
        const heart = card.querySelector(".wishlist i");

        if (heart && TCWishlist.isSaved(id)) {
            heart.classList.remove("fa-regular");
            heart.classList.add("fa-solid");
            card.querySelector(".wishlist").classList.add("saved");
        }

    });

}
