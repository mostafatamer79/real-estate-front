/**
 * DETAILS ELITE INTERACTION & MOTION ENGINE
 * Emil Kowalski & High-End Visual Design principles
 */

(function () {
  'use strict';

  // 1. Theme Synchronization
  function initTheme() {
    const isDark = document.body.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark && !document.body.classList.contains('dark')) {
      document.body.classList.add('dark');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const activeDark = document.body.classList.contains('dark');
        themeToggleBtn.setAttribute('aria-pressed', String(activeDark));
        // Propagate to iframe map if present
        syncMapTheme(activeDark);
      });
    }
  }

  function syncMapTheme(isDark) {
    const mapFrame = document.querySelector('.map-portal-frame');
    if (mapFrame && mapFrame.contentDocument) {
      mapFrame.contentDocument.body.classList.toggle('dark', isDark);
    }
  }

  // 2. Animated Number Rollups (Count-up)
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-counter') || '0');
          const prefix = el.getAttribute('data-prefix') || '';
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1200;
          const start = performance.now();

          function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(ease * target);
            el.textContent = `${prefix}${current.toLocaleString('ar-SA')}${suffix}`;
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              el.textContent = `${prefix}${target.toLocaleString('ar-SA')}${suffix}`;
            }
          }
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(c => observer.observe(c));
  }

  // 3. Interactive 3D Tilt on Hover for Cards
  function initTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // 3b. Interactive Platform Hero Ecosystem & Living CAD Stage
  function initCadStage() {
    const cadStage = document.getElementById('hero-cad-stage');
    const masterSvg = document.getElementById('master-ecosystem-svg');
    const btnEcosystem = document.getElementById('view-mode-ecosystem');
    const btnBlueprint = document.getElementById('view-mode-blueprint');
    const pillarsGroup = document.getElementById('svg-pillars-group');
    const skylineGroup = document.getElementById('svg-skyline-group');
    if (!cadStage) return;

    // View Switcher: Architectural Ecosystem vs Living CAD Blueprint
    if (btnEcosystem && btnBlueprint && masterSvg) {
      btnEcosystem.addEventListener('click', () => {
        btnEcosystem.classList.add('active');
        btnBlueprint.classList.remove('active');
        masterSvg.classList.remove('blueprint-mode');
      });

      btnBlueprint.addEventListener('click', () => {
        btnBlueprint.classList.add('active');
        btnEcosystem.classList.remove('active');
        masterSvg.classList.add('blueprint-mode');
      });
    }

    // High-Precision 2.5D Vector Parallax on Mousemove
    let rafId = null;
    cadStage.addEventListener('mousemove', (e) => {
      const rect = cadStage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const transX = (x - 0.5) * -12;
        const transY = (y - 0.5) * -8;
        if (pillarsGroup) {
          pillarsGroup.style.transform = `translate(${transX}px, ${transY}px)`;
          pillarsGroup.style.transition = 'transform 0.12s ease-out';
        }
        if (skylineGroup) {
          skylineGroup.style.transform = `translate(${transX * 0.35}px, ${transY * 0.35}px)`;
          skylineGroup.style.transition = 'transform 0.12s ease-out';
        }
      });
    });

    cadStage.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (pillarsGroup) {
        pillarsGroup.style.transform = 'translate(0px, 0px)';
        pillarsGroup.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      if (skylineGroup) {
        skylineGroup.style.transform = 'translate(0px, 0px)';
        skylineGroup.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    });
  }

  // 4. Modal / Drawer Interactions
  function initModals() {
    const triggers = document.querySelectorAll('[data-modal-trigger]');
    const backdrop = document.querySelector('.modal-backdrop');
    const closeBtns = document.querySelectorAll('[data-modal-close]');

    function openModal(id) {
      const modal = document.getElementById(id);
      if (modal && backdrop) {
        backdrop.hidden = false;
        modal.hidden = false;
        requestAnimationFrame(() => {
          backdrop.classList.add('visible');
          modal.classList.add('visible');
        });
      }
    }

    function closeModal() {
      const activeModals = document.querySelectorAll('.elite-modal.visible');
      if (backdrop) backdrop.classList.remove('visible');
      activeModals.forEach(m => m.classList.remove('visible'));
      setTimeout(() => {
        if (backdrop) backdrop.hidden = true;
        activeModals.forEach(m => m.hidden = true);
      }, 250);
    }

    triggers.forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(t.getAttribute('data-modal-trigger'));
      });
    });

    closeBtns.forEach(b => b.addEventListener('click', closeModal));
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // 5. Parent communication for Master Chooser
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'THEME_SYNC') {
      document.body.classList.toggle('dark', e.data.dark);
      syncMapTheme(e.data.dark);
    }
  });

  // Run on DOM loaded
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCounters();
    initTilt();
    initCadStage();
    initModals();
  });
})();
