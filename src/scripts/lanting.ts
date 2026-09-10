const root = document.querySelector<HTMLElement>('[data-lanting]');
const dialog = document.querySelector<HTMLDialogElement>('[data-paper-reader]');
if (root && dialog) {
  const entries = [...dialog.querySelectorAll<HTMLElement>('[data-reader-entry]')];
  const fragments = [...root.querySelectorAll<HTMLAnchorElement>('[data-fragment]')];
  const title = dialog.querySelector<HTMLElement>('[data-reader-title]')!;
  const select = dialog.querySelector<HTMLSelectElement>('[data-reader-select]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-reader-close]')!;
  const reveal = root.querySelector<HTMLButtonElement>('[data-reveal]')!;
  const foundCount = root.querySelector<HTMLElement>('[data-found-count]')!;
  const cue = dialog.querySelector<HTMLElement>('[data-reader-cue]')!;
  const status = dialog.querySelector<HTMLElement>('[data-reader-status]')!;
  const dock = root.querySelector<HTMLElement>('[data-discovery-dock]')!;
  const manuscriptScroll = root.querySelector<HTMLElement>('[data-manuscript-scroll]')!;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const found = new Set<string>();
  let launcher: HTMLElement | null = null;
  let active = 0;
  let animation: Animation | null = null;
  let scrollY = 0;
  let scrollLeft = 0;
  let closing = false;

  // Start with the opening text in view, while retaining the full scan on either side.
  manuscriptScroll.scrollLeft = -Math.max(
    0,
    (1 - Number(manuscriptScroll.dataset.writingStart)) * manuscriptScroll.scrollWidth - 24,
  );

  function discover(fragment: HTMLAnchorElement) {
    found.add(fragment.dataset.fragment!);
    fragment.dataset.found = 'true';
    foundCount.textContent = `${found.size} / ${fragments.length}`;
  }

  function showEntry(index: number) {
    active = (index + entries.length) % entries.length;
    entries.forEach((entry, i) => {
      entry.hidden = i !== active;
    });
    title.textContent = entries[active]!.dataset.title!;
    select.value = String(active);
    const fragment = fragments.find((item) => Number(item.dataset.entry) === active);
    cue.replaceChildren();
    if (fragment) {
      const template = fragment.querySelector<HTMLTemplateElement>('[data-fragment-cue]')!;
      cue.append(template.content.cloneNode(true));
      discover(fragment);
    }
    status.textContent = `${title.textContent}, ${active + 1} / ${entries.length}`;
    dialog!.scrollTop = 0;
  }

  function open(index: number, source: HTMLElement) {
    if (dialog!.open || closing) return;
    launcher = source;
    const sourceRect = source.getBoundingClientRect();
    scrollY = window.scrollY;
    scrollLeft = manuscriptScroll.scrollLeft;
    showEntry(index);
    dialog!.showModal();
    document.body.style.overflow = 'hidden';
    dock.style.visibility = 'hidden';
    closeButton.focus({ preventScroll: true });
    if (!reduceMotion.matches) {
      const target = dialog!.getBoundingClientRect();
      const dx = sourceRect.left + sourceRect.width / 2 - (target.left + target.width / 2);
      const dy = sourceRect.top + sourceRect.height / 2 - (target.top + target.height / 2);
      animation = dialog!.animate(
        [
          {
            transform: `translate(${dx}px,${dy}px) scale(${Math.min(sourceRect.width / target.width, 0.4)},${Math.min(sourceRect.height / target.height, 0.5)}) rotate(-2deg)`,
            opacity: 0.55,
            borderRadius: '12px',
          },
          { transform: 'translate(0,0) scale(1,1) rotate(0deg)', opacity: 1, borderRadius: '0' },
        ],
        { duration: 540, easing: 'cubic-bezier(.2,.75,.2,1)' },
      );
      dialog!
        .querySelector<HTMLElement>('.reader-sheet')!
        .animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 350,
          delay: 160,
          fill: 'backwards',
        });
    }
  }

  function finishClose() {
    dialog!.close();
    document.body.style.overflow = '';
    dock.style.visibility = '';
    closing = false;
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    manuscriptScroll.scrollLeft = scrollLeft;
    launcher?.focus({ preventScroll: true });
  }

  function close() {
    if (closing || !dialog!.open) return;
    closing = true;
    animation?.cancel();
    if (reduceMotion.matches || !launcher) {
      finishClose();
      return;
    }
    const from = dialog!.getBoundingClientRect();
    const to = launcher.getBoundingClientRect();
    animation = dialog!.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        {
          transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px,${to.top + to.height / 2 - from.top - from.height / 2}px) scale(${Math.min(to.width / from.width, 0.4)},${Math.min(to.height / from.height, 0.5)}) rotate(-2deg)`,
          opacity: 0,
        },
      ],
      { duration: 260, easing: 'cubic-bezier(.4,0,.8,.4)' },
    );
    animation.finished.then(finishClose).catch(finishClose);
  }

  root.querySelectorAll<HTMLAnchorElement>('[data-entry], [data-index-entry]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      open(Number(link.dataset.entry ?? link.dataset.indexEntry), link);
    });
  });
  fragments.forEach((fragment) => {
    fragment.addEventListener('focus', () => discover(fragment));
    fragment.addEventListener('pointerenter', () => discover(fragment));
  });
  root.addEventListener('pointermove', (event) => {
    if (!hover.matches || dialog!.open) return;
    const viewport = manuscriptScroll.getBoundingClientRect();
    let nearest: HTMLAnchorElement | undefined;
    let distance = 38;
    for (const fragment of fragments) {
      const box = fragment.getBoundingClientRect();
      if (box.right <= viewport.left || box.left >= viewport.right) continue;
      const dx = Math.max(box.left - event.clientX, 0, event.clientX - box.right);
      const dy = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom);
      const next = Math.hypot(dx, dy);
      if (next < distance) {
        nearest = fragment;
        distance = next;
      }
    }
    fragments.forEach((fragment) => fragment.classList.toggle('is-near', fragment === nearest));
    if (nearest) discover(nearest);
  });
  manuscriptScroll.addEventListener('scroll', () =>
    fragments.forEach((fragment) => fragment.classList.remove('is-near')),
  );
  root.addEventListener('pointerleave', () =>
    fragments.forEach((fragment) => fragment.classList.remove('is-near')),
  );
  reveal.hidden = false;
  reveal.addEventListener('click', () => {
    const next = reveal.getAttribute('aria-pressed') !== 'true';
    reveal.setAttribute('aria-pressed', String(next));
    root.dataset.revealed = String(next);
  });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      close();
  });
  dialog
    .querySelector('[data-reader-prev]')!
    .addEventListener('click', () => showEntry(active - 1));
  dialog
    .querySelector('[data-reader-next]')!
    .addEventListener('click', () => showEntry(active + 1));
  select.addEventListener('change', () => showEntry(Number(select.value)));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button, a[href], select')].filter(
        (item) => item.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (event.target instanceof HTMLSelectElement) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showEntry(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  window.addEventListener('pagehide', () => {
    animation?.cancel();
    if (dialog.open) finishClose();
  });
  root.dataset.ready = 'true';
}
