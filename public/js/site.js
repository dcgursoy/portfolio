/* Shared behaviour for every page: theme toggle, videos that play on hover or while in view,
   copy buttons. The theme itself is applied before paint by the small inline script in each
   page's <head>; this file only wires the controls. */
(() => {
  const root = document.documentElement;
  const KEY = 'dg-theme';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setTheme(t, save) {
    root.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'dark' ? '#0b0b0b' : '#ffffff';
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      b.title = t === 'dark' ? 'Light mode' : 'Dark mode';
    });
    if (save) { try { localStorage.setItem(KEY, t); } catch (e) { /* private mode */ } }
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-theme-toggle]');
    if (b) setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  // follow the system setting until the visitor picks a theme here
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
    if (!saved) setTheme(e.matches ? 'dark' : 'light', false);
  });

  /* cards whose video plays while the pointer is over the card (or it has focus) */
  function wireHoverVideos(scope) {
    (scope || document).querySelectorAll('[data-hover-video]').forEach(card => {
      if (card.dataset.wired) return;
      const v = card.querySelector('video');
      if (!v) return;
      card.dataset.wired = '1';
      const play = () => { if (!reduce) v.play().catch(() => {}); };
      const stop = () => { v.pause(); v.load(); };          // load() brings the poster back
      card.addEventListener('pointerenter', play);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', play);
      card.addEventListener('focusout', stop);
    });
  }
  wireHoverVideos();

  /* <video data-inview> plays, muted and looping, while at least half of it is on screen and
     pauses when it is not. It never starts by itself when the visitor prefers reduced motion.
     Each one gets a small round button in a corner of its frame to pause and play it; a pause
     chosen there holds until the visitor presses play again. data-inview="721" means: below a
     721px viewport leave the poster alone (no playback, no button). */
  const ICONS = '<svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>' +
                '<svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.3v11.4L13.5 8z" fill="currentColor"/></svg>';
  let watcher = null;
  const state = new WeakMap();                             // video -> { held, seen, sync }
  function wireInview(scope) {
    (scope || document).querySelectorAll('video[data-inview]').forEach(v => {
      if (state.has(v)) return;
      const min = parseInt(v.dataset.inview, 10);
      if (min && !matchMedia(`(min-width: ${min}px)`).matches) return;
      v.muted = true; v.loop = true; v.playsInline = true; v.controls = false;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'vbtn'; btn.innerHTML = ICONS;
      const s = { held: reduce, seen: false };              // held: the visitor (or their motion setting) keeps it paused
      s.sync = () => {
        const playing = !v.paused;
        btn.dataset.state = playing ? 'playing' : 'paused';
        btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      };
      btn.addEventListener('click', () => {
        if (v.paused) { s.held = false; v.play().catch(() => {}); } else { s.held = true; v.pause(); }
      });
      v.addEventListener('play', s.sync);
      v.addEventListener('pause', s.sync);
      state.set(v, s);
      s.sync();
      (v.closest('.frame') || v.parentElement).appendChild(btn);
      if (!watcher) {
        watcher = new IntersectionObserver(entries => entries.forEach(en => {
          const st = state.get(en.target);
          if (!st) return;
          st.seen = en.intersectionRatio >= 0.5;
          if (st.seen && !st.held) en.target.play().catch(() => {});
          else if (!st.seen) en.target.pause();
        }), { threshold: [0, 0.5, 1] });
      }
      watcher.observe(v);
    });
  }
  wireInview();

  /* <button data-copy="text"> copies and confirms in place */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const text = b.dataset.copy, label = b.textContent;
    const done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = label; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
  });

  window.DG = Object.assign(window.DG || {}, { setTheme, wireHoverVideos, wireInview, reduce });
})();
