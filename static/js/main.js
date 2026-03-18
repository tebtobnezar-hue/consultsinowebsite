/* ════════════════════════════════════════════════════════════
   ELH SINO-CONSULT — Premium Animation Engine v5
   ════════════════════════════════════════════════════════════ */
'use strict';

/* ── UTILITIES ───────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── THEME (runs immediately) ────────────────────────────── */
(function applyTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const btn = $('#theme-toggle');
    if (btn) btn.textContent = '☀️';
  }
})();

/* ═══════════════════════════════════════════════════════════
   1. INTRO ANIMATION — Canvas particles + smooth reveal
   ═══════════════════════════════════════════════════════════ */
(function initIntro() {
  const overlay = $('#intro-overlay');
  if (!overlay) return;

  const DURATION = sessionStorage.getItem('elh_intro') ? 800 : 3500;

  /* ── Canvas particle system ── */
  const canvas = $('#intro-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35 - 0.15,
      alpha: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.5 ? '212,175,55' : '58,170,58',
      pulse: Math.random() * Math.PI * 2,
    }));

    let canvasRaf;
    function drawCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = performance.now() * 0.001;
      particles.forEach(p => {
        p.x  += p.vx; p.y += p.vy;
        p.pulse += 0.018;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${a})`;
        ctx.fill();
      });
      canvasRaf = requestAnimationFrame(drawCanvas);
    }
    canvasRaf = requestAnimationFrame(drawCanvas);

    overlay.addEventListener('animationend', () => {
      cancelAnimationFrame(canvasRaf);
    }, { once: true });
  }

  /* ── Progress bar ── */
  const fill = $('#intro-loader-fill');
  const t0 = performance.now();
  let dismissed = false;

  function tick(now) {
    if (dismissed) return;
    const pct = clamp((now - t0) / DURATION * 100, 0, 100);
    if (fill) fill.style.width = pct + '%';
    if (pct >= 100) dismiss();
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ── Dismiss (smooth fade + scale) ── */
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.add('hiding');
    sessionStorage.setItem('elh_intro', '1');
    setTimeout(() => {
      overlay.style.display = 'none';
      /* Trigger hero entrance */
      const hero = $('.hero-content');
      if (hero) hero.classList.add('animated');
    }, 900);
  }

  overlay.addEventListener('click', dismiss, { once: true });
  const skipHint = $('#intro-skip-hint');
  if (skipHint) skipHint.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
})();

/* ═══════════════════════════════════════════════════════════
   2. SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════════ */
const scrollBar = $('#scroll-progress');
function updateScrollBar() {
  if (!scrollBar) return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.width = total > 0 ? (window.scrollY / total * 100) + '%' : '0';
}

/* ═══════════════════════════════════════════════════════════
   3. HERO 3D MOUSE PARALLAX
   ═══════════════════════════════════════════════════════════ */
(function initHeroParallax() {
  const hero    = $('.hero');
  const heroBg  = $('.hero-bg');
  const heroContent = $('.hero-content');
  if (!hero || !heroBg) return;

  let mx = 0, my = 0;   // target
  let cx = 0, cy = 0;   // current (lerped)
  let raf = null;

  function update() {
    cx = lerp(cx, mx, 0.06);
    cy = lerp(cy, my, 0.06);

    const bgX = cx * -18;
    const bgY = cy * -10;
    const fgX = cx * 8;
    const fgY = cy * 5;
    const rotX = cy * 4;
    const rotY = cx * -5;

    heroBg.style.transform = `translate(${bgX}px, ${bgY}px) scale(1.08)`;
    if (heroContent) {
      heroContent.style.transform = `translate(${fgX}px, ${fgY}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }
    raf = requestAnimationFrame(update);
  }

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mx = (e.clientX - rect.left) / rect.width  - 0.5;
    my = (e.clientY - rect.top)  / rect.height - 0.5;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    mx = 0; my = 0;
  }, { passive: true });

  // Also on touch devices — light gyro-like effect
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (!e.beta || !e.gamma) return;
      mx = clamp(e.gamma / 30, -0.5, 0.5);
      my = clamp((e.beta - 40) / 30, -0.5, 0.5);
    }, { passive: true });
  }

  // Start loop
  raf = requestAnimationFrame(update);
})();

