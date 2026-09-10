const root = document.querySelector<HTMLElement>('[data-lanting]');
const dialog = document.querySelector<HTMLDialogElement>('[data-paper-reader]');

if (root && dialog) {
  const entries = [...dialog.querySelectorAll<HTMLElement>('[data-reader-entry]')];
  const fragments = [...root.querySelectorAll<HTMLAnchorElement>('[data-fragment]')];
  const title = dialog.querySelector<HTMLElement>('[data-reader-title]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-reader-close]')!;
  const previous = dialog.querySelector<HTMLButtonElement>('[data-reader-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-reader-next]')!;
  const contents = dialog.querySelector<HTMLButtonElement>('[data-reader-index]')!;
  const navigation = dialog.querySelector<HTMLElement>('.reader-navigation')!;
  const cue = dialog.querySelector<HTMLElement>('[data-reader-cue]')!;
  const status = dialog.querySelector<HTMLElement>('[data-reader-status]')!;
  const manuscriptScroll = root.querySelector<HTMLElement>('[data-manuscript-scroll]')!;
  const indexEntry = entries.findIndex((entry) => entry.dataset.entryId === 'index');
  const pastEntry = entries.findIndex((entry) => entry.dataset.entryId === 'past');
  const reveal = root.querySelector<HTMLButtonElement>('[data-reveal]')!;
  const pastLink = root.querySelector<HTMLAnchorElement>('[data-past-entry]')!;
  const revealStatus = root.querySelector<HTMLElement>('[data-reveal-status]')!;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let launcher: HTMLElement | null = null;
  let active = 0;
  let animation: Animation | null = null;
  let scrollLeft = 0;
  let closing = false;
  let awaitingHistory = false;

  // Retain the opening column and the outer seals of the original scan.
  manuscriptScroll.scrollLeft = -Math.max(
    0,
    (1 - Number(manuscriptScroll.dataset.writingStart)) * manuscriptScroll.scrollWidth - 24,
  );

  function clearProximity() {
    fragments.forEach((fragment) => fragment.classList.remove('is-near'));
  }

  function setRevealed(revealed: boolean) {
    root!.dataset.revealed = String(revealed);
    reveal.setAttribute('aria-pressed', String(revealed));
    pastLink.hidden = !revealed;
    clearProximity();
    revealStatus.textContent =
      root!.dataset.lang === 'zh'
        ? revealed
          ? '隐藏入口已高亮，往昔入口已显示。'
          : '高亮已关闭。'
        : revealed
          ? 'Hidden entries highlighted. Past versions are now available.'
          : 'Highlights hidden.';
  }

  function showEntry(index: number) {
    active = index;
    entries.forEach((entry, i) => {
      entry.hidden = i !== active;
    });
    title.textContent = entries[active]!.dataset.title!;
    navigation.hidden = active >= indexEntry;
    const fragment = fragments.find((item) => Number(item.dataset.entry) === active);
    cue.replaceChildren();
    if (fragment) {
      const template = fragment.querySelector<HTMLTemplateElement>('[data-fragment-cue]')!;
      cue.append(template.content.cloneNode(true));
    }
    status.textContent = title.textContent;
    dialog!.scrollTop = 0;
  }

  function readerURL(index: number) {
    const url = new URL(location.href);
    url.hash = `read-${entries[index]!.dataset.entryId}`;
    return url;
  }

  function open(index: number, source: HTMLElement) {
    if (closing) {
      animation?.cancel();
      closing = false;
    }
    if (dialog!.open) {
      showEntry(index);
      return;
    }
    launcher = source;
    scrollLeft = manuscriptScroll.scrollLeft;
    const sourceRect = source.getBoundingClientRect();
    showEntry(index);
    clearProximity();
    dialog!.showModal();
    document.body.style.overflow = 'hidden';
    closeButton.focus({ preventScroll: true });
    if (!reduceMotion.matches) {
      const target = dialog!.getBoundingClientRect();
      const dx = sourceRect.left + sourceRect.width / 2 - (target.left + target.width / 2);
      const dy = sourceRect.top + sourceRect.height / 2 - (target.top + target.height / 2);
      animation = dialog!.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        ],
        { duration: 380, easing: 'cubic-bezier(.2,.75,.2,1)' },
      );
    }
  }

  function finishClose() {
    dialog!.close();
    document.body.style.overflow = '';
    closing = false;
    manuscriptScroll.scrollLeft = scrollLeft;
    launcher?.focus({ preventScroll: true });
  }

  function closeView() {
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
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) scale(.12)`,
          opacity: 0,
        },
      ],
      { duration: 240, easing: 'cubic-bezier(.4,0,.8,.4)' },
    );
    animation.finished.then(finishClose).catch(() => undefined);
  }

  function visit(index: number, source: HTMLElement) {
    if (index < 0 || index >= entries.length || closing || awaitingHistory) return;
    const wasOpen = dialog!.open;
    if (wasOpen) {
      history.replaceState(history.state, '', readerURL(index));
    } else {
      history.pushState(
        {
          ...history.state,
          manuscriptReader: true,
          manuscriptLauncher: source.dataset.fragment ?? source.dataset.readerLauncher,
          manuscriptScroll: manuscriptScroll.scrollLeft,
        },
        '',
        readerURL(index),
      );
    }
    open(index, source);
    // Index links disappear when a leaf opens; move focus into the new content.
    if (wasOpen && !document.activeElement?.getClientRects().length)
      title.focus({ preventScroll: true });
  }

  function requestClose() {
    if (closing || awaitingHistory || !dialog!.open) return;
    if (history.state?.manuscriptReader) {
      awaitingHistory = true;
      history.back();
    } else {
      // A directly shared reading URL does not have a homepage history entry.
      const url = new URL(location.href);
      url.hash = '';
      history.replaceState(history.state, '', url);
      closeView();
    }
  }

  function syncHistory() {
    awaitingHistory = false;
    const index =
      location.hash === '#collection'
        ? indexEntry
        : entries.findIndex((entry) => location.hash === `#read-${entry.dataset.entryId}`);
    if (index < 0) {
      closeView();
      return;
    }
    const source =
      index === pastEntry || history.state?.manuscriptLauncher === 'past'
        ? pastLink
        : (fragments.find((item) => item.dataset.fragment === history.state?.manuscriptLauncher) ??
          fragments.find((item) => Number(item.dataset.entry) === index) ??
          fragments[0]!);
    if (source === pastLink) setRevealed(true);
    if (!dialog!.open) {
      if (typeof history.state?.manuscriptScroll === 'number')
        manuscriptScroll.scrollLeft = history.state.manuscriptScroll;
      else source.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
    open(index, source);
  }

  root.querySelectorAll<HTMLAnchorElement>('[data-entry], [data-index-entry]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      visit(Number(link.dataset.entry ?? link.dataset.indexEntry), link);
    });
  });

  reveal.hidden = false;
  reveal.addEventListener('click', () =>
    setRevealed(reveal.getAttribute('aria-pressed') !== 'true'),
  );

  root.addEventListener('pointermove', (event) => {
    if (!hover.matches || dialog!.open || root!.dataset.revealed === 'true') return;
    const viewport = manuscriptScroll.getBoundingClientRect();
    let nearest: HTMLAnchorElement | undefined;
    let distance = 34;
    for (const fragment of fragments) {
      const box = fragment.getBoundingClientRect();
      if (box.right <= viewport.left || box.left >= viewport.right) continue;
      const dx = Math.max(box.left - event.clientX, 0, event.clientX - box.right);
      const dy = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom);
      const nextDistance = Math.hypot(dx, dy);
      if (nextDistance < distance) {
        nearest = fragment;
        distance = nextDistance;
      }
    }
    fragments.forEach((fragment) => fragment.classList.toggle('is-near', fragment === nearest));
  });
  manuscriptScroll.addEventListener('scroll', clearProximity);
  root.addEventListener('pointerleave', clearProximity);
  // A normal mouse wheel unrolls the manuscript. Trackpad horizontal movement stays native.
  manuscriptScroll.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? manuscriptScroll.clientWidth : 1;
      event.preventDefault();
      manuscriptScroll.scrollLeft -= event.deltaY * unit;
    },
    { passive: false },
  );

  closeButton.addEventListener('click', requestClose);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    requestClose();
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
      requestClose();
  });

  function turnPage(direction: number) {
    if (active >= indexEntry) return;
    visit((active + direction + indexEntry) % indexEntry, launcher ?? fragments[0]!);
  }
  previous.addEventListener('click', () => turnPage(-1));
  next.addEventListener('click', () => turnPage(1));
  contents.addEventListener('click', () => visit(indexEntry, launcher ?? fragments[0]!));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>('button, a[href], summary'),
      ].filter((item) => item.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === title)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (active < indexEntry && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      turnPage(event.key === 'ArrowRight' ? 1 : -1);
    }
  });

  window.addEventListener('popstate', syncHistory);
  window.addEventListener('hashchange', syncHistory);
  window.addEventListener('pagehide', () => {
    animation?.cancel();
    if (dialog.open) finishClose();
  });
  window.addEventListener('pageshow', syncHistory);
  root.dataset.ready = 'true';
  syncHistory();
}
