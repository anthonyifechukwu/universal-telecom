/* =========================================
   TRUECELL ADMIN
   ADD PRODUCT JS — PART 1/2
========================================= */


/* =========================================
   MOBILE SIDEBAR
========================================= */

const menuBtn =
    document.querySelector(".menu-btn");

const sidebar =
    document.querySelector(".sidebar");

const sidebarOverlay =
    document.querySelector(".sidebar-overlay");


function openSidebar() {

    if (sidebar) {

        sidebar.classList.add("open");

    }

    if (sidebarOverlay) {

        sidebarOverlay.classList.add("show");

    }

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove("open");

    }

    if (sidebarOverlay) {

        sidebarOverlay.classList.remove("show");

    }

}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        openSidebar
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


/* =========================================
   CLOSE SIDEBAR AFTER CLICKING A LINK
========================================= */

document
    .querySelectorAll(".sidebar nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


/* =========================================
   PRODUCT FORM
========================================= */

const productForm =
    document.querySelector("#product-form");


/* =========================================
   IMAGE UPLOAD
========================================= */

const imageInput =
    document.querySelector("#product-image");

const imagePreview =
    document.querySelector("#image-preview");


let selectedImages = [];


if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            const files =
                Array.from(this.files);

            if (!files.length) {

                return;

            }


            files.forEach(file => {

                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select a valid image file."
                    );

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload = function (event) {

                    const imageData = {

                        id:
                            Date.now() +
                            Math.random(),

                        name: file.name,

                        type: file.type,

                        data: event.target.result

                    };


                    selectedImages.push(
                        imageData
                    );


                    displayImages();

                };


                reader.readAsDataURL(file);

            });


            /*
             * Clear the input so the same
             * image can be selected again.
             */

            this.value = "";

        }
    );

}


/* =========================================
   DISPLAY IMAGE PREVIEW
========================================= */

function displayImages() {

    if (!imagePreview) {

        return;

    }


    imagePreview.innerHTML = "";


    selectedImages.forEach(image => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "image-preview-item";


        const img =
            document.createElement("img");

        img.src = image.data;

        img.alt = image.name;


        const removeButton =
            document.createElement("button");

        removeButton.type = "button";

        removeButton.className =
            "remove-image";

        removeButton.innerHTML =
            '<i class="fa-solid fa-xmark"></i>';


        removeButton.addEventListener(
            "click",
            function () {

                selectedImages =
                    selectedImages.filter(
                        item =>
                            item.id !== image.id
                    );

                displayImages();

            }
        );


        wrapper.appendChild(img);

        wrapper.appendChild(removeButton);

        imagePreview.appendChild(wrapper);

    });

}


/* =========================================
   GET SELECTED COLORS
========================================= */

function getSelectedColors() {

    const checkedColors =
        document.querySelectorAll(
            'input[name="colors"]:checked'
        );


    return Array.from(checkedColors)
        .map(input => input.value);

}


/* =========================================
   GET FORM VALUE SAFELY
========================================= */

function getValue(selector) {

    const element =
        document.querySelector(selector);


    if (!element) {

        return "";

    }


    return element.value.trim();

}


/* =========================================
   GET PRODUCT DATA
========================================= */

function getProductData() {

    const product = {

        id:
            "product-" +
            Date.now(),

        name:
            getValue("#product-name"),

        brand:
            getValue("#brand"),

        category:
            getValue("#category"),

        description:
            getValue("#description"),

        price:
            Number(
                getValue("#price")
            ) || 0,

        moq:
            Number(
                getValue("#moq")
            ) || 1,

        stock:
            Number(
                getValue("#stock")
            ) || 0,

        storage:
            getValue("#storage"),

        ram:
            getValue("#ram"),

        network:
            getValue("#network"),

        processor:
            getValue("#processor"),

        colors:
            getSelectedColors(),

        images:
            selectedImages.map(
                image => image.data
            ),

        active:
            document.querySelector("#active")
                ?.checked || false,

        featured:
            document.querySelector("#featured")
                ?.checked || false,

        flashDeal:
            document.querySelector("#flash-deal")
                ?.checked || false,

        createdAt:
            new Date().toISOString()

    };


    return product;

}


/* =========================================
   VALIDATE PRODUCT
========================================= */

