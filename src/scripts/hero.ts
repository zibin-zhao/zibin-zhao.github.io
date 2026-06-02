const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCore = document.getElementById('heroCore');
const topnav = document.getElementById('topnav');
const hint = document.getElementById('hint');

function onScroll() {
  if (!heroCore || !topnav) return;
  const vh = window.innerHeight;
  const p = Math.min(Math.max(window.scrollY / vh, 0), 1);
  if (!reduce) {
    heroCore.style.transform = `translateY(${-80 * p}px) scale(${1 - 0.6 * p})`;
    heroCore.style.opacity = String(Math.max(1 - 1.25 * p, 0));
    if (hint) hint.style.opacity = String(Math.max(1 - 2 * p, 0));
  }
  topnav.classList.toggle('show', p > 0.55);
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }
}, { passive: true });
onScroll();

const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
  { threshold: 0.18 }
);
document.querySelectorAll('.reveal').forEach((s) => io.observe(s));
