/* =========================================
   TRUECELL ADMIN PRODUCTS
========================================= */


/* =========================================
   API
   Uses the shared TC helper (js/api.js) so it
   always hits the correct backend URL and sends
   the admin's login token — the public product
   list alone won't show hidden/out-of-stock items.
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const productGrid =
    document.querySelector("#product-grid");

const loading =
    document.querySelector("#loading");

const errorBox =
    document.querySelector("#error-box");

const errorMessage =
    document.querySelector("#error-message");

const emptyBox =
    document.querySelector("#empty-box");

const searchInput =
    document.querySelector("#search-input");

const brandFilter =
    document.querySelector("#brand-filter");

const stockFilter =
    document.querySelector("#stock-filter");

const refreshButton =
    document.querySelector("#refresh-btn");

const retryButton =
    document.querySelector("#retry-btn");

const resultText =
    document.querySelector("#product-result");


/* =========================================
   PRODUCT STORAGE
========================================= */

let products = [];


/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {

    showLoading();

    try {

        const data = await TC.adminListProducts();


        /*
            Some APIs return:

            [
                product,
                product
            ]

            Others return:

            {
                products: []
            }

            We support both.
        */

        products =
            Array.isArray(data)
                ? data
                : data.products || [];


        updateStatistics();

        createBrandFilters();

        displayProducts(products);


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        showError(error.message);

    }

}


/* =========================================
   DISPLAY PRODUCTS
========================================= */

function displayProducts(list) {

    loading.hidden = true;

    errorBox.hidden = true;

    productGrid.innerHTML = "";


    if (list.length === 0) {

        emptyBox.hidden = false;

        resultText.textContent =
            "No products found";

        return;

    }


    emptyBox.hidden = true;


    resultText.textContent =
        `${list.length} product${list.length === 1 ? "" : "s"} found`;


    list.forEach(product => {

        productGrid.appendChild(
            createProductCard(product)
        );

    });

}


/* =========================================
   CREATE PRODUCT CARD
========================================= */

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";


    /* STOCK */

    const stock =
        Number(product.stock || 0);


    let stockClass = "available";

    let stockText = "In Stock";


    if (stock <= 0) {

        stockClass = "out";

        stockText = "Out of Stock";

    }

    else if (stock <= 10) {

        stockClass = "low";

        stockText = "Low Stock";

    }


    /* IMAGE */

    const image =
        product.images?.[0]
        ||
        product.image
        ||
        "https://via.placeholder.com/600x500?text=TrueCell";


    /* PRICE */

    const price =
        Number(
            product.wholesalePrice
            ||
            product.price
            ||
            0
        );


    card.innerHTML = `

        <div class="product-image">

            <span class="stock-badge ${stockClass}">
                ${stockText}
            </span>

            <img
                src="${image}"
                alt="${escapeHTML(product.name || "Product")}"
                loading="lazy"
            >

        </div>


        <div class="product-content">

            <span class="brand">
                ${escapeHTML(product.brand || "Unknown")}
            </span>


            <h3>
                ${escapeHTML(product.name || "Unnamed Product")}
            </h3>


            <div class="price">

                ${formatCurrency(price)}

            </div>


            <div class="product-meta">

                <span>
                    Stock: ${stock}
                </span>

                <span>
                    MOQ: ${product.moq || 1}
                </span>

            </div>


            <div class="product-actions">

                <button
                    class="edit-btn"
                    data-id="${product.id || product._id}"
                >

                    <i class="fa-solid fa-pen"></i>

                    Edit

                </button>


                <button
                    class="delete-btn"
                    data-id="${product.id || product._id}"
                >

                    <i class="fa-solid fa-trash"></i>

                    Delete

                </button>

            </div>

        </div>

    `;


    /* EDIT */

    const editButton =
        card.querySelector(".edit-btn");


    editButton.addEventListener(
        "click",
        () => {

            const id =
                editButton.dataset.id;

            window.location.href =
                `add-product.html?id=${encodeURIComponent(id)}`;

        }
    );


    /* DELETE */

    const deleteButton =
        card.querySelector(".delete-btn");


    deleteButton.addEventListener(
        "click",
        () => {

            deleteProduct(
                deleteButton.dataset.id
            );

        }
    );


    return card;

}


