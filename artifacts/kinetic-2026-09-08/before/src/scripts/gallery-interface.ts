// The reading layer stays complete without animation, JavaScript, or WebGL.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = document.querySelectorAll<HTMLElement>(
  '[data-reveal], .page-intro, .project-card, .publication, .cv-section, .about-prose',
);
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.animate([{ transform: 'translateY(28px)' }, { transform: 'translateY(0)' }], {
          duration: 750,
          easing: 'cubic-bezier(.16,1,.3,1)',
        });
        revealObserver.unobserve(element);
      });
    },
    { threshold: 0.08 },
  );
  revealTargets.forEach((element) => revealObserver.observe(element));
  window.addEventListener('pagehide', () => revealObserver.disconnect(), { once: true });
}

const links = document.querySelectorAll<HTMLElement>('.project-card');
if (!reduceMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  links.forEach((link) => {
    link.addEventListener('pointermove', (event) => {
      const rect = link.getBoundingClientRect();
      link.style.setProperty(
        '--pointer-x',
        `${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`,
      );
      link.style.setProperty(
        '--pointer-y',
        `${((event.clientY - rect.top) / rect.height - 0.5) * -2}deg`,
      );
    });
    link.addEventListener('pointerleave', () => {
      link.style.setProperty('--pointer-x', '0deg');
      link.style.setProperty('--pointer-y', '0deg');
    });
  });
}
