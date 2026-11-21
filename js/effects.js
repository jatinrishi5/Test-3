/* Test-3 · Luxury private advisory: decorative effects.
   Runs after main.js. Purely visual: every element added here is aria-hidden,
   and nothing runs for visitors who prefer reduced motion. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hero = document.querySelector('.hero');
  if (!hero || reduce) return;

  function make(tag, cls, parent) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    if (parent) parent.appendChild(el);
    return el;
  }

  // ---------- Opening curtain: once per browser session ----------
  var intro = 0;
  var seen = false;
  try { seen = sessionStorage.getItem('jr-curtain') === '1'; sessionStorage.setItem('jr-curtain', '1'); } catch (e) { seen = true; }
  if (!seen && window.scrollY < 50) {
    var curtain = make('div', 'fx-curtain', document.body);
    var mark = make('div', 'fx-curtain-mark', curtain);
    mark.textContent = 'JR';
    make('i', '', mark);
    setTimeout(function () { curtain.remove(); }, 2300);
    intro = 1.25;
  }
  hero.style.setProperty('--intro', intro + 's');

  // ---------- Background layers ----------
  var aurora = make('div', 'fx-layer fx-aurora');
  for (var a = 0; a < 3; a++) make('span', '', aurora);
  var columns = make('div', 'fx-layer fx-columns');
  var grain = make('div', 'fx-layer fx-grain');
  var dust = make('canvas', 'fx-layer fx-dust');
  hero.insertBefore(dust, hero.firstChild);
  hero.insertBefore(grain, hero.firstChild);
  hero.insertBefore(columns, hero.firstChild);
  hero.insertBefore(aurora, hero.firstChild);

  // ---------- Headline: split into words that rise in ----------
  var h1 = hero.querySelector('h1');
  var wordIndex = 0;
  function wrapWord(content) {
    var outer = document.createElement('span');
    outer.className = 'fx-word';
    var inner = document.createElement('span');
    inner.style.setProperty('--d', (wordIndex++ * 0.12) + 's');
    if (typeof content === 'string') inner.textContent = content; else inner.appendChild(content);
    outer.appendChild(inner);
    return outer;
  }
  if (h1) {
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrapWord(part));
        });
        h1.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        var placeholder = document.createTextNode('');
        h1.replaceChild(placeholder, node);
        h1.replaceChild(wrapWord(node), placeholder);
      }
    });
    Array.prototype.forEach.call(h1.querySelectorAll('.fx-word'), function (w) { w.setAttribute('aria-hidden', 'true'); });
  }

  // Rest of the hero arrives in sequence
  var copyKids = hero.querySelectorAll('.hero-copy > :not(h1)');
  Array.prototype.forEach.call(copyKids, function (el, i) { el.style.setProperty('--i', i); });
  var visual = hero.querySelector('.hero-visual');
  if (visual) visual.style.setProperty('--i', 2);
  var highlights = hero.querySelector('.highlights');
  if (highlights) highlights.style.setProperty('--i', copyKids.length + 1);
  hero.classList.add('fx-intro');

  // ---------- Gold dust ----------
  var ctx = dust.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, motes = [];
  function sizeDust() {
    W = hero.clientWidth; H = hero.clientHeight;
    dust.width = W * dpr; dust.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(Math.min(90, W / 16));
    motes = [];
    for (var i = 0; i < count; i++) motes.push(newMote(true));
  }
  function newMote(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: Math.random() * 1.5 + .35,
      vy: Math.random() * .22 + .06,
      sway: Math.random() * Math.PI * 2,
      tw: Math.random() * Math.PI * 2,
      ts: Math.random() * .03 + .01
    };
  }
  var running = false, visible = true;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y -= m.vy; m.sway += .006; m.tw += m.ts;
      var x = m.x + Math.sin(m.sway) * 14;
      var alpha = .25 + Math.sin(m.tw) * .25 + .25;
      if (m.y < -10) motes[i] = newMote(false);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(232, 205, 150,' + alpha.toFixed(3) + ')';
      ctx.shadowColor = 'rgba(232, 205, 150, .8)';
      ctx.shadowBlur = m.r * 4;
      ctx.arc(x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  function setRunning() {
    var should = visible && !document.hidden;
    if (should && !running) { running = true; requestAnimationFrame(frame); }
    else if (!should) running = false;
  }
  sizeDust();
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(sizeDust, 200); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', setRunning);
  setRunning();

  // ---------- Cursor spotlight and 3D card (mouse only) ----------
  if (finePointer) {
    var spot = make('div', 'fx-spot');
    hero.insertBefore(spot, aurora.nextSibling);
    var raf = 0, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        hero.style.setProperty('--sx', mx + 'px');
        hero.style.setProperty('--sy', my + 'px');
      });
    });
    hero.addEventListener('pointerenter', function () { hero.classList.add('fx-hover'); });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('fx-hover'); });

    var ledger = hero.querySelector('.ledger');
    if (visual && ledger) {
      make('div', 'fx-glare', ledger);
      visual.addEventListener('pointermove', function (e) {
        var r = ledger.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ledger.style.transform = 'perspective(1100px) rotateY(' + ((px - .5) * 9).toFixed(2) + 'deg) rotateX(' + ((.5 - py) * 7).toFixed(2) + 'deg) translateZ(0)';
        ledger.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        ledger.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        visual.classList.add('fx-tilting');
      });
      visual.addEventListener('pointerleave', function () {
        ledger.style.transform = '';
        visual.classList.remove('fx-tilting');
      });
    }
  }

  // ---------- Scroll reveals ----------
  if ('IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.section-head, .sw-head, .marquee, .explorer, .who-card, .tl-step, .tc-grid > .card, .about-copy, .beliefs li, .founder, .faq-intro, .accordion, .contact-info, .intake-card');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add('fx-in');
        var delay = parseInt(el.style.getPropertyValue('--fx-delay'), 10) || 0;
        // Hand control back to the element's own hover styles once revealed.
        setTimeout(function () { el.classList.remove('fx-reveal', 'fx-in'); el.style.removeProperty('--fx-delay'); }, 1400 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    Array.prototype.forEach.call(targets, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * .92 && r.bottom > 0) return; // already on screen
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--fx-delay', (idx % 4) * 110 + 'ms');
      el.classList.add('fx-reveal');
      io.observe(el);
    });
  }
})();
