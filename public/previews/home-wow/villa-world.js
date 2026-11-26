import * as THREE from './vendor/three.module.js';

// Project the supplied photograph onto a shallow relief. At the resting camera
// position the projection reproduces the source, including its lighting.
const host = document.querySelector('.villa-canvas');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const source = host.querySelector('.villa-fallback');
const sourceAspect = 1376 / 768;
const cameraDistance = 24;
const frameWidth = 16;
const frameHeight = frameWidth / sourceAspect;
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

const preloadObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  preloadObserver.disconnect();
  initialize().catch(() => host.classList.add('villa-unavailable'));
}, { rootMargin: '300px' });
preloadObserver.observe(host);

async function initialize() {
  const texture = await new THREE.TextureLoader().loadAsync(source.src);
  texture.colorSpace = THREE.SRGBColorSpace;
  // No realtime lights recolor the photograph.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.z = cameraDistance;
  const geometry = new THREE.PlaneGeometry(frameWidth, frameHeight, 128, 72);
  const positions = geometry.attributes.position;
  const coordinates = geometry.attributes.uv;

  function smoothRange(start, end, value) {
    const amount = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
    return amount * amount * (3 - 2 * amount);
  }

  for (let index = 0; index < positions.count; index++) {
    const u = coordinates.getX(index);
    const v = 1 - coordinates.getY(index);
    // Smooth depth boundaries avoid tearing along the roof and landscape.
    const horizontal = smoothRange(0.13, 0.34, u) * (1 - smoothRange(0.75, 0.91, u));
    const vertical = smoothRange(0.13, 0.32, v) * (1 - smoothRange(0.68, 0.9, v));
    const depth = horizontal * vertical * 1.5;
    const projectionScale = (cameraDistance - depth) / cameraDistance;
    positions.setXYZ(index, positions.getX(index) * projectionScale, positions.getY(index) * projectionScale, depth);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const relief = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }));
  scene.add(relief);

  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let pointer = null;
  let dragged = false;
  let contextAvailable = true;

  function request() {
    if (!frame && visible && !document.hidden && contextAvailable) frame = requestAnimationFrame(render);
  }

  function render(time) {
    frame = 0;
    const elapsed = Math.min(64, time - (lastTime || time - 16));
    lastTime = time;
    const blend = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 110);
    yaw += (targetYaw - yaw) * blend;
    pitch += (targetPitch - pitch) * blend;
    if (Math.abs(yaw - targetYaw) < 0.0001) yaw = targetYaw;
    if (Math.abs(pitch - targetPitch) < 0.0001) pitch = targetPitch;
    relief.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
    host.classList.add('villa-ready');
    if (yaw !== targetYaw || pitch !== targetPitch) request();
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const fittingHeight = Math.max(frameHeight, frameWidth / camera.aspect);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fittingHeight / (2 * cameraDistance)));
    camera.updateProjectionMatrix();
    request();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
    request();
  }).observe(host);

  host.addEventListener('pointerdown', event => {
    if (event.isPrimary === false) return;
    dragged = false;
    pointer = { id: event.pointerId, x: event.clientX, yaw: targetYaw };
  });
  host.addEventListener('pointermove', event => {
    if (pointer?.id === event.pointerId) {
      const distance = event.clientX - pointer.x;
      if (Math.abs(distance) > 8) dragged = true;
      if (Math.abs(distance) > 8 && !host.hasPointerCapture(event.pointerId)) host.setPointerCapture(event.pointerId);
      targetYaw = clamp(pointer.yaw + distance * 0.0007, 0.14);
    } else if (event.pointerType === 'mouse' && !reducedMotion.matches) {
      const bounds = host.getBoundingClientRect();
      targetYaw = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 0.2, 0.1);
      targetPitch = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 0.06, 0.03);
    } else return;
    request();
  });

  function release(event) {
    if (pointer && host.hasPointerCapture(pointer.id)) host.releasePointerCapture(pointer.id);
    pointer = null;
    if ((event.type === 'pointerleave' && !dragged) || event.type === 'pointercancel') {
      targetYaw = 0;
      targetPitch = 0;
      request();
    }
  }
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => host.addEventListener(type, release));
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    targetYaw = event.key === 'Escape' ? 0 : clamp(targetYaw + (event.key === 'ArrowLeft' ? -0.035 : 0.035), 0.14);
    targetPitch = 0;
    request();
  });
  reducedMotion.addEventListener('change', () => {
    targetYaw = 0;
    targetPitch = 0;
    request();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    lastTime = 0;
    request();
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextAvailable = false;
    host.classList.remove('villa-ready');
    cancelAnimationFrame(frame);
    frame = 0;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextAvailable = true;
    resize();
  });
  resize();
}