function validateProduct(product) {

    const errors = [];


    if (!product.name) {

        errors.push(
            "Product name is required."
        );

    }


    if (!product.brand) {

        errors.push(
            "Brand is required."
        );

    }


    if (!product.category) {

        errors.push(
            "Category is required."
        );

    }


    if (!product.description) {

        errors.push(
            "Product description is required."
        );

    }


    if (product.price <= 0) {

        errors.push(
            "Enter a valid product price."
        );

    }


    if (product.moq <= 0) {

        errors.push(
            "MOQ must be at least 1."
        );

    }


    if (product.stock < 0) {

        errors.push(
            "Stock cannot be negative."
        );

    }


    if (!product.storage) {

        errors.push(
            "Select the storage capacity."
        );

    }


    if (!product.ram) {

        errors.push(
            "Select the RAM."
        );

    }


    if (!product.processor) {

        errors.push(
            "Enter the processor."
        );

    }


    if (product.colors.length === 0) {

        errors.push(
            "Select at least one color."
        );

    }


    if (product.images.length === 0) {

        errors.push(
            "Upload at least one product image."
        );

    }


    return errors;

}


/* =========================================
   SHOW VALIDATION ERRORS
========================================= */

function showValidationErrors(errors) {

    if (!errors.length) {

        return;

    }


    alert(
        "Please fix the following:\n\n" +
        errors.join("\n")
    );

}


/* =========================================
   SAVE PRODUCT LOCALLY
========================================= */

function saveProductLocally(product) {

    let products = [];


    try {

        products =
            JSON.parse(
                localStorage.getItem(
                    "truecell_products"
                )
            ) || [];


    } catch (error) {

        console.error(
            "Could not read saved products:",
            error
        );

        products = [];

    }


    products.push(product);


    localStorage.setItem(
        "truecell_products",
        JSON.stringify(products)
    );


    return true;

}


/* =========================================
   CHECK EXISTING PRODUCTS
========================================= */

function getSavedProducts() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "truecell_products"
            )
        ) || [];

    } catch (error) {

        console.error(
            "Could not load products:",
            error
        );

        return [];

    }

}


/* =========================================
   PAGE READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "TrueCell Add Product page ready."
        );


        console.log(
            "Saved products:",
            getSavedProducts()
        );

    }
);


/* =========================================
   TRUECELL ADMIN
   ADD PRODUCT JS — PART 2/2
========================================= */


/* =========================================
   EDIT MODE — pre-fill form if ?id= is present
========================================= */

const editingProductId = new URLSearchParams(window.location.search).get("id");

if (editingProductId) {

    TC.adminListProducts()
        .then(data => {

            const existing = (data.products || []).find(
                p => String(p._id) === String(editingProductId)
            );

            if (!existing) {
                alert("Product not found.");
                return;
            }

            populateFormForEdit(existing);

        })
        .catch(() => {
            alert("Could not load product for editing.");
        });

}

function populateFormForEdit(product) {

    const setValue = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.value = value || "";
    };

    setValue("#product-name", product.name);
    setValue("#brand", product.brand);
    setValue("#category", product.category);
    setValue("#description", product.description);
    setValue("#price", product.wholesalePrice);
    setValue("#moq", product.moq);
    setValue("#stock", product.stock);
    setValue("#storage", product.storage);
    setValue("#ram", product.ram);
    setValue("#network", product.network);
    setValue("#processor", product.processor);

    (product.colors || []).forEach(color => {
        const checkbox = document.querySelector(`input[name="colors"][value="${color}"]`);
        if (checkbox) checkbox.checked = true;
    });

    const activeSwitch = document.querySelector("#active");
    if (activeSwitch) activeSwitch.checked = product.status !== "hidden";

    const featuredSwitch = document.querySelector("#featured");
    if (featuredSwitch) featuredSwitch.checked = Boolean(product.featured);

    const flashSwitch = document.querySelector("#flash-deal");
    if (flashSwitch) flashSwitch.checked = Boolean(product.flashDeal);

    selectedImages = (product.images || []).map(data => ({ data }));
    displayImages();

    const submitButton = document.querySelector("#submit-btn");
    if (submitButton) {
        submitButton.innerHTML = `<i class="fa-solid fa-pen"></i> Save Changes`;
    }

    const heading = document.querySelector(".page-title, h1");
    if (heading) heading.textContent = "Edit Product";

}


