const pages = JSON.parse(document.getElementById('route-data').textContent);
const screen = document.getElementById('screen');
const picker = document.getElementById('page-picker');
const routePath = document.getElementById('route-path');
const toast = document.getElementById('toast');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const lastName = page => page.title.split(' / ').at(-1);
const link = (route, text, primary = false) => `<a class="action ${primary ? 'primary' : ''}" href="#${encodeURIComponent(route)}">${text}<span class="arrow" aria-hidden="true">←</span></a>`;
const demoButton = (text, primary = false) => `<button class="action ${primary ? 'primary' : ''}" type="button" data-demo="true">${text}<span class="arrow" aria-hidden="true">←</span></button>`;
const photo = `<div class="hero-visual"><img src="architecture-concept.png" alt="تصور معماري توضيحي لمبنى سكني حديث"><div class="visual-caption"><strong>مساحة تستحق الاكتشاف</strong>صورة تصورّية للمعاينة فقط</div></div>`;
function heading(page, text, description, actions = '', withPhoto = false) {
  return `<div class="breadcrumb">الرئيسية / <b>${escapeHtml(page.title)}</b></div><section class="hero ${withPhoto ? '' : 'no-visual'}"><div class="hero-copy"><h1 class="hero-title">${text}</h1><p class="hero-desc">${description}</p><div class="hero-actions">${actions}</div></div>${withPhoto ? photo : ''}</section>`;
}
function sectionTitle(title, aside = '') { return `<div class="section-heading"><h2>${title}</h2><span>${aside}</span></div>`; }
function services() {
  const items = [
    ['01','العروض العقارية','استعرض العروض حسب المدينة والحي والمساحة والسعر.'],
    ['02','إدارة الأملاك','تابع العقارات والوحدات والعقود والصيانة من حسابك.'],
    ['03','الخدمات المساندة','التسويق والخدمات القانونية والبناء وما بعد الشراء.']
  ];
  return `<div class="service-strips">${items.map(([n,title,description]) => `<article class="service-strip"><span>${n}</span><h3>${title}</h3><p>${description}</p><b aria-hidden="true">↗</b></article>`).join('')}</div>`;
}
function metrics(admin = false) {
  const items = admin ? [['إجمالي المستخدمين','120','معاينة'],['الطلبات المفتوحة','18','معاينة'],['العمليات النشطة','8','معاينة']] : [['العقارات المسجلة','20','معاينة'],['الطلبات قيد المتابعة','8','معاينة'],['الزيارات القادمة','4','معاينة']];
  return `<div class="metrics">${items.map(([label,value,caption]) => `<div class="metric"><small>${label}</small><strong>${value}</strong><span>${caption} · قيمة توضيحية</span></div>`).join('')}</div>`;
}
function dashboard(page) {
  const admin = page.route.startsWith('/admin');
  const lead = admin ? 'راقب عمل المنصة من مكان واحد، وانتقل بسرعة إلى الطلبات التي تحتاج قرارًا.' : 'خريطة أعمالك العقارية، طلباتك، والفرص التي تهمك في نظرة واحدة.';
  const first = admin ? 'طلبات المنصة' : 'الخريطة التفاعلية';
  const focus = admin ? `<div class="activity"><div class="activity-row"><i></i><div><strong>طلبات الخدمات</strong><small>مراجعة الطلبات الجديدة</small></div></div><div class="activity-row"><i></i><div><strong>إدارة المستخدمين</strong><small>متابعة الحسابات</small></div></div><div class="activity-row"><i></i><div><strong>العروض العقارية</strong><small>عرض المحتوى النشط</small></div></div></div>` : `<div class="map-preview"><span class="map-label">معاينة موقع توضيحية</span></div>`;
  return heading(page, escapeHtml(lastName(page)), lead, link(admin ? '/admin/service-requests' : '/offers',admin ? 'فتح الطلبات' : 'استعراض العروض',true)) + metrics(admin) + `<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>${first}</h3><span>معاينة</span></div>${focus}</section><section class="panel soft"><div class="panel-head"><h3>آخر النشاطات</h3><span>اليوم</span></div><div class="activity"><div class="activity-row"><i></i><div><strong>طلب جديد</strong><small>يظهر هنا النشاط المرتبط بحسابك</small></div></div><div class="activity-row"><i></i><div><strong>تحديث حالة</strong><small>تظهر التفاصيل الفعلية في الموقع</small></div></div><div class="activity-row"><i></i><div><strong>موعد قادم</strong><small>تنبيه واضح للخطوة التالية</small></div></div></div></section></div>${sectionTitle('التحليلات والاتجاهات','عرض توضيحي')}<div class="panel"><h3>اتجاه النشاط</h3><p>تظهر القيم الحقيقية عند ربط التصميم ببيانات المنصة.</p><div class="chart"><i style="--h:36%"></i><i style="--h:52%"></i><i style="--h:43%"></i><i style="--h:70%"></i><i style="--h:61%"></i><i style="--h:85%"></i><i style="--h:74%"></i></div></div>`;
}
function publicPage(page) {
  return heading(page,'الوساطة الرقمية للخدمات والعروض العقارية في السعودية','منصة تجمع العروض والطلبات العقارية مع إدارة الأملاك والخدمات التي تحتاجها في كل مرحلة.',link('/offers','استعرض العروض العقارية',true)+link('/about','تعرف على المنصة'),true) + sectionTitle('منظومة متكاملة لاحتياجاتك العقارية','اكتشف ما يمكنك إنجازه') + services();
}
function catalog(page) {
  return heading(page,escapeHtml(lastName(page)),'استكشف الخيارات العقارية والخدمات المتاحة، ثم انتقل إلى التفاصيل التي تناسب احتياجك.',demoButton('ابدأ البحث',true),true) + `<div class="filter-bar"><button class="is-active" type="button">الكل</button><button type="button">العروض</button><button type="button">الخدمات</button><button type="button">حسب المدينة</button></div><div class="catalog-layout"><div class="feature-photo"><img src="architecture-concept.png" alt="تصور معماري توضيحي"><span>صورة توضيحية للمعاينة</span></div><div class="catalog-list"><div class="catalog-item"><strong>العروض والطلبات العقارية</strong><small>استكشاف · مقارنة · متابعة</small></div><div class="catalog-item"><strong>إدارة الأملاك والمباني</strong><small>الوحدات · العقود · الصيانة</small></div><div class="catalog-item"><strong>الخدمات العقارية المساندة</strong><small>تسويق · قانونية · ما بعد الشراء</small></div></div></div>`;
}
function records(page) {
  const title = escapeHtml(lastName(page));
  return heading(page,title,'ابحث في السجلات وتابع الحالات والإجراءات المرتبطة بهذه الصفحة.',demoButton('إضافة جديد',true)) + `<div class="filter-bar"><button class="is-active" type="button">الكل</button><button type="button">قيد المتابعة</button><button type="button">مكتمل</button></div><div class="records-layout"><div class="table-wrap"><table><thead><tr><th>العنصر</th><th>النوع</th><th>الحالة</th><th>آخر تحديث</th></tr></thead><tbody><tr><td>طلب توضيحي 01</td><td>${title}</td><td><span class="pill">قيد المتابعة</span></td><td>اليوم</td></tr><tr><td>طلب توضيحي 02</td><td>${title}</td><td><span class="pill">مكتمل</span></td><td>أمس</td></tr><tr><td>طلب توضيحي 03</td><td>${title}</td><td><span class="pill">بانتظار الإجراء</span></td><td>—</td></tr></tbody></table></div><aside class="side-note"><strong>كل ما تحتاجه في مكان واحد</strong><p>البيانات في هذه المعاينة توضيحية. في الصفحة الحية تظهر السجلات الفعلية وإجراءاتها.</p></aside></div>`;
}
function form(page, auth = false) {
  return heading(page,escapeHtml(lastName(page)),auth ? 'أكمل الوصول إلى حسابك بخطوات واضحة.' : 'أدخل المعلومات المطلوبة، ثم راجعها قبل المتابعة.',demoButton('المساعدة')) + `<div class="form-layout"><div class="steps"><div class="active">01 · البيانات</div><div>02 · المراجعة</div><div>03 · الإرسال</div></div><form class="form-card" id="demo-form"><h2>${escapeHtml(lastName(page))}</h2><div class="fields"><label class="field">الاسم أو العنوان<input type="text" placeholder="اكتب هنا" required></label><label class="field">نوع الطلب<select><option>اختر من القائمة</option><option>استفسار</option><option>طلب خدمة</option></select></label><label class="field full">التفاصيل<textarea placeholder="أضف التفاصيل المناسبة"></textarea></label></div><div class="hero-actions">${demoButton('متابعة',true)}${demoButton('حفظ لاحقًا')}</div></form></div>`;
}
function chat(page) {
  return heading(page,escapeHtml(lastName(page)),'رسائلك وطلباتك في سياق واحد يسهل متابعته.') + `<div class="chat-layout"><aside class="chat-list"><div class="active">محادثة توضيحية 01<br><small>آخر رسالة اليوم</small></div><div>محادثة توضيحية 02</div><div>محادثة توضيحية 03</div></aside><div class="chat-room"><h3>محادثة توضيحية</h3><div class="bubble">مرحبًا، كيف يمكننا مساعدتك؟</div><div class="bubble reply">أرغب في متابعة طلبي.</div><div class="chat-input">اكتب رسالة... (معاينة فقط)</div></div></div>`;
}
function map(page) {
  return heading(page,escapeHtml(lastName(page)),'استكشف العقارات والمناطق على خريطة واضحة، مع أدوات بحث سهلة الوصول.') + `<div class="filter-bar"><button class="is-active" type="button">الكل</button><button type="button">العقارات</button><button type="button">الخدمات</button></div><div class="map-preview" style="min-height:420px"><span class="map-label">الخريطة هنا توضيحية</span></div>`;
}
function article(page) {
  return heading(page,escapeHtml(lastName(page)),'معلومات واضحة عن المنصة وخدماتها، منظمة لتصل إلى الإجابة بسرعة.',link('/services','استكشف الخدمات',true)) + `<div class="article-layout"><article><h2>عن الوساطة الرقمية</h2><p>تجمع المنصة العروض العقارية والخدمات المرتبطة بها في تجربة واحدة. يمكنك استعراض العروض، متابعة الطلبات، والتعرف على الخدمات المساندة.</p><h2>كيف تبدأ؟</h2><p>ابدأ بتصفح العروض أو الخدمات، ثم اختر ما يناسب احتياجك. تتغير الخطوات اللاحقة بحسب نوع الخدمة.</p></article><aside><strong>في هذه الصفحة</strong><div>عن المنصة</div><div>الخدمات</div><div>الخطوات التالية</div></aside></div>`;
}
function account(page) {
  return heading(page,'ملفك الشخصي','راجع بياناتك، حالة التحقق، وتفضيلات التواصل من مكان واحد.',demoButton('تعديل البيانات',true)) + `<div class="dashboard-grid"><section class="panel soft"><div class="panel-head"><h3>المعلومات الشخصية</h3><span>حساب تجريبي</span></div><div class="activity"><div class="activity-row"><i></i><div><strong>الاسم</strong><small>يظهر اسم المستخدم هنا</small></div></div><div class="activity-row"><i></i><div><strong>التواصل</strong><small>تظهر بيانات الاتصال هنا</small></div></div></div></section><section class="panel"><h3>حالة الحساب</h3><p>تظهر حالة التحقق والبيانات الناقصة بوضوح، مع الخطوة التالية.</p><div class="hero-actions">${demoButton('عرض التفاصيل')}</div></section></div>`;
}
function detail(page) {
  return heading(page,escapeHtml(page.title.replace(' / التفاصيل','')),'تفاصيل العنصر، حالته الحالية، والخطوات المتاحة للمتابعة.',demoButton('متابعة الطلب',true)) + `<div class="dashboard-grid"><section class="panel"><h3>نظرة عامة</h3><p>المعلومات الأساسية لهذا العنصر تظهر هنا بشكل منظم.</p><div class="activity"><div class="activity-row"><i></i><div><strong>الحالة الحالية</strong><small>قيد المتابعة · توضيحي</small></div></div><div class="activity-row"><i></i><div><strong>التفاصيل</strong><small>وصف ومرفقات مرتبطة بالعنصر</small></div></div></div></section><section class="panel soft"><h3>الخطوة التالية</h3><p>إجراء واضح بحسب نوع العنصر وصلاحيات المستخدم.</p><div class="hero-actions">${demoButton('عرض الإجراء')}</div></section></div>`;
}
function content(page) {
  switch(page.kind) {
    case 'public': return publicPage(page);
    case 'dashboard': return dashboard(page);
    case 'catalog': return catalog(page);
    case 'records': return records(page);
    case 'form': return form(page);
    case 'auth': return form(page,true);
    case 'chat': return chat(page);
    case 'map': return map(page);
    case 'article': return article(page);
    case 'account': return account(page);
    case 'detail': return detail(page);
  }
  return records(page);
}
function selectedPage() {
  let route;
  try { route = decodeURIComponent(location.hash.slice(1)) || '/'; } catch { route = '/'; }
  return pages.find(page => page.route === route) || pages.find(page => page.route === '/');
}
function draw(replay = false) {
  const page = selectedPage();
  const update = () => {
    screen.innerHTML = content(page);
    picker.value = page.route;
    routePath.textContent = page.route;
    document.title = page.title + ' | __NAME__';
    document.querySelectorAll('.studio-variants a').forEach(anchor => anchor.href = anchor.getAttribute('href').split('#')[0] + '#' + encodeURIComponent(page.route));
    document.querySelectorAll('.site-header nav a,.site-rail a').forEach(anchor => { const href = anchor.getAttribute('href'); anchor.classList.toggle('is-active', href === '#' + encodeURIComponent(page.route)); });
  };
  if (!replay && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('motion-off')) document.startViewTransition(update);
  else update();
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'),2400); }
const groups = pages.reduce((acc,page) => { (acc[page.group] ??= []).push(page); return acc; },{});
picker.innerHTML = Object.entries(groups).map(([group,items]) => `<optgroup label="${escapeHtml(group)}">${items.map(page => `<option value="${escapeHtml(page.route)}">${escapeHtml(page.title)} · ${escapeHtml(page.route)}</option>`).join('')}</optgroup>`).join('');
picker.addEventListener('change', () => { location.hash = encodeURIComponent(picker.value); });
window.addEventListener('hashchange', () => draw());
document.getElementById('replay').addEventListener('click', () => draw(true));
document.getElementById('pause').addEventListener('click', event => { const off = document.body.classList.toggle('motion-off'); event.currentTarget.setAttribute('aria-pressed',String(off)); event.currentTarget.textContent = off ? 'تشغيل الحركة' : 'إيقاف الحركة'; });
screen.addEventListener('click', event => { if (event.target.closest('[data-demo]')) showToast('هذا نموذج تصميمي فقط؛ لا يرسل بيانات.'); });
screen.addEventListener('click', event => { const chip = event.target.closest('.filter-bar button'); if (chip) { chip.parentElement.querySelectorAll('button').forEach(item => item.classList.remove('is-active')); chip.classList.add('is-active'); } });
screen.addEventListener('submit', event => event.preventDefault());
document.querySelectorAll('.studio-variants a').forEach(anchor => { if (anchor.dataset.variant === '__VARIANT__') anchor.setAttribute('aria-current','page'); });
draw(true);
