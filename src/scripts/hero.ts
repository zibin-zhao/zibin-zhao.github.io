import { isMenuOpen, setMenuOpen, shouldDismissMenu } from './menu';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const topnav = document.getElementById('topnav');
const menu = document.getElementById('menubtn');
const links = document.getElementById('navlinks');

const updateNav = () => topnav?.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

const closeMenu = ({ returnFocus = false } = {}) => setMenuOpen(menu, links, false, { returnFocus });

menu?.addEventListener('click', () => setMenuOpen(menu, links, !isMenuOpen(links)));

links?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Node)) return;
  const insideButton = menu?.contains(event.target) ?? false;
  const insidePanel = links?.contains(event.target) ?? false;

  if (shouldDismissMenu(isMenuOpen(links), insideButton, insidePanel)) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isMenuOpen(links)) closeMenu({ returnFocus: true });
});

if (!reduce && 'IntersectionObserver' in window) {
  try {
    const nodes = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }), { threshold: .12 });

    nodes.forEach((node) => observer.observe(node));
    document.documentElement.classList.add('motion-ready');
  } catch {
    document.documentElement.classList.remove('motion-ready');
  }
}