/* ═══════════════════════════════════════════════════════════
   4. SCROLL-DRIVEN PARALLAX for bg sections
   ═══════════════════════════════════════════════════════════ */
function updateParallax() {
  const y = window.scrollY;
  // Stats section depth
  const stats = $('.stats-section');
  if (stats) {
    const rel = y - stats.offsetTop;
    const bg = $('.stats-bg', stats);
    if (bg) bg.style.transform = `translateY(${rel * 0.2}px)`;
  }
}

/* ═══════════════════════════════════════════════════════════
   5. NAVBAR — smart hide/show + scroll detection
   ═══════════════════════════════════════════════════════════ */
const navbar = $('#navbar');
let lastY = 0;
let ticking = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (navbar) {
        navbar.classList.toggle('scrolled', y > 40);
        if (y > lastY + 8 && y > 250) {
          navbar.style.transform = 'translateY(-100%)';
        } else if (y < lastY - 8 || y < 100) {
          navbar.style.transform = 'translateY(0)';
        }
        lastY = y;
      }
      updateScrollBar();
      updateParallax();
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ═══════════════════════════════════════════════════════════
   6. SCROLL REVEAL — IntersectionObserver
   ═══════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add('visible');
    $$('.reveal-item, .reveal-scale, .reveal-left, .reveal-right', target)
      .forEach(c => c.classList.add('visible'));
    // Section header text clip reveal
    if (target.classList.contains('section-header')) {
      target.classList.add('visible');
    }
    revealObs.unobserve(target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

$$('.reveal, .reveal-item, .reveal-scale, .reveal-left, .reveal-right, .section-header')
  .forEach(el => revealObs.observe(el));

/* ═══════════════════════════════════════════════════════════
   7. STATS COUNTER — eased count-up
   ═══════════════════════════════════════════════════════════ */
function animateCounter(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = parseInt(el.dataset.target, 10) || 0;
  const DURATION = 2200;
  const t0 = performance.now();

  function easeOutQuart(x) { return 1 - Math.pow(1 - x, 4); }

  function frame(now) {
    const p = clamp((now - t0) / DURATION, 0, 1);
    const v = Math.floor(easeOutQuart(p) * target);
    el.textContent = v >= 1000 ? v.toLocaleString() : v;
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target >= 1000 ? target.toLocaleString() : target;
  }
  requestAnimationFrame(frame);
}

new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    $$('.stat-num[data-target]', target).forEach(animateCounter);
    $$('.stat-item', target).forEach((el, i) => {
      el.style.transitionDelay = (i * 0.12) + 's';
      el.classList.add('visible');
    });
  });
}, { threshold: 0.25 }).observe($('.stats-section') || document.body);

/* ═══════════════════════════════════════════════════════════
   8. CARD 3D TILT on mousemove
   ═══════════════════════════════════════════════════════════ */
function initCardTilt() {
  const CARDS = $$('.card, .uni-card, .service-card, .contact-card');
  CARDS.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        translateY(-10px)
        rotateX(${y * -10}deg)
        rotateY(${x * 10}deg)
        scale(1.015)
      `;
      // Dynamic highlight
      const gx = (e.clientX - rect.left) / rect.width * 100;
      const gy = (e.clientY - rect.top) / rect.height * 100;
      card.style.background = `radial-gradient(circle at ${gx}% ${gy}%, var(--card-bg) 0%, var(--card-bg) 60%)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.background = '';
    }, { passive: true });
  });
}

/* ═══════════════════════════════════════════════════════════
   9. HERO PARTICLES
   ═══════════════════════════════════════════════════════════ */
