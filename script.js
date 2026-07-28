/*=========================================
 AMAZINGFITWEAR
 Premium Website JS
=========================================*/

// ================= MENU MOBILE =================

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

// ================= NAVBAR SCROLL =================

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.background = "#ffffff";
        header.style.boxShadow = "0 10px 30px rgba(0,0,0,.08)";
        header.style.padding = "0";

    } else {

        header.style.background = "transparent";
        header.style.boxShadow = "none";

    }

});

// ================= BACK TO TOP =================

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 600) {

        backToTop.style.display = "flex";

    } else {

        backToTop.style.display = "none";

    }

});

backToTop.addEventListener("click", () => {

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

// ================= CART =================

const cart = document.querySelector(".cart-sidebar");

const cartBtn = document.querySelector(".fa-bag-shopping");

const closeCart = document.querySelector(".cart-header i");

cartBtn.addEventListener("click",()=>{

    cart.classList.add("active");

});

closeCart.addEventListener("click",()=>{

    cart.classList.remove("active");

});

// ================= SCROLL ANIMATION =================

const reveals = document.querySelectorAll(
".category-card,.product-card,.benefit,.testimonial-card,.about,.new-collection,.instagram img"
);

function revealElements(){

    const trigger = window.innerHeight - 100;

    reveals.forEach(el=>{

        const top = el.getBoundingClientRect().top;

        if(top < trigger){

            el.classList.add("show");

        }

    });

}

window.addEventListener("scroll",revealElements);

revealElements();

// ================= FADE EFFECT =================

document.querySelectorAll(
".category-card,.product-card,.benefit,.testimonial-card,.about,.new-collection,.instagram img"
).forEach(el=>{

    el.style.opacity="0";
    el.style.transform="translateY(40px)";
    el.style.transition=".8s";

});

document.querySelectorAll(
".show"
).forEach(el=>{

    el.style.opacity="1";

});

// ================= HERO BUTTON =================

const shopBtn = document.querySelector(".btn-primary");

shopBtn.addEventListener("click",(e)=>{

    e.preventDefault();

    document.querySelector("#collections").scrollIntoView({

        behavior:"smooth"

    });

});

// ================= NEWSLETTER =================

const newsletter = document.querySelector(".newsletter form");

newsletter.addEventListener("submit",(e)=>{

    e.preventDefault();

    alert("¡Gracias por suscribirte a AmazingFitWear!");

});

// ================= CONTACT =================

const contact = document.querySelector(".contact-form");

contact.addEventListener("submit",(e)=>{

    e.preventDefault();

    alert("Tu mensaje fue enviado correctamente.");

});

// ================= PRELOADER =================

window.addEventListener("load",()=>{

    document.body.classList.add("loaded");

});

console.log("AmazingFitWear Website Ready 🚀");