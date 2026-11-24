import { DEFAULT_DETAILS_DESIGN } from './vendor/details-design.js';

const map = document.querySelector('#section-map');
const host = map.querySelector('.sanctuary-map-host');
const pins = map.querySelector('.sanctuary-map-pins');
const status = map.querySelector('.sanctuary-map-status[role="status"]');
const placeList = map.querySelector('#sanctuary-place-list');
const placeDetail = map.querySelector('.sanctuary-place-detail');
const controls = [...map.querySelectorAll('[data-camera]')];
const playButton = controls.find(button => button.dataset.camera === 'play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const places = DEFAULT_DETAILS_DESIGN.places;
const placeButtons = new Map();
let scene;
let playing = false;

function showPlaying(value) {
  playing = value;
  playButton.setAttribute('aria-pressed', String(value));
  playButton.textContent = value ? 'إيقاف الحركة' : 'تشغيل الحركة';
}

function selectPlace(place) {
  scene?.play(false);
  showPlaying(false);
  for (const [id, buttons] of placeButtons) {
    for (const button of buttons) button.setAttribute('aria-pressed', String(id === place.id));
  }
  placeDetail.textContent = place.id === 'apartment'
    ? 'المبنى الرئيسي في المشهد التوضيحي.'
    : `${place.ar} ضمن الخدمات المحيطة بالمبنى في المشهد التوضيحي.`;
}

for (const place of [{ id: 'apartment', ar: 'المبنى' }, ...places.filter(place => place.enabled)]) {
  const listButton = document.createElement('button');
  listButton.type = 'button';
  listButton.textContent = place.ar;
  listButton.setAttribute('aria-pressed', 'false');
  listButton.addEventListener('click', () => selectPlace(place));

  const pin = listButton.cloneNode(true);
  pin.className = 'sanctuary-map-pin';
  pin.hidden = true;
  pin.tabIndex = -1;
  pin.addEventListener('click', () => selectPlace(place));

  placeList.append(listButton);
  pins.append(pin);
  placeButtons.set(place.id, [listButton, pin]);
}

function positionPins(positions) {
  for (const { id, x, y, visible } of positions) {
    const pin = placeButtons.get(id)[1];
    pin.hidden = !visible;
    if (visible) {
      pin.style.left = `clamp(32px, ${x}px, calc(100% - 32px))`;
      pin.style.top = `${y}px`;
    }
  }
}

const cameraActions = {
  left: () => scene.rotate(-.22),
  right: () => scene.rotate(.22),
  in: () => scene.zoom(-.12),
  out: () => scene.zoom(.12),
  reset: () => scene.reset(),
  play: () => {
    showPlaying(!playing);
    scene.play(playing);
  },
};

for (const button of controls) {
  button.addEventListener('click', () => {
    if (button !== playButton) {
      scene.play(false);
      showPlaying(false);
    }
    cameraActions[button.dataset.camera]();
  });
}

const mapObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) loadScene();
}, { rootMargin: '240px 0px' });

let loading = false;
async function loadScene() {
  if (loading) return;
  loading = true;
  mapObserver.disconnect();
  status.textContent = 'جارٍ تجهيز المشهد ثلاثي الأبعاد…';
  try {
    const { createNeighborhoodScene } = await import('./vendor/neighborhood-scene.js');
    host.hidden = false;
    scene = createNeighborhoodScene(host, positionPins, {
      places,
      reducedMotion: reducedMotion.matches,
      dark: document.body.classList.contains('dark'),
      onPlayingChange: showPlaying,
    });
    status.hidden = true;
    host.tabIndex = 0;
    controls.forEach(button => { button.disabled = false; });
  } catch {
    host.hidden = true;
    status.textContent = 'تعذّر تشغيل المشهد ثلاثي الأبعاد. يمكنك استعراض المواقع أدناه.';
  }
}

const navigation = [...document.querySelectorAll('.workspace-shortcuts a')];
function updateSection() {
  for (const link of navigation) {
    if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (location.hash === '#section-map') loadScene();
}
mapObserver.observe(map);
window.addEventListener('hashchange', updateSection);
updateSection();

const themeObserver = new MutationObserver(() => scene?.theme(document.body.classList.contains('dark')));
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
reducedMotion.addEventListener('change', () => scene?.setReducedMotion(reducedMotion.matches));
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  mapObserver.disconnect();
  themeObserver.disconnect();
  scene?.dispose();
});
