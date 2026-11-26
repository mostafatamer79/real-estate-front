"use client";

import { useEffect, useRef } from "react";

const SOURCE_ASPECT = 1376 / 768;
const CAMERA_DISTANCE = 24;
const FRAME_WIDTH = 16;
const FRAME_HEIGHT = FRAME_WIDTH / SOURCE_ASPECT;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function smoothRange(start: number, end: number, value: number): number {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return amount * amount * (3 - 2 * amount);
}

export default function VillaWorld() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const source = imgRef.current;
    if (!host || !source) return;

    let cancelled = false;
    let cleanupScene: (() => void) | null = null;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        preloadObserver.disconnect();
        initialize().catch(() => {
          if (!cancelled) host.classList.add("villa-unavailable");
        });
      },
      { rootMargin: "300px" },
    );
    preloadObserver.observe(host);

    async function initialize() {
      const THREE = await import("three");
      if (cancelled || !host || !source) return;

      const texture = await new THREE.TextureLoader().loadAsync(source.currentSrc || source.src);
      if (cancelled) {
        texture.dispose();
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.append(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
      camera.position.z = CAMERA_DISTANCE;

      const geometry = new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT, 128, 72);
      const positions = geometry.attributes.position;
      const coordinates = geometry.attributes.uv;

      for (let index = 0; index < positions.count; index++) {
        const u = coordinates.getX(index);
        const v = 1 - coordinates.getY(index);
        // Smooth depth boundaries avoid tearing along the roof and landscape.
        const horizontal = smoothRange(0.13, 0.34, u) * (1 - smoothRange(0.75, 0.91, u));
        const vertical = smoothRange(0.13, 0.32, v) * (1 - smoothRange(0.68, 0.9, v));
        const depth = horizontal * vertical * 1.5;
        const projectionScale = (CAMERA_DISTANCE - depth) / CAMERA_DISTANCE;
        positions.setXYZ(index, positions.getX(index) * projectionScale, positions.getY(index) * projectionScale, depth);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const relief = new THREE.Mesh(geometry, material);
      scene.add(relief);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let visible = false;
      let frame = 0;
      let lastTime = 0;
      let yaw = 0;
      let pitch = 0;
      let targetYaw = 0;
      let targetPitch = 0;
      let pointer: { id: number; x: number; yaw: number } | null = null;
      let dragged = false;
      let contextAvailable = true;

      const request = () => {
        if (!cancelled && !frame && visible && !document.hidden && contextAvailable) {
          frame = window.requestAnimationFrame(render);
        }
      };

      const render = (time: number) => {
        frame = 0;
        if (cancelled) return;
        const elapsed = Math.min(64, time - (lastTime || time - 16));
        lastTime = time;
        const blend = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 110);
        yaw += (targetYaw - yaw) * blend;
        pitch += (targetPitch - pitch) * blend;
        if (Math.abs(yaw - targetYaw) < 0.0001) yaw = targetYaw;
        if (Math.abs(pitch - targetPitch) < 0.0001) pitch = targetPitch;
        relief.rotation.set(pitch, yaw, 0);
        renderer.render(scene, camera);
        host.classList.add("villa-ready");
        if (yaw !== targetYaw || pitch !== targetPitch) request();
      };

      const resize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        const fittingHeight = Math.max(FRAME_HEIGHT, FRAME_WIDTH / camera.aspect);
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fittingHeight / (2 * CAMERA_DISTANCE)));
        camera.updateProjectionMatrix();
        request();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (!visible) {
          window.cancelAnimationFrame(frame);
          frame = 0;
          lastTime = 0;
        }
        request();
      });
      visibilityObserver.observe(host);

      const onPointerDown = (event: PointerEvent) => {
        if (event.isPrimary === false) return;
        dragged = false;
        pointer = { id: event.pointerId, x: event.clientX, yaw: targetYaw };
      };

      const onPointerMove = (event: PointerEvent) => {
        if (pointer?.id === event.pointerId) {
          const distance = event.clientX - pointer.x;
          if (Math.abs(distance) > 8) dragged = true;
          if (Math.abs(distance) > 8 && !host.hasPointerCapture(event.pointerId)) {
            host.setPointerCapture(event.pointerId);
          }
          targetYaw = clamp(pointer.yaw + distance * 0.0007, 0.14);
        } else if (event.pointerType === "mouse" && !reducedMotion.matches) {
          const bounds = host.getBoundingClientRect();
          targetYaw = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 0.2, 0.1);
          targetPitch = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 0.06, 0.03);
        } else {
          return;
        }
        request();
      };

      const release = (event: PointerEvent) => {
        if (pointer && host.hasPointerCapture(pointer.id)) {
          host.releasePointerCapture(pointer.id);
        }
        pointer = null;
        if ((event.type === "pointerleave" && !dragged) || event.type === "pointercancel") {
          targetYaw = 0;
          targetPitch = 0;
          request();
        }
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (!["ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) return;
        event.preventDefault();
        targetYaw = event.key === "Escape" ? 0 : clamp(targetYaw + (event.key === "ArrowLeft" ? -0.035 : 0.035), 0.14);
        targetPitch = 0;
        request();
      };

      const onReducedChange = () => {
        targetYaw = 0;
        targetPitch = 0;
        request();
      };

      const onVisibilityChange = () => {
        if (document.hidden) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        lastTime = 0;
        request();
      };

      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextAvailable = false;
        host.classList.remove("villa-ready");
        window.cancelAnimationFrame(frame);
        frame = 0;
      };

      const onContextRestored = () => {
        contextAvailable = true;
        resize();
      };

      host.addEventListener("pointerdown", onPointerDown);
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerup", release);
      host.addEventListener("pointercancel", release);
      host.addEventListener("pointerleave", release);
      host.addEventListener("keydown", onKeyDown);
      reducedMotion.addEventListener("change", onReducedChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

      resize();

      cleanupScene = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        host.removeEventListener("pointerdown", onPointerDown);
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerup", release);
        host.removeEventListener("pointercancel", release);
        host.removeEventListener("pointerleave", release);
        host.removeEventListener("keydown", onKeyDown);
        reducedMotion.removeEventListener("change", onReducedChange);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
        host.classList.remove("villa-ready");
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    return () => {
      cancelled = true;
      preloadObserver.disconnect();
      cleanupScene?.();
    };
  }, []);

  return (
    <section className="villa-world" id="villa-world">
      <div className="villa-heading">
        <span>المكان، من كل زاوية</span>
        <h2>اقترب. غيّر منظورك.</h2>
        <p>حرّك المؤشر أو اسحب لتغيير المنظور.</p>
      </div>
      <div
        ref={hostRef}
        className="villa-canvas"
        role="img"
        aria-label="صورة الفيلا الأصلية بعمق تفاعلي، اسحب أفقيًا لتغيير المنظور"
        tabIndex={0}
      >
        <img
          ref={imgRef}
          className="villa-fallback"
          src="/artworks/banan/villa-reference.png"
          alt="تصوّر لفيلا بفناء ومسبح"
        />
      </div>
    </section>
  );
}
