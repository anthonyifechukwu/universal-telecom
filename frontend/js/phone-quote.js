/*=========================================
   TRUECELL — QUOTE REQUEST FORM
   The actual request form was completely
   missing from the page HTML (only a
   comment marked where it should be) —
   rebuilt in phone-quote.html, and this
   file rewritten to match the real fields
   and use the real backend, real URL
   parameters (product/brand/qty passed from
   the shop and product-detail pages), and a
   real generated quote ID from the server
   instead of a fake client-side one.
=========================================*/

let savedInquiry = null;


/*=========================================
   PRE-FILL FROM URL PARAMETERS
   (?product=&brand=&storage=&colour=&qty=)
=========================================*/

const params = new URLSearchParams(window.location.search);

const productNameInput = document.getElementById("productName");
const brandInput = document.getElementById("brand");
const storageInput = document.getElementById("storage");
const colourInput = document.getElementById("colour");
const quantityInput = document.getElementById("quantity");

if (productNameInput) productNameInput.value = params.get("product") || "";
if (storageInput) storageInput.value = params.get("storage") || "";
if (colourInput) colourInput.value = params.get("colour") || "";
if (quantityInput) quantityInput.value = params.get("qty") || 5;

// Use the REAL brand passed from the shop/product page. Only fall back
// to guessing from the product name if no real brand was ever passed
// (e.g. someone opened this page directly with no context).
if (brandInput) {

    const realBrand = params.get("brand");

    if (realBrand) {

        brandInput.value = realBrand;

    } else {

        const name = (productNameInput?.value || "").toLowerCase();

        if (name.includes("iphone")) brandInput.value = "Apple";
        else if (name.includes("samsung")) brandInput.value = "Samsung";
        else if (name.includes("google") || name.includes("pixel")) brandInput.value = "Google";
        else if (name.includes("xiaomi")) brandInput.value = "Xiaomi";
        else if (name.includes("tecno")) brandInput.value = "Tecno";
        else if (name.includes("infinix")) brandInput.value = "Infinix";
        else brandInput.value = "";

    }

}


/*=========================================
   FORM SUBMISSION — REAL BACKEND SAVE
=========================================*/

const form = document.querySelector(".quote-request-form");
const errorBox = document.getElementById("quote-form-error");

function showFormError(message) {
    if (!errorBox) { alert(message); return; }
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

function hideFormError() {
    if (errorBox) errorBox.style.display = "none";
}

if (form) {

    form.addEventListener("submit", async function (e) {

        e.preventDefault();
        hideFormError();

        const business = document.getElementById("businessName").value.trim();
        const person = document.getElementById("contactPerson").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const product = productNameInput.value.trim();
        const quantity = quantityInput.value;

        if (!business || !person || !email || !phone || !product) {
            showFormError("Please complete all required fields.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn.innerHTML;
        submitBtn.innerHTML = "Sending...";
        submitBtn.disabled = true;

        try {

            const data = await TC.submitInquiry({
                businessName: business,
                contactPerson: person,
                email,
                phone,
                product,
                brand: brandInput.value,
                storage: storageInput.value,
                colour: colourInput.value,
                quantity
            });

            savedInquiry = data.inquiry;

            const modal = document.getElementById("successModal");
            document.getElementById("modalQuoteId").textContent = savedInquiry.quoteId;
            modal.classList.add("show");

            form.reset();
            if (quantityInput) quantityInput.value = 5;

        } catch (error) {

            showFormError(error.message || "Could not submit your quote request. Please try again.");

        } finally {

            submitBtn.innerHTML = originalLabel;
            submitBtn.disabled = false;

        }

    });

}


/*=========================================
   MESSAGE US ABOUT THIS QUOTE
   Requires login. If not logged in, sends
   the customer to register/login first,
   then back here so they land in chat.
=========================================*/

const messageAdminBtn = document.getElementById("messageAdminBtn");

if (messageAdminBtn) {

    messageAdminBtn.addEventListener("click", (e) => {

        e.preventDefault();

        if (!TC.isLoggedIn()) {
            window.location.href = "phone-register.html?redirect=phone-chat.html";
            return;
        }

        window.location.href = "phone-chat.html";

    });

}


/*=========================================
   MESSAGE BUTTON — goes to real chat
   Simplified: this used to ambiguously act as
   either a WhatsApp shortcut OR a chat link
   depending on form state, which was confusing
   and didn't reliably require login the way the
   "Message Us About This Quote" button in the
   success modal does. There's already a
   dedicated floating WhatsApp button elsewhere
   on this page, so this one now has one clear
   job: take the customer to real chat, same
   login-gating as everywhere else on the site.
=========================================*/

const quoteMessageBtn = document.getElementById("quote-message-btn");

if (quoteMessageBtn) {

    quoteMessageBtn.addEventListener("click", function (e) {

        e.preventDefault();

        if (!TC.isLoggedIn()) {
            window.location.href = "phone-register.html?redirect=phone-chat.html";
            return;
        }

        window.location.href = "phone-chat.html";

    });

}


/*=========================================
   SCROLL REVEAL
=========================================*/

const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
        }
    });

}, { threshold: .15 });

