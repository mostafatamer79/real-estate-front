import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface BuildingSceneController {
  playIntro: (onComplete: () => void, onFloorChange: (floorIndex: number) => void) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

export interface BuildingSceneOptions {
  container: HTMLElement;
  onUnavailable: () => void;
}

const FLOOR_COUNT = 4;
const TOUR_DURATION_SECONDS = 20;
const FLOOR_STEP_SECONDS = 5;

function smoothstep01(value: number): number {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (t * (t * 6 - 15) + 10);
}

function defaultCameraFraming(aspect: number) {
  const narrow = Number.isFinite(aspect) && aspect < 0.8;
  return {
    position: narrow ? ([40, 29, 49] as const) : ([28, 24, 36] as const),
    target: [0, 8.5, 0] as const,
    fov: narrow ? 46 : 42,
  };
}

export function createBuildingScene({
  container,
  onUnavailable,
}: BuildingSceneOptions): BuildingSceneController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  const isCoarseOrNarrow =
    window.matchMedia("(pointer: coarse)").matches || container.clientWidth < 768;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isCoarseOrNarrow ? 1 : 1.25);

  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e8e1d5");
  scene.fog = new THREE.Fog("#e8e1d5", 65, 120);

  const envScene = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(envScene, 0.04);
  envScene.dispose();
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.32;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 150);
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const textures: THREE.Texture[] = [];
  const screenMaterials = new Map<string, THREE.MeshBasicMaterial>();

  function addScreen(
    parent: THREE.Object3D,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    title: string,
    lines: string[],
  ) {
    let mat = screenMaterials.get(title);
    if (!mat) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      if (ctx) {
        ctx.fillStyle = "#f4f1e9";
        ctx.fillRect(0, 0, 512, 256);
        ctx.direction = "rtl";
        ctx.textAlign = "right";
        ctx.fillStyle = "#354453";
        ctx.font = "bold 33px Arial";
        ctx.fillText(title, 475, 64);
        ctx.fillStyle = "#7c8a8f";
        ctx.font = "19px Arial";
        lines.slice(0, 4).forEach((line, idx) => {
          ctx.fillText(line, 475, 108 + idx * 35);
        });
        ctx.fillStyle = "#ad936d";
        ctx.fillRect(29, 31, 5, 191);
        tex.needsUpdate = true;
      }
      mat = new THREE.MeshBasicMaterial({ map: tex });
      screenMaterials.set(title, mat);
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
  }

  function makeProceduralTexture(kind: "stone" | "wood" | "fabric"): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = kind === "wood" ? "#b59b78" : kind === "fabric" ? "#ccc9c0" : "#e4dfd4";
      ctx.fillRect(0, 0, 128, 128);
      let seed = 27;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      if (kind === "wood") {
        for (let i = 0; i < 90; i++) {
          ctx.strokeStyle = `rgba(83,57,32,${0.03 + rand() * 0.08})`;
          ctx.lineWidth = 0.35 + rand() * 0.5;
          ctx.beginPath();
          const x = rand() * 128;
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + 5, 40, x - 6, 85, x + 2, 128);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 2000; i++) {
          ctx.fillStyle = `rgba(75,71,65,${rand() * 0.07})`;
          ctx.fillRect(rand() * 128, rand() * 128, 1, kind === "fabric" ? 3 : 1);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    textures.push(tex);
    return tex;
  }

  const stoneMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: makeProceduralTexture("stone"),
    roughness: 0.88,
  });
  const slabMat = new THREE.MeshStandardMaterial({ color: "#faf7ef", roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({
    color: "#6f6558",
    roughness: 0.38,
    metalness: 0.25,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: makeProceduralTexture("wood"),
    roughness: 0.62,
  });
  const fabricMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: makeProceduralTexture("fabric"),
    roughness: 0.98,
  });
  const rugMat = new THREE.MeshStandardMaterial({ color: "#a8a9a5", roughness: 1 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: "#8ca2ac",
    roughness: 0.18,
    metalness: 0.3,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: "#fff0cc",
    emissive: "#ffdca0",
    emissiveIntensity: 0.55,
  });
  const foliageMat = new THREE.MeshStandardMaterial({ color: "#73816d", roughness: 1 });
  const groundMat = new THREE.MeshStandardMaterial({ color: "#dedbd3", roughness: 1 });

  const hemi = new THREE.HemisphereLight("#fff7e5", "#a7a49a", 1.7);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight("#fff4de", 2.4);
  sun.position.set(18, 30, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isCoarseOrNarrow ? 512 : 1024, isCoarseOrNarrow ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 27, bottom: -24 });
  sun.shadow.bias = -0.001;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight("#d9e5f2", 0.65);
  fillLight.position.set(-12, 10, 6);
  scene.add(fillLight);

  function addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    castShadow = false,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addRoundedBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    radius = 0.045,
  ) {
    const r = Math.min(radius, w / 3, h / 3, d / 3);
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, r), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addSofa(parent: THREE.Object3D, x: number, z: number, width = 2.1, dir = 1) {
    addRoundedBox(parent, width, 0.22, 1, x, 0.65, z, woodMat);
    addRoundedBox(parent, width - 0.16, 0.2, 0.88, x, 0.86, z + 0.03, fabricMat, 0.08);
    addRoundedBox(parent, width, 0.68, 0.22, x, 1.02, z - 0.46 * dir, fabricMat, 0.08);
    for (const side of [-1, 1]) {
      addRoundedBox(parent, 0.19, 0.42, 0.95, x + side * (width / 2 - 0.08), 1, z, fabricMat, 0.06);
    }
  }

  function addPlanter(parent: THREE.Object3D, x: number, z: number, baseY = 0.4) {
    addBox(parent, 0.85, 0.6, 0.85, x, baseY + 0.3, z, stoneMat);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), foliageMat);
    bush.position.set(x, baseY + 1, z);
    parent.add(bush);
  }

  function addWorkstation(parent: THREE.Object3D, x: number, z: number) {
    addRoundedBox(parent, 2, 0.09, 1.05, x, 1.18, z, woodMat);
    for (const side of [-1, 1]) {
      addBox(parent, 0.055, 0.8, 0.75, x + side * 0.85, 0.75, z, metalMat);
    }
    addBox(parent, 0.7, 0.48, 0.07, x, 1.58, z - 0.15, metalMat);
    addScreen(parent, 0.63, 0.4, x, 1.58, z - 0.11, "مساحة العمل", [
      "الأملاك  ·  المالية",
      "الطلبات  ·  المستندات",
    ]);
    addBox(parent, 0.1, 0.2, 0.1, x, 1.38, z - 0.15, metalMat);
    addRoundedBox(parent, 0.65, 0.14, 0.65, x, 0.82, z + 0.8, fabricMat, 0.07);
    addRoundedBox(parent, 0.65, 0.65, 0.12, x, 1.03, z + 1.08, fabricMat, 0.055);
    addBox(parent, 0.06, 0.4, 0.06, x, 0.56, z + 0.8, metalMat);
    addBox(parent, 0.65, 0.045, 0.08, x, 0.37, z + 0.8, metalMat);
  }

  function addVillaModel(parent: THREE.Object3D, x: number, z: number, scale = 1) {
    addRoundedBox(parent, 2.4 * scale, 0.7, 2 * scale, x, 0.7, z, stoneMat);
    addBox(parent, 1.6 * scale, 0.9 * scale, 1.35 * scale, x, 1.05 + 0.45 * scale, z, slabMat);
    addBox(parent, 0.75 * scale, 0.5 * scale, 1.1 * scale, x - 0.4 * scale, 1.05 + 1.15 * scale, z, slabMat);
    addBox(parent, 1.8 * scale, 0.08 * scale, 1.5 * scale, x, 1.05 + 0.94 * scale, z, woodMat);
    addBox(parent, 1.05 * scale, 0.45 * scale, 0.035, x, 1.05 + 0.47 * scale, z + 0.68 * scale, glassMat);
    addBox(parent, 0.32 * scale, 0.65 * scale, 0.04, x + 0.58 * scale, 1.05 + 0.33 * scale, z + 0.68 * scale, metalMat);
  }

  // Ground and plinth
  addBox(scene, 120, 0.15, 120, 0, -0.6, 0, groundMat);
  addBox(rootGroup, 21, 0.3, 17, 0, -0.3, 0.6, stoneMat, true);
  addBox(rootGroup, 17.5, 0.2, 14, 0, -0.05, 0.4, slabMat, true);
  for (const side of [-1, 1]) {
    addPlanter(rootGroup, side * 8.3, 5.5, -0.1);
    addPlanter(rootGroup, side * 8.3, -4.5, -0.1);
  }
  for (let i = -5; i <= 5; i++) {
    addBox(rootGroup, 0.025, 0.01, 16, i * 1.8, -0.14, 0.6, groundMat);
  }

  const floors = Array.from({ length: FLOOR_COUNT }, (_, floorIdx) => {
    const group = new THREE.Group();
    group.position.y = floorIdx * 4.4;
    group.userData.floor = floorIdx;
    rootGroup.add(group);

    const accent = new THREE.MeshStandardMaterial({
      color: "#b2bbc7",
      emissive: "#7184a7",
      emissiveIntensity: floorIdx === 0 ? 0.65 : 0.03,
    });

    addBox(group, 14.5, 0.3, 11.5, 0, 0.15, 0, slabMat, true);
    addBox(group, 14.6, 0.06, 0.1, 0, 0.32, 5.8, accent);
    addBox(group, 0.1, 0.06, 11.5, 7.3, 0.32, 0, accent);
    addBox(group, 0.1, 0.06, 11.5, -7.3, 0.32, 0, accent);
    addBox(group, 14, 2.6, 0.25, 0, 1.65, -5.4, stoneMat);

    for (const side of [-1, 1]) {
      for (const z of [-5.1, 5.1]) {
        addBox(group, 0.35, 3.7, 0.35, side * 6.8, 2.1, z, metalMat, true);
      }
      addBox(group, 0.08, 2.8, 10, side * 7, 1.8, 0, glassMat);
      for (let louver = -2; louver <= 2; louver++) {
        addBox(group, 0.25, 3.15, 0.1, side * 7.1, 1.9, louver * 2, woodMat);
      }
    }

    addBox(group, 13.4, 0.9, 0.07, 0, 0.85, 5.4, glassMat);
    addBox(group, 13.8, 0.07, 0.11, 0, 1.33, 5.4, metalMat);

    for (const x of [-4.5, 0, 4.5]) {
      addBox(group, 0.055, 0.035, 7, x, 3.65, -0.4, lampMat);
    }

    if (floorIdx === 0) {
      addRoundedBox(group, 4.2, 1.05, 1.25, 2.5, 0.85, -2.5, woodMat, 0.09);
      addRoundedBox(group, 4.5, 0.09, 1.45, 2.5, 1.43, -2.5, slabMat);
      addBox(group, 0.75, 0.5, 0.06, 2.5, 1.74, -2.65, metalMat);
      addBox(group, 6.3, 0.018, 4.8, -3.1, 0.315, 1.6, rugMat);
      for (const x of [-4.8, -2.5]) {
        addSofa(group, x, 1, 1.9);
      }
      addRoundedBox(group, 1.6, 0.09, 1.1, -3.5, 0.75, 2.7, woodMat, 0.08);
      addBox(group, 0.7, 0.35, 0.6, -3.5, 0.52, 2.7, metalMat);
      for (let slat = -7; slat <= 7; slat++) {
        addBox(group, 0.08, 2.3, 0.1, slat * 0.25 - 2, 1.7, -5.2, woodMat);
      }
      addPlanter(group, 5.6, 3.8);
    } else if (floorIdx === 1) {
      addBox(group, 12, 0.018, 7.2, 0, 0.315, -0.3, rugMat);
      for (const x of [-3.7, 1.3]) {
        addRoundedBox(group, 3, 0.09, 1.6, x, 1.15, -0.8, woodMat, 0.09);
        for (const side of [-1, 1]) {
          addSofa(group, x, -0.8 + side * 1.7, 2.1, side > 0 ? -1 : 1);
          addBox(group, 0.055, 0.8, 1.1, x + side, 0.7, -0.8, metalMat);
        }
      }
      for (let step = 0; step < 3; step++) {
        addBox(group, 1, 0.5 + step * 0.25, 1, 5, 0.55 + step * 0.125, -3 + step * 2, slabMat);
      }
      addPlanter(group, 5.3, 3.5);
    } else if (floorIdx === 2) {
      for (const x of [-4.3, -0.5, 3.3]) {
        for (const z of [-2.2, 1.4]) {
          addWorkstation(group, x, z);
        }
      }
      for (let shelf = 0; shelf < 4; shelf++) {
        addBox(group, 0.55, 2, 1.1, -6.5, 1.3, -3.5 + shelf * 1.8, woodMat);
      }
      addPlanter(group, 5.7, -3.5);
    } else {
      addVillaModel(group, -4.5, 0.8, 1.1);
      addVillaModel(group, 4.5, -2.5, 0.85);
      addVillaModel(group, 4.5, 1, 1.1);
      for (let block = 0; block < 3; block++) {
        addBox(group, 0.7, 1.1 + block * 0.2, 0.7, -5.5, 0.9 + block * 0.1, -3.5 + block * 1.5, stoneMat);
      }
      addBox(group, 2.5, 1.2, 0.5, 5, 1, -1.5, metalMat);
      addPlanter(group, 5.5, 3.7);
    }

    return { group, accent };
  });

  const roofGroup = new THREE.Group();
  rootGroup.add(roofGroup);
  addBox(roofGroup, 14.8, 0.22, 11.8, 0, 0, 0, slabMat, true);
  for (let slat = -7; slat <= 7; slat++) {
    addBox(roofGroup, 0.12, 0.16, 11.8, slat, 0.2, 0, woodMat);
  }
  roofGroup.position.y = 17.6;

  function mergeStaticChildren(group: THREE.Group) {
    const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of [...group.children]) {
      if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) continue;
      const list = byMaterial.get(child.material) || [];
      list.push(child);
      byMaterial.set(child.material, list);
    }
    group.updateMatrix();
    for (const [material, meshes] of byMaterial) {
      if (meshes.length < 2) continue;
      const geoms = meshes.map((mesh) => {
        mesh.updateMatrix();
        const cloned = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();
        return cloned.applyMatrix4(mesh.matrix);
      });
      const merged = mergeGeometries(geoms);
      geoms.forEach((g) => g.dispose());
      if (!merged) continue;
      const combined = new THREE.Mesh(merged, material);
      combined.castShadow = meshes.some((m) => m.castShadow);
      combined.receiveShadow = true;
      meshes.forEach((m) => {
        group.remove(m);
        m.geometry.dispose();
      });
      group.add(combined);
    }
  }

  floors.forEach((f) => mergeStaticChildren(f.group));
  mergeStaticChildren(roofGroup);
  mergeStaticChildren(rootGroup);

  let rafId = 0;
  let disposed = false;
  let reducedMotion = false;
  let hiddenAt = 0;
  let activeTour: {
    started: number;
    onComplete: () => void;
    onFloorChange: (idx: number) => void;
  } | null = null;
  let lastReportedFloor = -1;
  const targetVec = new THREE.Vector3();

  const renderFrame = () => {
    rafId = 0;
    if (disposed || document.hidden) return;

    const elapsed = activeTour
      ? Math.min(TOUR_DURATION_SECONDS, (performance.now() - activeTour.started) / 1000)
      : 0;
    const floorIdx = Math.min(FLOOR_COUNT - 1, Math.floor(elapsed / FLOOR_STEP_SECONDS));
    const localTime = elapsed - floorIdx * FLOOR_STEP_SECONDS;
    const floorTransition = smoothstep01(localTime / 0.8);
    const prevFloor = Math.max(0, floorIdx - 1);
    const interpolatedFloor = prevFloor + (floorIdx - prevFloor) * floorTransition;

    const separation = reducedMotion
      ? 0
      : smoothstep01((elapsed - 1) / 2.5) * (1 - smoothstep01((elapsed - 18) / 2));

    floors.forEach(({ group, accent }, idx) => {
      group.position.y = idx * (4.4 + 1.65 * separation);
      group.position.x = reducedMotion ? 0 : idx === floorIdx ? 0.45 : 0;
      accent.emissiveIntensity = reducedMotion ? 0.08 : idx === floorIdx ? 0.75 : 0.025;
    });
    roofGroup.position.y = 17.6 + 6.6 * separation;

    const framing = defaultCameraFraming(camera.aspect);
    const portrait = camera.aspect < 1.2;
    const focusY = reducedMotion ? 8.5 : 5.8 + interpolatedFloor * (4.4 + 1.65 * separation) * 0.45;
    rootGroup.rotation.y = reducedMotion ? 0 : Math.sin((elapsed / TOUR_DURATION_SECONDS) * Math.PI) * 0.16;

    if (activeTour) {
      const introEase = 1 - smoothstep01(elapsed / 1.8);
      camera.position.set(
        portrait ? 36 + introEase * 6 : 26 + introEase * 5,
        focusY + (portrait ? 21 : 18),
        portrait ? 51 + introEase * 7 : 38 + introEase * 5,
      );
      targetVec.set(0, focusY, 0);
    } else {
      camera.position.fromArray(framing.position);
      targetVec.fromArray(framing.target);
    }

    camera.fov = framing.fov;
    camera.lookAt(targetVec);
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);

    container.dataset.activeFloor = String(floorIdx + 1);
    container.dataset.presentationSeconds = elapsed.toFixed(2);
    container.dataset.floorSeparation = separation.toFixed(3);

    if (activeTour && floorIdx !== lastReportedFloor) {
      lastReportedFloor = floorIdx;
      activeTour.onFloorChange(floorIdx);
    }

    if (activeTour && elapsed >= TOUR_DURATION_SECONDS) {
      const complete = activeTour.onComplete;
      activeTour = null;
      queueMicrotask(complete);
      return;
    }

    if (activeTour && !reducedMotion) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  };

  const requestRender = () => {
    if (!disposed && !rafId && !document.hidden) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    renderer.setSize(width, height);
    requestRender();
  });
  resizeObserver.observe(container);

  const onVisibilityChange = () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    } else {
      if (activeTour && hiddenAt) {
        activeTour.started += performance.now() - hiddenAt;
      }
      hiddenAt = 0;
      requestRender();
    }
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    onUnavailable();
  };

  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibilityChange);
  requestRender();

  return {
    playIntro(onComplete, onFloorChange) {
      if (reducedMotion) return;
      lastReportedFloor = -1;
      activeTour = {
        started: performance.now(),
        onComplete,
        onFloorChange,
      };
      requestRender();
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
      if (reduced) activeTour = null;
      requestRender();
    },
    dispose() {
      disposed = true;
      activeTour = null;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);

      const materials = new Set<THREE.Material>();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const list = Array.isArray(obj.material) ? obj.material : [obj.material];
          list.forEach((m) => materials.add(m));
        }
      });
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