(function spawnHeroParticles() {
  const container = $('#hero-particles');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('span');
    p.className = 'hero-particle';
    const size = Math.random() * 4 + 1.5;
    const drift = (Math.random() - 0.5) * 60;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      bottom:${Math.random()*40}%;
      --drift:${drift}px;
      animation-duration:${Math.random()*10+6}s;
      animation-delay:${Math.random()*8}s;
      opacity:${Math.random()*0.5+0.1};
    `;
    container.appendChild(p);
  }
})();

/* ═══════════════════════════════════════════════════════════
   10. SMOOTH CURSOR (desktop) — subtle premium touch
   ═══════════════════════════════════════════════════════════ */
(function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;
  $$('.btn-primary, .btn-secondary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width  / 2) * 0.2;
      const y = (e.clientY - rect.top  - rect.height / 2) * 0.2;
      btn.style.transform = `translate(${x}px, ${y}px) translateY(-3px) scale(1.02)`;
    }, { passive: true });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    }, { passive: true });
  });
})();

/* ═══════════════════════════════════════════════════════════
   11. PAGE LOAD — DOMContentLoaded init
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
  initCardTilt();

  // If no intro overlay on page, animate hero directly
  const heroContent = $('.hero-content');
  if (heroContent && !$('#intro-overlay')) {
    heroContent.classList.add('animated');
  }

  // Animate section headers when visible
  $$('.section-header').forEach(h => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { h.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(h);
  });
});

/* ═══════════════════════════════════════════════════════════
   12. THEME TOGGLE
   ═══════════════════════════════════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  const btn = $('#theme-toggle');
  if (btn) btn.textContent = dark ? '🌙' : '☀️';
  localStorage.setItem('theme', dark ? 'light' : 'dark');
}

/* ═══════════════════════════════════════════════════════════
   13. LANGUAGE TOGGLE
   ═══════════════════════════════════════════════════════════ */
let currentLang = localStorage.getItem('lang') || 'en';
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  $$('[data-en],[data-fr]').forEach(el => {
    const v = el.getAttribute('data-' + lang);
    if (!v) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = v;
    else if (el.tagName === 'OPTION') el.textContent = v;
    else el.innerHTML = v;
  });
  $('#btn-en')?.classList.toggle('active', lang === 'en');
  $('#btn-fr')?.classList.toggle('active', lang === 'fr');
}

/* ═══════════════════════════════════════════════════════════
   14. MOBILE MENU
   ═══════════════════════════════════════════════════════════ */
function toggleMenu() {
  $('#nav-links')?.classList.toggle('open');
}
$$('.nav-links a').forEach(a => {
  a.addEventListener('click', () => $('#nav-links')?.classList.remove('open'));
});

/* ═══════════════════════════════════════════════════════════
   15. FAQ ACCORDION
   ═══════════════════════════════════════════════════════════ */
function toggleFaq(btn) {
  const item   = btn.closest('.faq-item');
  const answer = $('.faq-a', item);
  const isOpen = btn.classList.contains('open');
  $$('.faq-q.open').forEach(b => {
    b.classList.remove('open');
    b.closest('.faq-item').querySelector('.faq-a').classList.remove('open');
  });
  if (!isOpen) { btn.classList.add('open'); answer.classList.add('open'); }
}

/* ═══════════════════════════════════════════════════════════
   16. AJAX FORMS
   ═══════════════════════════════════════════════════════════ */
function handleForm(formId, statusId) {
  const form = $('#' + formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('#' + statusId);
    const btn = $('button[type="submit"]', form);
    const orig = btn.textContent;
    btn.textContent = currentLang === 'fr' ? 'Envoi…' : 'Sending…';
    btn.disabled = true; btn.style.opacity = '0.7';
    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const r = await res.json();
      if (status) {
        status.className = 'form-status ' + (r.success ? 'success' : 'error');
        status.textContent = r.message;
        status.style.animation = 'none';
        status.offsetHeight;
        status.style.animation = 'formStatusIn 0.5s var(--ease-spring) forwards';
      }
      if (r.success) form.reset();
    } catch {
      if (status) {
        status.className = 'form-status error';
        status.textContent = currentLang === 'fr' ? 'Erreur réseau.' : 'Network error. Please try again.';
      }
    } finally {
      btn.textContent = orig; btn.disabled = false; btn.style.opacity = '1';
      status?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
handleForm('quick-form', 'quick-status');
handleForm('contact-msg-form', 'contact-status');

/* ═══════════════════════════════════════════════════════════
   17. SMOOTH ANCHOR SCROLL
   ═══════════════════════════════════════════════════════════ */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = $(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ═══════════════════════════════════════════════════════════
   MAP INTERACTIVITY
   ═══════════════════════════════════════════════════════════ */
(function initMap() {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;
  const markers = document.querySelectorAll('.map-marker');
  markers.forEach(marker => {
    marker.addEventListener('mouseenter', (e) => {
      const city = marker.dataset.city;
      const uni  = marker.dataset.uni;
      tooltip.querySelector('.tooltip-city').textContent = city;
      tooltip.querySelector('.tooltip-uni').textContent  = uni;
      tooltip.classList.add('visible');
    });
    marker.addEventListener('mousemove', (e) => {
      const wrap = document.querySelector('.china-map-wrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tooltip.style.left = (x + 14) + 'px';
      tooltip.style.top  = (y - 40) + 'px';
    });
    marker.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
    // Stagger pulse animations
    const pulse = marker.querySelector('.marker-pulse');
    const ring  = marker.querySelector('.marker-ring');
    const delay = Math.random() * 1.5;
    if (pulse) pulse.style.animationDelay = delay + 's';
    if (ring)  ring.style.animationDelay  = delay + 's';
  });
})();

/* ═══════════════════════════════════════════════════════════
   FILE UPLOAD
   ═══════════════════════════════════════════════════════════ */
(function initFileUpload() {
  const input   = document.getElementById('doc-upload');
  const area    = document.getElementById('file-upload-area');
  const display = document.getElementById('file-name-display');
  if (!input || !area) return;

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      const name = input.files[0].name;
      const size = (input.files[0].size / 1024 / 1024).toFixed(2);
      area.querySelector('.file-upload-content').style.display = 'none';
      display.style.display = 'flex';
      display.innerHTML = `📎 <strong>${name}</strong> <span style="color:var(--text-muted);font-weight:400">(${size} MB)</span>
        <button onclick="clearFile(event)" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--red);font-size:1rem;padding:0">✕</button>`;
    }
  });

  // Drag & drop
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragging'); });
  area.addEventListener('dragleave', () => area.classList.remove('dragging'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });
})();