document.querySelectorAll(".feature-card,.faq-item,.contact-card,.quote-request-form")
    .forEach(item => {
        item.classList.add("reveal");
        observer.observe(item);
    });


/*=========================================
   STICKY HEADER
=========================================*/

const header = document.querySelector(".header");

if (header) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 60) {
            header.style.background = "rgba(5,8,22,.95)";
            header.style.backdropFilter = "blur(20px)";
        } else {
            header.style.background = "transparent";
        }

    });

}


/*=========================================
   NEWSLETTER (separate, decorative — not
   the quote request form)
=========================================*/

const newsletter = document.querySelector(".newsletter form");

if (newsletter) {

    newsletter.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = this.querySelector("input").value;

        if (email === "") {
            alert("Enter your email.");
            return;
        }

        alert("Thank you for subscribing!");
        this.reset();

    });

}


/*=========================================
   SUCCESS MODAL — close on outside click
=========================================*/

const successModal = document.getElementById("successModal");

if (successModal) {

    successModal.addEventListener("click", function (e) {
        if (e.target === successModal) {
            successModal.classList.remove("show");
        }
    });

}


/*=========================================
   DOWNLOAD QUOTE PDF
   Uses the REAL saved inquiry from the
   server (with its real quote ID) — only
   available after a successful submission.
=========================================*/

const downloadButton = document.getElementById("downloadQuote");

if (downloadButton) {

    downloadButton.addEventListener("click", function (e) {

        e.preventDefault();

        if (!savedInquiry) {
            alert("Please submit the form first to generate your quote PDF.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("Universal Telecom Wholesale Quote", 20, 20);

        doc.setFontSize(11);
        doc.text("Quote ID: " + savedInquiry.quoteId, 20, 35);
        doc.text("Date: " + new Date(savedInquiry.createdAt).toLocaleDateString(), 20, 42);

        doc.line(20, 48, 190, 48);

        doc.text("Business: " + savedInquiry.businessName, 20, 60);
        doc.text("Contact Person: " + savedInquiry.contactPerson, 20, 68);
        doc.text("Phone: " + savedInquiry.phone, 20, 76);
        doc.text("Email: " + savedInquiry.email, 20, 84);

        doc.line(20, 92, 190, 92);

        doc.text("Product: " + (savedInquiry.product || "-"), 20, 104);
        doc.text("Brand: " + (savedInquiry.brand || "-"), 20, 112);
        doc.text("Storage: " + (savedInquiry.storage || "-"), 20, 120);
        doc.text("Colour: " + (savedInquiry.colour || "-"), 20, 128);
        doc.text("Quantity: " + (savedInquiry.quantity || 1), 20, 136);

        doc.setFontSize(10);
        doc.text("Our sales team will follow up with final pricing shortly.", 20, 155);

        doc.save(`${savedInquiry.quoteId}-quote.pdf`);

    });

}