/* =========================================
   SUBMIT PRODUCT — REAL BACKEND SAVE
========================================= */

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const product = getProductData();

            const errors = validateProduct(product);

            if (errors.length > 0) {
                showValidationErrors(errors);
                return;
            }

            const submitButton = document.querySelector("#submit-btn");

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.classList.add("loading");
                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner"></i>
                    Saving Product...
                `;
            }

            const payload = {
                name: product.name,
                brand: product.brand,
                category: product.category,
                description: product.description,
                wholesalePrice: product.price,
                moq: product.moq,
                stock: product.stock,
                storage: product.storage,
                ram: product.ram,
                network: product.network,
                processor: product.processor,
                colors: product.colors,
                images: product.images,
                featured: product.featured,
                flashDeal: product.flashDeal,
                status: product.active ? "active" : "hidden"
            };

            try {

                if (editingProductId) {
                    await TC.adminUpdateProduct(editingProductId, payload);
                } else {
                    await TC.adminCreateProduct(payload);
                }

                showSuccessMessage();

                setTimeout(() => {
                    window.location.href = "products.html";
                }, 900);

            } catch (error) {

                alert(error.message || "Could not save product. Please try again.");

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.classList.remove("loading");
                    submitButton.innerHTML = editingProductId
                        ? `<i class="fa-solid fa-pen"></i> Save Changes`
                        : `<i class="fa-solid fa-plus"></i> Add Product`;
                }

            }

        }
    );

}


/* =========================================
   SUCCESS MESSAGE
========================================= */

function showSuccessMessage() {

    /*
     * Remove an old message if one exists.
     */

    const oldMessage =
        document.querySelector(
            ".success-message"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    const message =
        document.createElement("div");


    message.className =
        "success-message";


    message.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>

        <div>
            <strong>Product added successfully!</strong>
            <div>
                The product has been saved to TrueCell products.
            </div>
        </div>
    `;


    /*
     * Put the message above
     * the product form.
     */

    if (productForm) {

        productForm.parentElement.insertBefore(
            message,
            productForm
        );

    }


    /*
     * Automatically remove it
     * after a few seconds.
     */

    setTimeout(() => {

        message.style.opacity = "0";

        message.style.transition =
            "opacity .3s ease";


        setTimeout(() => {

            message.remove();

        }, 300);

    }, 4000);

}


/* =========================================
   PRICE FORMATTING
========================================= */

const priceInput =
    document.querySelector("#price");


if (priceInput) {

    priceInput.addEventListener(
        "input",
        function () {

            /*
             * Allow numbers and decimal point
             */

            this.value =
                this.value.replace(
                    /[^0-9.]/g,
                    ""
                );

        }
    );

}


/* =========================================
   MOQ VALIDATION
========================================= */

const moqInput =
    document.querySelector("#moq");


if (moqInput) {

    moqInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value.replace(
                    /[^0-9]/g,
                    ""
                );

        }
    );

}


/* =========================================
   STOCK VALIDATION
========================================= */

const stockInput =
    document.querySelector("#stock");


if (stockInput) {

    stockInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value.replace(
                    /[^0-9]/g,
                    ""
                );

        }
    );

}


/* =========================================
   LIVE PRODUCT NAME CHECK
========================================= */

const productName =
    document.querySelector("#product-name");


if (productName) {

    productName.addEventListener(
        "blur",
        function () {

            if (
                this.value.trim() === ""
            ) {

                this.classList.add(
                    "error"
                );

            } else {

                this.classList.remove(
                    "error"
                );

            }

        }
    );


    productName.addEventListener(
        "input",
        function () {

            if (
                this.value.trim() !== ""
            ) {

                this.classList.remove(
                    "error"
                );

            }

        }
    );

}


/* =========================================
   BRAND CHECK
========================================= */

const brandInput =
    document.querySelector("#brand");


if (brandInput) {

    brandInput.addEventListener(
        "change",
        function () {

            this.classList.remove(
                "error"
            );

        }
    );

}


/* =========================================
   CATEGORY CHECK
========================================= */

const categoryInput =
    document.querySelector("#category");


if (categoryInput) {

    categoryInput.addEventListener(
        "change",
        function () {

            this.classList.remove(
                "error"
            );

        }
    );

}


/* =========================================
   BEFORE LEAVING PAGE
========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * Nothing needs to be done here.
         *
         * Products are already saved
         * immediately to localStorage.
         */

    }
);


/* =========================================
   ADMIN PRODUCT COUNT
========================================= */

function getProductCount() {

    const products =
        getSavedProducts();


    return products.length;

}


/* =========================================
   DEBUG HELPER
========================================= */

window.TrueCellProducts = {

    getAll: function () {

        return getSavedProducts();

    },


    count: function () {

        return getProductCount();

    },


    clear: function () {

        localStorage.removeItem(
            "truecell_products"
        );

        console.log(
            "TrueCell products cleared."
        );

    }

};


/* =========================================
   FINAL PAGE MESSAGE
========================================= */

console.log(
    "TrueCell Add Product system loaded."
);



/* =========================================
   SIDEBAR MESSAGES BADGE (real unread count)
========================================= */

(async function loadMessagesBadge() {

    try {

        const data = await TC.adminListConversations();
        const unread = (data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const badge = document.getElementById("sidebar-messages-badge");

        if (badge) {
            if (unread > 0) {
                badge.textContent = unread;
                badge.hidden = false;
            } else {
                badge.hidden = true;
            }
        }

    } catch (error) {
        // Non-critical — badge just won't update
    }

})();