/* =========================================
   DELETE PRODUCT
========================================= */

async function deleteProduct(id) {

    if (!id) {

        alert("Product ID is missing.");

        return;

    }


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmDelete) return;


    try {

        await TC.adminDeleteProduct(id);

        await loadProducts();


    } catch (error) {

        console.error(error);

        alert(
            error.message || "Could not delete the product."
        );

    }

}


/* =========================================
   SEARCH
========================================= */

function filterProducts() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedBrand =
        brandFilter.value;


    const selectedStock =
        stockFilter.value;


    const filtered =
        products.filter(product => {


            const name =
                String(product.name || "")
                    .toLowerCase();


            const brand =
                String(product.brand || "")
                    .toLowerCase();


            const matchesSearch =
                name.includes(search)
                ||
                brand.includes(search);


            const matchesBrand =
                selectedBrand === "all"
                ||
                product.brand === selectedBrand;


            const stock =
                Number(product.stock || 0);


            let matchesStock = true;


            if (selectedStock === "in-stock") {

                matchesStock = stock > 10;

            }


            if (selectedStock === "low-stock") {

                matchesStock =
                    stock > 0 && stock <= 10;

            }


            if (selectedStock === "out-stock") {

                matchesStock = stock <= 0;

            }


            return (
                matchesSearch &&
                matchesBrand &&
                matchesStock
            );

        });


    displayProducts(filtered);

}


/* =========================================
   BRAND FILTER
========================================= */

function createBrandFilters() {

    const brands =
        [
            ...new Set(
                products
                    .map(product => product.brand)
                    .filter(Boolean)
            )
        ]
        .sort();


    brandFilter.innerHTML = `

        <option value="all">
            All Brands
        </option>

    `;


    brands.forEach(brand => {

        const option =
            document.createElement("option");

        option.value = brand;

        option.textContent = brand;

        brandFilter.appendChild(option);

    });

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const total =
        products.length;


    const inStock =
        products.filter(
            product =>
                Number(product.stock || 0) > 10
        ).length;


    const lowStock =
        products.filter(
            product => {

                const stock =
                    Number(product.stock || 0);

                return stock > 0 && stock <= 10;

            }
        ).length;


    const brands =
        new Set(
            products
                .map(product => product.brand)
                .filter(Boolean)
        ).size;


    document.querySelector(
        "#total-products"
    ).textContent = total;


    document.querySelector(
        "#in-stock"
    ).textContent = inStock;


    document.querySelector(
        "#low-stock"
    ).textContent = lowStock;


    document.querySelector(
        "#total-brands"
    ).textContent = brands;

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

    loading.hidden = false;

    errorBox.hidden = true;

    emptyBox.hidden = true;

    productGrid.innerHTML = "";

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    loading.hidden = true;

    errorBox.hidden = false;

    emptyBox.hidden = true;

    productGrid.innerHTML = "";

    errorMessage.textContent =
        message ||
        "Could not connect to the server.";

    resultText.textContent =
        "Connection failed";

}


/* =========================================
   CURRENCY
========================================= */

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================
   EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    filterProducts
);


brandFilter.addEventListener(
    "change",
    filterProducts
);


stockFilter.addEventListener(
    "change",
    filterProducts
);


refreshButton.addEventListener(
    "click",
    loadProducts
);


retryButton.addEventListener(
    "click",
    loadProducts
);


/* =========================================
   START
========================================= */

loadProducts();

/* =========================================
   MOBILE SIDEBAR
========================================= */

const menuButton =
    document.querySelector("#menu-btn");

const sidebar =
    document.querySelector(".sidebar");

const sidebarOverlay =
    document.querySelector("#sidebar-overlay");


function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    sidebarOverlay?.classList.add("show");

    document.body.style.overflow = "hidden";
}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    sidebarOverlay?.classList.remove("show");

    document.body.style.overflow = "";
}


menuButton?.addEventListener(
    "click",
    openSidebar
);


sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);


/* Close when navigation link is clicked */

document
    .querySelectorAll(".sidebar nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


/* Close with ESC */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeSidebar();

        }

    }
);