const constellation = document.querySelector<HTMLElement>('[data-sticker-constellation]');

if (constellation) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    constellation.classList.add('is-revealed', 'is-static');
    constellation.style.setProperty('--sticker-scroll', '0px');
  } else {
    if (typeof window.IntersectionObserver === 'function') {
      const revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          constellation.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      }, { threshold: .16 });
      revealObserver.observe(constellation);
    } else {
      constellation.classList.add('is-revealed');
    }

    let queuedFrame: number | undefined;
    const updateParallax = () => {
      queuedFrame = undefined;
      const bounds = constellation.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionCenter = bounds.top + (bounds.height / 2);
      const travel = Math.max(window.innerHeight + bounds.height, 1);
      const progress = (viewportCenter - sectionCenter) / travel;
      const offset = Math.max(-12, Math.min(12, progress * 24));
      constellation.style.setProperty('--sticker-scroll', `${offset.toFixed(2)}px`);
    };
    const queueParallax = () => {
      if (queuedFrame !== undefined) return;
      queuedFrame = window.requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', queueParallax, { passive: true });
    queueParallax();
  }
}
