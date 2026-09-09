import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createKineticField } from './kinetic-field';

type GalleryMode = 'research' | 'projects' | 'play';

const mountedGalleries = new Map<HTMLElement, () => void>();

function markGalleryFallback(wrapper: HTMLElement): void {
  wrapper.dataset.state = 'fallback';
  document.querySelectorAll<HTMLElement>('[data-gallery-controls]').forEach((controls) => {
    controls.hidden = true;
  });
}

// Interior sculptures are visual metaphors, not molecular models.
class RibbonPath extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    const radius = 1.67 + 0.37 * Math.cos(3 * angle);
    return target.set(
      radius * Math.cos(2 * angle),
      radius * Math.sin(2 * angle),
      0.78 * Math.sin(3 * angle),
    );
  }
}

function createRibbon(lengthSegments = 420, profileSegments = 24): THREE.BufferGeometry {
  const path = new RibbonPath();
  const frames = path.computeFrenetFrames(lengthSegments, true);
  const positions: number[] = [];
  const indices: number[] = [];
  const uv: number[] = [];
  const point = new THREE.Vector3();

  for (let row = 0; row <= lengthSegments; row += 1) {
    const t = row / lengthSegments;
    const center = path.getPointAt(t);
    const twist = Math.sin(t * Math.PI * 6) * 0.42 + 0.3;
    const normal = frames.normals[row].clone().applyAxisAngle(frames.tangents[row], twist);
    const binormal = frames.binormals[row].clone().applyAxisAngle(frames.tangents[row], twist);

    for (let column = 0; column <= profileSegments; column += 1) {
      const theta = (column / profileSegments) * Math.PI * 2;
      // A softly rounded, flat section makes the loop read as a substantial ceramic ribbon.
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const across = Math.sign(cos) * Math.pow(Math.abs(cos), 0.55) * 0.405;
      const depth = Math.sign(sin) * Math.pow(Math.abs(sin), 0.55) * 0.092;
      point.copy(center).addScaledVector(normal, across).addScaledVector(binormal, depth);
      positions.push(point.x, point.y, point.z);
      uv.push(t, column / profileSegments);

      if (row < lengthSegments && column < profileSegments) {
        const a = row * (profileSegments + 1) + column;
        const b = a + profileSegments + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeContactShadow(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(52, 57, 48, 0.24)');
  gradient.addColorStop(0.37, 'rgba(52, 57, 48, 0.15)');
  gradient.addColorStop(0.72, 'rgba(52, 57, 48, 0.04)');
  gradient.addColorStop(1, 'rgba(52, 57, 48, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createInteriorGallery(wrapper: HTMLElement): () => void {
  const canvas = wrapper.querySelector<HTMLCanvasElement>('.gallery-canvas');
  if (!canvas) return () => {};
  const page = wrapper.dataset.scene;
  const mode: GalleryMode =
    page === 'projects' || page === 'prompts'
      ? 'projects'
      : page === 'about' || page === 'contact'
        ? 'play'
        : 'research';
  wrapper.dataset.state = 'loading';
  wrapper.dataset.mode = mode;

  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: false,
  });
  if (!context) {
    markGalleryFallback(wrapper);
    return () => {};
  }

  const debugRendererInfo = context.getExtension('WEBGL_debug_renderer_info');
  const rendererName = String(
    context.getParameter(debugRendererInfo?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER),
  );
  const softwareRendering = /swiftshader|llvmpipe|softpipe|software/i.test(rendererName);
  wrapper.dataset.renderProfile = softwareRendering ? 'software' : 'default';

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setClearColor('#e8e9e3', 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e8e9e3', 16, 36);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 70);
  const environmentRoom = new RoomEnvironment();
  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  const environmentSize = softwareRendering ? 64 : window.innerWidth < 760 ? 128 : 256;
  const environmentTarget = environmentGenerator.fromScene(environmentRoom, 0.035, 0.1, 100, {
    size: environmentSize,
  });
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.85;
  environmentRoom.dispose();
  environmentGenerator.dispose();

  scene.add(new THREE.HemisphereLight('#ffffff', '#9d9e92', 1.35));
  const keyLight = new THREE.DirectionalLight('#fff8eb', 2.6);
  keyLight.position.set(-4, 10, 7);
  keyLight.castShadow = true;
  const shadowSize = softwareRendering ? 512 : 1024;
  keyLight.shadow.mapSize.set(shadowSize, shadowSize);
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -7;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.normalBias = 0.035;
  keyLight.shadow.bias = -0.00008;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight('#e7efff', 1.8);
  rimLight.position.set(5, 6, -4);
  scene.add(rimLight);

  const porcelain = new THREE.MeshPhysicalMaterial({
    color: '#cc4215',
    metalness: 0.05,
    roughness: 0.34,
    clearcoat: 0.28,
    clearcoatRoughness: 0.27,
    side: THREE.DoubleSide,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: '#d2d6d0',
    metalness: 0.9,
    roughness: 0.28,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: '#c8cbc0',
    metalness: 0.03,
    roughness: 0.78,
  });
  const darkInset = new THREE.MeshStandardMaterial({
    color: '#a1a79b',
    metalness: 0.45,
    roughness: 0.48,
  });
  const warmWhite = new THREE.MeshStandardMaterial({
    color: '#f1f1e9',
    metalness: 0.16,
    roughness: 0.35,
  });

  const installation = new THREE.Group();
  scene.add(installation);
  const sculpturePivot = new THREE.Group();
  sculpturePivot.position.set(0, 2.94, 0);
  sculpturePivot.rotation.set(-0.09, 0.25, -0.13);
  const ribbon = new THREE.Mesh(
    softwareRendering ? createRibbon(168, 16) : createRibbon(),
    porcelain,
  );
  ribbon.castShadow = true;
  ribbon.receiveShadow = true;
  sculpturePivot.add(ribbon);
  installation.add(sculpturePivot);

  const plinthProfile = [
    new THREE.Vector2(0, 0.07),
    new THREE.Vector2(2.07, 0.07),
    new THREE.Vector2(2.15, 0.12),
    new THREE.Vector2(2.15, 0.4),
    new THREE.Vector2(2.12, 0.45),
    new THREE.Vector2(0, 0.45),
  ];
  const plinth = new THREE.Mesh(new THREE.LatheGeometry(plinthProfile, 112), concrete);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  installation.add(plinth);
  const footing = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 0.075, 96), darkInset);
  footing.position.y = 0.06;
  installation.add(footing);
  const topEtching = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.006, 4, 140), silver);
  topEtching.rotation.x = -Math.PI / 2;
  topEtching.position.y = 0.454;
  installation.add(topEtching);

  const architecturalRing = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.042, 12, 180), silver);
  architecturalRing.position.set(-0.1, 3.15, -1.63);
  architecturalRing.rotation.y = -0.13;
  architecturalRing.castShadow = true;
  installation.add(architecturalRing);

  // Small physical exhibits give the camera a foreground, middle distance, and background.
  const satellite = new THREE.Group();
  satellite.position.set(3.35, 2.16, -0.82);
  satellite.rotation.set(0.14, -0.48, 0.13);
  const panelGeometry = new THREE.BoxGeometry(1.05, 1.32, 0.055);
  for (let index = 0; index < 4; index += 1) {
    const panel = new THREE.Mesh(panelGeometry, index === 3 ? silver : warmWhite);
    panel.position.set(index * 0.1, index * 0.04, index * -0.23);
    panel.castShadow = true;
    satellite.add(panel);
  }
  const inset = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 16, 64), porcelain);
  inset.position.set(0.01, 0.09, 0.073);
  satellite.add(inset);
  const panelDetails = new THREE.Group();
  const panelEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(panelGeometry),
    new THREE.LineBasicMaterial({ color: '#8a9185', transparent: true, opacity: 0.5 }),
  );
  panelDetails.add(panelEdge);
  const progressTrack = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.016, 0.014), silver);
  progressTrack.position.set(0, -0.39, 0.043);
  panelDetails.add(progressTrack);
  const progressAccent = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.018, 0.016), porcelain);
  progressAccent.position.set(-0.175, -0.39, 0.047);
  panelDetails.add(progressAccent);
  for (let index = 0; index < 3; index += 1) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.012), silver);
    key.position.set(-0.21 + index * 0.21, -0.49, 0.043);
    panelDetails.add(key);
  }
  satellite.add(panelDetails);
  installation.add(satellite);
  const smallPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.91, 0.91, 0.17, 72), concrete);
  smallPlinth.position.set(3.45, 0.11, -0.85);
  smallPlinth.receiveShadow = true;
  smallPlinth.castShadow = true;
  installation.add(smallPlinth);

  const orbit = new THREE.Group();
  orbit.position.set(-2.76, 1.51, -1.42);
  const polishedStone = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38, softwareRendering ? 3 : 4),
    silver,
  );
  polishedStone.scale.set(0.95, 1.27, 0.95);
  polishedStone.castShadow = true;
  orbit.add(polishedStone);
  const stoneRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.02, 12, 112), silver);
  stoneRing.rotation.set(1.12, 0.1, 0.5);
  orbit.add(stoneRing);
  const orbitalArch = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.018, 12, 112), silver);
  orbitalArch.rotation.set(0.25, 0.78, -0.32);
  orbit.add(orbitalArch);
  const orangeOrbit = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.024, 12, 112), porcelain);
  orangeOrbit.rotation.set(0.47, -0.55, 0.38);
  orbit.add(orangeOrbit);
  const orbitSatellites = new THREE.Group();
  const satelliteLocations = [
    new THREE.Vector3(0.82, 0.28, 0.26),
    new THREE.Vector3(-0.5, -0.48, 0.37),
    new THREE.Vector3(0.09, 0.66, -0.44),
  ];
  satelliteLocations.forEach((position, index) => {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(index === 0 ? 0.12 : 0.082, 28, 18),
      index === 2 ? warmWhite : porcelain,
    );
    bead.position.copy(position);
    bead.castShadow = true;
    orbitSatellites.add(bead);
  });
  orbit.add(orbitSatellites);
  installation.add(orbit);

  const pose = (x: number, y: number, z: number, scale: number) => ({
    position: new THREE.Vector3(x, y, z),
    scale,
  });
  // Each reading page selects one established arrangement for its backdrop.
  const exhibitPoses = {
    research: [pose(0, 2.94, 0, 1), pose(3.35, 2.16, -0.82, 1), pose(-2.76, 1.51, -1.42, 0.85)],
    projects: [
      pose(-2.78, 1.64, -1.7, 0.3),
      pose(0.03, 2.9, 0.3, 2.8),
      pose(3.12, 1.55, -1.65, 0.8),
    ],
    play: [pose(3.2, 1.63, -1.7, 0.3), pose(-2.85, 1.84, -1.8, 0.8), pose(0, 3.04, 0.12, 2.7)],
  } satisfies Record<GalleryMode, ReturnType<typeof pose>[]>;
  [sculpturePivot, satellite, orbit].forEach((object, index) => {
    const arrangement = exhibitPoses[mode][index];
    object.position.copy(arrangement.position);
    object.scale.setScalar(arrangement.scale);
  });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: '#e8e9e3', roughness: 0.96, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  floor.receiveShadow = true;
  scene.add(floor);

  const contactTexture = makeContactShadow();
  if (contactTexture) {
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 7),
      new THREE.MeshBasicMaterial({
        map: contactTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.75,
      }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0.25, 0.005, 0.18);
    scene.add(contactShadow);
  }

  const floorLineMaterial = new THREE.LineBasicMaterial({
    color: '#a8aea3',
    transparent: true,
    opacity: 0.24,
  });
  [-5.7, 5.7].forEach((x) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.009, -12),
        new THREE.Vector3(x, 0.009, 9),
      ]),
      floorLineMaterial,
    );
    scene.add(line);
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const abortController = new AbortController();
  const { signal } = abortController;
  const motionButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-motion]');
  let paused = reducedMotion.matches;
  let visible = true;
  let disposed = false;
  let failed = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let sampledFrames = 0;
  let smoothedFrameMs = 16.7;
  let resolutionReduced = false;
  let width = 1;
  let height = 1;
  let mobile = false;
  let pointerX = 0;
  let pointerY = 0;
  let cameraMoving = false;
  let desiredCamera = new THREE.Vector3();
  const cameraLookAt = new THREE.Vector3(0, 2.35, 0);
  const motionOffsets: Record<GalleryMode, THREE.Vector3> = {
    research: new THREE.Vector3(7, 4.7, 11),
    projects: new THREE.Vector3(8.8, 4.4, 10),
    play: new THREE.Vector3(4.8, 5.8, 12),
  };

  function syncMotionControls(): void {
    wrapper.dataset.motion = paused ? 'paused' : 'running';
    motionButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(paused));
      const label = paused ? button.dataset.labelPlay : button.dataset.labelPause;
      if (label) {
        button.setAttribute('aria-label', label);
        const labelNode = button.querySelector<HTMLElement>('[data-motion-label]');
        if (labelNode) labelNode.textContent = label;
        else if (button.children.length === 0) button.textContent = label;
      }
    });
  }

  function setCameraDestination(): void {
    const fit = mobile ? Math.max(1, 1.02 / camera.aspect) : 1;
    desiredCamera = motionOffsets[mode].clone().multiplyScalar(fit * 1.08);
  }

  function renderScene(): void {
    if (disposed || failed) return;
    try {
      renderer.render(scene, camera);
      if (wrapper.dataset.state !== 'ready') {
        wrapper.dataset.state = 'ready';
        document.querySelectorAll<HTMLElement>('[data-gallery-controls]').forEach((controls) => {
          controls.hidden = false;
        });
      }
    } catch {
      failed = true;
      markGalleryFallback(wrapper);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function canAnimate(): boolean {
    return !disposed && !failed && visible && !document.hidden;
  }

  function animate(now: number): void {
    frame = 0;
    if (!canAnimate()) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.06) : 0;
    if (lastTime && !resolutionReduced && !paused) {
      sampledFrames += 1;
      smoothedFrameMs = smoothedFrameMs * 0.9 + (now - lastTime) * 0.1;
      if (sampledFrames >= 16 && smoothedFrameMs > 35) {
        resolutionReduced = true;
        renderer.setPixelRatio(softwareRendering ? (mobile ? 0.5 : 0.55) : mobile ? 0.7 : 0.8);
        renderer.setSize(width, height, false);
      }
    }
    lastTime = now;
    if (!paused) elapsed += delta;
    const ease = 1 - Math.exp(-delta * 5);
    sculpturePivot.rotation.y = 0.25 + Math.sin(elapsed * 0.12) * 0.15;
    sculpturePivot.rotation.z = -0.13 + Math.sin(elapsed * 0.18) * 0.035;
    const projectY = exhibitPoses[mode][1].position.y;
    satellite.position.y = projectY + Math.sin(elapsed * 0.46 + 0.9) * 0.09;
    satellite.rotation.y = -0.48 + Math.sin(elapsed * 0.2) * 0.12;
    const orbitY = exhibitPoses[mode][2].position.y;
    orbit.position.y = orbitY + Math.sin(elapsed * 0.42 + 2) * 0.075;
    orbit.rotation.y = 0;
    orbitSatellites.rotation.y = elapsed * 0.12;
    orangeOrbit.rotation.z = 0.38 + elapsed * 0.08;
    polishedStone.rotation.y = elapsed * 0.1;
    const destination = desiredCamera.clone();
    if (!paused && !mobile) {
      destination.x += pointerX * 0.28;
      destination.y -= pointerY * 0.17;
    }
    camera.position.lerp(destination, ease);
    camera.lookAt(cameraLookAt);
    cameraMoving = camera.position.distanceToSquared(destination) > 0.0001;
    renderScene();
    if (!paused || cameraMoving) {
      frame = requestAnimationFrame(animate);
    }
  }

  function requestRender(): void {
    if (!frame && canAnimate()) {
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    }
  }

  function resize(): void {
    if (disposed || failed) return;
    const bounds = wrapper.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    mobile = window.innerWidth < 760;
    renderer.setPixelRatio(
      resolutionReduced
        ? softwareRendering
          ? mobile
            ? 0.5
            : 0.55
          : mobile
            ? 0.7
            : 0.8
        : Math.min(
            window.devicePixelRatio || 1,
            softwareRendering ? (mobile ? 0.65 : 0.75) : mobile ? 1.25 : 1.5,
          ),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.clearViewOffset();
    if (!mobile) camera.setViewOffset(width, height, -width * 0.23, 0, width, height);
    camera.updateProjectionMatrix();
    setCameraDestination();
    camera.position.copy(desiredCamera);
    camera.lookAt(cameraLookAt);
    renderScene();
    requestRender();
  }

  motionButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        paused = !paused;
        syncMotionControls();
        requestRender();
      },
      { signal },
    );
  });
  canvas.style.cursor = 'default';
  canvas.addEventListener(
    'pointermove',
    (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / height - 0.5) * 2;
    },
    { signal, passive: true },
  );
  canvas.addEventListener(
    'pointerleave',
    () => {
      pointerX = 0;
      pointerY = 0;
    },
    { signal },
  );
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      failed = true;
      markGalleryFallback(wrapper);
      cancelAnimationFrame(frame);
      frame = 0;
    },
    { signal },
  );
  reducedMotion.addEventListener(
    'change',
    () => {
      paused = reducedMotion.matches;
      syncMotionControls();
      requestRender();
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestRender();
    },
    { signal },
  );

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapper);
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestRender();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: '80px' },
  );
  intersectionObserver.observe(wrapper);
  syncMotionControls();
  resize();

  return () => {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        objectMaterials.forEach((material) => materials.add(material));
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    contactTexture?.dispose();
    keyLight.shadow.dispose();
    environmentTarget.dispose();
    renderer.dispose();
  };
}

function mountGalleries(): void {
  document.querySelectorAll<HTMLElement>('[data-gallery-scene]').forEach((wrapper) => {
    if (mountedGalleries.has(wrapper)) return;
    try {
      const dispose =
        wrapper.dataset.layout === 'field'
          ? createKineticField(wrapper)
          : createInteriorGallery(wrapper);
      mountedGalleries.set(wrapper, dispose);
    } catch {
      markGalleryFallback(wrapper);
    }
  });
}

function disposeGalleries(): void {
  mountedGalleries.forEach((dispose) => dispose());
  mountedGalleries.clear();
}

mountGalleries();
document.addEventListener('astro:page-load', mountGalleries);
document.addEventListener('astro:before-swap', disposeGalleries);
window.addEventListener('pagehide', disposeGalleries);
window.addEventListener('pageshow', mountGalleries);
