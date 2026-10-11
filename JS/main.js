// ==========================================================================
// UNIVERSAL MOBILE NAVBAR & NAVIGATION CONTROLLER
// ==========================================================================

function toggleMobileMenu() {
  const navMenu = document.getElementById('nav-menu');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  
  if (navMenu) {
    navMenu.classList.toggle('open');
  }
  if (toggleBtn) {
    toggleBtn.classList.toggle('active');
  }
}

// Attach event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const navMenu = document.getElementById('nav-menu');
  const toggleBtn = document.getElementById('mobile-menu-toggle');

  // Rule 1: Auto-close menu when selecting any navigation link
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        if (toggleBtn) toggleBtn.classList.remove('active');
      }
    });
  });

  // Rule 2: Close menu if tapping anywhere outside the header
  document.addEventListener('click', (event) => {
    const isClickInsideHeader = event.target.closest('.navbar');
    if (!isClickInsideHeader && navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      if (toggleBtn) toggleBtn.classList.remove('active');
    }
  });
});

// ==========================================================================
// GLOBAL NAVBAR & SECRET CONCERT (BASEMENT) MODE CONTROLLER
// ==========================================================================

// 1. Mobile Hamburger Menu Toggle
function toggleMobileMenu() {
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) {
    navMenu.classList.toggle('open');
  }
}

// 2. Secret Concert Mode (Basement / After Hours Toggle)
function toggleSecretConcertMode() {
  const isBasement = document.body.classList.contains('basement-mode');
  const newMode = isBasement ? 'twilight' : 'basement';
  
  // Save preference across page navigations
  localStorage.setItem('neko_active_mode', newMode);
  applyThemeMode(newMode);
}

function applyThemeMode(mode) {
  const body = document.body;
  const toggleBtn = document.getElementById('mode-toggle-btn');

  if (mode === 'basement') {
    body.classList.remove('twilight-mode');
    body.classList.add('basement-mode');
    if (toggleBtn) toggleBtn.innerText = '🌸 Twilight Mode';
  } else {
    body.classList.remove('basement-mode');
    body.classList.add('twilight-mode');
    if (toggleBtn) toggleBtn.innerText = '⚡ Secret Concert Mode';
  }
}

// Initialize saved theme mode on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('neko_active_mode') || 'twilight';
  applyThemeMode(savedMode);

  // Auto-close mobile hamburger drawer when tapping outside
  document.addEventListener('click', (event) => {
    const navMenu = document.getElementById('nav-menu');
    const isInsideNavbar = event.target.closest('.navbar');
    if (!isInsideNavbar && navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
    }
  });
});

