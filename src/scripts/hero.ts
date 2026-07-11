import { mountFieldMotion } from './field-motion';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCore = document.getElementById('heroCore');
const fieldRoot = document.querySelector<HTMLElement>('[data-field-motion]');
const topnav = document.getElementById('topnav');

function onScroll() {
  if (!heroCore || !topnav) return;
  const progress = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
  if (!reduce) {
    heroCore.style.transform = `translateY(${-46 * progress}px) rotate(${-3 + progress * 3}deg)`;
    heroCore.style.opacity = String(Math.max(1 - 1.25 * progress, 0));
  }
  topnav.classList.toggle('show', progress > 0.55);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')),
  { threshold: 0.18 },
);
document.querySelectorAll('.reveal').forEach((section) => observer.observe(section));

if (fieldRoot) mountFieldMotion(fieldRoot);
