const TRAIL_LIMIT = 34;
const CLICK_LIMIT = 12;
const TRAIL_DISTANCE = 24;
const TRAIL_LIFETIME = 820;
const CLICK_LIFETIME = 1260;
const MARK_CLASSES = ['', 'blue', 'orange', 'star'];
const CLICK_SYMBOLS = ['+', '×', '·'];

export function canUseFieldMotion(preferReducedMotion: boolean, finePointer: boolean) {
  return !preferReducedMotion && finePointer;
}

export function takeNewest<T>(items: T[], limit: number) {
  return items.length <= limit ? items : items.slice(-limit);
}

function removeAfter(node: HTMLElement, nodes: HTMLElement[], lifetime: number) {
  window.setTimeout(() => {
    node.remove();
    const index = nodes.indexOf(node);
    if (index !== -1) nodes.splice(index, 1);
  }, lifetime);
}

function addBounded(nodes: HTMLElement[], node: HTMLElement, limit: number) {
  nodes.push(node);
  while (nodes.length > limit) nodes.shift()?.remove();
}

function createMark(type: 'trail' | 'click', index: number, x: number, y: number) {
  const mark = document.createElement('span');
  const colour = MARK_CLASSES[index % MARK_CLASSES.length];
  mark.className = `field-${type} ${colour}`.trim();
  mark.style.left = `${x}px`;
  mark.style.top = `${y}px`;

  if (type === 'trail' && colour === 'star') mark.textContent = '✦';
  if (type === 'click') mark.textContent = CLICK_SYMBOLS[index % CLICK_SYMBOLS.length];
  return mark;
}

export function mountFieldMotion(root: HTMLElement) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!canUseFieldMotion(prefersReducedMotion, finePointer)) return () => undefined;

  const wand = document.createElement('div');
  wand.className = 'field-wand';
  wand.setAttribute('aria-hidden', 'true');
  root.append(wand);

  const trails: HTMLElement[] = [];
  const clicks: HTMLElement[] = [];
  let lastPoint: { x: number; y: number } | undefined;
  let markIndex = 0;

  const pointInRoot = (event: PointerEvent) => {
    const bounds = root.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const point = pointInRoot(event);
    wand.style.left = `${point.x}px`;
    wand.style.top = `${point.y}px`;

    const target = event.target instanceof Element
      ? event.target.closest('a, button, [data-field-target]')
      : null;
    wand.classList.toggle('is-target', Boolean(target));

    if (lastPoint && Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < TRAIL_DISTANCE) return;
    const trail = createMark('trail', markIndex++, point.x, point.y);
    root.append(trail);
    addBounded(trails, trail, TRAIL_LIMIT);
    removeAfter(trail, trails, TRAIL_LIFETIME);
    lastPoint = point;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const point = pointInRoot(event);
    const click = createMark('click', markIndex++, point.x, point.y);
    root.append(click);
    addBounded(clicks, click, CLICK_LIMIT);
    removeAfter(click, clicks, CLICK_LIFETIME);
  };

  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerdown', onPointerDown);

  return () => {
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerdown', onPointerDown);
    trails.forEach((node) => node.remove());
    clicks.forEach((node) => node.remove());
    wand.remove();
  };
}
