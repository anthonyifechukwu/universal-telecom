/*=========================================
STICKY HEADER
=========================================*/

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (header) {

        if (window.scrollY > 60) {

            header.style.background = "rgba(5,8,22,.95)";
            header.style.backdropFilter = "blur(20px)";
            header.style.transition = ".3s";

        } else {

            header.style.background = "transparent";
            header.style.backdropFilter = "none";

        }

    }

});

/*=========================================
SCROLL REVEAL
=========================================*/

const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("active");
            revealObserver.unobserve(entry.target);

        }

    });

}, {

    threshold:0.15

});

reveals.forEach(item => {

    revealObserver.observe(item);

});

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
CONTACT FORM
=========================================*/

const contactForm = document.querySelector(".contact-form");

if(contactForm){

    contactForm.addEventListener("submit", function(e){

        e.preventDefault();

        const requiredFields = this.querySelectorAll(
            "input[required], select[required], textarea[required]"
        );

        let valid = true;

        requiredFields.forEach(field => {

            if(field.value.trim() === ""){

                field.style.border = "1px solid red";
                valid = false;

            }else{

                field.style.border = "1px solid rgba(255,255,255,.15)";

            }

        });

        if(!valid){

            alert("Please complete all required fields.");

            return;

        }

        alert("Your enquiry has been sent successfully!");

        this.reset();

    });

}

/*=========================================
NEWSLETTER
=========================================*/

const newsletterForm = document.querySelector(".newsletter-form");

if(newsletterForm){

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
BUSINESS HOURS
=========================================*/

const status = document.querySelector(".status");

if(status){

    const hour = new Date().getHours();

    if(hour >= 8 && hour < 18){

        status.classList.add("open");
        status.innerHTML = `
            <span class="dot"></span>
            Currently Open
        `;

    }else{

        status.classList.remove("open");

        status.style.background = "rgba(239,68,68,.15)";
        status.style.color = "#ef4444";

        status.innerHTML = `
            <span class="dot"
                  style="background:#ef4444;"></span>
            Currently Closed
        `;

    }

}

/*=========================================
WHATSAPP BUTTON
=========================================*/

const whatsapp = document.querySelector(".floating-whatsapp");

if(whatsapp){

    whatsapp.addEventListener("mouseenter", () => {

        whatsapp.style.transform = "scale(1.1)";

    });

    whatsapp.addEventListener("mouseleave", () => {

        whatsapp.style.transform = "scale(1)";

    });

}

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
MOBILE MENU
=========================================*/

const menuToggle = document.querySelector(".menu-toggle");
const navRight = document.querySelector(".nav-right");

if(menuToggle && navRight){

    menuToggle.addEventListener("click", () => {

        navRight.classList.toggle("open");

    });

}

/*=========================================
PARALLAX HERO
=========================================*/

const hero = document.querySelector(".contact-hero");

window.addEventListener("scroll", () => {

    if(hero){

        hero.style.backgroundPositionY = `${window.scrollY * 0.4}px`;

    }

});

/*=========================================
BACK TO TOP BUTTON
(Add a button with class="back-to-top"
if you decide to use this feature.)
=========================================*/

const backToTop = document.querySelector(".back-to-top");

window.addEventListener("scroll", () => {

    if(backToTop){

        if(window.scrollY > 500){

            backToTop.classList.add("show");

        }else{

            backToTop.classList.remove("show");

        }

    }

});

if(backToTop){

    backToTop.addEventListener("click", () => {

        window.scrollTo({

            top:0,
            behavior:"smooth"

        });

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
