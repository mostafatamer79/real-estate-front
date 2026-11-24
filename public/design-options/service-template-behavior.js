(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const data = JSON.parse($('#service-data').textContent);
  const scenes = JSON.parse($('#scene-data').textContent);
  const catalog = data.catalog;
  const dialog = $('#preview-dialog');
  function message(title, description) {
    $('#dialog-title').textContent = title;
    $('#dialog-body').textContent = description;
    dialog.showModal();
  }
  $('#theme').addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    $('#theme').textContent = dark ? 'الوضع الفاتح' : 'الوضع الداكن';
    $('#theme').setAttribute('aria-pressed', String(dark));
  });
  $('#motion-toggle').addEventListener('click', event => {
    const paused = document.body.classList.toggle('paused');
    event.currentTarget.setAttribute('aria-pressed', String(paused));
    event.currentTarget.setAttribute('aria-label', paused ? 'تشغيل الحركة' : 'إيقاف الحركة');
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.setProperty('--reveal-opacity', '1');
      entry.target.style.setProperty('--reveal-y', '0px');
      reveal.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  if (!reduced.matches) {
    document.body.classList.add('motion-ready');
    $$('.reveal').forEach(element => reveal.observe(element));
  }
  let ticking = false;
  function progress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--progress', max > 0 ? scrollY / max : 0);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
  addEventListener('resize', progress);
  progress();
  const normalize = value => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase().trim();
  if (document.body.dataset.page === 'catalog') {
    let filter = 'all';
    function applyFilters() {
      const query = normalize($('#service-search').value);
      let count = 0;
      $$('.service-card').forEach(card => {
        const category = card.dataset.category;
        const text = [catalog[category].title, catalog[category].description, ...(catalog[category].options || []), ...(category === 'legal' ? Object.values(data.legalOptions).flat() : [])].join(' ');
        card.hidden = !((filter === 'all' || category === filter) && normalize(text).includes(query));
        if (!card.hidden) count++;
      });
      $('#results-count').textContent = `${count} أقسام تخصصية`;
      $('#empty-state').hidden = count !== 0;
    }
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
      filter = button.dataset.filter;
      $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      applyFilters();
    }));
    $('#service-search').addEventListener('input', applyFilters);
    $('#clear-search').addEventListener('click', () => {
      $('#service-search').value = '';
      $('[data-filter="all"]').click();
      $('#service-search').focus();
    });
    $$('[data-select]').forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.select;
      $('#hero-scene').innerHTML = scenes[category]; // Only source-owned SVG from the embedded scene bank.
      $('#selected-title').textContent = catalog[category].title;
      $('#category-status').textContent = `${catalog[category].title} — ${catalog[category].description}`;
      $$('[data-select]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.select === category)));
    }));
    $$('[data-info]').forEach(button => button.addEventListener('click', () => message(button.textContent.trim(), 'هذه معاينة للتصميم. متابعة الطلبات والعمل كمزود خدمة تتم بعد تسجيل الدخول إلى المنصة الفعلية.')));
    return;
  }
  const form = $('#request-form');
  const category = $('#category');
  const family = $('#legal-family');
  const service = $('#service');
  const other = $('#other-service');
  const panels = $$('.step-panel');
  let step = 0;
  let draft = null;
  const params = new URLSearchParams(location.search);
  const validKey = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  category.value = validKey(catalog, params.get('type')) ? params.get('type') : 'postPurchase';
  const families = Array.isArray(data.legal) ? data.legal : Object.values(data.legal);
  family.replaceChildren(...families.map(item => new Option(item.title, item.id)));
  if (families.some(item => item.id === params.get('category'))) family.value = params.get('category');
  function options() {
    const legal = category.value === 'legal';
    $('#legal-family-field').hidden = !legal;
    family.disabled = !legal;
    family.required = legal;
    const chosenFamily = families.find(item => item.id === family.value) || families[0];
    const list = legal ? data.legalOptions[chosenFamily.formKey] : catalog[category.value].options;
    service.replaceChildren(new Option('اختر الخدمة المطلوبة', ''), ...list.map(value => new Option(value, value)));
    conditional();
    summary();
  }
  function conditional() {
    const custom = service.value === 'أخرى' || service.value === 'خدمة قانونية مخصصة';
    $('#other-field').hidden = !custom;
    other.disabled = !custom;
    other.required = custom;
  }
  function summary() {
    const item = catalog[category.value];
    $('#summary-category').textContent = item.title;
    $('#summary-description').textContent = item.description;
    $('#summary-scene').innerHTML = scenes[category.value];
    $('#summary-service').textContent = service.value || 'اختر الخدمة من النموذج';
    $('#summary-quantity').textContent = $('#quantity').value || '—';
    $('#summary-city').textContent = $('#city').value.trim() || 'لم تحدد بعد';
    $('#summary-step').textContent = `${step + 1} من 3`;
  }
  options();
  if ([...service.options].some(option => option.value === params.get('service'))) service.value = params.get('service');
  conditional();
  summary();
  category.addEventListener('change', options);
  family.addEventListener('change', options);
  service.addEventListener('change', conditional);
  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    if (['city', 'quantity', 'service', 'category', 'legal-family'].includes(event.target.id)) summary();
  });
  form.addEventListener('change', summary);
  function validate(index) {
    const controls = [...panels[index].querySelectorAll('input,select,textarea')].filter(control => !control.disabled);
    const invalid = controls.filter(control => !control.checkValidity());
    controls.forEach(control => control.setAttribute('aria-invalid', String(invalid.includes(control))));
    $('#error-summary').hidden = !invalid.length;
    $('#error-summary').textContent = invalid.length ? 'يرجى إكمال الحقول المطلوبة والتحقق من صحة بياناتك.' : '';
    if (invalid.length) {
      if (step !== index) showStep(index, false);
      invalid[0].focus();
      invalid[0].reportValidity();
      return false;
    }
    return true;
  }
  function review() {
    const values = [
      ['فئة الخدمة', catalog[category.value].title],
      ...(category.value === 'legal' ? [['التخصص القانوني', family.selectedOptions[0].textContent]] : []),
      ['الخدمة المطلوبة', service.value],
      ...(!other.disabled ? [['تفاصيل الخدمة الأخرى', other.value]] : []),
      ['اسم العميل', $('#client-name').value], ['رقم الجوال', $('#phone').value],
      ['المدينة', $('#city').value], ['الحي', $('#district').value],
      ['الكمية / العدد', $('#quantity').value], ['تفاصيل وملاحظات', $('#description').value || 'لا توجد ملاحظات']
    ];
    $('#review-list').replaceChildren(...values.flatMap(([label, value]) => {
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value;
      return [dt, dd];
    }));
  }
  function showStep(index, focus = true) {
    step = index;
    panels.forEach((panel, i) => { panel.hidden = i !== step; });
    $$('[data-go-step]').forEach((button, i) => {
      if (i === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#back').hidden = step === 0;
    $('#next').textContent = ['أكمل التفاصيل ←', 'راجع الطلب ←', 'معاينة إرسال الطلب ←'][step];
    $('#error-summary').hidden = true;
    if (step === 2) review();
    summary();
    if (focus) panels[step].querySelector('h2').focus({ preventScroll: true });
  }
  $$('[data-go-step]').forEach(button => button.addEventListener('click', () => {
    const target = Number(button.dataset.goStep);
    for (let index = 0; index < target; index++) if (!validate(index)) return;
    showStep(target);
  }));
  $('#back').addEventListener('click', () => showStep(Math.max(0, step - 1)));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate(step)) return;
    if (step < 2) showStep(step + 1);
    else {
      for (let index = 0; index < 3; index++) if (!validate(index)) return;
      message('اكتملت معاينة طلبك', 'نجحت تجربة النموذج محليًا. لم يُرسل طلب إلى المنصة، ولم تُحفظ بياناتك على الخادم. يمكنك إغلاق هذه النافذة لتعديل التفاصيل.');
    }
  });
  $('#save-draft').addEventListener('click', () => {
    draft = Object.fromEntries(new FormData(form));
    $('#form-status').textContent = 'احتُفظ بالقيم داخل هذه الصفحة مؤقتًا. ستختفي عند إعادة التحميل، ولم تُرسل إلى أي جهة.';
    if (!$('#restore-draft')) {
      const restore = document.createElement('button');
      restore.type = 'button'; restore.id = 'restore-draft'; restore.className = 'secondary'; restore.textContent = 'استعادة المسودة';
      restore.addEventListener('click', () => {
        category.value = draft.category;
        if (draft.legalFamily) family.value = draft.legalFamily;
        options();
        for (const [name, value] of Object.entries(draft)) {
          const field = form.elements.namedItem(name);
          if (field && field.type !== 'checkbox') field.value = value;
        }
        conditional(); summary();
        $('#form-status').textContent = 'استُعيدت المسودة المؤقتة.';
      });
      $('#save-draft').after(restore);
    }
  });
  $('#terms-info').addEventListener('click', () => message('شروط تجربة النموذج', 'هذا إقرار تجريبي للتحقق من واجهة النموذج فقط. شروط المنصة الفعلية وإرسال الطلب تظهران في مسار الخدمة بعد تسجيل الدخول.'));
})();
