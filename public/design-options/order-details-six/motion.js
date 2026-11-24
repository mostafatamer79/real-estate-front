/* Presentation only: this file never loads order data or sends messages. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  const running = new Set();
  const canAnimate = () => !paused && !preference.matches;

  function play(element, frames, options = {}) {
    if (!canAnimate() || !element || typeof element.animate !== 'function') return;
    const animation = element.animate(frames, {
      duration: 480,
      easing: 'cubic-bezier(.22,1,.36,1)',
      ...options,
    });
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  }

  const control = document.createElement('button');
  control.className = 'btn motion-control';
  control.type = 'button';
  control.dataset.motion = '';
  control.setAttribute('aria-pressed', 'false');
  control.textContent = 'إيقاف الحركة';
  const toolbar = document.querySelector('header .nav') || document.querySelector('header');
  toolbar?.append(control);

  function syncMotion() {
    const disabled = !canAnimate();
    document.body.classList.toggle('motion-paused', disabled);
    control.setAttribute('aria-pressed', String(disabled));
    control.textContent = preference.matches ? 'الحركة المخففة مفعّلة' : paused ? 'تشغيل الحركة' : 'إيقاف الحركة';
    control.disabled = preference.matches;
    if (disabled) running.forEach(animation => animation.cancel());
  }
  control.addEventListener('click', () => { paused = !paused; syncMotion(); });
  preference.addEventListener('change', syncMotion);
  syncMotion();

  const hero = document.querySelector('.hero') || document.querySelector('.intro');
  if (hero) {
    const art = document.createElement('div');
    art.className = 'hero-art';
    art.setAttribute('aria-hidden', 'true');
    // Decorative request network; deliberately has no live status semantics.
    art.innerHTML = '<svg viewBox="0 0 440 240" fill="none"><g class="network-lines" stroke="currentColor"><path d="M10 180H130Q160 180 160 150V80Q160 50 190 50H425"/><path d="M45 215H240Q270 215 270 185V110Q270 80 300 80H410"/><path d="M25 110H80Q110 110 110 80V25"/></g><g class="network-trace" stroke="currentColor"><path d="M10 180H130Q160 180 160 150V80Q160 50 190 50H425"/><path d="M45 215H240Q270 215 270 185V110Q270 80 300 80H410"/></g><g fill="currentColor"><circle class="network-node n1" cx="160" cy="120" r="5"/><circle class="network-node n2" cx="270" cy="155" r="5"/><circle class="network-node n3" cx="330" cy="50" r="5"/></g><g class="network-house" stroke="currentColor" stroke-width="1.4"><rect x="180" y="100" width="58" height="62" rx="9"/><path d="M193 124L209 111L225 124V145H193V124Z"/><path d="M205 145V132H214V145"/></g></svg>';
    hero.append(art);
    hero.classList.add('motion-hero');
  }

  const targets = document.querySelectorAll('.hero > :not(.hero-art), .intro > *, .metric, .content > .card, .sidebar > .card, .gallery article');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        play(entry.target, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: Math.min(stagger++ * 65, 195), duration: 650 });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    targets.forEach(target => observer.observe(target));
  }

  const log = document.querySelector('.messages');
  if (log) {
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType !== 1 || !node.classList.contains('bubble')) return;
        play(node, [{ opacity: .2, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 280 });
      }));
    });
    observer.observe(log, { childList: true });
  }

  document.addEventListener('order-panel-change', event => {
    if (event.detail?.keyboard) return;
    document.querySelectorAll('[data-panel]:not([hidden])').forEach((panel, i) => {
      play(panel, [{ opacity: .3, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, delay: i * 35 });
    });
  });

  // Pointer-only feedback leaves keyboard navigation immediate.
  document.addEventListener('click', event => {
    const button = event.target.closest('.btn');
    if (!button || !event.detail) return;
    play(button, [{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 180 });
  });
})();
