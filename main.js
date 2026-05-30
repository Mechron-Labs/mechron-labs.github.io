/* =========================================================
   Mechron — landing interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Sticky nav state + mobile menu
     --------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');

  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // close the mobile menu after navigating
    document.querySelectorAll('.nav__mobile a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------------------------------------------------------
     2. Reveal-on-scroll
     --------------------------------------------------------- */
  const reveals = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     3. Hero background: real video if present, else animated canvas
     The <video> sources point at assets/hero.{webm,mp4}. If those files
     exist and can play, we fade the video in and stop the canvas. Until
     then (or on failure / reduced-motion) the canvas fallback stays.
     --------------------------------------------------------- */
  const video = document.getElementById('heroVideo');
  const canvas = document.getElementById('heroCanvas');

  let raf = null;
  const stopCanvas = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  if (video) {
    const activateVideo = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        video.classList.add('is-ready');
        if (canvas) canvas.classList.add('is-hidden');
        stopCanvas();
      }
    };
    // Listen broadly: the video may become ready before or after this script
    // attaches, so 'playing'/'timeupdate' catch the case where the early
    // 'loadeddata'/'canplay' events already fired.
    ['loadeddata', 'canplay', 'playing', 'timeupdate'].forEach((ev) =>
      video.addEventListener(ev, activateVideo)
    );
    // give up gracefully if the sources are missing
    video.addEventListener('error', stopVideoFallback, true);
    // immediate check in case the video is already ready right now
    activateVideo();
  }
  function stopVideoFallback() {/* keep canvas running — nothing to do */}

  // --- animated fallback: drifting particle field with light links ---
  function runCanvas() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, points;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((w * h) / 16000));
      points = Array.from({ length: count }, (_, i) => ({
        x: ((i * 9301 + 49297) % 233280) / 233280 * w,
        y: ((i * 49297 + 9301) % 233280) / 233280 * h,
        vx: (((i * 13) % 100) / 100 - 0.5) * 0.25,
        vy: (((i * 7) % 100) / 100 - 0.5) * 0.25,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // subtle vignette base
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // links
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(214, 221, 232, ${0.14 * (1 - dist / 130)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes — mostly cool light, a few accent sparks
      for (let i = 0; i < points.length; i++) {
        const accent = i % 6 === 0;
        ctx.fillStyle = accent ? 'rgba(223, 83, 30, 0.95)' : 'rgba(214, 221, 232, 0.6)';
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, accent ? 1.8 : 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    if (prefersReduced) {
      // draw a single static frame, no animation loop
      draw();
      stopCanvas();
    } else {
      draw();
    }
  }
  runCanvas();

  /* ---------------------------------------------------------
     4. i18n scaffold
     English ships inline in the HTML (works with no JS / no fetch).
     A language file at i18n/<lang>.json can override every [data-i18n]
     node — drop i18n/pt.json with the same keys to enable Portuguese.
     --------------------------------------------------------- */
  const I18N = {
    current: 'en',
    apply(dict) {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] != null) el.innerHTML = dict[key];
      });
    },
    async load(lang) {
      try {
        const res = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        const dict = await res.json();
        this.apply(dict);
        this.current = lang;
        document.documentElement.lang = lang;
        return true;
      } catch (e) {
        // fetch unavailable (e.g. file://) — inline copy stays. No-op.
        return false;
      }
    },
  };

  // keep EN in sync with the json source of truth when served over http(s)
  if (location.protocol.startsWith('http')) I18N.load('en');

  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      const lang = btn.getAttribute('data-lang');
      if (lang === I18N.current) return;
      const ok = await I18N.load(lang);
      if (!ok) return;
      document.querySelectorAll('.lang__btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    });
  });
})();
