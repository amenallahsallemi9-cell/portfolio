/* Portfolio — Part 1 layout + Part 2 motion & interactions. */
(function () {
  'use strict';

  window.__motionReady = true;

  var MOBILE_QUERY = window.matchMedia('(max-width: 900px)');
  var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)');

  function isDesktop() { return !MOBILE_QUERY.matches; }
  function hasMouse() { return FINE_POINTER.matches && isDesktop(); }

  /* =======================================================
     PART 1 — Static layout (name fit + portrait placement)
     ======================================================= */

  // Portrait source facts, measured from assets/portrait.png (848 × 928).
  // HAIR_TOP is the first non-transparent row (56px) as a share of the height.
  var PORTRAIT_RATIO = 928 / 848;
  var HAIR_TOP = 56 / 928;

  // Inter cap height, as a share of font-size.
  var CAP_HEIGHT = 0.727;

  // Name sizing limits from the design spec.
  var NAME_MAX = 180;
  var NAME_MIN_DESKTOP = 64;

  var hero = document.querySelector('.hero');
  var heroName = document.querySelector('.hero-name');
  var nameFirst = document.querySelector('.name-first');
  var nameRest = document.querySelector('.name-rest');
  var baselineMarker = document.querySelector('.name-baseline');
  var portrait = document.querySelector('.hero-portrait');
  var portraitGray = document.querySelector('.portrait-gray');

  /* ---------- Giant name: fit to ~90% width ---------- */
  function fitName() {
    heroName.style.fontSize = NAME_MAX + 'px';

    if (MOBILE_QUERY.matches) {
      // Two lines: the widest line must fit 90% of the screen.
      var available = document.documentElement.clientWidth * 0.9;
      var widest = Math.max(textWidth(nameFirst), textWidth(nameRest));
      heroName.style.fontSize = Math.min(NAME_MAX, NAME_MAX * available / widest) + 'px';
      return;
    }

    var target = hero.clientWidth * 0.9;
    var size = NAME_MAX * target / heroName.scrollWidth;
    heroName.style.fontSize = Math.max(NAME_MIN_DESKTOP, Math.min(NAME_MAX, size)) + 'px';
  }

  // Width of an inline-or-block span's actual text.
  function textWidth(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().width;
  }

  /* ---------- Portrait: size and vertical placement ---------- */
  function layoutPortrait() {
    if (MOBILE_QUERY.matches) {
      portrait.style.width = '';
      portrait.style.top = '';
      return;
    }

    var heroW = hero.clientWidth;
    var heroH = hero.clientHeight;
    var width = Math.min(heroW * 0.5, heroH * 0.9);
    var height = width * PORTRAIT_RATIO;
    var hairOffset = height * HAIR_TOP;

    // Measured without the entrance translate so the resting spot is exact.
    var heroTop = hero.getBoundingClientRect().top;
    var baseline = baselineMarker.getBoundingClientRect().top - heroTop;
    var capH = parseFloat(getComputedStyle(heroName).fontSize) * CAP_HEIGHT;

    // Top of hair sits inside the bottom 28% of the letters (aim ~14% up).
    var top = baseline - capH * 0.14 - hairOffset;

    // The hero edge must cut the photo: if it falls short, lower it,
    // but never so far that the hair leaves the letters.
    if (top + height < heroH + 2) {
      top = Math.min(heroH + 2 - height, baseline - capH * 0.03 - hairOffset);
    }

    portrait.style.width = width + 'px';
    portrait.style.top = top + 'px';
  }

  function layout() {
    fitName();
    layoutPortrait();
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector('.footer-year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* =======================================================
     PART 2 — Motion & interactions
     ======================================================= */

  var scroller = document.querySelector('.scroller');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.section-dots .dot'));
  var progressBar = document.querySelector('.progress-bar');

  var started = false;    // hero sequence has begun
  var activeIndex = -1;

  /* ---------- Entrance stagger delays ---------- */
  function stagger(selector, first, step) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.style.setProperty('--d', (first + i * step).toFixed(2) + 's');
    });
  }
  stagger('.project-card', 0.05, 0.10);
  stagger('.service-row', 0.05, 0.10);
  stagger('.experience-row', 0.05, 0.08);
  stagger('.cert-row', 0.05, 0.08);

  /* ---------- Active section ---------- */
  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    sections[index].classList.add('is-in');    // entrance plays once, stays
    dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
    hidePreview();
  }

  // Active = the section with the largest visible share, if above ~45%.
  // The share is measured against the smaller of section and viewport
  // height so tall phone sections can still become active.
  function detectActive() {
    if (!started) return;
    var vTop, vBottom;
    if (isDesktop()) {
      var r = scroller.getBoundingClientRect();
      vTop = r.top; vBottom = r.bottom;
    } else {
      vTop = 0; vBottom = window.innerHeight;
    }
    var viewH = vBottom - vTop;
    var best = -1, bestRatio = 0;

    sections.forEach(function (section, i) {
      var rect = section.getBoundingClientRect();
      var visible = Math.min(rect.bottom, vBottom) - Math.max(rect.top, vTop);
      if (visible <= 0) return;
      var ratio = visible / Math.min(rect.height, viewH);
      if (ratio > bestRatio) { bestRatio = ratio; best = i; }
    });

    if (best >= 0 && bestRatio > 0.45) setActive(best);
  }

  /* ---------- Progress bar ---------- */
  function updateProgress() {
    var p;
    if (isDesktop()) {
      var max = scroller.scrollHeight - scroller.clientHeight;
      p = max > 0 ? scroller.scrollTop / max : 0;
    } else {
      var maxW = document.documentElement.scrollHeight - window.innerHeight;
      p = maxW > 0 ? window.scrollY / maxW : 0;
    }
    progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)).toFixed(4) + ')';
  }

  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      scrollTicking = false;
      detectActive();
      updateProgress();
    });
  }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Smooth section scrolling (desktop window) ---------- */
  // cubic-bezier(.16,.84,.25,1), solved for y at time x.
  function bezier(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
    function b(p1, p2) { return 3 * p2 - 6 * p1; }
    function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-6) break;
        t -= (at(t, x1, x2) - x) / s;
      }
      return at(Math.min(1, Math.max(0, t)), y1, y2);
    };
  }
  var easeStandard = bezier(0.16, 0.84, 0.25, 1);

  var SCROLL_DURATION = 900;
  var scrollAnim = null;

  function animateScrollTo(target) {
    if (scrollAnim) cancelAnimationFrame(scrollAnim.raf);
    var from = scroller.scrollTop;
    var distance = target - from;
    if (Math.abs(distance) < 1) { scroller.scrollTop = target; return; }

    var start = performance.now();
    scroller.classList.add('is-animating');
    scrollAnim = { raf: 0 };

    function step(now) {
      var t = Math.min(1, (now - start) / SCROLL_DURATION);
      scroller.scrollTop = from + distance * easeStandard(t);
      if (t < 1) {
        scrollAnim.raf = requestAnimationFrame(step);
      } else {
        scroller.scrollTop = target;
        scroller.classList.remove('is-animating');
        scrollAnim = null;
      }
    }
    scrollAnim.raf = requestAnimationFrame(step);
  }

  var targetIndex = 0;

  function goToSection(index) {
    index = Math.max(0, Math.min(sections.length - 1, index));
    if (isDesktop()) {
      targetIndex = index;
      animateScrollTo(sections[index].offsetTop);
    } else {
      sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function step(dir) {
    var from = scrollAnim ? targetIndex : Math.round(scroller.scrollTop / scroller.clientHeight);
    var to = from + dir;
    if (to < 0 || to >= sections.length) return;    // nothing past first/last
    goToSection(to);
  }

  /* ---------- Wheel: one gesture = one section ---------- */
  // A new gesture is accepted after a quiet gap, or when the delta jumps
  // (a fresh swipe during the inertia tail of the previous one).
  var lastWheelTime = 0;
  var lastWheelDelta = 0;

  window.addEventListener('wheel', function (e) {
    if (!isDesktop() || e.ctrlKey) return;
    e.preventDefault();

    var now = performance.now();
    var gap = now - lastWheelTime;
    var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : 0;
    var size = Math.abs(delta);
    lastWheelTime = now;

    if (size < 2) { lastWheelDelta = size; return; }

    var freshGesture = gap > 180 || size > lastWheelDelta * 1.6 + 4;
    lastWheelDelta = size;

    if (scrollAnim || !freshGesture) return;
    step(delta > 0 ? 1 : -1);
  }, { passive: false });

  /* ---------- Keyboard ---------- */
  window.addEventListener('keydown', function (e) {
    if (!isDesktop()) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!scrollAnim) step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!scrollAnim) step(-1); }
  });

  /* ---------- Anchor links & dots ---------- */
  function indexOfId(id) {
    for (var i = 0; i < sections.length; i++) if (sections[i].id === id) return i;
    return -1;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var index = indexOfId(link.getAttribute('href').slice(1));
    if (index < 0) return;
    e.preventDefault();
    goToSection(index);
  });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var index = indexOfId(dot.getAttribute('data-target'));
      if (index >= 0) goToSection(index);
    });
  });

  /* ---------- Custom cursor ---------- */
  var cursor = document.createElement('div');
  cursor.className = 'cursor-dot';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor-dot-inner"></span>';
  document.body.appendChild(cursor);

  var GROW_TARGETS = 'a, button, .experience-row, .dot';

  document.addEventListener('mousemove', function (e) {
    if (!hasMouse()) return;
    cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    cursor.classList.add('is-visible');
  });
  document.addEventListener('mouseover', function (e) {
    cursor.classList.toggle('is-grown', !!e.target.closest(GROW_TARGETS));
  });
  document.documentElement.addEventListener('mouseleave', function () {
    cursor.classList.remove('is-visible');
  });

  /* ---------- Portrait colour reveal ---------- */
  var REVEAL_INNER = 120;
  var REVEAL_OUTER = 170;
  var reveal = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, raf: 0 };

  function revealFrame() {
    reveal.x += (reveal.tx - reveal.x) * 0.25;
    reveal.y += (reveal.ty - reveal.y) * 0.25;
    reveal.r += (reveal.tr - reveal.r) * 0.18;

    if (reveal.r < 0.5 && reveal.tr === 0) {
      reveal.r = 0;
      portraitGray.classList.remove('is-revealing');
      reveal.raf = 0;
      return;
    }

    var s = portraitGray.style;
    s.setProperty('--mx', reveal.x.toFixed(1) + 'px');
    s.setProperty('--my', reveal.y.toFixed(1) + 'px');
    s.setProperty('--r-in', reveal.r.toFixed(1) + 'px');
    s.setProperty('--r-out', (reveal.r * REVEAL_OUTER / REVEAL_INNER).toFixed(1) + 'px');
    portraitGray.classList.add('is-revealing');
    reveal.raf = requestAnimationFrame(revealFrame);
  }

  function setRevealTarget(inside, x, y) {
    if (inside) {
      if (reveal.r < 0.5) { reveal.x = x; reveal.y = y; }   // appear where the mouse is
      reveal.tx = x; reveal.ty = y; reveal.tr = REVEAL_INNER;
    } else {
      reveal.tr = 0;
    }
    if (!reveal.raf) reveal.raf = requestAnimationFrame(revealFrame);
  }

  document.addEventListener('mousemove', function (e) {
    if (!hasMouse()) { if (reveal.tr) setRevealTarget(false); return; }
    var rect = portrait.getBoundingClientRect();
    var inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                 e.clientY >= rect.top && e.clientY <= rect.bottom &&
                 e.clientY <= hero.getBoundingClientRect().bottom;
    setRevealTarget(inside, e.clientX - rect.left, e.clientY - rect.top);
  });
  document.documentElement.addEventListener('mouseleave', function () { setRevealTarget(false); });

  /* ---------- Experience hover preview ---------- */
  var expRows = Array.prototype.slice.call(document.querySelectorAll('.experience-row[data-preview]'));
  var preview = null;
  var previewImg = null;

  if (expRows.length) {
    preview = document.createElement('div');
    preview.className = 'exp-preview';
    preview.setAttribute('aria-hidden', 'true');
    previewImg = document.createElement('img');
    previewImg.alt = '';
    preview.appendChild(previewImg);
    document.body.appendChild(preview);

    // Preload so switching rows is instant.
    expRows.forEach(function (row) { new Image().src = row.getAttribute('data-preview'); });

    document.addEventListener('mousemove', function (e) {
      if (!hasMouse()) { hidePreview(); return; }
      var row = e.target.closest && e.target.closest('.experience-row[data-preview]');
      if (!row) { hidePreview(); return; }
      var src = row.getAttribute('data-preview');
      if (previewImg.getAttribute('src') !== src) previewImg.setAttribute('src', src);
      preview.style.transform = 'translate3d(' + (e.clientX + 24) + 'px,' + (e.clientY - 75) + 'px,0)';
      preview.classList.add('is-visible');
    });
  }

  function hidePreview() {
    if (preview) preview.classList.remove('is-visible');
  }

  /* ---------- Resize: keep layout and snap alignment exact ---------- */
  window.addEventListener('resize', function () {
    layout();
    if (isDesktop() && !scrollAnim && activeIndex >= 0) {
      scroller.scrollTop = sections[activeIndex].offsetTop;
    }
    detectActive();
    updateProgress();
  });

  /* ---------- Start ---------- */
  layout();

  function start() {
    if (started) return;
    layout();
    started = true;
    setActive(0);    // hero is active immediately; its sequence starts now
    detectActive();
    updateProgress();
  }

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1000); })]).then(start);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
})();
