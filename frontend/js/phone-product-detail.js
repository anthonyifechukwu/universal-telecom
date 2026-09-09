/* =========================================
   PRODUCT DETAIL PAGE — REAL DATA
   Reads ?id=<productId> from the URL and
   loads the real product from the backend.
   Replaces the old version which showed the
   same hardcoded "iPhone 16 Pro Max" no
   matter what was clicked.
========================================= */

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let currentProduct = null;
let selectedColour = "";


/* =========================================
   LOAD
========================================= */

async function loadProduct() {

    if (!productId) {
        showNotFound();
        return;
    }

    try {

        const data = await TC.getProduct(productId);
        currentProduct = data.product;
        renderProduct(currentProduct);
        loadRelatedProducts(currentProduct);

    } catch (error) {
        showNotFound();
    }

}

function showNotFound() {

    const container = document.querySelector(".product-details");

    if (container) {
        container.innerHTML = `
            <div style="padding:60px 20px; text-align:center; width:100%;">
                <i class="fa-solid fa-box-open" style="font-size:36px; color:#ccc;"></i>
                <h2 style="margin-top:12px;">Product not found</h2>
                <p style="color:#888;">This product may have been removed.</p>
                <a href="phone-whole-shop.html" style="display:inline-block; margin-top:14px; color:#0b7cff;">
                    ← Back to Shop
                </a>
            </div>
        `;
    }

}


/* =========================================
   RENDER
========================================= */

function renderProduct(product) {

    document.title = `${product.name} | Universal Telecom`;

    setText("breadcrumb-product-name", product.name);
    setText("product-brand", product.brand);
    setText("product-name", product.name);
    setText("product-description", product.description || "No description provided yet.");
    setText("product-moq", `${product.moq || 1} Units`);
    setText("box-product-name", product.name);

    const stockEl = document.getElementById("product-stock");
    if (stockEl) {
        const inStock = product.stock > 0;
        stockEl.className = `stock ${inStock ? "in-stock" : "out-of-stock"}`;
        stockEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${inStock ? "In Stock" : "Out of Stock"}`;
    }

    const priceEl = document.getElementById("product-price");
    if (priceEl) {
        priceEl.innerHTML = `From <span>₦${Number(product.wholesalePrice || 0).toLocaleString()}</span> / Unit`;
    }

    // Images
    const images = (product.images && product.images.length > 0)
        ? product.images
        : ["image/logo.png"];

    const mainImage = document.getElementById("mainImage");
    if (mainImage) mainImage.src = images[0];

    const thumbGallery = document.getElementById("thumbnail-gallery");
    if (thumbGallery) {

        thumbGallery.innerHTML = "";

        images.forEach((img, index) => {

            const thumb = document.createElement("img");
            thumb.src = img;
            thumb.alt = `${product.name} view ${index + 1}`;
            if (index === 0) thumb.classList.add("active");

            thumb.addEventListener("click", () => {
                mainImage.src = img;
                thumbGallery.querySelectorAll("img").forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
            });

            thumbGallery.appendChild(thumb);

        });

    }

    // Colours
    const coloursSection = document.getElementById("colours-section");
    const colorOptions = document.getElementById("color-options");

    if (product.colors && product.colors.length > 0) {

        coloursSection.hidden = false;
        colorOptions.innerHTML = "";

        product.colors.forEach((color, index) => {

            const swatch = document.createElement("span");
            swatch.className = "color" + (index === 0 ? " active" : "");
            swatch.style.background = color;
            swatch.title = color;

            swatch.addEventListener("click", () => {
                colorOptions.querySelectorAll(".color").forEach(c => c.classList.remove("active"));
                swatch.classList.add("active");
                selectedColour = color;
            });

            colorOptions.appendChild(swatch);

        });

        selectedColour = product.colors[0];

    } else {
        coloursSection.hidden = true;
    }

    // Storage
    const storageSection = document.getElementById("storage-section");
    const storageOptions = document.getElementById("storage-options");

    if (product.storage) {

        storageSection.hidden = false;
        storageOptions.innerHTML = `<button class="active">${escapeHTML(product.storage)}</button>`;

    } else {
        storageSection.hidden = true;
    }

    // Specs table — only real fields that were actually filled in
    const specTable = document.getElementById("spec-table");
    const specRows = [
        ["Brand", product.brand],
        ["Category", product.category],
        ["Processor", product.processor],
        ["RAM", product.ram],
        ["Storage", product.storage],
        ["Network", product.network]
    ].filter(([, value]) => value);

    if (specTable) {

        if (specRows.length === 0) {
            specTable.closest(".info-card").hidden = true;
        } else {
            specTable.innerHTML = specRows
                .map(([label, value]) => `<tr><td>${escapeHTML(label)}</td><td>${escapeHTML(value)}</td></tr>`)
                .join("");
        }

    }

}


/* =========================================
   QUANTITY STEPPER
========================================= */

const qtyInput = document.getElementById("qty-input");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");

if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
        qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
}

if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
        qtyInput.value = Number(qtyInput.value) + 1;
    });
}


/* =========================================
   ACTIONS — REQUEST QUOTE / ADD TO CART
========================================= */

const quoteBtn = document.getElementById("detail-quote-btn");
const addCartBtn = document.getElementById("detail-add-cart-btn");

if (quoteBtn) {

    quoteBtn.addEventListener("click", (e) => {

        e.preventDefault();

        if (!currentProduct) return;

        const params = new URLSearchParams();
        params.set("product", currentProduct.name);
        params.set("brand", currentProduct.brand || "");
        params.set("qty", qtyInput ? qtyInput.value : (currentProduct.moq || 1));

        window.location.href = `phone-quote.html?${params.toString()}`;

    });

}

if (addCartBtn) {

    addCartBtn.addEventListener("click", () => {

        if (!currentProduct) return;

        TCCart.addItem({
            name: currentProduct.name,
            brand: currentProduct.brand,
            storage: currentProduct.storage,
            colour: selectedColour,
            image: (currentProduct.images && currentProduct.images[0]) || "",
            moq: qtyInput ? qtyInput.value : (currentProduct.moq || 1)
        });

        const originalHTML = addCartBtn.innerHTML;
        addCartBtn.innerHTML = `<i class="fa-solid fa-check"></i> Added`;

        setTimeout(() => {
            addCartBtn.innerHTML = originalHTML;
        }, 1500);

    });

}


/* =========================================
   RELATED PRODUCTS
========================================= */

async function loadRelatedProducts(product) {

    try {

        const data = await TC.listProducts();
        const others = (data.products || [])
            .filter(p => p._id !== product._id)
            .slice(0, 3);

        if (others.length === 0) return;

        const section = document.getElementById("related-products-section");
        const grid = document.getElementById("related-grid");

        grid.innerHTML = "";

        others.forEach(p => {

            const image = (p.images && p.images[0]) || "image/logo.png";

            const card = document.createElement("div");
            card.className = "related-card";
            card.innerHTML = `
                <img src="${image}" alt="${escapeHTML(p.name)}">
                <h3>${escapeHTML(p.name)}</h3>
                <span>From ₦${Number(p.wholesalePrice || 0).toLocaleString()}</span>
                <a href="phone-product-detail.html?id=${p._id}">View Details</a>
            `;

            grid.appendChild(card);

        });

        section.hidden = false;

    } catch (error) {
        // Silently skip related products on failure — not critical
    }

}


/* =========================================
   HELPERS
========================================= */

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}


/* =========================================
   INIT
========================================= */

loadProduct();
