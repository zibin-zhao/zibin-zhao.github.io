import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ArchiveLeaf } from '../lib/archive-content';

export interface KineticInstrumentOptions {
  lowDetail: boolean;
  entries: readonly ArchiveLeaf[];
}

export interface ArchiveLeafSelection {
  index: number;
  amount: number;
}

export interface KineticInstrument {
  group: THREE.Group;
  leaves: readonly THREE.Group[];
  update: (
    openness: number,
    time: number,
    selection?: ArchiveLeafSelection | null,
    hoveredIndex?: number | null,
  ) => void;
  dispose: () => void;
}

type GeometryBucket = Map<THREE.Material, THREE.BufferGeometry[]>;

const LEAF_COUNT = 9;
const AXLE_HEIGHT = 1.28;
const LEAF_WIDTHS = [3.91, 4.19, 4.36, 4.22, 4.1, 3.97, 3.86, 3.72, 3.52];
const LEAF_HEIGHTS = [3.13, 3.2, 3.19, 3.13, 3.07, 2.98, 2.9, 2.81, 2.73];

function roundedRectangle(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function transformGeometry(
  geometry: THREE.BufferGeometry,
  position = new THREE.Vector3(),
  rotation = new THREE.Euler(),
): THREE.BufferGeometry {
  const matrix = new THREE.Matrix4().compose(
    position,
    new THREE.Quaternion().setFromEuler(rotation),
    new THREE.Vector3(1, 1, 1),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

function addPart(
  bucket: GeometryBucket,
  material: THREE.Material,
  geometry: THREE.BufferGeometry,
  position?: THREE.Vector3,
  rotation?: THREE.Euler,
): void {
  transformGeometry(geometry, position, rotation);
  const normalized = geometry.index ? geometry.toNonIndexed() : geometry;
  if (normalized !== geometry) geometry.dispose();
  // Stock geometries have different optional attributes. The machined parts use these three.
  Object.keys(normalized.attributes).forEach((name) => {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') normalized.deleteAttribute(name);
  });
  const geometries = bucket.get(material) || [];
  geometries.push(normalized);
  bucket.set(material, geometries);
}

function finishParts(bucket: GeometryBucket, target: THREE.Group, prefix: string): void {
  let index = 0;
  bucket.forEach((geometries, material) => {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `${prefix}-${index}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    target.add(mesh);
    index += 1;
  });
}

function createFinishTexture(brushed: boolean): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const noise = (x: number, y: number): number => {
    const value = Math.sin(x * 127.1 + y * 311.7 + 19.19) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const grain = brushed ? noise(x, 0) * 0.8 + noise(x, y) * 0.2 : noise(x, y);
      const value = Math.round((brushed ? 0.7 : 0.82) * 255 + (grain - 0.5) * 31);
      const offset = (y * size + x) * 4;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(brushed ? 18 : 15, brushed ? 2 : 15);
  texture.needsUpdate = true;
  return texture;
}

function wrapPrintedText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  limit: number,
): string[] {
  const tokens =
    text.match(
      /[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]|[^\s\u3400-\u9fff\u3000-\u303f\uff00-\uffef]+\s*/gu,
    ) || [];
  const lines: string[] = [];
  let current = '';
  for (const token of tokens) {
    if (current && context.measureText(current + token).width > width) {
      lines.push(current.trim());
      current = token.trimStart();
    } else {
      current += token;
    }
  }
  if (current) lines.push(current.trim());
  if (lines.length > limit) {
    lines.length = limit;
    let last = lines[limit - 1];
    while (last && context.measureText(`${last}…`).width > width) last = last.slice(0, -1);
    lines[limit - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function createFacePrint(
  index: number,
  entry: ArchiveLeaf | undefined,
  lowDetail: boolean,
): THREE.Texture {
  if (typeof document === 'undefined') {
    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    texture.needsUpdate = true;
    return texture;
  }
  const canvas = document.createElement('canvas');
  const width = lowDetail ? 512 : 1024;
  const height = Math.round((width * (LEAF_HEIGHTS[index] - 0.7)) / LEAF_WIDTHS[index]);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    texture.needsUpdate = true;
    return texture;
  }
  // Each leaf owns a correctly proportioned print. The material supplies the orange enamel.
  // Canvas top maps to the physical top edge; text is readable from the +Z face.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  const margin = width * 0.105;
  const measure = width - margin * 2;
  const font = 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textBaseline = 'top';
  context.fillStyle = '#303b30';
  context.font = `500 ${width * 0.024}px ${font}`;
  context.fillText(entry?.kicker || 'Z / Z', margin, height * 0.11, measure - width * 0.1);
  context.textAlign = 'right';
  context.font = `500 ${width * 0.032}px monospace`;
  context.fillText(String(index + 1).padStart(2, '0'), width - margin, height * 0.104);
  context.textAlign = 'left';
  context.fillRect(margin, height * 0.19, measure, Math.max(1, width * 0.0013));
  if (entry) {
    context.fillStyle = '#19251d';
    const titleSize = width * 0.074;
    context.font = `600 ${titleSize}px ${font}`;
    wrapPrintedText(context, entry.title, measure, 2).forEach((line, lineIndex) => {
      context.fillText(line, margin, height * 0.24 + lineIndex * titleSize * 1.08, measure);
    });
    const summarySize = width * 0.032;
    context.font = `400 ${summarySize}px ${font}`;
    wrapPrintedText(context, entry.summary, measure, 3).forEach((line, lineIndex) => {
      context.fillText(line, margin, height * 0.59 + lineIndex * summarySize * 1.32, measure);
    });
    context.fillStyle = '#384236';
    context.font = `500 ${width * 0.022}px ${font}`;
    context.fillText(
      entry.links[0]?.label || entry.id,
      margin,
      height * 0.9,
      measure - width * 0.09,
    );
  }
  context.fillStyle = '#53614f';
  for (let tick = 0; tick < 9; tick += 1) {
    context.fillRect(
      width - margin - tick * width * 0.006,
      height * 0.9,
      width * 0.0012,
      width * (tick % 4 === 0 ? 0.022 : 0.012),
    );
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = lowDetail ? 1 : 4;
  return texture;
}

function createLeafOutline(width: number, height: number, stemX: number): THREE.Shape {
  const left = -width / 2;
  const right = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(stemX - 0.12, 0.085);
  shape.lineTo(stemX + 0.12, 0.085);
  shape.lineTo(stemX + 0.12, 0.65);
  shape.quadraticCurveTo(stemX + 0.12, 0.87, stemX + 0.34, 0.87);
  shape.lineTo(right - 0.18, 0.87);
  shape.quadraticCurveTo(right, 0.87, right, 1.05);
  shape.lineTo(right, height - 0.4);
  shape.quadraticCurveTo(right, height - 0.23, right - 0.17, height - 0.2);
  shape.lineTo(0.92, height - 0.2);
  shape.quadraticCurveTo(0.8, height - 0.2, 0.74, height - 0.09);
  shape.quadraticCurveTo(0.68, height + 0.025, 0.53, height + 0.025);
  shape.lineTo(-0.54, height + 0.025);
  shape.quadraticCurveTo(-0.68, height + 0.025, -0.85, height - 0.05);
  shape.lineTo(left + 0.16, height - 0.27);
  shape.quadraticCurveTo(left, height - 0.32, left, height - 0.5);
  shape.lineTo(left, 1.05);
  shape.quadraticCurveTo(left, 0.87, left + 0.18, 0.87);
  shape.lineTo(stemX - 0.34, 0.87);
  shape.quadraticCurveTo(stemX - 0.12, 0.87, stemX - 0.12, 0.65);
  shape.closePath();
  return shape;
}

function createLeafGeometry(index: number, lowDetail: boolean): THREE.BufferGeometry {
  const width = LEAF_WIDTHS[index];
  const height = LEAF_HEIGHTS[index];
  const stemX = (index - 4) * 0.345;
  const shape = createLeafOutline(width, height, stemX);
  const source = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelSegments: lowDetail ? 2 : 3,
    steps: 1,
    bevelSize: 0.009,
    bevelThickness: 0.009,
    curveSegments: lowDetail ? 4 : 6,
  });
  const sourcePositions = source.getAttribute('position');
  const sourceNormals = source.getAttribute('normal');
  const fronts: number[] = [];
  const backs: number[] = [];

  const splitTriangle = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    target: number[],
  ): void => {
    const edgeLength = (start: THREE.Vector3, end: THREE.Vector3): number => {
      const foldedLip = Math.max(start.y, end.y) > height - 0.39;
      const yStep = foldedLip ? (lowDetail ? 0.15 : 0.095) : lowDetail ? 0.29 : 0.18;
      return Math.hypot((end.x - start.x) / (lowDetail ? 1.05 : 0.72), (end.y - start.y) / yStep);
    };
    const abLength = edgeLength(a, b);
    const bcLength = edgeLength(b, c);
    const caLength = edgeLength(c, a);
    if (Math.max(abLength, bcLength, caLength) <= 1) {
      target.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      return;
    }
    // Split the same long outline edges on caps and bevels before bending the sheet.
    // This keeps the curved perimeter joined instead of leaving a straight edge strip.
    if (abLength >= bcLength && abLength >= caLength) {
      const ab = a.clone().add(b).multiplyScalar(0.5);
      splitTriangle(a, ab, c, target);
      splitTriangle(ab, b, c, target);
    } else if (bcLength >= caLength) {
      const bc = b.clone().add(c).multiplyScalar(0.5);
      splitTriangle(a, b, bc, target);
      splitTriangle(a, bc, c, target);
    } else {
      const ca = c.clone().add(a).multiplyScalar(0.5);
      splitTriangle(a, b, ca, target);
      splitTriangle(ca, b, c, target);
    }
  };
  for (let vertex = 0; vertex < sourcePositions.count; vertex += 3) {
    const normalZ = sourceNormals.getZ(vertex);
    const back = normalZ < -0.45;
    const a = new THREE.Vector3().fromBufferAttribute(sourcePositions, vertex);
    const b = new THREE.Vector3().fromBufferAttribute(sourcePositions, vertex + 1);
    const c = new THREE.Vector3().fromBufferAttribute(sourcePositions, vertex + 2);
    splitTriangle(a, b, c, back ? backs : fronts);
  }
  source.dispose();

  const positions = fronts.concat(backs);
  const uv: number[] = [];
  const radius = 6.9 + index * 0.035;
  const deform = (x: number, y: number, depth: number): [number, number, number] => {
    const theta = y / radius;
    const lip = THREE.MathUtils.smoothstep(y, height - 0.34, height);
    const sideDish = Math.pow(x / (width / 2), 2) * Math.max(0, y - 0.7) * 0.012;
    return [
      x,
      radius * Math.sin(theta) - lip * lip * 0.038 - depth * Math.sin(theta),
      radius * (1 - Math.cos(theta)) + lip * lip * 0.12 + sideDish + depth * Math.cos(theta),
    ];
  };
  for (let vertex = 0; vertex < positions.length; vertex += 3) {
    const x = positions[vertex];
    const y = positions[vertex + 1];
    const depth = positions[vertex + 2] - 0.015;
    const isFront = vertex < fronts.length && positions[vertex + 2] > 0.026;
    uv.push(
      isFront ? THREE.MathUtils.clamp(x / width + 0.5, 0.01, 0.99) : 0.02,
      isFront ? THREE.MathUtils.clamp((y - 0.75) / (height - 0.7), 0.01, 0.99) : 0.02,
    );
    const point = deform(x, y, depth);
    positions[vertex] = point[0];
    positions[vertex + 1] = point[1];
    positions[vertex + 2] = point[2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.addGroup(0, fronts.length / 3, 0);
  geometry.addGroup(fronts.length / 3, backs.length / 3, 1);
  const merged = mergeVertices(geometry, 0.00001);
  geometry.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function createSocketScrew(lowDetail: boolean): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.051, 0, Math.PI * 2, false);
  const socket = new THREE.Path();
  for (let index = 0; index <= 6; index += 1) {
    const angle = (-index / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 0.023;
    const y = Math.sin(angle) * 0.023;
    if (index === 0) socket.moveTo(x, y);
    else socket.lineTo(x, y);
  }
  shape.holes.push(socket);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.019,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.004,
    bevelSegments: lowDetail ? 1 : 2,
    curveSegments: lowDetail ? 5 : 8,
  });
}

function createBearingProfile(lowDetail: boolean, long = false): THREE.LatheGeometry {
  const half = long ? 0.2 : 0.145;
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.11, -half),
      new THREE.Vector2(0.143, -half),
      new THREE.Vector2(0.165, -half + 0.021),
      new THREE.Vector2(0.165, half - 0.021),
      new THREE.Vector2(0.143, half),
      new THREE.Vector2(0.11, half),
      new THREE.Vector2(0.11, -half),
    ],
    lowDetail ? 20 : 32,
  );
}

function createSupport(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.73, 0.12);
  shape.lineTo(0.65, 0.12);
  shape.quadraticCurveTo(0.79, 0.12, 0.73, 0.28);
  shape.lineTo(0.23, 1.37);
  shape.quadraticCurveTo(0.17, 1.5, 0.02, 1.51);
  shape.quadraticCurveTo(-0.15, 1.49, -0.2, 1.34);
  shape.lineTo(-0.79, 0.29);
  shape.quadraticCurveTo(-0.87, 0.12, -0.73, 0.12);
  const opening = new THREE.Path();
  opening.moveTo(-0.31, 0.38);
  opening.lineTo(0.26, 0.38);
  opening.quadraticCurveTo(0.33, 0.38, 0.3, 0.47);
  opening.lineTo(0.045, 1.025);
  opening.quadraticCurveTo(0.005, 1.1, -0.04, 1.02);
  opening.lineTo(-0.36, 0.47);
  opening.quadraticCurveTo(-0.4, 0.38, -0.31, 0.38);
  shape.holes.push(opening);
  return shape;
}

/**
 * An original articulated archive instrument. +Z faces the viewer; X is the axle.
 * All parts rest on a structural frame at y=0. The object is a visual metaphor.
 * No renderer, lights, camera, network requests, or independent animation loop are created.
 */
export function createKineticInstrument({
  lowDetail,
  entries = [],
}: KineticInstrumentOptions): KineticInstrument {
  const group = new THREE.Group();
  group.name = 'kinetic-archive-instrument';
  const coatingTexture = createFinishTexture(false);
  const brushedTexture = createFinishTexture(true);
  const facePrints = Array.from({ length: LEAF_COUNT }, (_, index) =>
    createFacePrint(index, entries[index], lowDetail),
  );
  const enamel = new THREE.MeshPhysicalMaterial({
    color: '#d95622',
    metalness: 0.18,
    roughness: 0.47,
    roughnessMap: coatingTexture,
    clearcoat: lowDetail ? 0 : 0.27,
    clearcoatRoughness: 0.33,
  });
  const underside = new THREE.MeshStandardMaterial({
    color: '#30342e',
    metalness: 0.25,
    roughness: 0.57,
    roughnessMap: coatingTexture,
  });
  const aluminum = new THREE.MeshPhysicalMaterial({
    color: '#b5bbb5',
    metalness: 0.96,
    roughness: 0.35,
    roughnessMap: brushedTexture,
    anisotropy: lowDetail ? 0 : 0.55,
    anisotropyRotation: Math.PI / 2,
  });
  const frameFinish = new THREE.MeshStandardMaterial({
    color: '#45483e',
    metalness: 0.38,
    roughness: 0.56,
    roughnessMap: coatingTexture,
  });
  const accent = new THREE.MeshPhysicalMaterial({
    color: '#d95622',
    metalness: 0.18,
    roughness: 0.42,
    clearcoat: 0.2,
  });
  const staticParts: GeometryBucket = new Map();
  const radialSegments = lowDetail ? 20 : 32;
  const bevelSegments = lowDetail ? 2 : 3;
  const extrusion = {
    bevelEnabled: true,
    bevelSegments,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    curveSegments: lowDetail ? 4 : 6,
    steps: 1,
  };

  addPart(
    staticParts,
    aluminum,
    new THREE.CylinderGeometry(0.109, 0.109, 5.18, radialSegments),
    new THREE.Vector3(0, AXLE_HEIGHT, 0),
    new THREE.Euler(0, 0, Math.PI / 2),
  );
  for (const side of [-1, 1]) {
    const x = side * 2.26;
    const support = new THREE.ExtrudeGeometry(createSupport(), { ...extrusion, depth: 0.25 });
    support.translate(0, 0, -0.125);
    addPart(
      staticParts,
      frameFinish,
      support,
      new THREE.Vector3(x, 0, 0),
      new THREE.Euler(0, Math.PI / 2, 0),
    );
    const foot = new THREE.ExtrudeGeometry(roundedRectangle(0.61, 1.57, 0.14), {
      ...extrusion,
      depth: 0.1,
      bevelSize: 0.018,
      bevelThickness: 0.018,
    });
    addPart(
      staticParts,
      frameFinish,
      foot,
      new THREE.Vector3(x, 0.022, 0.02),
      new THREE.Euler(-Math.PI / 2, 0, 0),
    );
    const housing = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.111, -0.2),
        new THREE.Vector2(0.245, -0.2),
        new THREE.Vector2(0.274, -0.17),
        new THREE.Vector2(0.274, -0.13),
        new THREE.Vector2(0.258, -0.11),
        new THREE.Vector2(0.258, 0.11),
        new THREE.Vector2(0.274, 0.13),
        new THREE.Vector2(0.274, 0.17),
        new THREE.Vector2(0.245, 0.2),
        new THREE.Vector2(0.111, 0.2),
        new THREE.Vector2(0.111, -0.2),
      ],
      radialSegments,
    );
    addPart(
      staticParts,
      aluminum,
      housing,
      new THREE.Vector3(x, AXLE_HEIGHT, 0),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
    for (const z of [-0.55, 0.55]) {
      addPart(
        staticParts,
        aluminum,
        createSocketScrew(lowDetail),
        new THREE.Vector3(x, 0.15, z),
        new THREE.Euler(-Math.PI / 2, 0, 0),
      );
    }
  }
  const crossBrace = new THREE.ExtrudeGeometry(roundedRectangle(4.39, 0.21, 0.065), {
    ...extrusion,
    depth: 0.17,
    bevelSize: 0.022,
    bevelThickness: 0.02,
  });
  addPart(staticParts, frameFinish, crossBrace, new THREE.Vector3(0, 0.25, -0.38));
  const leftCap = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, -0.085),
      new THREE.Vector2(0.13, -0.085),
      new THREE.Vector2(0.175, -0.06),
      new THREE.Vector2(0.175, 0.06),
      new THREE.Vector2(0.15, 0.085),
      new THREE.Vector2(0, 0.085),
    ],
    radialSegments,
  );
  addPart(
    staticParts,
    aluminum,
    leftCap,
    new THREE.Vector3(-2.59, AXLE_HEIGHT, 0),
    new THREE.Euler(0, 0, Math.PI / 2),
  );
  // A stationary vernier scale contrasts with the moving orange handle.
  for (let index = 0; index < 17; index += 1) {
    const angle = -0.68 + index * 0.084;
    const y = AXLE_HEIGHT + Math.cos(angle) * 0.33;
    const z = Math.sin(angle) * 0.33;
    addPart(
      staticParts,
      frameFinish,
      new THREE.BoxGeometry(0.012, index % 4 === 0 ? 0.048 : 0.026, 0.008),
      new THREE.Vector3(2.478, y, z),
      new THREE.Euler(angle, 0, 0),
    );
  }
  finishParts(staticParts, group, 'frame');

  const leaves: THREE.Group[] = [];
  const leafMaterials: THREE.MeshPhysicalMaterial[] = [];
  const plates: THREE.Mesh[] = [];
  for (let index = 0; index < LEAF_COUNT; index += 1) {
    const leaf = new THREE.Group();
    leaf.name = `archive-leaf-${String(index + 1).padStart(2, '0')}`;
    leaf.userData.archiveLeafIndex = index;
    leaf.position.y = AXLE_HEIGHT;
    const frontMaterial = enamel.clone();
    frontMaterial.map = facePrints[index];
    frontMaterial.emissive.set('#d95622');
    frontMaterial.emissiveIntensity = 0;
    frontMaterial.color.offsetHSL((index - 4) * 0.001, 0, (index - 4) * 0.006);
    leafMaterials.push(frontMaterial);
    const plate = new THREE.Mesh(createLeafGeometry(index, lowDetail), [frontMaterial, underside]);
    // Render the nearer opaque leaves first so hidden fragments fail depth testing early.
    plate.renderOrder = LEAF_COUNT - index;
    plate.name = `folded-enamel-plate-${index + 1}`;
    plate.userData.archiveLeafIndex = index;
    plate.castShadow = true;
    plate.receiveShadow = true;
    plates.push(plate);
    leaf.add(plate);
    const hardware: GeometryBucket = new Map();
    const stemX = (index - 4) * 0.345;
    addPart(
      hardware,
      aluminum,
      createBearingProfile(lowDetail),
      new THREE.Vector3(stemX, 0, 0),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
    const strap = new THREE.ExtrudeGeometry(roundedRectangle(0.165, 0.62, 0.055), {
      ...extrusion,
      depth: 0.022,
      bevelSize: 0.007,
      bevelThickness: 0.005,
    });
    addPart(hardware, aluminum, strap, new THREE.Vector3(stemX, 0.44, -0.06));
    for (const y of [0.25, 0.68]) {
      addPart(hardware, aluminum, createSocketScrew(lowDetail), new THREE.Vector3(stemX, y, 0.035));
    }
    finishParts(hardware, leaf, 'hinge-and-fasteners');
    leaves.push(leaf);
    group.add(leaf);
  }

  const handle = new THREE.Group();
  handle.name = 'indexed-opening-handle';
  handle.position.set(2.63, AXLE_HEIGHT, 0);
  const handleParts: GeometryBucket = new Map();
  const grip = new THREE.CylinderGeometry(0.237, 0.237, 0.25, lowDetail ? 40 : 64, 1);
  const gripPositions = grip.getAttribute('position');
  for (let index = 0; index < gripPositions.count; index += 1) {
    const x = gripPositions.getX(index);
    const z = gripPositions.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius < 0.1) continue;
    const angle = Math.atan2(z, x);
    const scale = 1 + Math.cos(angle * (lowDetail ? 20 : 32)) * 0.035;
    gripPositions.setX(index, x * scale);
    gripPositions.setZ(index, z * scale);
  }
  grip.computeVertexNormals();
  addPart(handleParts, aluminum, grip, new THREE.Vector3(), new THREE.Euler(0, 0, Math.PI / 2));
  const thumb = new THREE.ExtrudeGeometry(roundedRectangle(0.13, 0.39, 0.063), {
    ...extrusion,
    depth: 0.08,
    bevelSize: 0.014,
    bevelThickness: 0.013,
  });
  addPart(
    handleParts,
    accent,
    thumb,
    new THREE.Vector3(0.126, 0.13, 0),
    new THREE.Euler(0, Math.PI / 2, 0),
  );
  addPart(
    handleParts,
    aluminum,
    createSocketScrew(lowDetail),
    new THREE.Vector3(0.132, 0, 0),
    new THREE.Euler(0, Math.PI / 2, 0),
  );
  finishParts(handleParts, handle, 'indexed-handle');
  group.add(handle);

  let disposed = false;
  const openAngles = [-0.77, -0.61, -0.435, -0.245, -0.04, 0.19, 0.44, 0.72, 1.025];
  const update = (
    openness: number,
    time: number,
    selection: ArchiveLeafSelection | null = null,
    hoveredIndex: number | null = null,
  ): void => {
    if (disposed) return;
    // The caller owns time. This object has no perpetual floating or unrelated idle motion.
    void time;
    const progress = THREE.MathUtils.clamp(Number.isFinite(openness) ? openness : 0, 0, 1);
    const selectedIndex =
      selection &&
      Number.isInteger(selection.index) &&
      selection.index >= 0 &&
      selection.index < LEAF_COUNT
        ? selection.index
        : -1;
    const focus =
      selectedIndex >= 0 && selection && Number.isFinite(selection.amount)
        ? THREE.MathUtils.clamp(selection.amount, 0, 1)
        : 0;
    leaves.forEach((leaf, index) => {
      const closed = -0.22 + index * 0.055;
      const opened = openAngles[index];
      const lag = ((LEAF_COUNT - 1 - index) / (LEAF_COUNT - 1)) * 0.12;
      const phase = THREE.MathUtils.smoothstep(progress, lag, 1);
      const originalAngle = THREE.MathUtils.lerp(closed, opened, phase);
      const selected = index === selectedIndex;
      const backgroundRank = index < selectedIndex ? index : index - 1;
      // Every bearing stays on the axle. The chosen leaf swings upright while its
      // neighbors rotate behind it, giving the real print an unobstructed reading face.
      const readingAngle = selected ? -0.36 : -1.5 + backgroundRank * 0.105;
      leaf.rotation.x = THREE.MathUtils.lerp(originalAngle, readingAngle, focus);
      if (index === hoveredIndex && !selected) leaf.rotation.x -= 0.025 * (1 - focus);
      leaf.userData.focusAmount = selected ? focus : 0;
      leafMaterials[index].emissiveIntensity = selected
        ? focus * 0.04
        : index === hoveredIndex
          ? 0.025
          : 0;
      plates[index].renderOrder =
        focus > 0.01 && selected ? 1 : LEAF_COUNT - index + (focus > 0.01 ? 1 : 0);
    });
    handle.rotation.x = -0.58 + progress * 1.16;
    group.userData.openness = progress;
  };
  update(0, 0);

  return {
    group,
    leaves,
    update,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>();
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      });
      geometries.forEach((geometry) => geometry.dispose());
      [enamel, underside, aluminum, frameFinish, accent, ...leafMaterials].forEach((material) =>
        material.dispose(),
      );
      [coatingTexture, brushedTexture, ...facePrints].forEach((texture) => texture.dispose());
    },
  };
}
