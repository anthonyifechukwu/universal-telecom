/*=================================
PAGE LOADER
=================================*/

const loader = document.querySelector(".loader");

// BUG FIX: previously waited for window's "load" event (every resource
// including external images finished) — on a slow connection this
// could leave the loader covering the page indefinitely.

function hideLoader() {

    if(loader){

        setTimeout(()=>{

            loader.style.opacity="0";
            loader.style.visibility="hidden";

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
PROFILE IMAGE UPLOAD PREVIEW
=================================*/

const imageUpload =
document.querySelector("#imageUpload");

const profileImage =
document.querySelector("#profileImage");


if(imageUpload && profileImage){


    imageUpload.addEventListener(
    "change",
    ()=>{


        const file =
        imageUpload.files[0];


        if(file){

            const reader =
            new FileReader();


            reader.onload = (e)=>{

                profileImage.src =
                e.target.result;

            };


            reader.readAsDataURL(file);

        }


    });


}



/*=================================
SAVE PROFILE INFORMATION
=================================*/

const profileForm =
document.querySelector(".profile-form");


if(profileForm){


    profileForm.addEventListener(
    "submit",
    (e)=>{


        e.preventDefault();


        const button =
        profileForm.querySelector(
        ".save-btn"
        );


        button.innerHTML =
        `
        <i class="fa-solid fa-check"></i>
        Saved Successfully
        `;


        setTimeout(()=>{


            button.innerHTML =
            `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Changes
            `;


        },2000);



    });


}



/*=================================
PREFERENCE SWITCHES
=================================*/

document
.querySelectorAll(".switch input")
.forEach(toggle=>{


    toggle.addEventListener(
    "change",
    ()=>{


        if(toggle.checked){

            console.log(
            "Preference enabled"
            );


        }else{

            console.log(
            "Preference disabled"
            );

        }


    });


});



/*=================================
CONNECTED ACCOUNT DISCONNECT
=================================*/

document
.querySelectorAll(".disconnect-btn")
.forEach(button=>{


    button.addEventListener(
    "click",
    ()=>{


        const account =
        button.closest(
        ".connected-card"
        );


        const confirmRemove =
        confirm(
        "Disconnect this account?"
        );


        if(confirmRemove){


            account.style.opacity="0";

            account.style.transform=
            "scale(.8)";


            setTimeout(()=>{

                account.remove();

            },400);


        }


    });


});



/*=================================
PROFILE DATA VALIDATION
=================================*/

const emailInput =
document.querySelector(
'input[type="email"]'
);


if(emailInput){


    emailInput.addEventListener(
    "blur",
    ()=>{


        if(
        !emailInput.value.includes("@")
        ){

            emailInput.style.borderColor=
            "#ef4444";


        }else{

            emailInput.style.borderColor=
            "#22c55e";

        }


    });


}



/*=================================
WHATSAPP ANIMATION
=================================*/

const whatsapp =
document.querySelector(
".floating-whatsapp"
);


if(whatsapp){


    setInterval(()=>{


        whatsapp.style.transform=
        "scale(1.1)";


        setTimeout(()=>{


            whatsapp.style.transform=
            "scale(1)";


        },500);


    },3000);


}



/*=================================
SMOOTH SCROLL
=================================*/

document
.querySelectorAll('a[href^="#"]')
.forEach(link=>{


    link.addEventListener(
    "click",
    (e)=>{


        const target =
        document.querySelector(
        link.getAttribute("href")
        );


        if(target){

            e.preventDefault();


            target.scrollIntoView({

                behavior:"smooth"

            });


        }


    });


});



/*=================================
INITIALIZE
=================================*/

window.addEventListener(
"DOMContentLoaded",
()=>{


    console.log(
    "PhoneHub Profile Settings Ready"
    );


});


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

