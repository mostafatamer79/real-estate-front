const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load() {
  const context = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/home-walkthrough.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
test('the cinematic camera enters every floor at its correct height', () => {
  const { floorTourPose } = load();
  for (let floor = 0; floor < 4; floor++) {
    const pose = floorTourPose(floor + 0.65, 1.6, false);
    assert.ok(pose.position[2] < 5.4);
    assert.ok(pose.position[1] > floor * 4.4 + 2.2);
    assert.ok(pose.position[1] < floor * 4.4 + 2.8);
    const outside = floorTourPose(floor + 0.2, 1.6, false);
    assert.ok(outside.position[2] >= 12);
  }
});
test('the camera exits before rising and stays continuous across floors', () => {
  const { floorTourPose } = load();
  let previous = floorTourPose(0, 1.6, false);
  for (let step = 1; step <= 4000; step++) {
    const pose = floorTourPose(step / 1000, 1.6, false);
    assert.ok([...pose.position, ...pose.target].every(Number.isFinite));
    assert.ok(Math.hypot(...pose.position.map((v, i) => v - previous.position[i])) < .5);
    previous = pose;
  }
  assert.deepEqual(floorTourPose(-1, 1.6, false).position, floorTourPose(0, 1.6, false).position);
});
test('floor selection separates all four levels without overlap or camera travel', () => {
  const { floorPresentation } = load();
  for (let active = 0; active < 4; active++) {
    let previous = -Infinity;
    for (let floor = 0; floor < 4; floor++) {
      const pose = floorPresentation(floor, active, true);
      assert.ok(pose.y - previous >= 4.3);
      assert.equal(pose.active, floor === active);
      previous = pose.y;
    }
  }
  assert.equal(floorPresentation(-1, 0, false).y, floorPresentation(0, 0, false).y);
  assert.equal(floorPresentation(9, 3, false).y, floorPresentation(3, 3, false).y);
});

test('mobile uses a wider, shorter camera move instead of an oversized interior zoom', () => {
  const { floorTourPose } = load();
  const mobile = floorTourPose(1.65, .46, false);
  const desktop = floorTourPose(1.65, 1.6, false);
  assert.ok(mobile.position[2] >= 9);
  assert.ok(mobile.fov >= 60);
  assert.ok(desktop.fov >= 65);
});

test('floor transitions cannot become instant when scrolling or skipping floors', () => {
  const { floorTransitionDuration } = load();
  assert.ok(floorTransitionDuration(5, false) >= 5000);
  assert.ok(floorTransitionDuration(50, false) > floorTransitionDuration(5, false));
  assert.ok(floorTransitionDuration(50, true) >= floorTransitionDuration(50, false));
  assert.ok(floorTransitionDuration(Infinity, true) <= 8500);
});

test('scroll-driven camera has a frame-by-frame travel and zoom speed limit', () => {
  const { advanceTourProgress, floorTourPose } = load();
  for (const aspect of [.46, 1.6]) {
    for (const start of [0, .12, .5, .85, 1.2, 2.8, 3.6]) {
      for (const target of [0, 3.6]) {
        const next = advanceTourProgress(start, target, 16.7, aspect, false);
        const a = floorTourPose(start, aspect, false), b = floorTourPose(next, aspect, false);
        assert.ok(Math.hypot(...b.position.map((v, i) => v - a.position[i])) <= .101);
        assert.ok(Math.abs(b.fov - a.fov) <= .12);
      }
    }
  }
});

test('model dragging turns both ways, limits tilt, and preserves vertical touch scrolling', () => {
  const { modelDragPose } = load();
  assert.ok(modelDragPose(0, 0, 100, 0, 600, false).yaw > 0);
  assert.ok(modelDragPose(0, 0, -100, 0, 600, false).yaw < 0);
  const limit = modelDragPose(0, 0, 10000, 10000, 300, false);
  assert.equal(limit.yaw, 1.25); assert.equal(limit.pitch, .16);
  const scroll = modelDragPose(.2, .1, 5, 150, 390, true);
  assert.equal(scroll.yaw, .2); assert.equal(scroll.pitch, .1);
});
