const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const topnav = document.getElementById('topnav');
const menu = document.getElementById('menubtn');
const links = document.getElementById('navlinks');

const updateNav = () => topnav?.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

menu?.addEventListener('click', () => {
  const open = links?.classList.toggle('open') ?? false;
  menu.setAttribute('aria-expanded', String(open));
});

if (!reduce && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
} else {
  document.querySelectorAll('.reveal').forEach((node) => node.classList.add('in'));
}
