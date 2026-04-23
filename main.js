// NAV SCROLL
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  if (window.scrollY > 10) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// MOBILE MENU
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// SCROLL ANIMATIONS
function initAnimations() {
  const elements = document.querySelectorAll('.anim');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  elements.forEach((el) => {
    if (!el.classList.contains('visible')) {
      observer.observe(el);
    }
  });
}

// INIT
initAnimations();