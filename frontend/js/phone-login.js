/*=================================
PAGE LOADER
=================================*/

const loader = document.querySelector(".loader");

// BUG FIX: previously waited for window's "load" event, which only
// fires once every resource (including external images) has finished —
// on a slow connection this could leave the loader covering the page
// indefinitely. Now reveals as soon as the DOM is ready, with a hard
// safety timeout so it can never get stuck either way.

function hideLoader() {

    if (loader) {

        setTimeout(()=>{

            loader.style.opacity="0";
            loader.style.pointerEvents="none";

        },800);

    }

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideLoader);
} else {
    hideLoader();
}

setTimeout(hideLoader, 3000);


/*=================================
SHOW / HIDE PASSWORD
=================================*/

const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector(".password-toggle");

if(passwordToggle && passwordInput){

    passwordToggle.addEventListener("click",()=>{

        if(passwordInput.type === "password"){

            passwordInput.type="text";
            passwordToggle.classList.remove("fa-eye");
            passwordToggle.classList.add("fa-eye-slash");

        }else{

            passwordInput.type="password";
            passwordToggle.classList.remove("fa-eye-slash");
            passwordToggle.classList.add("fa-eye");

        }

    });

}


/*=================================
IF ALREADY LOGGED IN, SKIP LOGIN
=================================*/

(function redirectIfLoggedIn(){

    if(TC.isLoggedIn()){

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        window.location.href = redirect ? redirect : "phone-account.html";

    }

})();


/*=================================
BANNER: WHY THEY'RE HERE
=================================*/

(function showRedirectReason(){

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    const errorBox = document.querySelector("#login-error");

    if(redirect === "phone-chat.html" && errorBox){

        errorBox.textContent = "Please sign in to message our support team.";
        errorBox.style.display = "block";
        errorBox.style.background = "rgba(14,165,233,.15)";
        errorBox.style.color = "#0ea5e9";

    }

})();


/*=================================
LOGIN FORM — REAL AUTH
=================================*/

const loginForm = document.querySelector(".login-form");
const errorBox = document.querySelector("#login-error");

function showError(message){

    if(!errorBox){
        alert(message);
        return;
    }

    errorBox.style.background = "";
    errorBox.style.color = "";
    errorBox.textContent = message;
    errorBox.style.display = "block";

}

if(loginForm){

    loginForm.addEventListener("submit", async (e)=>{

        e.preventDefault();

        const email = document.querySelector("#email").value.trim();
        const password = passwordInput.value.trim();

        if(email === "" || password === ""){

            showError("Please fill in all fields");
            return;

        }

        const button = loginForm.querySelector("button[type='submit']");
        const originalText = button.innerHTML;

        button.innerHTML = "Logging in...";
        button.disabled = true;

        try{

            const data = await TC.login({ email, password });

            TC.saveSession(data.token, data.user);

            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect");

            window.location.href = redirect ? redirect : "phone-account.html";

        }catch(error){

            showError(error.message || "Invalid email or password.");
            button.innerHTML = originalText;
            button.disabled = false;

        }

    });

}


/*=================================
REMEMBER ME
=================================*/

const remember = document.querySelector('.login-options input[type="checkbox"]');

if(remember){

    remember.addEventListener("change",()=>{

        if(remember.checked){
            localStorage.setItem("rememberUser","true");
        }else{
            localStorage.removeItem("rememberUser");
        }

    });

}


/*=================================
MOBILE MENU
=================================*/

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-right");

if(menuToggle && nav){

    menuToggle.addEventListener("click",()=>{
        nav.classList.toggle("open");
    });

}


/*=================================
INPUT FOCUS EFFECT
=================================*/

const inputs = document.querySelectorAll(".input-box input");

inputs.forEach(input=>{

    input.addEventListener("focus",()=>{
        input.parentElement.style.borderColor = "#0ea5e9";
    });

    input.addEventListener("blur",()=>{
        input.parentElement.style.borderColor = "rgba(255,255,255,.12)";
    });

});


/*=================================
WHATSAPP BUTTON EFFECT
=================================*/

const whatsapp = document.querySelector(".floating-whatsapp");

if(whatsapp){

    setInterval(()=>{

        whatsapp.style.transform = "scale(1.1)";

        setTimeout(()=>{
            whatsapp.style.transform = "scale(1)";
        },500);

    },3000);

}


/*=================================
SMOOTH SCROLL
=================================*/

document.querySelectorAll('a[href^="#"]').forEach(link=>{

    link.addEventListener("click",(e)=>{

        const target = document.querySelector(link.getAttribute("href"));

        if(target){
            e.preventDefault();
            target.scrollIntoView({ behavior:"smooth" });
        }

    });

});


/*=================================
AUTO REMEMBER CHECKBOX
=================================*/

window.addEventListener("DOMContentLoaded",()=>{

    if(localStorage.getItem("rememberUser") && remember){
        remember.checked = true;
    }

});


/*=================================
BOTTOM NAV MENU
=================================*/

const menuBtn = document.getElementById("menuBtn");
const menuOptions = document.getElementById("menuOptions");

if(menuBtn && menuOptions){

    menuBtn.addEventListener("click", () => {
        menuOptions.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {

        if(!menuBtn.contains(e.target) && !menuOptions.contains(e.target)){
            menuOptions.classList.remove("show");
        }

    });

}
