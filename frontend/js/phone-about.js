/*=========================================
STICKY HEADER
=========================================*/

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 60) {

        header.style.background = "rgba(5,8,22,.95)";
        header.style.backdropFilter = "blur(20px)";

    } else {

        header.style.background = "transparent";
        header.style.backdropFilter = "none";

    }

});

/*=========================================
SCROLL REVEAL
=========================================*/

const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(

(entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("active");

            revealObserver.unobserve(entry.target);

        }

    });

},

{
    threshold:0.15
}

);

reveals.forEach(item => {

    revealObserver.observe(item);

});

/*=========================================
ANIMATED COUNTERS
=========================================*/

const counters = document.querySelectorAll(".counter");

const counterObserver = new IntersectionObserver(

(entries) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const counter = entry.target;

        const target = +counter.dataset.target;

        const duration = 1800;

        const step = target / (duration / 16);

        let current = 0;

        const update = () => {

            current += step;

            if (current < target) {

                counter.textContent = Math.floor(current).toLocaleString();

                requestAnimationFrame(update);

            } else {

                counter.textContent = target.toLocaleString() + "+";

            }

        };

        update();

        counterObserver.unobserve(counter);

    });

},

{
    threshold:0.5
}

);

counters.forEach(counter => {

    counterObserver.observe(counter);

});

/*=========================================
NEWSLETTER
=========================================*/

const newsletterForm = document.querySelector(".newsletter-form");

if (newsletterForm) {

    newsletterForm.addEventListener("submit", function(e){

        e.preventDefault();

        const email = this.querySelector("input").value.trim();

        if(email === ""){

            alert("Please enter your email address.");

            return;

        }

        alert("Thank you for subscribing!");

        this.reset();

    });

}

/*=========================================
SMOOTH SCROLL
=========================================*/

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function(e){

        const target = document.querySelector(this.getAttribute("href"));

        if(target){

            e.preventDefault();

            target.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

});

/*=========================================
PARALLAX HERO
=========================================*/

const hero = document.querySelector(".about-hero");

window.addEventListener("scroll", () => {

    if(hero){

        hero.style.backgroundPositionY = `${window.scrollY * 0.4}px`;

    }

});

/*=========================================
ACTIVE BOTTOM NAVIGATION
=========================================*/

const navLinks = document.querySelectorAll(".bottom-nav a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(item => item.classList.remove("active"));

        link.classList.add("active");

    });

});

/*=========================================
SIMPLE MOBILE MENU
=========================================*/

const menuToggle = document.querySelector(".menu-toggle");
const navRight = document.querySelector(".nav-right");

if(menuToggle){

    menuToggle.addEventListener("click", () => {

        navRight.classList.toggle("open");

    });

}

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
// BOTTOM NAV MENU DROPDOWN
// ============================

const menuBtn = document.getElementById("menuBtn");
const menuOptions = document.getElementById("menuOptions");

if (menuBtn && menuOptions) {
    menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menuOptions.classList.toggle("show");
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
        if (!menuOptions.contains(e.target) && e.target !== menuBtn) {
            menuOptions.classList.remove("show");
        }
    });
}