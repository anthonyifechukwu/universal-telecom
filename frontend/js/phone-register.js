/*=================================
PAGE LOADER
=================================*/

const loader = document.querySelector(".loader");

// BUG FIX: previously waited for window's "load" event (every resource
// including external images finished) — on a slow connection this
// could leave the loader covering the page indefinitely.

function hideLoader() {

    if (loader) {

        setTimeout(() => {

            loader.style.opacity = "0";
            loader.style.visibility = "hidden";

        }, 800);

    }

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideLoader);
} else {
    hideLoader();
}

setTimeout(hideLoader, 3000);


/*=================================
PASSWORD TOGGLE
=================================*/

const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirm-password");

const passwordToggle = document.querySelector(".password-toggle");
const confirmToggle = document.querySelector(".confirm-password-toggle");


if (password && passwordToggle) {

    passwordToggle.addEventListener("click", () => {

        if (password.type === "password") {

            password.type = "text";
            passwordToggle.classList.replace("fa-eye", "fa-eye-slash");

        } else {

            password.type = "password";
            passwordToggle.classList.replace("fa-eye-slash", "fa-eye");

        }

    });

}


if (confirmPassword && confirmToggle) {

    confirmToggle.addEventListener("click", () => {

        if (confirmPassword.type === "password") {

            confirmPassword.type = "text";
            confirmToggle.classList.replace("fa-eye", "fa-eye-slash");

        } else {

            confirmPassword.type = "password";
            confirmToggle.classList.replace("fa-eye-slash", "fa-eye");

        }

    });

}


/*=================================
PASSWORD STRENGTH
=================================*/

if (password) {

    password.addEventListener("input", () => {

        const value = password.value;

        if (value.length < 6) {
            password.style.borderColor = "#ef4444";
        } else if (value.length < 10) {
            password.style.borderColor = "#f59e0b";
        } else {
            password.style.borderColor = "#22c55e";
        }

    });

}


/*=================================
FORM SUBMISSION — REAL REGISTRATION
=================================*/

const form = document.querySelector(".register-form");
const errorBox = document.querySelector("#register-error");

function showError(message) {

    if (!errorBox) {
        alert(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.style.display = "block";

}

function hideError() {

    if (errorBox) {
        errorBox.style.display = "none";
    }

}

form.addEventListener("submit", async (e) => {

    e.preventDefault();
    hideError();

    const fullName = document.querySelector("#fullName").value.trim();
    const businessName = document.querySelector("#businessName").value.trim();
    const email = document.querySelector("#email").value.trim();
    const phone = document.querySelector("#phone").value.trim();

    if (password.value !== confirmPassword.value) {
        showError("Passwords do not match.");
        return;
    }

    if (password.value.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    const submitButton = document.querySelector(".register-btn");
    const originalText = submitButton.innerHTML;

    submitButton.innerHTML = "Creating Account...";
    submitButton.disabled = true;

    try {

        const data = await TC.register({
            fullName,
            businessName,
            email,
            phone,
            password: password.value
        });

        TC.saveSession(data.token, data.user);

        // If the customer arrived here because they tried to message
        // support without an account, send them straight back to chat.
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        window.location.href = redirect ? redirect : "phone-account.html";

    } catch (error) {

        showError(error.message || "Registration failed. Please try again.");
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;

    }

});


/*=================================
INPUT ANIMATION
=================================*/

const inputs = document.querySelectorAll(".input-box input, .input-box select");

inputs.forEach(input => {

    input.addEventListener("focus", () => {
        input.parentElement.style.borderColor = "#0ea5e9";
    });

    input.addEventListener("blur", () => {
        input.parentElement.style.borderColor = "rgba(255,255,255,.12)";
    });

});


/*=================================
WHATSAPP BUTTON
=================================*/

const whatsapp = document.querySelector(".floating-whatsapp");

if (whatsapp) {

    setInterval(() => {

        whatsapp.style.transform = "scale(1.1)";

        setTimeout(() => {
            whatsapp.style.transform = "scale(1)";
        }, 500);

    }, 3000);

}


/*=================================
SMOOTH SCROLL
=================================*/

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", (e) => {

        const target = document.querySelector(link.getAttribute("href"));

        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
        }

    });

});


/*=================================
BOTTOM NAV MENU DROPDOWN
=================================*/

const menuBtn = document.getElementById("menuBtn");
const menuOptions = document.getElementById("menuOptions");

if (menuBtn && menuOptions) {

    menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menuOptions.classList.toggle("show");
    });

    document.addEventListener("click", function (e) {
        if (!menuOptions.contains(e.target) && e.target !== menuBtn) {
            menuOptions.classList.remove("show");
        }
    });

}
