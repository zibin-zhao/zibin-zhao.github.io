import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createKineticInstrument } from './kinetic-objects';
import { createCollectionProps, disposeObjectTree, type CollectionProp } from './kinetic-props';
import type { ArchiveLeaf } from '../lib/archive-content';

type PlacedProp = CollectionProp & {
  basePosition: THREE.Vector3;
  baseRotation: number;
  scale: number;
};

const desktopPoses: Record<string, [number, number, number, number, number]> = {
  research: [1.2, 0, -0.6, 1.05, -0.14],
  projects: [4.9, 0, -2.7, 0.83, -0.35],
  singularity: [-3.8, 0, -2.4, 0.74, 0.3],
  about: [-1.05, 0, 4.35, 1.08, -0.12],
  medit: [4.35, 0, 2.7, 0.8, 0.2],
  prompts: [2.55, 0, 4.35, 0.82, -0.34],
  cv: [-0.5, 0, -3.9, 0.75, 0.15],
  contact: [-4.25, 0, 0.3, 0.83, -0.25],
};

function makeGroundShade(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const radial = context.createRadialGradient(64, 64, 4, 64, 64, 62);
  radial.addColorStop(0, 'rgba(38,44,32,.48)');
  radial.addColorStop(0.35, 'rgba(38,44,32,.24)');
  radial.addColorStop(1, 'rgba(38,44,32,0)');
  context.fillStyle = radial;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** One continuous collection with a finished mechanical subject and an interruptible opening. */
export function createKineticField(wrapper: HTMLElement): () => void {
  const canvasElement = wrapper.querySelector<HTMLCanvasElement>('canvas');
  if (!canvasElement) return () => {};
  const canvas = canvasElement;
  const home = wrapper.closest<HTMLElement>('.spatial-home')!;
  const viewer = home.querySelector<HTMLElement>('[data-archive-viewer]')!;
  const archiveOpen = home.querySelector<HTMLButtonElement>('[data-archive-open]')!;
  const selectors = Array.from(home.querySelectorAll<HTMLButtonElement>('[data-archive-select]'));
  const hoverLabel = home.querySelector<HTMLElement>('[data-archive-hover]')!;
  const entries = JSON.parse(
    home.querySelector('[data-archive-content]')?.textContent || '[]',
  ) as ArchiveLeaf[];
  if (entries.length !== 9) throw new Error('The archive requires nine real content records.');
  // A page restored from the browser cache retains DOM state but gets a new scene.
  viewer.hidden = true;
  hoverLabel.hidden = true;
  home.classList.remove('archive-active');
  archiveOpen.hidden = false;
  archiveOpen.setAttribute('aria-expanded', 'false');
  selectors.forEach((button) => button.setAttribute('aria-pressed', 'false'));
  const controls = document.querySelectorAll<HTMLElement>('[data-gallery-controls]');
  const fallback = () => {
    wrapper.dataset.state = 'fallback';
    viewer.hidden = true;
    hoverLabel.hidden = true;
    home.classList.remove('archive-active');
    controls.forEach((control) => {
      control.hidden = true;
    });
  };
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: false,
  });
  if (!context) {
    fallback();
    return () => {};
  }
  const debug = context.getExtension('WEBGL_debug_renderer_info');
  const software = /swiftshader|llvmpipe|softpipe|software/i.test(
    String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER)),
  );
  const lowDetail = software || window.innerWidth < 760;
  wrapper.dataset.mode = 'field';
  wrapper.dataset.view = '0';
  wrapper.dataset.renderProfile = software ? 'software' : 'default';
  wrapper.dataset.instrument = 'open';
  wrapper.dataset.state = 'loading';

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.97;
  renderer.setClearColor('#e8e9e3', 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = software ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e8e9e3', 25, 70);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 500);
  const environmentRoom = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentRoom, 0.03, 0.1, 100, {
    size: software ? 64 : 128,
  });
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.53;
  environmentRoom.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight('#fffdf2', '#7b8371', 0.49));
  const key = new THREE.DirectionalLight('#fff6df', 3.7);
  key.position.set(-5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(software ? 512 : lowDetail ? 1024 : 2048);
  Object.assign(key.shadow.camera, {
    left: -12,
    right: 12,
    top: 10,
    bottom: -10,
    near: 0.1,
    far: 38,
  });
  key.shadow.normalBias = 0.028;
  key.shadow.bias = -0.00004;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);
  const edge = new THREE.DirectionalLight('#d9e6f3', 1.35);
  edge.position.set(6, 5, -4);
  scene.add(edge);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    software
      ? new THREE.MeshLambertMaterial({ color: '#e8e9e3' })
      : new THREE.MeshStandardMaterial({ color: '#e8e9e3', roughness: 0.93, metalness: 0.01 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.025;
  floor.receiveShadow = true;
  scene.add(floor);
  const world = new THREE.Group();
  scene.add(world);
  const instrument = createKineticInstrument({ lowDetail, entries });
  const objects = createCollectionProps(lowDetail, () => requestFrame());
  objects.set('research', {
    group: instrument.group,
    anchor: new THREE.Vector3(-2.45, 3.5, 0.2),
    pickPoint: new THREE.Vector3(0.4, 2.2, 0.5),
  });
  const placed = new Map<string, PlacedProp>();
  const shadowTexture = makeGroundShade();
  const groundShades = new Map<string, THREE.Mesh>();
  objects.forEach((object, name) => {
    world.add(object.group);
    placed.set(name, { ...object, basePosition: new THREE.Vector3(), baseRotation: 0, scale: 1 });
    if (shadowTexture) {
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: name === 'research' ? 0.58 : 0.3,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.003;
      world.add(shadow);
      groundShades.set(name, shadow);
    }
  });

  // A continuous rail supplies a quiet depth cue through the assembled collection.
  const railway = new THREE.Group();
  world.add(railway);
  const railPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, 0.055, 6.2),
    new THREE.Vector3(-4, 0.055, 5.5),
    new THREE.Vector3(1.8, 0.055, 2.4),
    new THREE.Vector3(5.3, 0.055, -1.5),
    new THREE.Vector3(8.2, 0.055, -8),
  ]);
  const railMetal = new THREE.MeshStandardMaterial({
    color: '#8a9384',
    metalness: 0.8,
    roughness: 0.4,
  });
  for (const offset of [-0.075, 0.075]) {
    const rail = new THREE.Mesh(new THREE.TubeGeometry(railPath, 100, 0.009, 4, false), railMetal);
    rail.position.x = offset;
    railway.add(rail);
  }
  const sleepers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.23, 0.02, 0.034),
    new THREE.MeshStandardMaterial({ color: '#b4b8aa', roughness: 0.9 }),
    62,
  );
  const transform = new THREE.Object3D();
  for (let i = 0; i < 62; i++) {
    transform.position.copy(railPath.getPointAt(i / 61));
    transform.position.y -= 0.017;
    const tangent = railPath.getTangentAt(i / 61);
    transform.rotation.y = Math.atan2(tangent.x, tangent.z);
    transform.updateMatrix();
    sleepers.setMatrixAt(i, transform.matrix);
  }
  railway.add(sleepers);
  const cars: THREE.Group[] = [];
  const carriagePaint = new THREE.MeshStandardMaterial({
    color: '#d7d8cc',
    roughness: 0.4,
    metalness: 0.35,
  });
  const trainWindows = new THREE.MeshStandardMaterial({
    color: '#28392e',
    roughness: 0.22,
    metalness: 0.45,
  });
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.15, 0.54, 2, 0.035), carriagePaint);
    body.position.y = 0.1;
    body.castShadow = false;
    car.add(body);
    const windows = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.051, 0.4), trainWindows);
    windows.position.y = 0.113;
    car.add(windows);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.187, 0.014, 0.46),
      new THREE.MeshStandardMaterial({ color: '#b64d25', roughness: 0.4 }),
    );
    stripe.position.y = 0.07;
    car.add(stripe);
    railway.add(car);
    cars.push(car);
  }

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spatial-anchor]'));
  const motionButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-motion]');
  const openButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-open]');
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observedMotionPreference = reducedMotion.matches;
  let paused = observedMotionPreference;
  let mobile = window.innerWidth < 760;
  let width = 1,
    height = 1,
    frame = 0,
    lastTime = 0,
    elapsed = 0;
  let disposed = false,
    failed = false,
    visible = true;
  let angle = 0,
    targetAngle = 0,
    step = 0;
  let openness = paused ? 1 : 0.54,
    targetOpen = 1;
  let intro = paused ? 1 : 0;
  let opening = !paused;
  let selectedLeaf: number | null = null;
  let focusedLeaf = 0;
  let focusAmount = 0;
  let hoveredLeaf: number | null = null;
  let returnFocus: HTMLElement = archiveOpen;
  let pickProjectionKey = '';
  let drag: { x: number; y: number; angle: number; moved: boolean } | null = null;
  const baseCamera = new THREE.Vector3();
  const baseTarget = new THREE.Vector3();
  const startCamera = new THREE.Vector3();
  const startTarget = new THREE.Vector3();
  const currentTarget = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const screenPoint = new THREE.Vector2();
  const displayed = new Map<HTMLElement, { x: number; y: number }>();
  const pickable = Array.from(placed.values(), (prop) => prop.group);
  const names = new Map(Array.from(placed, ([name, prop]) => [prop.group, name]));

  function syncMotion() {
    wrapper.dataset.motion = paused ? 'paused' : 'running';
    motionButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(paused));
      const label = paused ? button.dataset.labelPlay : button.dataset.labelPause;
      if (label) {
        button.textContent = label;
        button.setAttribute('aria-label', label);
      }
    });
  }
  function syncInstrument() {
    wrapper.dataset.instrument = targetOpen ? 'open' : 'closed';
    openButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(Boolean(targetOpen)));
      const label = targetOpen ? button.dataset.labelClose : button.dataset.labelOpen;
      if (label) {
        button.textContent = label;
        button.setAttribute('aria-label', label);
      }
    });
  }
  function stopIntro() {
    if (!opening) return;
    opening = false;
    intro = 1;
    baseCamera.copy(camera.position);
    baseTarget.copy(currentTarget);
    wrapper.dataset.intro = 'complete';
  }
  function showArchive(index: number) {
    const next = (index + entries.length) % entries.length;
    if (selectedLeaf === null) {
      returnFocus =
        document.activeElement instanceof HTMLElement && document.activeElement === archiveOpen
          ? document.activeElement
          : archiveOpen;
    }
    stopIntro();
    selectedLeaf = next;
    hoveredLeaf = null;
    hoverLabel.hidden = true;
    targetOpen = 1;
    if (reducedMotion.matches) {
      openness = 1;
      focusedLeaf = next;
      focusAmount = 1;
    }
    const entry = entries[next];
    const setText = (selector: string, value: string) => {
      const element = viewer.querySelector<HTMLElement>(selector);
      if (element) element.textContent = value;
    };
    setText('[data-archive-position]', `${String(next + 1).padStart(2, '0')} / 09`);
    setText('[data-archive-title]', entry.title);
    setText('[data-archive-kicker]', entry.kicker);
    setText('[data-archive-summary]', entry.summary);
    setText('[data-archive-detail]', entry.detail);
    const destination = viewer.querySelector<HTMLElement>('[data-archive-links]')!;
    destination.replaceChildren(
      ...entry.links.map((link) => {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = `${link.label} ↗`;
        return anchor;
      }),
    );
    selectors.forEach((button, position) =>
      button.setAttribute('aria-pressed', String(position === next)),
    );
    viewer.hidden = false;
    viewer.scrollTop = 0;
    archiveOpen.setAttribute('aria-expanded', 'true');
    archiveOpen.hidden = true;
    home.classList.add('archive-active');
    wrapper.dataset.selectedLeaf = String(next);
    syncInstrument();
    renderer.shadowMap.needsUpdate = true;
    if (mobile && window.scrollY > home.offsetTop + 20) {
      window.scrollTo({ top: home.offsetTop, behavior: 'instant' });
    }
    requestFrame();
  }
  function closeArchive(restoreFocus = true) {
    if (selectedLeaf === null) return;
    selectedLeaf = null;
    hoveredLeaf = null;
    if (reducedMotion.matches) focusAmount = 0;
    viewer.hidden = true;
    hoverLabel.hidden = true;
    home.classList.remove('archive-active');
    archiveOpen.hidden = false;
    archiveOpen.setAttribute('aria-expanded', 'false');
    selectors.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    wrapper.dataset.selectedLeaf = 'none';
    renderer.shadowMap.needsUpdate = true;
    requestFrame();
    if (restoreFocus) returnFocus.focus({ preventScroll: true });
  }
  function applyMotionPreference(matches: boolean) {
    if (matches === observedMotionPreference) return;
    observedMotionPreference = matches;
    stopIntro();
    paused = matches;
    if (paused) {
      openness = targetOpen;
      angle = targetAngle;
      renderer.shadowMap.needsUpdate = true;
    }
    syncMotion();
    lastTime = 0;
  }
  function configureCamera() {
    camera.aspect = width / height;
    const fit = mobile ? Math.max(1, 0.77 / camera.aspect) : Math.max(1, 1.45 / camera.aspect);
    baseTarget.set(mobile ? 0 : 0.1, mobile ? 0 : 1.3, 0);
    baseCamera
      .set(mobile ? 3.4 : 5.1, mobile ? 10.5 : 6.15, mobile ? 15 : 11.7)
      .multiplyScalar(fit);
    startTarget.set(1.1, 2.1, 0);
    startCamera
      .copy(baseCamera)
      .sub(baseTarget)
      .multiplyScalar(mobile ? 0.93 : 0.79)
      .add(startTarget);
    camera.position.copy(baseCamera);
    currentTarget.copy(baseTarget);
    camera.lookAt(currentTarget);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }
  function project(point: THREE.Vector3) {
    const value = point.clone().project(camera);
    return { x: (value.x * 0.5 + 0.5) * width, y: (-value.y * 0.5 + 0.5) * height };
  }
  function screenBounds(group: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(group);
    let minX = Infinity,
      maxX = -Infinity;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          const point = project(new THREE.Vector3(x, y, z));
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
        }
    return maxX - minX;
  }
  function groundPosition(x: number, y: number) {
    raycaster.setFromCamera(new THREE.Vector2((x / width) * 2 - 1, -(y / height) * 2 + 1), camera);
    return raycaster.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Vector3(),
    );
  }
  function placeObjects() {
    renderer.shadowMap.needsUpdate = true;
    world.rotation.y = 0;
    instrument.update(1, 0);
    placed.forEach((prop, name) => {
      const [x, y, z, scale, rotation] = desktopPoses[name];
      prop.group.position.set(x, y, z);
      prop.group.rotation.y = rotation;
      prop.group.scale.setScalar(scale);
      prop.scale = scale;
      prop.baseRotation = rotation;
    });
    if (mobile) {
      const stage = wrapper.getBoundingClientRect();
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      placed.forEach((prop, name) => {
        const link = links.find((item) => item.dataset.spatialAnchor === name);
        if (!link) return;
        const bounds = link.getBoundingClientRect();
        const hero = name === 'research';
        const x = hero ? width * 0.55 : bounds.left - stage.left + bounds.width / 2;
        const y = hero ? 30 * rem : bounds.top - stage.top - 15;
        const point = groundPosition(x, y);
        if (!point) return;
        prop.group.position.copy(point);
        prop.group.rotation.y = hero ? -0.34 : prop.baseRotation;
        prop.baseRotation = prop.group.rotation.y;
        prop.group.updateWorldMatrix(true, true);
        const targetWidth = hero ? width * 1.16 : name === 'projects' ? 140 : 124;
        prop.scale *= targetWidth / Math.max(1, screenBounds(prop.group));
        prop.group.scale.setScalar(prop.scale);
      });
    } else {
      const placement: Record<string, [number, number, number]> = {
        projects: [0.9, 0.67, 0.13],
        singularity: [0.35, 0.62, 0.095],
        about: [0.17, 0.83, 0.2],
        medit: [0.84, 0.76, 0.115],
        prompts: [0.53, 0.85, 0.115],
        cv: [0.36, 0.77, 0.12],
        contact: [0.13, 0.2, 0.105],
      };
      placed.forEach((prop, name) => {
        if (name === 'research') return;
        const [x, y, size] = placement[name];
        const point = groundPosition(width * x, height * y);
        if (!point) return;
        prop.group.position.copy(point);
        prop.group.updateWorldMatrix(true, true);
        prop.scale *= (width * size) / Math.max(1, screenBounds(prop.group));
        prop.group.scale.setScalar(prop.scale);
      });
    }
    placed.forEach((prop, name) => {
      prop.basePosition.copy(prop.group.position);
      const shadow = groundShades.get(name);
      if (shadow) {
        shadow.position.set(prop.group.position.x, 0.003, prop.group.position.z);
        shadow.scale.set(
          name === 'research' ? prop.scale * 7 : prop.scale * 3,
          name === 'research' ? prop.scale * 3.6 : prop.scale * 2.2,
          1,
        );
      }
    });
    railway.visible = !mobile;
    if (mobile) {
      scene.fog = null;
      const hero = placed.get('research')!;
      key.target.position.copy(hero.group.position);
      key.position
        .copy(hero.group.position)
        .add(new THREE.Vector3(-5, 10, 6).multiplyScalar(hero.scale));
      const span = hero.scale * 8;
      Object.assign(key.shadow.camera, {
        left: -span,
        right: span,
        top: span,
        bottom: -span,
        far: hero.scale * 40,
      });
    } else {
      scene.fog = new THREE.Fog('#e8e9e3', 25, 70);
      key.target.position.set(0, 0, 0);
      key.position.set(-5, 10, 6);
      Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, far: 38 });
    }
    key.shadow.camera.updateProjectionMatrix();
    world.updateMatrixWorld(true);
  }
  function updateObjects() {
    instrument.update(openness, elapsed, { index: focusedLeaf, amount: focusAmount }, hoveredLeaf);
    world.rotation.y = mobile ? 0 : angle;
    if (mobile)
      placed.forEach((prop) => {
        prop.group.rotation.y = prop.baseRotation + angle * 0.65;
        prop.group.position.x = prop.basePosition.x + Math.sin(angle) * prop.scale * 0.27;
      });
    cars.forEach((car, index) => {
      const progress = (elapsed * 0.012 + 0.33 - index * 0.019 + 1) % 1;
      car.position.copy(railPath.getPointAt(progress));
      const tangent = railPath.getTangentAt(progress);
      car.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
    world.updateMatrixWorld(true);
  }
  function projectLabels() {
    links.forEach((link) => {
      const prop = placed.get(link.dataset.spatialAnchor || '');
      if (!prop) return;
      const point = project(prop.group.localToWorld(prop.pickPoint.clone()));
      link.dataset.objectX = point.x.toFixed(2);
      link.dataset.objectY = point.y.toFixed(2);
      if (mobile) {
        link.dataset.projected = 'false';
        return;
      }
      const labelPoint = project(prop.group.localToWorld(prop.anchor.clone()));
      const x = Math.round(THREE.MathUtils.clamp(labelPoint.x, 110, width - 110));
      const y = Math.round(THREE.MathUtils.clamp(labelPoint.y, 145, height - 105));
      const prior = displayed.get(link);
      if (!prior || Math.hypot(prior.x - x, prior.y - y) > 3) {
        link.style.setProperty('--anchor-x', `${x}px`);
        link.style.setProperty('--anchor-y', `${y}px`);
        displayed.set(link, { x, y });
      }
      link.dataset.projected = 'true';
    });
    // Retain actual, unoccluded leaf hit points for the native content index.
    // The cached projection changes only with the articulated geometry or camera.
    const projectionKey = [
      width,
      height,
      angle.toFixed(3),
      openness.toFixed(3),
      focusAmount.toFixed(3),
      focusedLeaf,
      opening ? intro.toFixed(2) : 'still',
    ].join(':');
    if (projectionKey !== pickProjectionKey) {
      pickProjectionKey = projectionKey;
      selectors.forEach((button) => {
        delete button.dataset.leafX;
        delete button.dataset.leafY;
      });
      for (const y of [2.7, 3.1, 2.2]) {
        const target = project(instrument.group.localToWorld(new THREE.Vector3(0.65, y, 0.2)));
        screenPoint.set((target.x / width) * 2 - 1, -(target.y / height) * 2 + 1);
        raycaster.setFromCamera(screenPoint, camera);
        const hit = raycaster.intersectObjects(pickable, true)[0];
        const index = leafIndex(hit?.object);
        if (index !== null) {
          const point = project(hit.point);
          selectors[index].dataset.leafX = point.x.toFixed(2);
          selectors[index].dataset.leafY = point.y.toFixed(2);
        }
      }
    }
  }
  function render() {
    if (disposed || failed) return;
    try {
      renderer.render(scene, camera);
      projectLabels();
      wrapper.dataset.state = 'ready';
      wrapper.dataset.openness = openness.toFixed(3);
      wrapper.dataset.angle = angle.toFixed(4);
      wrapper.dataset.focusAmount = focusAmount.toFixed(3);
      controls.forEach((control) => {
        control.hidden = false;
      });
    } catch (error) {
      console.error('The kinetic field could not render.', error);
      failed = true;
      fallback();
    }
  }
  function requestFrame() {
    if (!frame && !disposed && !failed && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || failed || !visible || document.hidden) return;
    // A delayed media event must not leave ambient motion running. Only a changed
    // system preference overrides an explicit choice made with the motion button.
    applyMotionPreference(reducedMotion.matches);
    const interval = software ? 1000 / 24 : mobile ? 1000 / 30 : 1000 / 60;
    if (lastTime && now - lastTime < interval - 1) {
      requestFrame();
      return;
    }
    const delta = Math.min((now - (lastTime || now)) / 1000, 0.2);
    lastTime = now;
    if (!paused) elapsed += delta;
    const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 9);
    if (opening && !paused) {
      intro = Math.min(1, intro + delta / 3.3);
      const progress = 1 - Math.pow(1 - intro, 3);
      camera.position.lerpVectors(startCamera, baseCamera, progress);
      currentTarget.lerpVectors(startTarget, baseTarget, progress);
      camera.lookAt(currentTarget);
      if (intro === 1) {
        opening = false;
        wrapper.dataset.intro = 'complete';
      }
    }
    const previousAngle = angle;
    const previousOpenness = openness;
    const previousFocus = focusAmount;
    if (selectedLeaf !== null && (focusAmount < 0.001 || reducedMotion.matches))
      focusedLeaf = selectedLeaf;
    const targetFocus = selectedLeaf !== null && focusedLeaf === selectedLeaf ? 1 : 0;
    focusAmount = THREE.MathUtils.lerp(
      focusAmount,
      targetFocus,
      reducedMotion.matches ? 1 : ease * 0.85,
    );
    if (Math.abs(focusAmount - targetFocus) < 0.001) focusAmount = targetFocus;
    angle = THREE.MathUtils.lerp(angle, targetAngle, ease);
    if (Math.abs(angle - targetAngle) < 0.00005) angle = targetAngle;
    openness = THREE.MathUtils.lerp(openness, targetOpen, ease * 0.65);
    if (Math.abs(openness - targetOpen) < 0.0001) openness = targetOpen;
    if (previousAngle !== angle || previousOpenness !== openness || previousFocus !== focusAmount)
      renderer.shadowMap.needsUpdate = true;
    updateObjects();
    render();
    if (
      !paused ||
      Math.abs(angle - targetAngle) > 0.00005 ||
      Math.abs(openness - targetOpen) > 0.0001 ||
      Math.abs(focusAmount - targetFocus) > 0.001 ||
      (selectedLeaf !== null && focusedLeaf !== selectedLeaf)
    )
      requestFrame();
  }
  function resize() {
    const bounds = wrapper.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const wasMobile = mobile;
    mobile = window.innerWidth < 760;
    if (wasMobile !== mobile || mobile) {
      links.forEach((link) => {
        link.style.removeProperty('--anchor-x');
        link.style.removeProperty('--anchor-y');
      });
      displayed.clear();
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, software ? (mobile ? 0.9 : 0.75) : mobile ? 1.35 : 1.65),
    );
    renderer.setSize(width, height, false);
    configureCamera();
    placeObjects();
    renderer.shadowMap.needsUpdate = true;
    if (opening) {
      camera.position.copy(startCamera);
      currentTarget.copy(startTarget);
      camera.lookAt(currentTarget);
    }
    updateObjects();
    render();
    requestFrame();
  }
  function leafIndex(object: THREE.Object3D | undefined): number | null {
    let candidate: THREE.Object3D | null = object || null;
    while (candidate) {
      if (Number.isInteger(candidate.userData.archiveLeafIndex))
        return candidate.userData.archiveLeafIndex;
      candidate = candidate.parent;
    }
    return null;
  }
  function hitTest(event: PointerEvent): { name: string | null; leaf: number | null } {
    const bounds = canvas.getBoundingClientRect();
    screenPoint.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(screenPoint, camera);
    const hit = raycaster.intersectObjects(pickable, true)[0];
    let object: THREE.Object3D | null = hit?.object || null;
    while (object) {
      const name = names.get(object as THREE.Group);
      if (name) return { name, leaf: leafIndex(hit?.object) };
      object = object.parent;
    }
    return { name: null, leaf: null };
  }
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      stopIntro();
      drag = { x: event.clientX, y: event.clientY, angle: targetAngle, moved: false };
      canvas.dataset.dragging = 'true';
      canvas.setPointerCapture(event.pointerId);
    },
    options,
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (drag) {
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        targetAngle = THREE.MathUtils.clamp(drag.angle + dx * 0.004, -0.55, 0.55);
        if (reducedMotion.matches) {
          angle = targetAngle;
          renderer.shadowMap.needsUpdate = true;
        }
        requestFrame();
      } else if (event.pointerType !== 'touch') {
        const { name, leaf } = hitTest(event);
        canvas.style.cursor = name ? 'pointer' : 'grab';
        canvas.dataset.hoveredArtwork = name || '';
        if (hoveredLeaf !== leaf) {
          hoveredLeaf = leaf;
          renderer.shadowMap.needsUpdate = true;
          requestFrame();
        }
        hoverLabel.hidden = leaf === null;
        if (leaf !== null) {
          hoverLabel.textContent = `${String(leaf + 1).padStart(2, '0')} · ${entries[leaf].title} ↗`;
          hoverLabel.style.left = `${Math.min(event.clientX + 16, window.innerWidth - 256)}px`;
          hoverLabel.style.top = `${Math.min(event.clientY + 16, window.innerHeight - 60)}px`;
        }
      }
    },
    options,
  );
  canvas.addEventListener(
    'pointerup',
    (event) => {
      const click = drag && !drag.moved;
      drag = null;
      canvas.dataset.dragging = 'false';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (click) {
        const { name, leaf } = hitTest(event);
        if (leaf !== null || name === 'research') showArchive(leaf ?? 0);
        else links.find((link) => link.dataset.spatialAnchor === name)?.click();
      }
    },
    options,
  );
  canvas.addEventListener(
    'pointerleave',
    () => {
      hoverLabel.hidden = true;
      if (hoveredLeaf !== null) {
        hoveredLeaf = null;
        renderer.shadowMap.needsUpdate = true;
        requestFrame();
      }
    },
    options,
  );
  archiveOpen.addEventListener(
    'click',
    () => {
      showArchive(0);
      viewer
        .querySelector<HTMLButtonElement>('[data-archive-close]')
        ?.focus({ preventScroll: true });
    },
    options,
  );
  selectors.forEach((button, index) =>
    button.addEventListener('click', () => showArchive(index), options),
  );
  viewer
    .querySelector('[data-archive-next]')
    ?.addEventListener('click', () => showArchive((selectedLeaf ?? 0) + 1), options);
  viewer
    .querySelector('[data-archive-prev]')
    ?.addEventListener('click', () => showArchive((selectedLeaf ?? 0) - 1), options);
  viewer
    .querySelector('[data-archive-close]')
    ?.addEventListener('click', () => closeArchive(), options);
  window.addEventListener(
    'keydown',
    (event) => {
      if (selectedLeaf === null) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeArchive();
      } else if (
        viewer.contains(document.activeElement) &&
        ['ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        event.preventDefault();
        showArchive(selectedLeaf + (event.key === 'ArrowRight' ? 1 : -1));
      }
    },
    options,
  );
  canvas.addEventListener(
    'pointercancel',
    () => {
      drag = null;
      canvas.dataset.dragging = 'false';
    },
    options,
  );
  document.querySelectorAll<HTMLButtonElement>('[data-gallery-shuffle]').forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        stopIntro();
        step = (step + 1) % 3;
        targetAngle = [0, -0.32, 0.31][step];
        wrapper.dataset.view = String(step);
        requestFrame();
      },
      options,
    ),
  );
  document.querySelectorAll<HTMLButtonElement>('[data-gallery-reset]').forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        stopIntro();
        closeArchive(false);
        step = 0;
        targetAngle = 0;
        angle = 0;
        targetOpen = 1;
        configureCamera();
        placeObjects();
        renderer.shadowMap.needsUpdate = true;
        displayed.clear();
        wrapper.dataset.view = '0';
        syncInstrument();
        updateObjects();
        render();
        requestFrame();
      },
      options,
    ),
  );
  motionButtons.forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        stopIntro();
        paused = !paused;
        syncMotion();
        lastTime = 0;
        requestFrame();
      },
      options,
    ),
  );
  openButtons.forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        stopIntro();
        closeArchive(false);
        targetOpen = targetOpen ? 0 : 1;
        syncInstrument();
        if (reducedMotion.matches) {
          openness = targetOpen;
          renderer.shadowMap.needsUpdate = true;
        }
        requestFrame();
      },
      options,
    ),
  );
  links.forEach((link) => link.addEventListener('focus', stopIntro, options));
  window.addEventListener('wheel', stopIntro, { ...options, passive: true });
  window.addEventListener('keydown', stopIntro, options);
  reducedMotion.addEventListener(
    'change',
    (event) => {
      applyMotionPreference(event.matches);
      requestFrame();
    },
    options,
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        lastTime = 0;
        requestFrame();
      }
    },
    options,
  );
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      failed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      fallback();
    },
    options,
  );
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      lastTime = 0;
      requestFrame();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  observer.observe(wrapper);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapper);
  syncMotion();
  syncInstrument();
  wrapper.dataset.intro = opening ? 'playing' : 'complete';
  wrapper.dataset.selectedLeaf = 'none';
  resize();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    observer.disconnect();
    resizeObserver.disconnect();
    instrument.dispose();
    world.remove(instrument.group);
    disposeObjectTree(scene);
    environment.dispose();
    key.shadow.dispose();
    renderer.dispose();
  };
}
