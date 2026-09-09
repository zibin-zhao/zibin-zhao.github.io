const root = document.querySelector<HTMLElement>('.grail-home');
if (root) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = root.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
  const field = root.querySelector<HTMLElement>('.card-field')!;
  const hero = root.querySelector<HTMLElement>('.grail-hero')!;
  const dialog = root.querySelector<HTMLDialogElement>('[data-work-dialog]')!;
  const details = [...root.querySelectorAll<HTMLElement>('[data-work-detail]')];
  const close = dialog.querySelector<HTMLButtonElement>('[data-work-close]')!;
  let paused = reduced.matches;
  let opener: HTMLElement | null = null;
  let selected = 0;
  let frame = 0;
  let pointer = 0;
  let heroVisible = true;

  function setPaused(value: boolean) {
    paused = value;
    root!.dataset.paused = String(value);
    toggle.setAttribute('aria-pressed', String(value));
    toggle.textContent = value ? toggle.dataset.play! : toggle.dataset.pause!;
    if (value) {
      field.style.setProperty('--pointer-x', '0px');
      field.style.setProperty('--scroll-drift', '0px');
    }
  }
  toggle.hidden = false;
  setPaused(paused);
  toggle.addEventListener('click', () => setPaused(!paused));
  reduced.addEventListener('change', () => setPaused(reduced.matches));

  // One scheduled paint per input batch, with no continuous idle render loop.
  function schedule() {
    if (frame || paused || !heroVisible || document.hidden) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (paused) return;
      field.style.setProperty('--pointer-x', `${pointer}px`);
      const progress = Math.min(
        1,
        Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight),
      );
      field.style.setProperty('--scroll-drift', `${progress * 85}px`);
    });
  }
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer = (event.clientX / window.innerWidth - 0.5) * 16;
    schedule();
  });
  hero.addEventListener('pointerleave', () => {
    pointer = 0;
    schedule();
  });
  window.addEventListener('scroll', schedule, { passive: true });
  const observer = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
  });
  observer.observe(hero);

  function showDetail(index: number) {
    selected = (index + details.length) % details.length;
    details.forEach((detail, i) => {
      detail.hidden = i !== selected;
    });
    const title = details[selected].querySelector('h2')!;
    title.id = 'active-work-title';
    details.forEach((detail, i) => {
      if (i !== selected) detail.querySelector('h2')!.removeAttribute('id');
    });
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.querySelector('[data-work-count]')!.textContent = `${selected + 1} / ${details.length}`;
    dialog.scrollTop = 0;
  }
  root.addEventListener('click', (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('[data-work-open]')
        : null;
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = details.findIndex(
      (detail) => detail.dataset.workDetail === link.dataset.workOpen,
    );
    if (index < 0) return;
    event.preventDefault();
    opener = link;
    showDetail(index);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    close.focus({ preventScroll: true });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    opener?.focus({ preventScroll: true });
  });
  dialog
    .querySelector('[data-work-prev]')!
    .addEventListener('click', () => showDetail(selected - 1));
  dialog
    .querySelector('[data-work-next]')!
    .addEventListener('click', () => showDetail(selected + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button, a[href]')].filter(
        (element) => element.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showDetail(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  const choices = [...root.querySelectorAll<HTMLButtonElement>('[data-feature-select]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-feature-panel]')];
  choices.forEach((button) =>
    button.addEventListener('click', () => {
      choices.forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.featurePanel !== button.dataset.featureSelect;
      });
    }),
  );
  window.addEventListener('pagehide', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (dialog.open) dialog.close();
    document.documentElement.style.overflow = '';
  });
  window.addEventListener('pageshow', () => {
    if (dialog.open) dialog.close();
    schedule();
  });
}
