// ============================
// SCROLL REVEAL
// ============================

const reveals = document.querySelectorAll(
".reveal, .slide-left, .slide-right, .zoom-in"
);

function revealElements(){

    const windowHeight = window.innerHeight;

    reveals.forEach((element)=>{

        const top = element.getBoundingClientRect().top;

        const visible = 120;

        if(top < windowHeight - visible){

            element.classList.add("active");

        }

    });

}

window.addEventListener("scroll", revealElements);

revealElements();


// ============================
// STICKY NAVBAR
// ============================

const header = document.querySelector(".header");

window.addEventListener("scroll",()=>{

    if(!header) return;

    if(window.scrollY > 80){

        header.style.padding = "10px 8%";

        header.style.background = "rgba(5,8,22,.95)";

        header.style.backdropFilter = "blur(20px)";

    }

    else{

        header.style.padding = "20px 8%";

        header.style.background = "transparent";

    }

});


// ============================
// SCROLL PROGRESS BAR
// ============================

const progress = document.createElement("div");

progress.className = "progress-bar";

document.body.appendChild(progress);

window.addEventListener("scroll",()=>{

    const scrollTop = document.documentElement.scrollTop;

    const height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;

    const percent = (scrollTop / height) * 100;

    progress.style.width = percent + "%";

});


// ============================
// FLOATING PARALLAX
// ============================

const phones = document.querySelectorAll(".phone");

window.addEventListener("mousemove",(e)=>{

    const x = (window.innerWidth / 2 - e.clientX) / 35;

    const y = (window.innerHeight / 2 - e.clientY) / 35;

    phones.forEach((phone,index)=>{

        phone.style.transform =
        `translate(${x*(index+1)}px, ${y*(index+1)}px)`;

    });

});


// ============================
// CARD HOVER TILT
// ============================

const cards = document.querySelectorAll(
".card,.deal-card,.why-card,.brand-card,.testimonial"
);

cards.forEach(card=>{

    card.addEventListener("mousemove",(e)=>{

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;

        const y = e.clientY - rect.top;

        const rotateY = (x / rect.width - .5) * 16;

        const rotateX = (.5 - y / rect.height) * 16;

        card.style.transform =
        `perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-10px)`;

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform = "";

    });

});


// ============================
// SMOOTH SCROLL
// ============================

