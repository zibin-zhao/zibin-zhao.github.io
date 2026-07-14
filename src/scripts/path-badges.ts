type BadgeCenter = {
  element: HTMLElement;
  center: number;
};

let stopController: (() => void) | undefined;

const stopPathBadges = () => {
  stopController?.();
  stopController = undefined;
};

const startPathBadges = () => {
  stopPathBadges();

  const layer = document.querySelector<HTMLElement>('[data-path-badges]');
  if (!layer) return;

  const badges: BadgeCenter[] = [...layer.querySelectorAll<HTMLElement>('[data-path-badge]')]
    .map((element) => ({ element, center: Number(element.dataset.center) }))
    .filter((badge) => Number.isFinite(badge.center));
  if (badges.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  layer.dataset.motionState = reducedMotion.matches ? 'reduced' : 'running';
  let scheduledFrame: number | undefined;

  const updateBadges = () => {
    scheduledFrame = undefined;
    const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.max(0, Math.min(1, window.scrollY / scrollRange));
    const visibleCount = window.innerWidth <= 700 ? 1 : 2;
    const visible = new Set(
      [...badges]
        .sort((a, b) => Math.abs(a.center - progress) - Math.abs(b.center - progress))
        .slice(0, visibleCount)
        .map((badge) => badge.element),
    );

    for (const badge of badges.map(({ element }) => element)) {
      badge.dataset.visible = visible.has(badge) ? 'true' : 'false';
    }
  };

  const scheduleUpdate = () => {
    if (scheduledFrame !== undefined) return;
    scheduledFrame = window.requestAnimationFrame(updateBadges);
  };
  const handleMotionChange = () => startPathBadges();

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  reducedMotion.addEventListener('change', handleMotionChange);

  stopController = () => {
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    reducedMotion.removeEventListener('change', handleMotionChange);
    if (scheduledFrame !== undefined) window.cancelAnimationFrame(scheduledFrame);
  };

  scheduleUpdate();
};

const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) startPathBadges();
};

document.addEventListener('astro:before-swap', stopPathBadges);
document.addEventListener('astro:page-load', startPathBadges);
window.addEventListener('pagehide', stopPathBadges);
window.addEventListener('pageshow', handlePageShow);

startPathBadges();
