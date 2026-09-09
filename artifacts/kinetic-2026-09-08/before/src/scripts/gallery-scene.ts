import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type GalleryMode = 'research' | 'projects' | 'play';

const mountedGalleries = new Map<HTMLElement, () => void>();
const galleryModes: GalleryMode[] = ['research', 'projects', 'play'];

function markGalleryFallback(wrapper: HTMLElement): void {
  wrapper.dataset.state = 'fallback';
  document.querySelectorAll<HTMLElement>('[data-gallery-controls]').forEach((controls) => {
    controls.hidden = true;
  });
}

// These commissioned-looking abstract objects are visual metaphors, not molecular models.
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

function createGallery(wrapper: HTMLElement): () => void {
  const canvas = wrapper.querySelector<HTMLCanvasElement>('.gallery-canvas');
  if (!canvas) return () => {};
  const isField = wrapper.dataset.layout === 'field';
  const page = wrapper.dataset.scene;
  const initialMode: GalleryMode =
    page === 'projects' || page === 'prompts'
      ? 'projects'
      : page === 'about' || page === 'contact'
        ? 'play'
        : 'research';
  wrapper.dataset.state = 'loading';
  wrapper.dataset.mode = isField ? 'field' : initialMode;
  wrapper.dataset.view = '0';

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
  // Each room brings a different physical exhibit onto the central plinth.
  const exhibitPoses = {
    research: [pose(0, 2.94, 0, 1), pose(3.35, 2.16, -0.82, 1), pose(-2.76, 1.51, -1.42, 0.85)],
    projects: [
      pose(-2.78, 1.64, -1.7, 0.3),
      pose(0.03, 2.9, 0.3, 2.8),
      pose(3.12, 1.55, -1.65, 0.8),
    ],
    play: [pose(3.2, 1.63, -1.7, 0.3), pose(-2.85, 1.84, -1.8, 0.8), pose(0, 3.04, 0.12, 2.7)],
  } satisfies Record<GalleryMode, ReturnType<typeof pose>[]>;
  const exhibitStates = [sculpturePivot, satellite, orbit].map((object, index) => ({
    object,
    position: exhibitPoses[initialMode][index].position.clone(),
    scale: exhibitPoses[initialMode][index].scale,
  }));

  type SpatialArtwork = {
    object: THREE.Group;
    anchor: THREE.Vector3;
    desktop: [number, number, number, number];
    mobile: [number, number, number, number];
    scale: number;
    hover: number;
    hoverTarget: number;
    restPosition: THREE.Vector3;
    mobileWorldPosition: THREE.Vector3 | null;
  };
  const spatialArtworks = new Map<string, SpatialArtwork>();
  const artworkPickPoints: Record<string, THREE.Vector3> = {
    research: new RibbonPath().getPoint(0.1),
    projects: new THREE.Vector3(0, 0, 0),
    singularity: new THREE.Vector3(0, 0, 0),
    about: new THREE.Vector3(0.45, 0, 0),
    medit: new THREE.Vector3(0, 0, 0),
    prompts: new THREE.Vector3(0.16, 0.2, -0.22),
    cv: new THREE.Vector3(0.14, 0.15, -0.08),
    contact: new THREE.Vector3(0, 0.42, 0),
  };
  const railway = new THREE.Group();
  const railwayCars: THREE.Group[] = [];
  let railwayPath: THREE.CatmullRomCurve3 | null = null;

  function registerArtwork(
    name: string,
    object: THREE.Group,
    desktop: SpatialArtwork['desktop'],
    mobile: SpatialArtwork['mobile'],
    anchor: THREE.Vector3,
  ): void {
    spatialArtworks.set(name, {
      object,
      desktop,
      mobile,
      anchor,
      scale: desktop[3],
      hover: 0,
      hoverTarget: 0,
      restPosition: new THREE.Vector3(...desktop.slice(0, 3)),
      mobileWorldPosition: null,
    });
    installation.add(object);
  }

  if (isField) {
    [plinth, footing, topEtching, architecturalRing, smallPlinth].forEach((object) => {
      object.visible = false;
    });
    registerArtwork(
      'research',
      sculpturePivot,
      [-3.55, 1.8, -1.45, 0.62],
      [-1.28, 1.45, -3.9, 0.44],
      new THREE.Vector3(-0.8, 2.6, 0),
    );
    registerArtwork(
      'projects',
      satellite,
      [3.05, 1.48, -1.9, 1.6],
      [1.2, 1.3, -3.15, 1.1],
      new THREE.Vector3(0, 1.15, 0),
    );
    registerArtwork(
      'singularity',
      orbit,
      [0.45, 2.15, 2.05, 1.3],
      [1.2, 1.75, 0.9, 0.95],
      new THREE.Vector3(1.15, 0.25, 0.25),
    );

    const graphite = new THREE.MeshStandardMaterial({
      color: '#202923',
      metalness: 0.24,
      roughness: 0.28,
    });
    const record = new THREE.Group();
    record.rotation.set(0.13, 0.12, -0.09);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.055, 2.1), concrete);
    sleeve.position.set(-0.13, -0.045, -0.1);
    sleeve.rotation.y = -0.16;
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    record.add(sleeve);
    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 0.94, 0.045, 112), graphite);
    vinyl.castShadow = true;
    record.add(vinyl);
    const recordLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 64), porcelain);
    record.add(recordLabel);
    for (let index = 0; index < 11; index += 1) {
      const groove = new THREE.Mesh(
        new THREE.TorusGeometry(0.4 + index * 0.047, 0.0025, 4, 112),
        silver,
      );
      groove.rotation.x = -Math.PI / 2;
      groove.position.y = 0.024;
      record.add(groove);
    }
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.053, 24), warmWhite);
    record.add(spindle);
    registerArtwork(
      'about',
      record,
      [-2.28, 0.65, 3.35, 1.05],
      [-1.17, 0.5, 3.2, 0.79],
      new THREE.Vector3(-0.5, 1.15, -0.15),
    );

    const meditation = new THREE.Group();
    const stoneGeometry = new THREE.SphereGeometry(0.67, 36, 24);
    const lowerStone = new THREE.Mesh(stoneGeometry, warmWhite);
    lowerStone.scale.set(1.12, 0.48, 0.88);
    lowerStone.castShadow = true;
    lowerStone.receiveShadow = true;
    meditation.add(lowerStone);
    const upperStone = new THREE.Mesh(stoneGeometry, silver);
    upperStone.position.set(0.12, 0.42, -0.02);
    upperStone.scale.set(0.61, 0.3, 0.55);
    upperStone.rotation.z = -0.09;
    upperStone.castShadow = true;
    meditation.add(upperStone);
    const quietMarker = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 16), porcelain);
    quietMarker.position.set(-0.48, 0.25, 0.31);
    meditation.add(quietMarker);
    registerArtwork(
      'medit',
      meditation,
      [3.46, 0.63, 3.5, 1.15],
      [1.2, 0.55, 4.55, 0.93],
      new THREE.Vector3(0, 1.13, 0),
    );

    const promptCards = new THREE.Group();
    promptCards.rotation.y = -0.23;
    for (let index = 0; index < 3; index += 1) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.32, 0.04, 0.92),
        index === 0 ? silver : warmWhite,
      );
      card.position.set(index * 0.08, index * 0.1, -index * 0.11);
      card.rotation.y = index * 0.08;
      card.castShadow = true;
      promptCards.add(card);
    }
    for (let index = 0; index < 4; index += 1) {
      const token = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.2),
        index === 0 ? porcelain : concrete,
      );
      token.position.set(-0.23 + index * 0.26, 0.27, -0.02);
      promptCards.add(token);
    }
    registerArtwork(
      'prompts',
      promptCards,
      [4.7, 0.72, 0.45, 1.05],
      [1.17, 0.6, -1.08, 0.9],
      new THREE.Vector3(0, 0.95, 0),
    );

    const folio = new THREE.Group();
    folio.rotation.y = -0.23;
    for (let index = 0; index < 3; index += 1) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.027, 1.85), warmWhite);
      sheet.position.set(index * 0.07, index * 0.075, -index * 0.04);
      sheet.rotation.y = index * 0.05;
      sheet.castShadow = true;
      folio.add(sheet);
    }
    const folioSpine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 1.8), porcelain);
    folioSpine.position.set(-0.58, 0.1, -0.02);
    folio.add(folioSpine);
    for (let index = 0; index < 5; index += 1) {
      const rule = new THREE.Mesh(
        new THREE.BoxGeometry(index === 0 ? 0.6 : 0.78, 0.008, 0.018),
        silver,
      );
      rule.position.set(0.12, 0.177, 0.4 - index * 0.19);
      folio.add(rule);
    }
    registerArtwork(
      'cv',
      folio,
      [-0.7, 0.4, -3.85, 1.06],
      [-0.87, 0.34, -7.2, 0.81],
      new THREE.Vector3(0, 1.08, 0),
    );

    const contact = new THREE.Group();
    const doorway = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.065, 16, 64, Math.PI),
      porcelain,
    );
    doorway.position.y = 0.44;
    contact.add(doorway);
    [-0.43, 0.43].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.45, 20), porcelain);
      leg.position.set(x, 0.22, 0);
      leg.castShadow = true;
      contact.add(leg);
    });
    const contactFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.09, 64), silver);
    contactFoot.position.y = -0.04;
    contact.add(contactFoot);
    const message = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), warmWhite);
    message.position.set(0, 0.42, 0);
    contact.add(message);
    registerArtwork(
      'contact',
      contact,
      [-4.65, 0.59, 1.1, 1.25],
      [-1.36, 0.65, -0.2, 1],
      new THREE.Vector3(0, 1.25, 0),
    );

    // A tiny model railway threads between the works, a personal rather than cosmic motif.
    const railPoints = Array.from({ length: 72 }, (_, index) => {
      const angle = (index / 72) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 6.15, 0.09, Math.sin(angle) * 4.8);
    });
    railwayPath = new THREE.CatmullRomCurve3(railPoints, true);
    [0.99, 1.012].forEach((scale) => {
      const rail = new THREE.Mesh(
        new THREE.TubeGeometry(railwayPath!, 220, 0.012, 5, true),
        silver,
      );
      rail.scale.set(scale, 1, scale);
      railway.add(rail);
    });
    for (let index = 0; index < 52; index += 1) {
      const point = railwayPath.getPointAt(index / 52);
      const tangent = railwayPath.getTangentAt(index / 52);
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.027, 0.037), concrete);
      sleeper.position.copy(point);
      sleeper.position.y -= 0.018;
      sleeper.rotation.y = Math.atan2(tangent.x, tangent.z);
      railway.add(sleeper);
    }
    for (let index = 0; index < 3; index += 1) {
      const carriage = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.19, 0.57),
        index === 0 ? porcelain : warmWhite,
      );
      body.position.y = 0.12;
      body.castShadow = true;
      carriage.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.043, 0.5), silver);
      roof.position.y = 0.232;
      carriage.add(roof);
      const windows = new THREE.Mesh(new THREE.BoxGeometry(0.247, 0.068, 0.43), graphite);
      windows.position.y = 0.153;
      carriage.add(windows);
      const undercarriage = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.45), graphite);
      undercarriage.position.y = 0.024;
      carriage.add(undercarriage);
      railwayCars.push(carriage);
      railway.add(carriage);
    }
    installation.add(railway);
  }

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
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const abortController = new AbortController();
  const { signal } = abortController;
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-mode]');
  const motionButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-motion]');
  const resetButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-reset]');
  const shuffleButtons = document.querySelectorAll<HTMLButtonElement>('[data-gallery-shuffle]');
  const spatialAnchors = document.querySelectorAll<HTMLElement>('[data-spatial-anchor]');
  const displayedAnchorPositions = new Map<HTMLElement, { x: number; y: number }>();
  const artworkRaycaster = new THREE.Raycaster();
  const pointerCoordinates = new THREE.Vector2();
  const pickableObjects = Array.from(spatialArtworks.values(), (artwork) => artwork.object);
  const artworkNames = new Map(
    Array.from(spatialArtworks, ([name, artwork]) => [artwork.object, name]),
  );
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
  let currentMode: GalleryMode = initialMode;
  let dragStart: { x: number; y: number; rotation: number } | null = null;
  let dragTarget = 0;
  let dragCurrent = 0;
  let shuffleStep = 0;
  let pointerX = 0;
  let pointerY = 0;
  let cameraMoving = false;
  let hoveredArtwork: string | null = null;
  let desiredCamera = new THREE.Vector3();
  const cameraLookAt = new THREE.Vector3(0, isField ? 0.65 : 2.35, 0);
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
    if (isField) {
      desiredCamera = mobile ? new THREE.Vector3(0.2, 16.6, 14) : new THREE.Vector3(3, 7.8, 10.8);
      if (mobile) desiredCamera.multiplyScalar(Math.max(1, 0.35 / camera.aspect));
      if (!mobile && camera.aspect < 1.35) desiredCamera.multiplyScalar(1.35 / camera.aspect);
      return;
    }
    const fit = mobile ? Math.max(1, 1.02 / camera.aspect) : 1;
    desiredCamera = motionOffsets[currentMode].clone().multiplyScalar(fit);
    if (wrapper.dataset.scene !== 'home') desiredCamera.multiplyScalar(1.08);
  }

  function renderScene(): void {
    if (disposed || failed) return;
    try {
      renderer.render(scene, camera);
      projectSpatialAnchors();
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

  function updateExhibits(ease: number): boolean {
    let moving = false;
    exhibitStates.forEach((exhibit, index) => {
      const target = exhibitPoses[currentMode][index];
      exhibit.position.lerp(target.position, ease);
      exhibit.scale = THREE.MathUtils.lerp(exhibit.scale, target.scale, ease);
      exhibit.object.position.copy(exhibit.position);
      exhibit.object.scale.setScalar(exhibit.scale);
      if (
        exhibit.position.distanceToSquared(target.position) > 0.00001 ||
        Math.abs(exhibit.scale - target.scale) > 0.0001
      ) {
        moving = true;
      }
    });
    return moving;
  }

  function placeSpatialArtworks(): void {
    if (!isField) return;
    spatialArtworks.forEach((artwork) => {
      const [x, y, z, scale] = mobile ? artwork.mobile : artwork.desktop;
      artwork.object.position.set(x, y, z);
      artwork.restPosition.set(x, y, z);
      artwork.scale = scale;
      artwork.object.scale.setScalar(scale);
    });
    railway.scale.set(mobile ? 0.46 : 1, 1, mobile ? 1.65 * Math.max(1, height / 1120) : 1);
    if (mobile) calibrateMobileSpatialArtworks();
  }

  function calibrateMobileSpatialArtworks(): void {
    if (!isField || !mobile) return;
    camera.updateMatrixWorld(true);
    installation.updateMatrixWorld(true);
    const stageBounds = wrapper.getBoundingClientRect();
    const identity = document
      .querySelector<HTMLElement>('.field-identity')
      ?.getBoundingClientRect();
    const clearTop = identity ? identity.bottom - stageBounds.top + 12 : 245;
    const targetSizes: Record<string, [number, number]> = {
      research: [112, 102],
      projects: [103, 104],
      singularity: [112, 105],
      about: [116, 64],
      medit: [103, 62],
      prompts: [107, 62],
      cv: [88, 49],
      contact: [85, 81],
    };
    spatialAnchors.forEach((anchor) => {
      const name = anchor.dataset.spatialAnchor || '';
      const artwork = spatialArtworks.get(name);
      if (!artwork) return;
      const label = anchor.getBoundingClientRect();
      const [targetWidth, targetHeight] = targetSizes[name];
      const targetX = label.left - stageBounds.left + label.width / 2;
      const targetY = Math.max(
        clearTop + targetHeight / 2,
        label.top -
          stageBounds.top +
          label.height / 2 -
          Math.max(42, label.height / 2 + targetHeight * 0.18 + 10),
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2((targetX / width) * 2 - 1, -(targetY / height) * 2 + 1),
        camera,
      );
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -artwork.mobile[1]);
      const worldPosition = ray.ray.intersectPlane(plane, new THREE.Vector3());
      if (!worldPosition) return;
      artwork.mobileWorldPosition = worldPosition.clone();
      artwork.object.position.copy(installation.worldToLocal(worldPosition.clone()));
      artwork.restPosition.copy(artwork.object.position);
      artwork.object.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(artwork.object);
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            const point = new THREE.Vector3(x, y, z).project(camera);
            const screenX = (point.x * 0.5 + 0.5) * width;
            const screenY = (-point.y * 0.5 + 0.5) * height;
            left = Math.min(left, screenX);
            right = Math.max(right, screenX);
            top = Math.min(top, screenY);
            bottom = Math.max(bottom, screenY);
          }
        }
      }
      const fit = Math.min(
        targetWidth / Math.max(1, right - left),
        targetHeight / Math.max(1, bottom - top),
      );
      artwork.scale *= fit;
      artwork.object.scale.setScalar(artwork.scale);
    });
  }

  function alignMobileSpatialArtworks(): void {
    if (!isField || !mobile) return;
    installation.updateMatrixWorld(true);
    spatialArtworks.forEach((artwork) => {
      if (!artwork.mobileWorldPosition) return;
      // Keep a quarter of the spatial orbit so touch dragging moves the actual exhibit.
      artwork.object.position
        .copy(installation.worldToLocal(artwork.mobileWorldPosition.clone()))
        .lerp(artwork.mobileWorldPosition, 0.25);
      artwork.restPosition.copy(artwork.object.position);
    });
  }

  function updateSpatialArtworks(ease: number): boolean {
    if (!isField) return false;
    let moving = false;
    spatialArtworks.forEach((artwork) => {
      artwork.hover = THREE.MathUtils.lerp(artwork.hover, artwork.hoverTarget, ease);
      artwork.object.scale.setScalar(artwork.scale * (1 + artwork.hover * 0.075));
      if (Math.abs(artwork.hover - artwork.hoverTarget) > 0.001) moving = true;
    });
    if (railwayPath) {
      railwayCars.forEach((carriage, index) => {
        const progress = (elapsed * 0.018 + 0.14 - index * 0.017 + 1) % 1;
        carriage.position.copy(railwayPath!.getPointAt(progress));
        const tangent = railwayPath!.getTangentAt(progress);
        carriage.rotation.y = Math.atan2(tangent.x, tangent.z);
      });
    }
    return moving;
  }

  function projectSpatialAnchors(): void {
    if (!isField) return;
    installation.updateMatrixWorld(true);
    const marginX = mobile ? 88 : 110;
    const marginY = mobile ? 115 : 110;
    const labels: {
      anchor: HTMLElement;
      x: number;
      y: number;
      halfWidth: number;
      halfHeight: number;
    }[] = [];
    spatialAnchors.forEach((anchor) => {
      const artwork = spatialArtworks.get(anchor.dataset.spatialAnchor || '');
      if (!artwork) return;
      const projected = artwork.object.localToWorld(artwork.anchor.clone()).project(camera);
      const meshPoint = artworkPickPoints[anchor.dataset.spatialAnchor || ''];
      if (meshPoint) {
        const objectPoint = artwork.object.localToWorld(meshPoint.clone()).project(camera);
        anchor.dataset.objectX = ((objectPoint.x * 0.5 + 0.5) * width).toFixed(2);
        anchor.dataset.objectY = ((-objectPoint.y * 0.5 + 0.5) * height).toFixed(2);
      }
      const x = THREE.MathUtils.clamp((projected.x * 0.5 + 0.5) * width, marginX, width - marginX);
      const y = THREE.MathUtils.clamp(
        (-projected.y * 0.5 + 0.5) * height,
        marginY,
        height - marginY,
      );
      const bounds = anchor.getBoundingClientRect();
      labels.push({
        anchor,
        x,
        y,
        halfWidth: bounds.width / 2 + 12,
        halfHeight: bounds.height / 2 + 12,
      });
    });
    if (!mobile) {
      const fieldBounds = wrapper.getBoundingClientRect();
      const reserved = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.field-identity, .field-instructions, .field-controls',
        ),
      ).map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          x: bounds.left - fieldBounds.left + bounds.width / 2,
          y: bounds.top - fieldBounds.top + bounds.height / 2,
          halfWidth: bounds.width / 2 + 22,
          halfHeight: bounds.height / 2 + 18,
        };
      });
      // Screen-space labels stay near their exhibits while preserving readable gaps.
      for (let pass = 0; pass < 14; pass += 1) {
        for (let first = 0; first < labels.length; first += 1) {
          for (let second = first + 1; second < labels.length; second += 1) {
            const a = labels[first];
            const b = labels[second];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const overlapX = a.halfWidth + b.halfWidth - Math.abs(dx);
            const overlapY = a.halfHeight + b.halfHeight - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;
            if (overlapX < overlapY) {
              const shift = (overlapX / 2 + 0.5) * (dx < 0 ? -1 : 1);
              a.x -= shift;
              b.x += shift;
            } else {
              const shift = (overlapY / 2 + 0.5) * (dy < 0 ? -1 : 1);
              a.y -= shift;
              b.y += shift;
            }
          }
        }
        labels.forEach((label) => {
          reserved.forEach((obstacle) => {
            const dx = label.x - obstacle.x;
            const dy = label.y - obstacle.y;
            const overlapX = label.halfWidth + obstacle.halfWidth - Math.abs(dx);
            const overlapY = label.halfHeight + obstacle.halfHeight - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) return;
            if (overlapX < overlapY) label.x += (overlapX + 1) * (dx < 0 ? -1 : 1);
            else label.y += (overlapY + 1) * (dy < 0 ? -1 : 1);
          });
          const horizontalMargin = Math.max(marginX, label.halfWidth + 24);
          label.x = THREE.MathUtils.clamp(label.x, horizontalMargin, width - horizontalMargin);
          label.y = THREE.MathUtils.clamp(
            label.y,
            Math.max(marginY, label.halfHeight + 86),
            height - Math.max(80, label.halfHeight + 36),
          );
        });
      }
    }
    labels.forEach(({ anchor, x, y }) => {
      const displayed = displayedAnchorPositions.get(anchor);
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      // Ambient motion should not make reading or acquiring a link a moving target.
      if (!displayed || Math.hypot(roundedX - displayed.x, roundedY - displayed.y) > 3) {
        anchor.style.setProperty('--anchor-x', `${roundedX}px`);
        anchor.style.setProperty('--anchor-y', `${roundedY}px`);
        displayedAnchorPositions.set(anchor, { x: roundedX, y: roundedY });
      }
      anchor.dataset.projected = 'true';
    });
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
    const exhibitsMoving = isField
      ? updateSpatialArtworks(ease)
      : updateExhibits(1 - Math.exp(-delta * 5.8));
    dragCurrent = THREE.MathUtils.lerp(dragCurrent, dragTarget, ease);
    if (isField) installation.rotation.y = dragCurrent;
    alignMobileSpatialArtworks();
    sculpturePivot.rotation.y =
      0.25 +
      (!isField && currentMode === 'research' ? dragCurrent : 0) +
      Math.sin(elapsed * 0.12) * 0.15;
    sculpturePivot.rotation.z = -0.13 + Math.sin(elapsed * 0.18) * 0.035;
    const projectY = isField
      ? spatialArtworks.get('projects')!.restPosition.y
      : exhibitStates[1].position.y;
    satellite.position.y = projectY + Math.sin(elapsed * 0.46 + 0.9) * 0.09;
    satellite.rotation.y =
      -0.48 +
      (!isField && currentMode === 'projects' ? dragCurrent : 0) +
      Math.sin(elapsed * 0.2) * 0.12;
    const orbitY = isField
      ? spatialArtworks.get('singularity')!.restPosition.y
      : exhibitStates[2].position.y;
    orbit.position.y = orbitY + Math.sin(elapsed * 0.42 + 2) * 0.075;
    orbit.rotation.y = !isField && currentMode === 'play' ? dragCurrent : 0;
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
    if (!paused || cameraMoving || exhibitsMoving || Math.abs(dragCurrent - dragTarget) > 0.0001) {
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
    if (!mobile && !isField) {
      const offset = wrapper.dataset.scene === 'home' ? 0.205 : 0.23;
      camera.setViewOffset(width, height, -width * offset, 0, width, height);
    }
    camera.updateProjectionMatrix();
    setCameraDestination();
    camera.position.copy(desiredCamera);
    camera.lookAt(cameraLookAt);
    if (isField && scene.fog instanceof THREE.Fog) {
      scene.fog.near = mobile ? desiredCamera.length() + 8 : 16;
      scene.fog.far = mobile ? desiredCamera.length() + 35 : 36;
      camera.far = mobile ? Math.max(70, desiredCamera.length() + 55) : 70;
      camera.updateProjectionMatrix();
    }
    placeSpatialArtworks();
    renderScene();
    requestRender();
  }

  function setMode(mode: GalleryMode, snap = reducedMotion.matches): void {
    if (isField) return;
    currentMode = mode;
    wrapper.dataset.mode = mode;
    dragTarget = 0;
    modeButtons.forEach((button) => {
      const active = button.dataset.galleryMode === mode;
      button.dataset.active = String(active);
      button.setAttribute('aria-pressed', String(active));
    });
    setCameraDestination();
    if (snap) {
      camera.position.copy(desiredCamera);
      updateExhibits(1);
      dragCurrent = 0;
    }
    requestRender();
  }

  window.addEventListener(
    'gallery:mode',
    (event) => {
      const mode = (event as CustomEvent<{ mode?: GalleryMode }>).detail?.mode;
      if (mode && galleryModes.includes(mode)) setMode(mode);
    },
    { signal },
  );
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
  resetButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        dragTarget = 0;
        shuffleStep = 0;
        wrapper.dataset.view = '0';
        if (reducedMotion.matches) dragCurrent = 0;
        requestRender();
      },
      { signal },
    );
  });
  shuffleButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        if (!isField) return;
        shuffleStep += 1;
        const angles = [0.26, -0.27, 0.34, -0.32, 0.1];
        dragTarget = angles[(shuffleStep - 1) % angles.length];
        wrapper.dataset.view = String(shuffleStep);
        if (reducedMotion.matches) dragCurrent = dragTarget;
        requestRender();
      },
      { signal },
    );
  });
  spatialAnchors.forEach((anchor) => {
    const artwork = spatialArtworks.get(anchor.dataset.spatialAnchor || '');
    if (!artwork) return;
    const hover = (active: boolean): void => {
      artwork.hoverTarget = active ? 1 : 0;
      if (reducedMotion.matches) artwork.hover = artwork.hoverTarget;
      requestRender();
    };
    anchor.addEventListener('pointerenter', () => hover(true), { signal });
    anchor.addEventListener('pointerleave', () => hover(false), { signal });
    anchor.addEventListener('focus', () => hover(true), { signal });
    anchor.addEventListener('blur', () => hover(false), { signal });
  });

  function pickArtwork(event: PointerEvent): string | null {
    if (!isField || failed || disposed) return null;
    const bounds = canvas!.getBoundingClientRect();
    pointerCoordinates.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    artworkRaycaster.setFromCamera(pointerCoordinates, camera);
    const hit = artworkRaycaster.intersectObjects(pickableObjects, true)[0];
    if (!hit) return null;
    let object: THREE.Object3D | null = hit.object;
    while (object && object !== installation) {
      const name = artworkNames.get(object as THREE.Group);
      if (name) return name;
      object = object.parent;
    }
    return null;
  }

  function setHoveredArtwork(name: string | null): void {
    if (name === hoveredArtwork) return;
    hoveredArtwork = name;
    spatialArtworks.forEach((artwork, artworkName) => {
      const anchor = Array.from(spatialAnchors).find(
        (item) => item.dataset.spatialAnchor === artworkName,
      );
      artwork.hoverTarget =
        artworkName === name || anchor?.matches(':hover, :focus-visible') ? 1 : 0;
      if (reducedMotion.matches) artwork.hover = artwork.hoverTarget;
    });
    canvas!.style.cursor = name ? 'pointer' : 'grab';
    requestRender();
  }

  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || disposed || failed) return;
      dragStart = { x: event.clientX, y: event.clientY, rotation: dragTarget };
      if (!coarsePointer.matches) canvas.setPointerCapture(event.pointerId);
      canvas.dataset.dragging = 'true';
      canvas.style.cursor = 'grabbing';
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / height - 0.5) * 2;
      if (!dragStart) {
        if (!coarsePointer.matches) setHoveredArtwork(pickArtwork(event));
        return;
      }
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (coarsePointer.matches && Math.abs(dy) > Math.abs(dx)) return;
      dragTarget = isField
        ? THREE.MathUtils.clamp(dragStart.rotation + dx * 0.0025, -0.35, 0.35)
        : dragStart.rotation + dx * 0.007;
      if (reducedMotion.matches) dragCurrent = dragTarget;
      requestRender();
    },
    { signal, passive: true },
  );
  const endDrag = (): void => {
    dragStart = null;
    canvas.dataset.dragging = 'false';
    canvas.style.cursor = hoveredArtwork ? 'pointer' : 'grab';
  };
  canvas.addEventListener(
    'pointerup',
    (event) => {
      const start = dragStart;
      const moved = start ? Math.hypot(event.clientX - start.x, event.clientY - start.y) : Infinity;
      const name = moved < (event.pointerType === 'touch' ? 10 : 6) ? pickArtwork(event) : null;
      endDrag();
      if (!name) return;
      const anchor = Array.from(spatialAnchors).find((item) => item.dataset.spatialAnchor === name);
      if (anchor instanceof HTMLAnchorElement) anchor.click();
    },
    { signal },
  );
  canvas.addEventListener('pointercancel', endDrag, { signal });
  canvas.addEventListener('lostpointercapture', endDrag, { signal });
  canvas.addEventListener(
    'pointerleave',
    () => {
      pointerX = 0;
      pointerY = 0;
      setHoveredArtwork(null);
      if (coarsePointer.matches) endDrag();
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
  if (isField) spatialAnchors.forEach((anchor) => resizeObserver.observe(anchor));
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
  setMode(initialMode, true);
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
      mountedGalleries.set(wrapper, createGallery(wrapper));
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
