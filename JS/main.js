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
