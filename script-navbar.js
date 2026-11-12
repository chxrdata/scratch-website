const body = document.body

// set up
const navBarLogoContainer = document.createElement('a');
navBarLogoContainer.href = 'index.html';
navBarLogoContainer.id = 'nav-bar-logo-container'
const navrBarLogo = document.createElement('img');
navrBarLogo.id = 'nav-bar-logo';
navrBarLogo.src = 'assets/logo.webp';
navBarLogoContainer.alt = 'Del Cro Logo';
navBarLogoContainer.appendChild(navrBarLogo);

const navLinks = document.createElement('div');
navLinks.classList.add('nav-links');

const workLink = document.createElement('a');
workLink.innerText = 'Work';
workLink.href = 'index.html';
const aboutLink = document.createElement('a');
aboutLink.innerText = 'About';
aboutLink.href = 'about.html';
const resourcesLink = document.createElement('a');
resourcesLink.innerText = 'Resources'
resourcesLink.href = 'resources.html';

navLinks.append(workLink, aboutLink, resourcesLink);

// mobile menu
const navBtnMobile = document.createElement('div');
navBtnMobile.id = 'nav-btn-mobile'

const line = document.createElement('div');
navBtnMobile.append(line.cloneNode(true), line.cloneNode(true), line.cloneNode(true));
body.prepend(navBtnMobile);

const navPopupMobile = document.createElement('div');
navPopupMobile.id = 'nav-popup'
navPopupMobile.appendChild(navLinks.cloneNode(true));

navBtnMobile.addEventListener('click', () => {

    if (navBtnMobile.classList.contains('active')) {
        navBtnMobile.classList.remove('active');
        body.style.overflow = 'visible'
        navPopupMobile.style.opacity = '0';
        setTimeout(() => {
            navPopupMobile.style.display = 'none';
        }, 400)
    } else {
        navBtnMobile.classList.add('active');
        body.style.overflow = 'hidden';
        navPopupMobile.style.display = 'flex';
        setTimeout(() => {
            navPopupMobile.style.opacity = '1';
        }, 1)
    }
});

// add nav bar
const navBar = document.createElement('div');
navBar.id = 'nav-bar';
navBar.append(navBarLogoContainer, navLinks, navBtnMobile);

body.prepend(navBar);
body.prepend(navPopupMobile);