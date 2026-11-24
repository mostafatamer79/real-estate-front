type Point = [number, number, number];

export function buildingOverviewPose(aspect: number) {
  const narrow = Number.isFinite(aspect) && aspect < 0.8;
  return {
    position: (narrow ? [40, 29, 49] : [28, 24, 36]) as Point,
    target: [0, 8.5, 0] as Point,
    fov: narrow ? 46 : 42,
  };
}

export function floorPresentation(floor: number, active: number, expanded: boolean) {
  const index = Math.max(0, Math.min(3, Math.round(Number.isFinite(floor) ? floor : 0)));
  return { y: index * (expanded ? 5.5 : 4.4), x: 0, active: index === active };
}

export function floorTourPose(value: number, aspect: number, expanded: boolean) {
  const total = Math.max(0, Math.min(3.999999, Number.isFinite(value) ? value : 0));
  const floor = Math.floor(total), phase = total - floor;
  const step = expanded ? 5.5 : 4.4;
  const y = floor * step;
  const overview = buildingOverviewPose(aspect);
  const mobile = Number.isFinite(aspect) && aspect < .8;
  const start = floor === 0 ? overview : { position: [6, y + 4.5, 15] as Point, target: [0, y + 1.7, 0] as Point, fov: 52 };
  const inside = { position: [mobile ? 0 : 1, y + (mobile ? 2.8 : 2.55), mobile ? 9 : 5] as Point, target: [0, y + (mobile ? 1.99 : 1.5), mobile ? -3.6 : -2.5] as Point, fov: mobile ? 68 : 70 };
  const end = floor === 3 ? inside : { position: [6, (floor + 1) * step + 4.5, 15] as Point, target: [0, (floor + 1) * step + 1.7, 0] as Point, fov: 52 };
  const keys = [
    { at: 0, ...start },
    { at: .25, position: [1, y + 3.2, 12] as Point, target: [0, y + 1.7, -2] as Point, fov: 56 },
    { at: .52, ...inside },
    { at: .7, ...inside },
    { at: 1, ...end },
  ];
  const index = Math.max(0, keys.findIndex(key => key.at > phase) - 1);
  const a = keys[index], b = keys[index + 1];
  const fraction = Math.max(0, Math.min(1, (phase - a.at) / (b.at - a.at)));
  const eased = fraction ** 3 * (fraction * (fraction * 6 - 15) + 10);
  const mix = (from: Point, to: Point): Point => from.map((v, i) => v + (to[i] - v) * eased) as Point;
  return { position: mix(a.position, b.position), target: mix(a.target, b.target), fov: a.fov + (b.fov - a.fov) * eased };
}

export function floorTransitionDuration(distance: number, mobile: boolean) {
  const length = Number.isFinite(distance) ? Math.max(0, distance) : 50;
  return Math.min(8500, Math.max(mobile ? 5600 : 5000, 4600 + length * (mobile ? 48 : 40)));
}

export function advanceTourProgress(current: number, target: number, elapsed: number, aspect: number, expanded: boolean) {
  const delta = Math.max(0, Math.min(40, elapsed));
  const proposed = current + (target - current) * (1 - Math.exp(-delta / 550));
  const from = floorTourPose(current, aspect, expanded);
  const maxMove = delta / 1000 * (aspect < .8 ? 4 : 6);
  let low = 0, high = 1;
  for (let step = 0; step < 10; step++) {
    const fraction = (low + high) / 2;
    const pose = floorTourPose(current + (proposed - current) * fraction, aspect, expanded);
    const distance = Math.hypot(...pose.position.map((value, index) => value - from.position[index]));
    if (distance <= maxMove && Math.abs(pose.fov - from.fov) <= delta / 1000 * 7) low = fraction; else high = fraction;
  }
  return Math.abs(target - current) < .0001 ? target : current + (proposed - current) * low;
}

export function modelDragPose(yaw: number, pitch: number, dx: number, dy: number, width: number, touch: boolean) {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  if (touch && Math.abs(dy) > Math.abs(dx)) return { yaw, pitch };
  const scale = Math.max(200, Number.isFinite(width) ? width : 400);
  return {
    yaw: clamp(yaw + dx / scale * Math.PI, -1.25, 1.25),
    pitch: touch ? pitch : clamp(pitch + dy / scale * .45, -.16, .16),
  };
}
