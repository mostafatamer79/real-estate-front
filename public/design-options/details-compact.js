(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const sections = $$('.chapter');
  const links = $$('[data-section]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const focus = document.body.dataset.design === 'focus';
  const animations = new Set();
  let paused = false, raf = 0, current = -1;
  const clamp = value => Math.max(0, Math.min(1, value));
  const allowed = () => !paused && !reduced.matches;
  function animate(element, frames, options = {}) {
    if (!allowed()) return;
    const animation = element.animate(frames, {duration:650, easing:'cubic-bezier(.16,1,.3,1)', ...options});
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  }
  function indicator(index) {
    current = index;
    links.forEach((link, i) => link.setAttribute('aria-current', String(i === index)));
    const box = links[index].getBoundingClientRect();
    const parent = $('.section-nav').getBoundingClientRect();
    $('.nav-indicator').style.width = `${box.width}px`;
    $('.nav-indicator').style.transform = `translateX(${box.left - parent.left}px)`;
  }
  function activate(index, moveFocus = false) {
    if (!focus) return;
    sections.forEach((section, i) => {
      section.classList.toggle('selected', i === index);
      section.hidden = i !== index;
    });
    indicator(index);
    const target = sections[index];
    animate(target, [
      {clipPath:'inset(0 100% 0 0)', opacity:.2, transform:'translateX(-20px)'},
      {clipPath:'inset(0 0% 0 0)', opacity:1, transform:'translateX(0)'}
    ], {duration:750});
    target.querySelectorAll('article,.quick-grid a').forEach((card, i) => animate(card, [
      {transform:'translateY(25px)',opacity:0}, {transform:'translateY(0)',opacity:1}
    ], {delay:100+i*75,fill:'backwards'}));
    if (moveFocus) {
      const heading = target.querySelector('h2');
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
    }
  }
  links.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault();
    history.replaceState(null, '', link.hash);
    if (focus) activate(index, true);
    else sections[index].scrollIntoView({block:'start',behavior:allowed()?'smooth':'instant'});
  }));
  function intro() {
    animations.forEach(animation => animation.cancel());
    $$('.title-line').forEach((line, index) => animate(line, [
      {transform:'translateY(35px)',clipPath:'inset(100% 0 0 0)',opacity:0},
      {transform:'translateY(0)',clipPath:'inset(0 0 0 0)',opacity:1}
    ], {delay:80+index*130,duration:950,fill:'backwards'}));
    animate($('.intro-art'), [{transform:'perspective(700px) rotateY(-20deg) translateX(-45px)',opacity:0},{transform:'perspective(700px) rotateY(0deg) translateX(0)',opacity:1}],{duration:1300});
    $$('.architect-lines>path').forEach((path, i) => {
      const length = path.getTotalLength();
      animate(path, [{strokeDasharray:length,strokeDashoffset:length},{strokeDasharray:length,strokeDashoffset:0}],{duration:1500,delay:i*85,fill:'backwards'});
    });
    sections.filter(section => !section.hidden).forEach((section,i) => animate(section,[
      {transform:'translateY(32px) rotateX(3deg)',opacity:0}, {transform:'translateY(0) rotateX(0)',opacity:1}
    ],{delay:150+i*90,duration:800,fill:'backwards'}));
  }
  function draw() {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    document.body.style.setProperty('--reading', max > 0 ? clamp(scrollY/max) : 0);
    document.body.style.setProperty('--header-height', `${$('header').offsetHeight}px`);
    if (!focus) {
      let active = 0, nearest = -Infinity;
      sections.forEach((section,index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < innerHeight*.5 && rect.top > nearest + 2) { active = index; nearest = rect.top; }
        section.style.setProperty('--section-progress', clamp((innerHeight - rect.top)/(innerHeight+rect.height)));
      });
      indicator(active);
    } else indicator(Math.max(0,current));
    if (allowed()) {
      const offset = clamp(scrollY / 350);
      $('.intro-art').style.translate = `0 ${-offset*25}px`;
      $('.intro-art').style.opacity = String(1-offset*.35);
    }
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request);
  $('#theme').addEventListener('click',event => {
    const dark = document.body.classList.toggle('dark');
    event.currentTarget.textContent = dark ? 'الوضع الفاتح' : 'الوضع الداكن';
    event.currentTarget.setAttribute('aria-pressed',String(dark));
    animate($('.intro-art'),[{opacity:.3},{opacity:1}],{duration:450});
  });
  function stopMapMotion() {
    const iframe = $('.live-map');
    const button = iframe?.contentDocument?.querySelector('[data-control="play"][aria-pressed="true"]');
    if (button) button.click();
  }
  $('#pause').addEventListener('click',event => {
    paused = !paused;
    document.body.classList.toggle('paused',paused);
    event.currentTarget.textContent = paused ? 'تشغيل الحركة' : 'إيقاف الحركة';
    event.currentTarget.setAttribute('aria-pressed',String(paused));
    animations.forEach(animation => paused ? animation.pause() : animation.play());
    if(paused) stopMapMotion();
    request();
  });
  $('#replay').addEventListener('click',intro);
  const dialog = $('dialog');
  $$('[data-dialog]').forEach(button => button.addEventListener('click',() => {
    const ads = button.dataset.dialog === 'ads';
    dialog.querySelector('h2').textContent = ads ? 'الإعلانات' : 'العمليات السابقة';
    dialog.querySelector('p').textContent = ads ? 'لا توجد إعلانات حالياً' : 'لا توجد عمليات حالياً';
    dialog.showModal();
    animate(dialog,[{transform:'translateY(18px) scale(.96)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:350});
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting) {
      if (!focus && allowed()) animate(entry.target,[{transform:'translateY(24px)',opacity:.3},{transform:'translateY(0)',opacity:1}],{duration:700});
      observer.unobserve(entry.target);
    }
  }),{threshold:.15});
  sections.forEach(section => observer.observe(section));
  $('.intro-art').addEventListener('pointermove',event => {
    if(!allowed() || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width-.5;
    const y=(event.clientY-rect.top)/rect.height-.5;
    $('.aperture').style.transform = `perspective(700px) rotateY(${x*14}deg) rotateX(${-y*10}deg)`;
  });
  $('.intro-art').addEventListener('pointerleave',() => {$('.aperture').style.transform='none'});
  reduced.addEventListener('change',() => {
    if(reduced.matches) {
      animations.forEach(animation=>animation.cancel());
      $('.intro-art').style.translate='none';
      $('.intro-art').style.opacity='1';
      $('.aperture').style.transform='none';
      stopMapMotion();
    }
    request();
  });
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) animations.forEach(animation=>animation.pause());
    else if (allowed()) animations.forEach(animation=>animation.play());
  });
  document.body.classList.add('enhanced');
  const initial = sections.findIndex(section=>'#'+section.id===location.hash);
  if(focus) activate(Math.max(0,initial));
  document.fonts.ready.then(()=>{draw();intro()});
  draw();
})();
