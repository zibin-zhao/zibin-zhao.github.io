import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type CollectionProp = {
  group: THREE.Group;
  anchor: THREE.Vector3;
  pickPoint: THREE.Vector3;
};

function canvasMap(paint: (context: CanvasRenderingContext2D) => void, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(size / 512, size / 512);
  paint(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function grain(context: CanvasRenderingContext2D, opacity = 0.045) {
  let seed = 20260908;
  for (let i = 0; i < 12000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = (seed / 4294967296) * 512;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const y = (seed / 4294967296) * 512;
    context.fillStyle = `rgba(60,50,36,${opacity})`;
    context.fillRect(x, y, 1.3, 1.3);
  }
}

export function createCollectionProps(
  lowDetail: boolean,
  onTextureReady?: () => void,
): Map<string, CollectionProp> {
  const result = new Map<string, CollectionProp>();
  const aluminum = new THREE.MeshStandardMaterial({
    color: '#c9ccc5',
    metalness: 0.92,
    roughness: 0.3,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#202922',
    metalness: 0.3,
    roughness: 0.32,
  });
  const orange = new THREE.MeshStandardMaterial({
    color: '#d65120',
    metalness: 0.08,
    roughness: 0.38,
  });
  const paper = new THREE.MeshStandardMaterial({ color: '#e5e1d4', roughness: 0.86 });
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: '#d4d3c8',
    metalness: 0.28,
    roughness: 0.54,
  });

  const box = (size: [number, number, number], material: THREE.Material, radius = 0.035) => {
    const geometry = new RoundedBoxGeometry(...size, lowDetail ? 2 : 3, radius);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const add = (
    name: string,
    group: THREE.Group,
    anchor: THREE.Vector3,
    pickPoint: THREE.Vector3,
  ) => {
    group.name = `collection-${name}`;
    result.set(name, { group, anchor, pickPoint });
  };

  const record = new THREE.Group();
  const sleeveMap = canvasMap((ctx) => {
    ctx.fillStyle = '#dcdace';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#c4c3b7';
    ctx.lineWidth = 1;
    for (let i = 32; i < 500; i += 24) {
      ctx.beginPath();
      ctx.moveTo(32, i);
      ctx.lineTo(480, i);
      ctx.stroke();
    }
    ctx.fillStyle = '#292f28';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ALONG THE WAY', 34, 50);
    ctx.font = '13px monospace';
    ctx.fillText('ZIBIN ZHAO / PERSONAL COLLECTION', 34, 478);
    grain(ctx);
  });
  const sleeve = box([2.25, 0.05, 2.25], paper, 0.02);
  sleeve.rotation.y = -0.16;
  sleeve.position.set(-0.15, 0.035, -0.17);
  record.add(sleeve);
  const sleevePrint = new THREE.Mesh(
    new THREE.PlaneGeometry(2.23, 2.23),
    new THREE.MeshStandardMaterial({ map: sleeveMap, roughness: 0.88 }),
  );
  sleevePrint.rotation.set(-Math.PI / 2, 0, 0.16);
  sleevePrint.position.copy(sleeve.position);
  sleevePrint.position.y = 0.062;
  record.add(sleevePrint);
  const vinyl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.02, 0.035, lowDetail ? 72 : 128),
    dark,
  );
  vinyl.position.set(0.12, 0.087, 0.12);
  vinyl.castShadow = true;
  record.add(vinyl);
  const vinylMap = canvasMap(
    (ctx) => {
      ctx.fillStyle = '#202820';
      ctx.fillRect(0, 0, 512, 512);
      for (let r = 87; r < 254; r += 1.45) {
        ctx.strokeStyle = r % 8 < 3 ? '#323b32' : '#283029';
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#c95527';
      ctx.beginPath();
      ctx.arc(256, 256, 83, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0e3c5';
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('SIDE A', 256, 234);
      ctx.font = '9px monospace';
      ctx.fillText('A FEW DETOURS', 256, 277);
      ctx.fillStyle = '#1e2920';
      ctx.beginPath();
      ctx.arc(256, 256, 8, 0, Math.PI * 2);
      ctx.fill();
    },
    lowDetail ? 512 : 1024,
  );
  const vinylFace = new THREE.Mesh(
    new THREE.CircleGeometry(1.019, lowDetail ? 72 : 128),
    new THREE.MeshStandardMaterial({ map: vinylMap, roughness: 0.4, metalness: 0.36 }),
  );
  vinylFace.rotation.x = -Math.PI / 2;
  vinylFace.position.set(0.12, 0.106, 0.12);
  record.add(vinylFace);
  add('about', record, new THREE.Vector3(-0.6, 0.25, 1.3), new THREE.Vector3(0.4, 0.108, 0.15));

  const makeScreen = (name: string, compact = false) => {
    const group = new THREE.Group();
    const base = box([compact ? 1.4 : 1.9, 0.13, compact ? 1 : 1.1], aluminum, 0.055);
    base.position.y = 0.09;
    group.add(base);
    const pedestal = box([0.28, 0.46, 0.24], aluminum, 0.025);
    pedestal.position.set(0, 0.31, -0.13);
    group.add(pedestal);
    const display = new THREE.Group();
    display.position.set(0, 0.98, -0.12);
    display.rotation.x = -0.12;
    const housing = box([compact ? 1.55 : 2.13, compact ? 1.11 : 1.4, 0.15], bodyMaterial, 0.065);
    display.add(housing);
    const bezel = box([compact ? 1.43 : 1.97, compact ? 0.94 : 1.21, 0.022], dark, 0.025);
    bezel.position.z = 0.084;
    bezel.position.y = 0.025;
    display.add(bezel);
    const paint = canvasMap((ctx) => {
      ctx.fillStyle = '#233329';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#b4bba4';
      ctx.font = '16px monospace';
      ctx.fillText('SELECTED SOFTWARE', 36, 57);
      ctx.fillStyle = '#f1edde';
      ctx.font = 'bold 68px sans-serif';
      ctx.fillText('CasMD', 33, 186);
      ctx.font = '27px sans-serif';
      ctx.fillText('DL-SELEX', 36, 290);
      ctx.fillText('TEMPO', 36, 349);
      ctx.fillStyle = '#dc713f';
      ctx.fillRect(36, 431, 44, 5);
      ctx.font = '16px monospace';
      ctx.fillText('BUILT TO BE USED', 100, 443);
    });
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: paint,
      roughness: 0.49,
      metalness: 0.04,
      emissive: '#ffffff',
      emissiveMap: paint,
      emissiveIntensity: 0.16,
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(compact ? 1.33 : 1.86, compact ? 0.84 : 1.1),
      screenMaterial,
    );
    screen.position.set(0, 0.025, 0.098);
    display.add(screen);
    const mark = box([0.1, 0.015, 0.012], orange, 0.004);
    mark.position.set(0, compact ? -0.49 : -0.63, 0.082);
    display.add(mark);
    group.add(display);
    if (name === 'singularity') {
      const actualPreview = document.querySelector<HTMLImageElement>(
        '[data-spatial-anchor="singularity"] img',
      );
      if (actualPreview) {
        const map = new THREE.TextureLoader().load(
          actualPreview.currentSrc || actualPreview.src,
          onTextureReady,
        );
        map.colorSpace = THREE.SRGBColorSpace;
        screenMaterial.map = map;
        screenMaterial.emissiveMap = map;
        paint?.dispose();
      }
    }
    add(name, group, new THREE.Vector3(0, 0.15, 1), new THREE.Vector3(0, 1.02, 0.02));
  };
  makeScreen('projects');
  makeScreen('singularity', true);

  const makePaper = (name: string, heading: string, subheading: string, count: number) => {
    const group = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const sheet = box([1.55, 0.018, 2.05], paper, 0.007);
      sheet.position.set(i * 0.032, 0.04 + i * 0.025, -i * 0.012);
      sheet.rotation.y = i * 0.025 - 0.07;
      group.add(sheet);
    }
    const printedMap = canvasMap((ctx) => {
      ctx.fillStyle = '#ebe7db';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#b9471c';
      ctx.font = '18px monospace';
      ctx.fillText(name === 'cv' ? 'CURRICULUM VITAE' : 'RESEARCH NOTEBOOK', 37, 48);
      ctx.fillStyle = '#263127';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(heading, 34, 127);
      ctx.font = '16px sans-serif';
      ctx.fillText(subheading, 36, 164);
      ctx.fillStyle = '#6d7568';
      for (let i = 0; i < 12; i++)
        ctx.fillRect(36, 214 + i * 17, i % 4 === 3 ? 257 : 433 - (i % 3) * 17, 1.15);
      ctx.font = '12px monospace';
      ctx.fillText(
        name === 'cv' ? 'ZIBIN ZHAO / HKUST' : 'ASK / READ / QUESTION / REVISE',
        36,
        475,
      );
      grain(ctx, 0.06);
    });
    const print = new THREE.Mesh(
      new THREE.PlaneGeometry(1.54, 2.04),
      new THREE.MeshStandardMaterial({ map: printedMap, roughness: 0.94 }),
    );
    print.rotation.set(-Math.PI / 2, 0, -(count - 1) * 0.025 + 0.07);
    print.position.set((count - 1) * 0.032, 0.05 + (count - 1) * 0.025, -(count - 1) * 0.012);
    group.add(print);
    const clip = box([0.25, 0.055, 0.6], aluminum, 0.023);
    clip.position.set(-0.51, 0.08 + count * 0.025, -0.74);
    group.add(clip);
    const tab = box([0.22, 0.014, 0.55], orange, 0.006);
    tab.position.set(0.75, 0.05 + count * 0.025, 0.36);
    group.add(tab);
    add(
      name,
      group,
      new THREE.Vector3(0, 0.2, 1.2),
      new THREE.Vector3(0.14, 0.06 + count * 0.025, 0.18),
    );
  };
  makePaper('prompts', 'Begin here.', 'Eight steps for a research review.', 6);
  makePaper('cv', 'Zibin Zhao.', 'Bioengineering / Research & projects', 3);

  const meditation = new THREE.Group();
  const tray = box([1.7, 0.14, 1.34], bodyMaterial, 0.07);
  tray.position.y = 0.07;
  meditation.add(tray);
  const stoneGeometry = new THREE.SphereGeometry(0.6, lowDetail ? 24 : 40, lowDetail ? 16 : 28);
  const positions = stoneGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const uneven = 1 + 0.065 * Math.sin(x * 7 + z * 3) * Math.cos(y * 5 - x);
    positions.setXYZ(i, x * uneven * 1.04, y * uneven * 0.54, z * uneven * 0.88);
  }
  stoneGeometry.computeVertexNormals();
  const stone = new THREE.Mesh(
    stoneGeometry,
    new THREE.MeshStandardMaterial({ color: '#666e5f', roughness: 0.79 }),
  );
  stone.position.set(-0.1, 0.46, 0);
  stone.rotation.y = 0.37;
  stone.castShadow = true;
  meditation.add(stone);
  const token = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 48), orange);
  token.position.set(0.55, 0.19, 0.36);
  token.castShadow = true;
  meditation.add(token);
  add('medit', meditation, new THREE.Vector3(0, 0.1, 0.98), new THREE.Vector3(0, 0.52, 0.22));

  const postcard = new THREE.Group();
  const card = box([1.6, 0.035, 1.1], paper, 0.015);
  card.position.y = 0.045;
  postcard.add(card);
  const postcardMap = canvasMap((ctx) => {
    ctx.fillStyle = '#e9e2d3';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#b5b3a3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(265, 38);
    ctx.lineTo(265, 463);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(285, 260 + i * 49);
      ctx.lineTo(480, 260 + i * 49);
      ctx.stroke();
    }
    ctx.fillStyle = '#ce602d';
    ctx.fillRect(408, 31, 72, 88);
    ctx.strokeStyle = '#f2e8d5';
    ctx.strokeRect(415, 38, 58, 74);
    ctx.fillStyle = '#29352a';
    ctx.font = 'bold 43px sans-serif';
    ctx.fillText('Hello.', 25, 236);
    ctx.font = '14px monospace';
    ctx.fillText('FROM HONG KONG', 25, 286);
    grain(ctx, 0.055);
  });
  const postcardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.58, 1.08),
    new THREE.MeshStandardMaterial({ map: postcardMap, roughness: 0.9 }),
  );
  postcardFace.rotation.x = -Math.PI / 2;
  postcardFace.position.y = 0.064;
  postcard.add(postcardFace);
  add('contact', postcard, new THREE.Vector3(0, 0.15, 0.9), new THREE.Vector3(0, 0.066, 0));
  return result;
}

export function disposeObjectTree(object: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