function clearFile(e) {
  e.stopPropagation();
  const input   = document.getElementById('doc-upload');
  const area    = document.getElementById('file-upload-area');
  const display = document.getElementById('file-name-display');
  if (input) input.value = '';
  if (display) display.style.display = 'none';
  if (area) area.querySelector('.file-upload-content').style.display = 'flex';
}

/* ═══════════════════════════════════════════════════════════
   REGISTRATION FORM AJAX
   ═══════════════════════════════════════════════════════════ */
(function initRegForm() {
  const form = document.getElementById('reg-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('reg-status');
    const btn    = document.getElementById('reg-submit');
    const orig   = btn.innerHTML;
    btn.innerHTML = '<span class="btn-reg-text">Sending…</span>';
    btn.disabled  = true;
    try {
      const fd   = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { if (k !== 'document') data[k] = v; });
      const res  = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const r = await res.json();
      if (status) {
        status.className = 'form-status ' + (r.success ? 'success' : 'error');
        status.textContent = r.message;
        status.style.animation = 'none';
        status.offsetHeight;
        status.style.animation = 'formStatusIn 0.5s ease forwards';
      }
      if (r.success) { form.reset(); clearFile({ stopPropagation: () => {} }); }
    } catch {
      if (status) { status.className = 'form-status error'; status.textContent = 'Network error. Please try again.'; }
    } finally {
      btn.innerHTML = orig;
      btn.disabled  = false;
      status?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
})();
