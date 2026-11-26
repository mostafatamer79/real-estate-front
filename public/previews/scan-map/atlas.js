'use strict';
(() => {
  const query = selector => document.querySelector(selector);
  document.body.dataset.motionReady = String(typeof window.Motion?.animate === 'function');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const district = query('#district');
  const radius = query('#radius');
  const stage = query('#map-stage');
  const frame = query('#map-frame');
  const scanButton = query('#scan');
  const status = query('#scan-status');
  const detail = query('#place-detail');
  const reportButton = query('#report');
  const report = query('#report-preview');
  const locations = {
    olaya: { name: 'الرياض، حي العليا', region: 'الرياض', lat: '24.713600', lng: '46.675300', display: '24°42′ N · 46°40′ E' },
    malqa: { name: 'الرياض، حي الملقا', region: 'الرياض', lat: '24.800000', lng: '46.610000', display: '24°48′ N · 46°36′ E' },
    jeddah: { name: 'جدة، حي الشاطئ', region: 'جدة', lat: '21.590000', lng: '39.110000', display: '21°35′ N · 39°06′ E' },
    khobar: { name: 'الخبر، الكورنيش', region: 'الخبر', lat: '26.280000', lng: '50.220000', display: '26°16′ N · 50°13′ E' },
  };
  const categories = {
    education: ['التعليم', '12 منشأة تعليمية ضمن بيانات المعاينة.'],
    health: ['الصحة والرعاية', '8 منشآت صحية ضمن بيانات المعاينة.'],
    shop: ['التسوق والخدمات', '21 منشأة تجارية ضمن بيانات المعاينة.'],
    park: ['الحدائق والترفيه', '7 مرافق ترفيهية ضمن بيانات المعاينة.'],
  };
  let zoom = 1;
  let timer = null;
  let sweep = null;
  let activeFilter = 'all';
  const pins = [...document.querySelectorAll('.service-pin')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const ring = query('#radius-ring');
  const controlsToggle = query('#controls-toggle');
  controlsToggle.addEventListener('click', () => {
    const open = controlsToggle.getAttribute('aria-expanded') !== 'true';
    controlsToggle.setAttribute('aria-expanded', String(open));
  });
  function animate(target, values, duration = .24) {
    if (motionPreference.matches || !window.Motion) return null;
    return window.Motion.animate(target, values, {duration, ease:[.23,1,.32,1]});
  }
  function announce(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }
  function closeDetail() {
    detail.hidden = true;
    pins.forEach(pin => pin.setAttribute('aria-pressed', 'false'));
  }
  function cancelScan() {
    clearTimeout(timer);
    timer = null;
    sweep?.stop();
    sweep = null;
    query('.scan-sweep').style.opacity = '0';
    frame.setAttribute('aria-busy', 'false');
    scanButton.disabled = false;
    query('#scan span').textContent = 'ابدأ المسح الذكي';
    radius.disabled = false;
    district.disabled = false;
    document.querySelectorAll('[data-radius]').forEach(button => { button.disabled = false; });
  }
  function updateRadius() {
    const value = Number(radius.value);
    query('#radius-value').replaceChildren(document.createTextNode(value.toFixed(1)+' '), Object.assign(document.createElement('small'), {textContent:'كم'}));
    radius.setAttribute('aria-valuetext', value+' كيلومتر');
    radius.style.setProperty('--range-percent', ((value-.5)/4.5*100)+'%');
    query('#area').textContent = (Math.PI*value*value).toFixed(1);
    query('#map-radius-label').textContent = 'نطاق '+value.toFixed(1)+' كم';
    // SVG coordinates and all service markers share the same zoomed map stage.
    const scale = .55 + value*.225;
    ring.setAttribute('transform', `translate(600 370) scale(${scale}) translate(-600 -370)`);
    document.querySelectorAll('[data-radius]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.radius)===value)));
    query('#report-location').textContent = locations[district.value].name+' · نطاق '+value.toFixed(1)+' كم';
  }
  function setFilter(category) {
    activeFilter = category;
    closeDetail();
    pins.forEach(pin => { pin.hidden = category !== 'all' && pin.dataset.category !== category; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  }
  function setZoom(value) {
    zoom = Math.max(1, Math.min(1.75, value));
    stage.style.transform = `scale(${zoom})`;
    query('#zoom-in').disabled = zoom >= 1.75;
    query('#zoom-out').disabled = zoom <= 1;
    // Scale indicator follows the zoom instead of suggesting a fixed distance.
    query('.map-scale').textContent = Math.round(500/zoom)+' م';
  }
  function syncLocation() {
    const location = locations[district.value];
    query('#map-district').textContent = location.name;
    query('#region').textContent = location.region+' / المملكة العربية السعودية';
    query('#heading-coords').textContent = location.display;
    query('#lat').textContent = location.lat;
    query('#lng').textContent = location.lng;
    updateRadius();
    closeDetail();
    query('#map-state').textContent = 'نطاق المسح جاهز';
    announce('تم تغيير الموقع. المخطط والأرقام توضيحية.');
  }
  radius.addEventListener('input', () => { updateRadius(); query('#map-state').textContent='نطاق المسح جاهز'; });
  document.querySelectorAll('[data-radius]').forEach(button => button.addEventListener('click', () => {
    radius.value = button.dataset.radius;
    updateRadius();
  }));
  district.addEventListener('change', syncLocation);
  scanButton.addEventListener('click', () => {
    cancelScan();
    closeDetail();
    if (matchMedia('(max-width: 700px)').matches) { controlsToggle.setAttribute('aria-expanded','false'); controlsToggle.focus({preventScroll:true}); }
    scanButton.disabled = true;
    district.disabled = true;
    radius.disabled = true;
    document.querySelectorAll('[data-radius]').forEach(button => { button.disabled = true; });
    query('#scan span').textContent = 'جارٍ المسح…';
    frame.setAttribute('aria-busy', 'true');
    query('#map-state').textContent = 'جارٍ استعراض الحي';
    announce('جارٍ تجهيز العرض التوضيحي للخدمات…');
    query('.scan-sweep').style.opacity = '1';
    sweep = animate(query('.scan-sweep'), {transform:['translateY(-100%)','translateY(100%)']}, .85);
    timer = setTimeout(() => {
      cancelScan();
      setFilter('all');
      query('#map-state').textContent = 'اكتمل العرض التوضيحي';
      announce('اكتمل العرض التجريبي: 48 منشأة. يمكنك اختيار تصنيف لاستكشافه.', 'success');
      pins.forEach(pin => animate(pin, {opacity:[.35,1]}, .2));
    }, motionPreference.matches ? 180 : 850);
  });
  filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  pins.forEach(pin => pin.addEventListener('click', () => {
    pins.forEach(item => item.setAttribute('aria-pressed',String(item===pin)));
    const category = categories[pin.dataset.category];
    query('#place-title').textContent = category[0];
    query('#place-description').textContent = category[1];
    detail.hidden = false;
  }));
  query('#close-place').addEventListener('click', () => {
    const selected = pins.find(pin => pin.getAttribute('aria-pressed') === 'true');
    closeDetail();
    selected?.focus({preventScroll:true});
  });
  query('#zoom-in').addEventListener('click', () => setZoom(zoom+.15));
  query('#zoom-out').addEventListener('click', () => setZoom(zoom-.15));
  query('#center-map').addEventListener('click', () => setZoom(1));
  query('#reset').addEventListener('click', () => {
    cancelScan(); district.value = 'olaya'; radius.value = '2';
    syncLocation(); setZoom(1); setFilter('all');
    report.hidden = true; reportButton.setAttribute('aria-expanded','false');
    announce('تمت استعادة إعدادات المسح.');
  });
  function showReport(show) {
    report.hidden = !show;
    reportButton.setAttribute('aria-expanded',String(show));
    if (show) {
      query('#report-location').textContent = locations[district.value].name+' · نطاق '+Number(radius.value).toFixed(1)+' كم';
      report.scrollIntoView({block:'nearest', behavior:motionPreference.matches?'instant':'smooth'});
      query('#close-report').focus({preventScroll:true});
    }
  }
  reportButton.addEventListener('click', () => showReport(report.hidden));
  query('#close-report').addEventListener('click', () => { showReport(false); reportButton.focus({preventScroll:true}); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!detail.hidden) query('#close-place').click();
    else if (!report.hidden) query('#close-report').click();
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) { sweep?.stop(); query('.scan-sweep').style.opacity='0'; }
  });
  addEventListener('pagehide', cancelScan);
  updateRadius(); setZoom(1); setFilter(activeFilter);
  // One short map reveal. Content is visible even without the motion library.
  animate(query('.map-column'), {opacity:[.7,1], transform:['translateY(8px)','translateY(0)']}, .45);
})();
