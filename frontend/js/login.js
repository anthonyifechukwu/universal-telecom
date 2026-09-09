/* =====================================================
   TRUECELL ADMIN — LOGIN
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENTS
    ================================================= */

    const form =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const toggleBtn =
        document.getElementById("toggleVisibility");

    const submitBtn =
        document.getElementById("submitBtn");

    const alertBox =
        document.getElementById("formAlert");

    const alertText =
        document.getElementById("formAlertText");

    const yearEl =
        document.getElementById("year");


    /* =================================================
       FOOTER YEAR
    ================================================= */

    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }


    /* =================================================
       PASSWORD VISIBILITY TOGGLE
    ================================================= */

    if (toggleBtn && passwordInput) {

        toggleBtn.addEventListener("click", () => {

            const isHidden =
                passwordInput.type === "password";

            passwordInput.type =
                isHidden ? "text" : "password";

            toggleBtn.innerHTML = isHidden
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

            toggleBtn.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );

        });

    }


    /* =================================================
       ALERT HELPERS
    ================================================= */

    function showAlert(message) {

        if (!alertBox) return;

        alertText.textContent = message;
        alertBox.classList.add("visible");

    }


    function hideAlert() {

        if (!alertBox) return;

        alertBox.classList.remove("visible");

    }


    /* =================================================
       FORM SUBMIT
    ================================================= */

    if (form) {

        form.addEventListener("submit", (e) => {

            e.preventDefault();

            hideAlert();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {

                showAlert(
                    "Enter both your email and password to continue."
                );

                return;
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                showAlert(
                    "Enter a valid email address."
                );

                return;
            }


            submitBtn.classList.add("loading");
            submitBtn.disabled = true;

            TC.login({ email, password })
                .then((data) => {

                    if (data.user.role !== "admin") {
                        showAlert("This account does not have admin access.");
                        return;
                    }

                    TC.saveSession(data.token, data.user);
                    window.location.href = "universal-telecom-dashboard.html";

                })
                .catch((error) => {
                    showAlert(error.message || "Incorrect email or password.");
                })
                .finally(() => {
                    submitBtn.classList.remove("loading");
                    submitBtn.disabled = false;
                });

        });

    }

});