document.querySelectorAll('a[href^="#"]').forEach(link=>{

    link.addEventListener("click",(e)=>{

        e.preventDefault();

        const target =
        document.querySelector(link.getAttribute("href"));

        if(target){

            target.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

});


// ============================
// MOBILE MENU
// ============================

const menu = document.querySelector(".menu-toggle");

const nav = document.querySelector(".nav-links");

if(menu){

    menu.addEventListener("click",()=>{

        nav.classList.toggle("show");

    });

}


// ============================
// HERO FADE ON SCROLL
// ============================

const heroContent = document.querySelector(".hero-content");

window.addEventListener("scroll",()=>{

    if(!heroContent) return;

    const scroll = window.scrollY;

    heroContent.style.opacity = 1 - scroll / 500;

    heroContent.style.transform =
    `translateY(${scroll * .3}px)`;

});


// ============================
// IMAGE ZOOM ON SCROLL
// ============================

const hero = document.querySelector(".hero");

window.addEventListener("scroll",()=>{

    if(!hero) return;

    const scale = 1 + window.scrollY / 4000;

    hero.style.backgroundSize =
    `${scale*100}%`;

});


// ============================
// PRELOADER EFFECT
// ============================
// BUG FIX: this used to wait for window's "load" event, which only
// fires once EVERY resource on the page has finished — including
// external images (the Unsplash placeholder photos used as fallbacks).
// On a slow or unstable connection, "load" could take a very long time
// (or effectively never fire), leaving the entire page invisible even
// though all the actual content and products were there all along —
// this was reported as "the space shows but nothing in it," which is
// exactly what opacity:0 on the whole body looks like.
//
// Fixed two ways: (1) reveal the page as soon as the DOM itself is
// ready, without waiting on images at all, and (2) a hard 2-second
// safety timeout that forces the page visible no matter what, so it
// can never get stuck invisible again under any circumstance.

function revealPage() {
    document.body.style.opacity = "1";
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revealPage);
} else {
    // DOM is already ready by the time this script runs
    revealPage();
}

setTimeout(revealPage, 2000);

document.body.style.opacity = "0";

document.body.style.transition = "opacity .8s";


// ============================
// END
// ============================


/*1237742*/

const menuBtn = document.getElementById("menuBtn");
const menuOptions = document.getElementById("menuOptions");

if (menuBtn && menuOptions) {

    menuBtn.addEventListener("click", () => {

        menuOptions.classList.toggle("show");

    });

    document.addEventListener("click", (e) => {

        if(!menuBtn.contains(e.target) &&
           !menuOptions.contains(e.target)){

            menuOptions.classList.remove("show");

        }

    });

}

/* =========================================
   REAL PRODUCT RENDERING
   Replaces the old hardcoded/fake product
   cards. Pulls real products from the backend
   (empty until admin adds some) and renders
   them with working Add to Cart, Request Quote,
   and View Details actions.
========================================= */

const productGrid = document.getElementById("product-grid");
const productsLoading = document.getElementById("products-loading");
const productsEmpty = document.getElementById("products-empty");

async function loadShopProducts() {

    if (!productGrid) return;

    try {

        const params = new URLSearchParams(window.location.search);
        const brand = params.get("brand");

        const data = await TC.listProducts(brand ? { brand } : {});
        const products = data.products || [];

        if (productsLoading) productsLoading.hidden = true;

        if (products.length === 0) {
            if (productsEmpty) productsEmpty.hidden = false;
            return;
        }

        if (productsEmpty) productsEmpty.hidden = true;

        products.forEach(product => {
            productGrid.appendChild(buildProductCard(product));
        });

        if (typeof revealOnScroll === "function") {
            revealOnScroll();
        }

        if (typeof applyWishlistState === "function") {
            applyWishlistState();
        }

    } catch (error) {

        if (productsLoading) productsLoading.hidden = true;

        productGrid.innerHTML += `
            <div class="products-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Could not load products</h3>
                <p>${error.message || "Please refresh and try again."}</p>
            </div>
        `;

    }

}

function buildProductCard(product) {

    const card = document.createElement("div");
    card.className = "product-card reveal active";
    card.dataset.productId = product._id;

    const image = (product.images && product.images[0]) || "image/logo.png";
    const stockLabel = product.stock > 0 ? "In Stock" : "Out of Stock";
    const stockClass = product.stock > 0 ? "available" : "unavailable";

    const colorSwatches = (product.colors || [])
        .slice(0, 5)
        .map(c => `<span class="color" style="background:${escapeAttr(c)}"></span>`)
        .join("");

    card.innerHTML = `
        ${product.flashDeal ? '<span class="discount">FLASH DEAL</span>' : ""}
        ${product.featured ? '<span class="discount">FEATURED</span>' : ""}

        <button class="wishlist">
            <i class="fa-regular fa-heart"></i>
        </button>

        <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}">

        <div class="product-info">

            <span class="brand">${escapeHTML(product.brand)}</span>

            <h3>${escapeHTML(product.name)}</h3>

            <div class="stock ${stockClass}">
                <i class="fa-solid fa-circle-check"></i>
                ${stockLabel}
            </div>

            <div class="moq">
                <strong>MOQ:</strong> ${product.moq || 1} Units
            </div>

            ${colorSwatches ? `<div class="colors">${colorSwatches}</div>` : ""}

            <div class="price">
                <span class="wholesale-price">
                    From ₦${Number(product.wholesalePrice || 0).toLocaleString()} / Unit
                </span>
            </div>

            <div class="product-buttons">

                <a href="#" class="quote-btn">
                    <i class="fa-solid fa-file-signature"></i>
                    Request Quote
                </a>

                <button type="button" class="whatsapp-btn add-to-cart-btn">
                    <i class="fa-solid fa-cart-plus"></i>
                    Add to Cart
                </button>

            </div>

            <div class="product-buttons" style="margin-top:8px;">

                <a href="phone-product-detail.html?id=${product._id}" class="whatsapp-btn" style="width:100%; justify-content:center;">
                    <i class="fa-solid fa-circle-info"></i>
                    View details
                </a>

            </div>

        </div>
    `;

    return card;

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
   DELEGATED EVENTS — REQUEST QUOTE
   Uses delegation (attached to the grid, not
   individual cards) because cards are added
   to the page after the fetch above completes.
   Reused on any grid that exists on this page
   (shop page, or the homepage's two grids).
========================================= */

function attachProductGridEvents(grid) {

    if (!grid) return;

    grid.addEventListener("click", (event) => {

        const wishlistBtn = event.target.closest(".wishlist");

        if (wishlistBtn) {

            event.preventDefault();

            const card = wishlistBtn.closest(".product-card");
            const productId = card ? card.dataset.productId : null;

            if (!productId) return;

            const nowSaved = TCWishlist.toggle(productId);
            const heartIcon = wishlistBtn.querySelector("i");

            if (nowSaved) {
                heartIcon.classList.remove("fa-regular");
                heartIcon.classList.add("fa-solid");
                wishlistBtn.classList.add("saved");
            } else {
                heartIcon.classList.remove("fa-solid");
                heartIcon.classList.add("fa-regular");
                wishlistBtn.classList.remove("saved");
            }

            return;

        }

        const quoteBtn = event.target.closest(".quote-btn");

        if (quoteBtn) {

            event.preventDefault();

            const card = quoteBtn.closest(".product-card");
            const titleEl = card ? card.querySelector(".product-info h3") : null;
            const brandEl = card ? card.querySelector(".product-info .brand") : null;
            const moqEl = card ? card.querySelector(".moq") : null;

            const productName = titleEl ? titleEl.textContent.trim() : "";
            const brand = brandEl ? brandEl.textContent.trim() : "";
            const moqMatch = moqEl ? moqEl.textContent.match(/\d+/) : null;

            const params = new URLSearchParams();
            if (productName) params.set("product", productName);
            if (brand) params.set("brand", brand);
            if (moqMatch) params.set("qty", moqMatch[0]);

            window.location.href = `phone-quote.html?${params.toString()}`;
            return;

        }

        const cartBtn = event.target.closest(".add-to-cart-btn");

        if (cartBtn) {

            event.preventDefault();

            const card = cartBtn.closest(".product-card");
            const titleEl = card ? card.querySelector(".product-info h3") : null;
            const brandEl = card ? card.querySelector(".product-info .brand") : null;
            const moqEl = card ? card.querySelector(".moq") : null;
            const imgEl = card ? card.querySelector("img") : null;

            TCCart.addItem({
                name: titleEl ? titleEl.textContent.trim() : "",
                brand: brandEl ? brandEl.textContent.trim() : "",
                image: imgEl ? imgEl.getAttribute("src") : "",
                moq: moqEl ? (moqEl.textContent.match(/\d+/) || [1])[0] : 1
            });

            const originalHTML = cartBtn.innerHTML;
            cartBtn.innerHTML = `<i class="fa-solid fa-check"></i> Added`;

            setTimeout(() => {
                cartBtn.innerHTML = originalHTML;
            }, 1500);

        }

    });

}

attachProductGridEvents(productGrid);
attachProductGridEvents(document.getElementById("featured-grid"));
attachProductGridEvents(document.getElementById("flash-deals-grid"));

loadShopProducts();



/* =========================================
   HOMEPAGE — FEATURED + FLASH DEALS
   phone-whosaler.html is the site's homepage
   (every logo click leads here). It used to
   show 10 repeated fake "iPhone 16 Pro Max"
   cards with fabricated reviews. Replaced
   with real products, split into Featured
   and Flash Deals using the admin's real
   featured/flashDeal flags on each product.
========================================= */

async function loadHomepageProducts() {

    const featuredGrid = document.getElementById("featured-grid");
    const flashGrid = document.getElementById("flash-deals-grid");

    // Only run this on the homepage — harmless no-op elsewhere.
    if (!featuredGrid && !flashGrid) return;

    try {

        const data = await TC.listProducts();
        const products = data.products || [];

        if (featuredGrid) {

            const featuredLoading = document.getElementById("featured-loading");
            const featuredEmpty = document.getElementById("featured-empty");
            if (featuredLoading) featuredLoading.hidden = true;

            const featured = products.filter(p => p.featured);
            const toShow = featured.length > 0 ? featured : products.slice(0, 6);

            if (toShow.length === 0) {
                if (featuredEmpty) featuredEmpty.hidden = false;
            } else {
                toShow.forEach(p => featuredGrid.appendChild(buildProductCard(p)));
            }

        }

        if (flashGrid) {

            const flashLoading = document.getElementById("flash-deals-loading");
            const flashEmpty = document.getElementById("flash-deals-empty");
            if (flashLoading) flashLoading.hidden = true;

            const flashDeals = products.filter(p => p.flashDeal);

            if (flashDeals.length === 0) {
                if (flashEmpty) flashEmpty.hidden = false;
            } else {
                flashDeals.forEach(p => flashGrid.appendChild(buildProductCard(p)));
            }

        }

        if (typeof revealOnScroll === "function") {
            revealOnScroll();
        }

        if (typeof applyWishlistState === "function") {
            applyWishlistState();
        }

    } catch (error) {

        [featuredGrid, flashGrid].forEach(grid => {
            if (!grid) return;
            grid.innerHTML = `<div class="products-empty"><i class="fa-solid fa-triangle-exclamation"></i><h3>Could not load products</h3><p>${error.message || "Please refresh and try again."}</p></div>`;
        });

    }

}

loadHomepageProducts();
