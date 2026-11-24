import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { buildingOverviewPose, floorPresentation, floorTourPose, floorTransitionDuration, advanceTourProgress, modelDragPose } from "@/lib/home-walkthrough";

type FloorProjection = { floor: number; x: number; y: number; visible: boolean };

/** Four batched architectural levels with a scroll-driven cinematic camera. */
export function createBuildingScene(host: HTMLDivElement, projectFloors: (floors: FloorProjection[]) => void, selectFloor: (floor: number) => void, reportBoard: (floor: number, feature: number) => void = () => {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  const mobileDevice = matchMedia("(pointer: coarse)").matches || host.clientWidth < 768;
  const pixelRatio = Math.min(devicePixelRatio, mobileDevice ? 1 : 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = !mobileDevice;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9e6df");
  scene.fog = new THREE.Fog("#e9e6df", 65, 120);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 150);
  const model = new THREE.Group();
  scene.add(model);
  const textures: THREE.Texture[] = [];
  const signPainters: ((dark: boolean) => void)[] = [];
  const signs = new Map<string, THREE.MeshBasicMaterial>();
  let guideData: { name: string; items: string[][] }[] = [];
  let manualFeature: number | null = null;
  let reportedFloor = -1, reportedFeature = -1;
  function sign(parent: THREE.Object3D, w: number, h: number, x: number, y: number, z: number, title: string, rows: string[]) {
    let material = signs.get(title);
    if (!material) {
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
      const context = canvas.getContext("2d")!;
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
      const paint = (dark: boolean) => {
        context.fillStyle = dark ? "#182735" : "#f4f1e9"; context.fillRect(0, 0, 512, 256);
        context.direction = "rtl"; context.textAlign = "right"; context.fillStyle = dark ? "#e7dfd0" : "#354453";
        context.font = "bold 33px Arial"; context.fillText(title, 475, 64);
        context.fillStyle = dark ? "#91a7bb" : "#7c8a8f"; context.font = "19px Arial";
        rows.slice(0, 4).forEach((row, index) => { context.fillText(row, 475, 108 + index * 35); });
        context.fillStyle = "#ad936d"; context.fillRect(29, 31, 5, 191); texture.needsUpdate = true;
      };
      paint(false); signPainters.push(paint); material = new THREE.MeshBasicMaterial({ map: texture }); signs.set(title, material);
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); mesh.position.set(x, y, z); parent.add(mesh);
  }
  function finish(kind: "wood" | "stone" | "fabric") {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = kind === "wood" ? "#b59b78" : kind === "fabric" ? "#ccc9c0" : "#e4dfd4";
    context.fillRect(0, 0, 128, 128);
    let seed = 27;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    if (kind === "wood") {
      for (let line = 0; line < 90; line++) {
        context.strokeStyle = `rgba(83,57,32,${.03 + random() * .08})`; context.lineWidth = .35 + random() * .5;
        context.beginPath(); const x = random() * 128;
        context.moveTo(x, 0); context.bezierCurveTo(x + 5, 40, x - 6, 85, x + 2, 128); context.stroke();
      }
    } else {
      for (let dot = 0; dot < 2000; dot++) { context.fillStyle = `rgba(75,71,65,${random() * .07})`; context.fillRect(random() * 128, random() * 128, 1, kind === "fabric" ? 3 : 1); }
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; textures.push(texture); return texture;
  }
  const stone = new THREE.MeshStandardMaterial({ color: "#ffffff", map: finish("stone"), roughness: 0.88 });
  const white = new THREE.MeshStandardMaterial({ color: "#faf7ef", roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: "#6f6558", roughness: 0.38, metalness: 0.25 });
  const wood = new THREE.MeshStandardMaterial({ color: "#ffffff", map: finish("wood"), roughness: 0.62 });
  const fabric = new THREE.MeshStandardMaterial({ color: "#ffffff", map: finish("fabric"), roughness: 0.98 });
  const rug = new THREE.MeshStandardMaterial({ color: "#a8a9a5", roughness: 1 });
  const glass = new THREE.MeshStandardMaterial({ color: "#8ca2ac", roughness: 0.18, metalness: 0.3, transparent: true, opacity: 0.23, depthWrite: false });
  const warm = new THREE.MeshStandardMaterial({ color: "#fff0cc", emissive: "#ffdca0", emissiveIntensity: 0.55 });
  const green = new THREE.MeshStandardMaterial({ color: "#73816d", roughness: 1 });
  const ground = new THREE.MeshStandardMaterial({ color: "#dedbd3", roughness: 1 });
  const ambient = new THREE.HemisphereLight("#fff7e5", "#a7a49a", 1.7);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff4de", 2.4);
  sun.position.set(18, 30, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 27, bottom: -24 });
  sun.shadow.bias = -0.001; scene.add(sun);
  const fill = new THREE.DirectionalLight("#d9e5f2", .65); fill.position.set(-12, 10, 6); scene.add(fill);

  function box(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, shadow = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function rounded(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, radius = .045) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w / 3, h / 3, d / 3)), material);
    mesh.position.set(x, y, z); mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sofa(parent: THREE.Object3D, x: number, z: number, width = 2.1, facing = 1) {
    rounded(parent, width, .22, 1, x, .65, z, wood);
    rounded(parent, width - .16, .2, .88, x, .86, z + .03, fabric, .08);
    rounded(parent, width, .68, .22, x, 1.02, z - .46 * facing, fabric, .08);
    for (const side of [-1, 1]) rounded(parent, .19, .42, .95, x + side * (width / 2 - .08), 1, z, fabric, .06);
  }
  function plant(parent: THREE.Object3D, x: number, z: number, y = 0.4) {
    box(parent, 0.85, 0.6, 0.85, x, y + 0.3, z, stone);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), green);
    crown.position.set(x, y + 1, z); parent.add(crown);
  }
  function desk(parent: THREE.Object3D, x: number, z: number) {
    rounded(parent, 2, 0.09, 1.05, x, 1.18, z, wood);
    for (const side of [-1, 1]) box(parent, 0.055, 0.8, 0.75, x + side * 0.85, 0.75, z, metal);
    box(parent, 0.7, 0.48, 0.07, x, 1.58, z - 0.15, metal);
    sign(parent, .63, .4, x, 1.58, z - .11, "مساحة العمل", ["الأملاك  ·  المالية", "الطلبات  ·  المستندات"]);
    box(parent, 0.1, 0.2, 0.1, x, 1.38, z - 0.15, metal);
    rounded(parent, .65, .14, .65, x, .82, z + .8, fabric, .07);
    rounded(parent, .65, .65, .12, x, 1.03, z + 1.08, fabric, .055);
    box(parent, .06, .4, .06, x, .56, z + .8, metal);
    box(parent, .65, .045, .08, x, .37, z + .8, metal);
  }
  function smallHouse(parent: THREE.Object3D, x: number, z: number, scale = 1) {
    rounded(parent, 2.4 * scale, .7, 2 * scale, x, .7, z, stone);
    box(parent, 1.6 * scale, .9 * scale, 1.35 * scale, x, 1.05 + .45 * scale, z, white);
    box(parent, .75 * scale, .5 * scale, 1.1 * scale, x - .4 * scale, 1.05 + 1.15 * scale, z, white);
    box(parent, 1.8 * scale, .08 * scale, 1.5 * scale, x, 1.05 + .94 * scale, z, wood);
    box(parent, 1.05 * scale, .45 * scale, .035, x, 1.05 + .47 * scale, z + .68 * scale, glass);
    box(parent, .32 * scale, .65 * scale, .04, x + .58 * scale, 1.05 + .33 * scale, z + .68 * scale, metal);
  }
  // A shallow landscaped plinth anchors the building, without background towers.
  box(scene, 120, 0.15, 120, 0, -0.6, 0, ground);
  box(model, 21, 0.3, 17, 0, -0.3, 0.6, stone, true);
  box(model, 17.5, 0.2, 14, 0, -0.05, 0.4, white, true);
  for (const side of [-1, 1]) { plant(model, side * 8.3, 5.5, -0.1); plant(model, side * 8.3, -4.5, -0.1); }
  for (let i = -5; i <= 5; i++) box(model, 0.025, 0.01, 16, i * 1.8, -0.14, 0.6, ground);

  const floors = Array.from({ length: 4 }, (_, floor) => {
    const group = new THREE.Group(); group.position.y = floor * 4.4; group.userData.floor = floor; model.add(group);
    const accent = new THREE.MeshStandardMaterial({ color: "#b2bbc7", emissive: "#7184a7", emissiveIntensity: floor === 0 ? 0.65 : 0.03 });
    box(group, 14.5, 0.3, 11.5, 0, 0.15, 0, white, true);
    box(group, 14.6, 0.06, 0.1, 0, 0.32, 5.8, accent);
    box(group, 0.1, 0.06, 11.5, 7.3, 0.32, 0, accent);
    box(group, 0.1, 0.06, 11.5, -7.3, 0.32, 0, accent);
    // Cutaway front and a glazed side keep each floor's purpose visible.
    box(group, 14, 2.6, 0.25, 0, 1.65, -5.4, stone);
    for (const side of [-1, 1]) {
      for (const z of [-5.1, 5.1]) box(group, 0.35, 3.7, 0.35, side * 6.8, 2.1, z, metal, true);
      box(group, 0.08, 2.8, 10, side * 7, 1.8, 0, glass);
      for (let bay = -2; bay <= 2; bay++) box(group, 0.25, 3.15, 0.1, side * 7.1, 1.9, bay * 2, wood);
    }
    // Low front balustrade reads as an open architectural section, rather than a wall.
    box(group, 13.4, 0.9, 0.07, 0, 0.85, 5.4, glass);
    box(group, 13.8, 0.07, 0.11, 0, 1.33, 5.4, metal);
    for (const x of [-4.5, 0, 4.5]) box(group, 0.055, 0.035, 7, x, 3.65, -0.4, warm);
    if (floor === 0) {
      // Reception: welcome desk, lounge seating, and an information wall.
      rounded(group, 4.2, 1.05, 1.25, 2.5, 0.85, -2.5, wood, .09);
      rounded(group, 4.5, 0.09, 1.45, 2.5, 1.43, -2.5, white);
      box(group, 0.75, 0.5, 0.06, 2.5, 1.74, -2.65, metal);
      box(group, 6.3, .018, 4.8, -3.1, .315, 1.6, rug);
      for (const x of [-4.8, -2.5]) sofa(group, x, 1, 1.9);
      rounded(group, 1.6, .09, 1.1, -3.5, .75, 2.7, wood, .08);
      box(group, .7, .35, .6, -3.5, .52, 2.7, metal);
      for (let i = -7; i <= 7; i++) box(group, 0.08, 2.3, 0.1, i * 0.25 - 2, 1.7, -5.2, wood);
      plant(group, 5.6, 3.8);
    } else if (floor === 1) {
      // Services: consultation tables, presentation wall, and a material display.
      box(group, 12, .018, 7.2, 0, .315, -.3, rug);
      for (const x of [-3.7, 1.3]) {
        rounded(group, 3, .09, 1.6, x, 1.15, -.8, wood, .09);
        for (const side of [-1, 1]) {
          sofa(group, x, -.8 + side * 1.7, 2.1, side > 0 ? -1 : 1);
          box(group, .055, .8, 1.1, x + side, .7, -.8, metal);
        }
      }
      for (let i = 0; i < 3; i++) box(group, 1, 0.5 + i * 0.25, 1, 5, 0.55 + i * 0.125, -3 + i * 2, white);
      plant(group, 5.3, 3.5);
    } else if (floor === 2) {
      // Internal: actual workstations and document storage, not empty windows.
      for (const x of [-4.3, -0.5, 3.3]) for (const z of [-2.2, 1.4]) desk(group, x, z);
      for (let i = 0; i < 4; i++) box(group, .55, 2, 1.1, -6.5, 1.3, -3.5 + i * 1.8, wood);
      plant(group, 5.7, -3.5);
    } else {
      // Offers & requests: a small property gallery, city models, and search kiosks.
      smallHouse(group, -4.5, .8, 1.1); smallHouse(group, 4.5, -2.5, .85); smallHouse(group, 4.5, 1, 1.1);
      for (let i = 0; i < 3; i++) box(group, .7, 1.1 + i * .2, .7, -5.5, .9 + i * .1, -3.5 + i * 1.5, stone);
      box(group, 2.5, 1.2, 0.5, 5, 1, -1.5, metal);
      plant(group, 5.5, 3.7);
    }
    return { group, accent };
  });
  const roof = new THREE.Group(); model.add(roof);
  box(roof, 14.8, 0.22, 11.8, 0, 0, 0, white, true);
  for (let x = -7; x <= 7; x++) box(roof, 0.12, 0.16, 11.8, x, 0.2, 0, wood);
  roof.position.y = 17.6;

  // Merge within each level, preserving floor selection while reducing draw calls.
  function batch(parent: THREE.Object3D) {
    const groups = new Map<THREE.Material, THREE.Mesh[]>();
    for (const object of [...parent.children]) {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) continue;
      const entries = groups.get(object.material) || []; entries.push(object); groups.set(object.material, entries);
    }
    parent.updateMatrix();
    for (const [material, meshes] of groups) {
      if (meshes.length < 2) continue;
      const copies = meshes.map(mesh => { mesh.updateMatrix(); return (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrix); });
      const geometry = mergeGeometries(copies); copies.forEach(copy => copy.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, material);
      merged.castShadow = meshes.some(mesh => mesh.castShadow); merged.receiveShadow = true;
      meshes.forEach(mesh => { parent.remove(mesh); mesh.geometry.dispose(); }); parent.add(merged);
    }
  }
  floors.forEach(floor => batch(floor.group)); batch(roof); batch(model);

  let active = 0, expanded = false, angle = 0, targetAngle = 0, frame = 0, stopped = false, reduced = false;
  let tilt = 0, targetTilt = 0;
  let tour = 0, targetTour = 0;
  let queuedTour: number | null = null;
  let lastFrameTime = 0;
  let focus: { started: number; duration: number; destination: number; path: THREE.CatmullRomCurve3; aim: THREE.CatmullRomCurve3; fov: number; endFov: number; offset: number } | null = null;
  let offsetFactor = 1;
  let intro: { started: number; complete: () => void; progress: (value: number) => void } | null = null;
  const look = new THREE.Vector3();
  const targets = floors.map((_, floor) => floorPresentation(floor, 0, false));
  const anchor = new THREE.Vector3();
  const render = () => {
    frame = 0; if (stopped || document.hidden) return;
    let unsettled = false;
    const now = performance.now();
    const delta = lastFrameTime ? Math.min(40, now - lastFrameTime) : 16.7;
    lastFrameTime = now;
    const factor = reduced ? 1 : 1 - Math.exp(-delta / 130);
    const approach = (value: number, target: number) => Math.abs(value - target) < 0.003 ? target : value + (target - value) * factor;
    tour = reduced || focus ? targetTour : advanceTourProgress(tour, targetTour, delta, camera.aspect, expanded);
    if (tour !== targetTour) unsettled = true;
    const phase = tour - Math.floor(tour);
    const viewedFloor = active;
    const count = guideData[viewedFloor]?.items.length || 1;
    const feature = manualFeature ?? Math.min(count - 1, Math.max(0, Math.floor((phase - .42) / .45 * count)));
    if (viewedFloor !== reportedFloor || feature !== reportedFeature) {
      reportedFloor = viewedFloor; reportedFeature = feature; reportBoard(viewedFloor, feature);
    }
    const wantedAngle = phase > .15 && phase < .86 ? 0 : targetAngle;
    angle = approach(angle, wantedAngle); model.rotation.y = angle;
    tilt = approach(tilt, targetTilt); model.rotation.x = tilt;
    if (angle !== wantedAngle) { unsettled = true; renderer.shadowMap.needsUpdate = true; }
    if (tilt !== targetTilt) { unsettled = true; renderer.shadowMap.needsUpdate = true; }
    floors.forEach(({ group, accent }, index) => {
      const target = targets[index];
      group.position.y = approach(group.position.y, target.y);
      group.position.x = approach(group.position.x, target.x);
      accent.emissiveIntensity = index === viewedFloor ? 1 : 0.04;
      if (group.position.y !== target.y || group.position.x !== target.x) { unsettled = true; renderer.shadowMap.needsUpdate = true; }
    });
    const roofY = expanded ? 22 : 17.6;
    roof.position.y = approach(roof.position.y, roofY);
    if (roof.position.y !== roofY) { unsettled = true; renderer.shadowMap.needsUpdate = true; }
    const pose = buildingOverviewPose(camera.aspect);
    camera.position.fromArray(pose.position); look.fromArray(pose.target);
    camera.fov = pose.fov;
    if (focus) {
      const t = Math.min(1, (now - focus.started) / focus.duration);
      const eased = t ** 3 * (t * (t * 6 - 15) + 10);
      focus.path.getPointAt(eased, camera.position); focus.aim.getPointAt(eased, look);
      camera.fov = focus.fov + (focus.endFov - focus.fov) * eased;
      if (t === 1) { targetTour = queuedTour ?? focus.destination; queuedTour = null; focus = null; unsettled = tour !== targetTour; }
    }
    let introOffset: number | null = null;
    if (intro) {
      const t = Math.min(1, (now - intro.started) / 8500);
      const eased = t * t * (3 - 2 * t);
      const end = buildingOverviewPose(camera.aspect);
      const start = new THREE.Vector3(mobileDevice ? 51 : 40, mobileDevice ? 33 : 28, mobileDevice ? 61 : 49);
      camera.position.copy(start).lerp(new THREE.Vector3(...end.position), eased);
      camera.position.x += Math.sin(t * Math.PI) * 3;
      look.set(0, 8.5, 0); camera.fov = end.fov;
      introOffset = THREE.MathUtils.smoothstep(t, .65, 1);
      intro.progress(t);
      if (t === 1) { const complete = intro.complete; intro = null; complete(); }
    }
    camera.lookAt(look);
    const outside = introOffset ?? (focus ? focus.offset * Math.max(0, 1 - (now - focus.started) / focus.duration) : reduced ? 1 : 1 - THREE.MathUtils.smoothstep(phase, .05, .45));
    offsetFactor = outside;
    const width = host.clientWidth, height = host.clientHeight;
    camera.setViewOffset(width, height, 0, width > 767 ? 0 : -height * .035 * outside, width, height);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    model.updateMatrixWorld(true); camera.updateMatrixWorld();
    projectFloors(floors.map(({ group }, floor) => {
      anchor.set(7.3, 1.7, 5.5); group.localToWorld(anchor); anchor.project(camera);
      return { floor, x: (anchor.x + 1) * host.clientWidth / 2, y: (1 - anchor.y) * host.clientHeight / 2, visible: (reduced || phase < .3 || phase > .9) && anchor.z > -1 && anchor.z < 1 };
    }));
    host.dataset.activeFloor = String(viewedFloor + 1); host.dataset.cameraZ = camera.position.z.toFixed(2);
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.tourProgress = tour.toFixed(3);
    host.dataset.cameraFov = camera.fov.toFixed(1);
    host.dataset.pixelRatio = renderer.getPixelRatio().toFixed(2);
    host.dataset.renderFrame = String(renderer.info.render.frame);
    host.dataset.cameraMoving = String(unsettled || !!focus || !!intro);
    host.dataset.modelYaw = angle.toFixed(3);
    host.dataset.modelPitch = tilt.toFixed(3);
    if (unsettled || focus || intro) frame = requestAnimationFrame(render);
  };
  const schedule = () => { if (!stopped && !frame) { lastFrameTime = 0; frame = requestAnimationFrame(render); } };
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect(); if (!width || !height) return;
    camera.aspect = width / height; const pose = buildingOverviewPose(camera.aspect);
    camera.setViewOffset(width, height, width > 767 ? width * 0.16 : 0, width > 767 ? 0 : -height * 0.14, width, height);
    camera.position.fromArray(pose.position); camera.lookAt(new THREE.Vector3(...pose.target)); camera.updateProjectionMatrix();
    renderer.setSize(width, height); schedule();
  }); resize.observe(host);
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const pick = (event: MouseEvent | PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(floors.map(floor => floor.group), true)[0];
    if (!hit) return null;
    let object: THREE.Object3D | null = hit.object;
    while (object && typeof object.userData.floor !== "number") object = object.parent;
    return object ? Number(object.userData.floor) : null;
  };
  let drag: { id: number; x: number; y: number; yaw: number; pitch: number; touch: boolean; horizontal: boolean } | null = null;
  let dragDistance = 0, lastHover = 0;
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || intro) return;
    dragDistance = 0;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: targetAngle, pitch: targetTilt, touch: event.pointerType === "touch", horizontal: false };
    if (!drag.touch) renderer.domElement.setPointerCapture(event.pointerId);
  };
  const hover = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.id) {
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      dragDistance = Math.hypot(dx, dy);
      if (!drag.touch || (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.15)) drag.horizontal = true;
      if (drag.horizontal) {
        if (event.cancelable) event.preventDefault();
        if (!renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.setPointerCapture(event.pointerId);
        const pose = modelDragPose(drag.yaw, drag.pitch, dx, dy, host.clientWidth, drag.touch);
        targetAngle = pose.yaw; targetTilt = pose.pitch; renderer.domElement.style.cursor = "grabbing"; schedule();
      }
      return;
    }
    if (performance.now() - lastHover < 50) return;
    lastHover = performance.now(); renderer.domElement.style.cursor = pick(event) === null ? "grab" : "pointer";
  };
  const up = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    drag = null; renderer.domElement.style.cursor = "grab";
  };
  const click = (event: MouseEvent) => { if (dragDistance > 7) return; const floor = pick(event); if (floor !== null) selectFloor(floor); };
  const lost = (event: Event) => { event.preventDefault(); host.dispatchEvent(new Event("scene-unavailable")); };
  renderer.domElement.addEventListener("click", click);
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", hover, { passive: false });
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", schedule);
  const beginFocus = (destination: number) => {
    if (Math.abs(destination - targetTour) < .001) return;
    queuedTour = null;
    const pose = destination === 0 ? buildingOverviewPose(camera.aspect) : floorTourPose(destination, camera.aspect, expanded);
    const y = Math.floor(destination) * (expanded ? 5.5 : 4.4);
    if (!reduced) {
      const path = new THREE.CatmullRomCurve3([camera.position.clone(), new THREE.Vector3(1, camera.position.y, 14), new THREE.Vector3(1, y + 3.2, 14), new THREE.Vector3(...pose.position)], false, "centripetal");
      const aim = new THREE.CatmullRomCurve3([look.clone(), new THREE.Vector3(0, look.y, -2), new THREE.Vector3(0, y + 1.7, -2), new THREE.Vector3(...pose.target)], false, "centripetal");
      focus = { started: performance.now(), duration: floorTransitionDuration(path.getLength(), mobileDevice), destination, path, aim, fov: camera.fov, endFov: pose.fov, offset: offsetFactor };
    }
    tour = destination; targetTour = destination; schedule();
  };
  schedule();
  return {
    playIntro(complete: () => void, progress: (value: number) => void) { if (reduced) { complete(); return; } focus = null; tour = targetTour = 0; intro = { started: performance.now(), complete, progress }; schedule(); },
    stopIntro() { intro = null; tour = targetTour = 0; schedule(); },
    focusFloor(floor: number) {
      manualFeature = 0;
      beginFocus(Math.max(0, Math.min(3, floor)) + .6);
    },
    updateTour(value: number) {
      const next = Math.max(0, Math.min(3.999, value));
      if (focus) { queuedTour = next; return; }
      if (Math.abs(next - targetTour) > .003) manualFeature = null;
      targetTour = next; schedule();
    },
    setGuides(data: { name: string; items: string[][] }[]) { guideData = data; schedule(); },
    setFeature(feature: number) { const floor = active; manualFeature = Math.max(0, Math.min((guideData[floor]?.items.length || 1) - 1, feature)); schedule(); },
    selectFloor(floor: number) { active = Math.max(0, Math.min(3, floor)); manualFeature = 0; floors.forEach((_, index) => { targets[index] = { ...floorPresentation(index, active, expanded), x: index === active ? .4 : 0 }; }); schedule(); },
    setExpanded(value: boolean) { expanded = value; floors.forEach((_, index) => { targets[index] = floorPresentation(index, active, expanded); }); schedule(); },
    rotate(direction: number) { targetAngle = Math.max(-1.25, Math.min(1.25, targetAngle + direction * .25)); schedule(); },
    resetView() { targetAngle = 0; targetTilt = 0; expanded = false; focus = null; tour = targetTour = 0; floors.forEach((_, index) => { targets[index] = { ...floorPresentation(index, active, false), x: index === active ? .4 : 0 }; }); schedule(); },
    setReducedMotion(value: boolean) { reduced = value; if (value) { focus = null; intro = null; } schedule(); },
    setTheme(dark: boolean) {
      const sky = dark ? "#101720" : "#e9e6df";
      (scene.background as THREE.Color).set(sky); (scene.fog as THREE.Fog).color.set(sky);
      ground.color.set(dark ? "#18212c" : "#dedbd3"); stone.color.set(dark ? "#9ca7b4" : "#ffffff");
      white.color.set(dark ? "#b7c1cc" : "#faf7ef"); wood.color.set(dark ? "#c8b69e" : "#ffffff");
      glass.color.set(dark ? "#55718b" : "#8ca2ac");
      ambient.intensity = dark ? 1.2 : 1.7; ambient.color.set(dark ? "#b1c9e8" : "#fff7e5");
      sun.intensity = dark ? 1.6 : 2.4; sun.color.set(dark ? "#c1d5f0" : "#fff4de");
      warm.emissiveIntensity = dark ? 1.8 : 0.55; renderer.toneMappingExposure = dark ? 1 : 1.05;
      signPainters.forEach(paint => paint(dark));
      host.dataset.theme = dark ? "dark" : "light"; schedule();
    },
    dispose() {
      stopped = true; cancelAnimationFrame(frame); resize.disconnect(); document.removeEventListener("visibilitychange", schedule);
      renderer.domElement.removeEventListener("click", click); renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", hover); renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up); renderer.domElement.removeEventListener("webglcontextlost", lost);
      const materials = new Set<THREE.Material>();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material)); } });
      materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
