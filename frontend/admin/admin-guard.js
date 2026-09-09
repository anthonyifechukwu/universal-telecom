/* =========================================
   ADMIN AUTH GUARD
   Include on every admin page EXCEPT login.html.
   Requires js/api.js to be loaded first.
   Redirects to login if not signed in as admin.
========================================= */

(function guardAdminPage() {

    const user = TC.getUser();

    if (!TC.isLoggedIn() || !user || user.role !== "admin") {
        TC.clearSession();
        window.location.href = "login.html";
    }

})();
