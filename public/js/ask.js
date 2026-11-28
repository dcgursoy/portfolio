/* "Ask me anything": a serial-monitor style panel that sends questions to POST /api/ask
   (server/server.py) and types the answers out. No dependencies.

   Pages include css/ask.css and this file, plus any trigger:
     <button class="ask-fab" type="button" data-ask-open>Ask me anything</button>
   (the ">_" glyph is added when the button has no aria-hidden child of its own)
   API:    window.Ask.open(triggerElement?), window.Ask.close(), window.Ask.isOpen(), window.Ask.ask(question, triggerElement?)
   Markup: <form data-ask-form [data-ask-about="project title"]><input><button></form> sends what was typed;
           <button data-ask-q="question"> sends a ready question.
   Events on document: "ask:open", "ask:close", "ask:busy" (detail true while waiting or printing, then false)
   Suggestions come from window.SITE.profile.ask_suggestions when that exists. */
(() => {
  'use strict';
  if (window.Ask) return;

  const EMAIL = 'dcgursoy07@gmail.com';
  const MAX_CHARS = 400;            // matches the server's limit on a question
  const CHARS_PER_SECOND = 90;      // typing rate of an answer
  const REQUEST_TIMEOUT_MS = 30000;
  const HISTORY_ITEMS = 6;          // the server keeps at most this many
  const STORE_KEY = 'dg-ask-log';   // sessionStorage: the transcript follows the visitor from page to page
  const STORE_MAX = 12;
  const DEFAULT_SUGGESTIONS = [
    'What did Deniz do at SpaceX?',
    'Which project should I look at first?',
    'What has he built on real hardware?',
    'How do I contact him?',
  ];

  /* site root and API address, worked out from this script's own URL so the widget
     also works from /projects/*.html and from a site served under a sub-path */
  const script = document.currentScript;
  const base = (() => {
    try { return new URL('..', script.src).href; } catch (e) { return new URL('/', location.href).href; }
  })();
  const API = (script && script.dataset.api) || new URL('api/ask', base).href;

  let panel, log, live, form, input, send, sugg, state;
  let open = false, busy = false, phase = 'ready', trigger = null, skip = null, turn = 0;
  const history = [];               // [{role, text}] of answered exchanges, for follow-up questions
  let stored = [];

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ── link hygiene: the same allow-list as the server; everything else stays text ── */
  function linkFor(target) {
    const t = String(target).trim();
    let m = /^\/projects\/([a-z0-9][a-z0-9-]*\.html)$/.exec(t);
    if (m) return { href: new URL('projects/' + m[1], base).href, external: false };
    if (t.toLowerCase() === 'mailto:' + EMAIL) return { href: 'mailto:' + EMAIL, external: false };
    m = /^https:\/\/github\.com\/dcgursoy((?:\/[A-Za-z0-9._-]+)*)\/?$/.exec(t);
    if (m && !m[1].split('/').some(s => s === '.' || s === '..')) return { href: 'https://github.com/dcgursoy' + m[1], external: true };
    if (/^https:\/\/(?:www\.)?linkedin\.com\/in\/dgursoy\/?$/i.test(t)) return { href: 'https://www.linkedin.com/in/dgursoy/', external: true };
    return null;
  }

  /* "[text](target)" and the bare email become link segments; nothing is ever parsed as HTML */
  function segments(raw) {
    const out = [];
    const text = s => {
      s.split(EMAIL).forEach((part, i) => {
        if (i) out.push({ s: EMAIL, link: { href: 'mailto:' + EMAIL, external: false } });
        if (part) out.push({ s: part });
      });
    };
    const re = /\[([^\[\]\n]{1,200})\]\(((?:[^()\s]|\([^()\s]*\)){1,300})\)/g;
    let last = 0, m;
    while ((m = re.exec(raw))) {
      text(raw.slice(last, m.index));
      const link = linkFor(m[2]);
      if (link) out.push({ s: m[1], link }); else text(m[1]);
      last = m.index + m[0].length;
    }
    text(raw.slice(last));
    return out;
  }
  const plain = raw => segments(raw).map(x => x.s).join('');

  /* ── building the panel ── */
  function build() {
    if (panel) return;
    panel = el('section', 'ask');
    panel.id = 'ask-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', String(matchMedia('(max-width: 640px)').matches));
    panel.setAttribute('aria-labelledby', 'ask-title');
    panel.setAttribute('aria-describedby', 'ask-note');

    const head = el('header', 'ask__head');
    const bar = el('div', 'ask__bar');
    const title = el('h2', 'ask__title', 'Ask me anything');
    title.id = 'ask-title';
    state = el('span', 'ask__state', 'ready');
    state.setAttribute('aria-hidden', 'true');
    const close = el('button', 'ask__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close the assistant');
    close.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>';
    close.addEventListener('click', () => closePanel());
    bar.append(title, state, close);
    const note = el('p', 'ask__note', 'An AI model answers from this site. It can be wrong; the project pages are the source.');
    note.id = 'ask-note';
    head.append(bar, note, el('p', 'ask__fine', "Questions are sent to Google's Gemini API."));

    log = el('div', 'ask__log');
    log.tabIndex = 0;
    log.setAttribute('role', 'region');
    log.setAttribute('aria-label', 'Conversation');

    live = el('div', 'ask__live');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');

    sugg = el('div', 'ask__sugg');
    sugg.setAttribute('role', 'group');
    sugg.setAttribute('aria-label', 'Suggested questions');
    const fromSite = window.SITE && window.SITE.profile && window.SITE.profile.ask_suggestions;
    const list = (Array.isArray(fromSite) ? fromSite : [])
      .filter(s => typeof s === 'string' && s.trim()).map(s => s.trim().slice(0, 120)).slice(0, 4);
    (list.length ? list : DEFAULT_SUGGESTIONS).forEach(q => {
      const b = el('button', 'ask__pick', q);
      b.type = 'button';
      b.addEventListener('click', () => { submit(q); input.focus({ preventScroll: true }); });
      sugg.append(b);
    });

    form = el('form', 'ask__form');
    form.noValidate = true;
    const field = el('div', 'ask__field');
    const prompt = el('span', 'ask__prompt', '>');
    prompt.setAttribute('aria-hidden', 'true');
    const label = el('label', 'ask__label', 'Your question');
    label.htmlFor = 'ask-input';
    input = el('input', 'ask__input');
    input.id = 'ask-input';
    input.type = 'text';
    input.name = 'question';
    input.maxLength = MAX_CHARS;
    input.autocomplete = 'off';
    input.spellcheck = true;
    input.placeholder = 'Type a question';
    input.setAttribute('enterkeyhint', 'send');
    field.append(prompt, label, input);
    send = el('button', 'ask__send', 'Send');
    send.type = 'submit';
    form.append(field, send);
    form.addEventListener('submit', e => { e.preventDefault(); submit(input.value); });

    panel.append(head, log, live, sugg, form);
    document.body.append(panel);

    panel.addEventListener('keydown', onKey);
    document.addEventListener('keydown', e => { if (open && e.key === 'Escape' && !panel.contains(e.target)) { e.preventDefault(); closePanel(); } });
    panel.addEventListener('pointerdown', () => { if (skip) skip(); });

    restore();
    if (!log.children.length) log.append(el('p', 'ask__sys', 'Ready. Type a question, or pick one below.'));
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
      return;
    }
    if (skip && !['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) skip();
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(n => n.getClientRects().length);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !panel.contains(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  }

  /* ── state ── */
  function setPhase(next) {
    phase = next;
    state.textContent = next;
    panel.classList.toggle('is-busy', next !== 'ready');
    send.setAttribute('aria-disabled', String(next === 'waiting'));   // not "disabled": that would drop focus
    const now = next !== 'ready';
    if (now !== busy) {
      busy = now;
      document.dispatchEvent(new CustomEvent('ask:busy', { detail: busy }));
    }
  }

  const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  const toBottom = () => { log.scrollTop = log.scrollHeight; };

  function announce(text) {
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 60);
  }

  /* ── the transcript ── */
  function addExchange(question) {
    const x = el('div', 'ask__x');
    x.append(el('p', 'ask__q', question));
    log.append(x);
    return x;
  }

  function fill(target, raw) {
    const parts = segments(raw).map(seg => {
      const text = document.createTextNode('');
      if (seg.link) {
        const a = el('a');
        a.href = seg.link.href;
        if (seg.link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.append(text);
        target.append(a);
        return { text, s: seg.s, a };
      }
      target.append(text);
      return { text, s: seg.s };
    });
    return {
      total: parts.reduce((n, p) => n + p.s.length, 0),
      show(n) {
        for (const p of parts) {
          const take = Math.max(0, Math.min(p.s.length, n));
          if (p.text.data.length !== take) p.text.data = p.s.slice(0, take);
          n -= p.s.length;
        }
      },
      links: parts.filter(p => p.a).map(p => p.a),
    };
  }

  /* types the answer out; resolves when the full text is on screen */
  function print(x, raw) {
    return new Promise(resolve => {
      const a = el('p', 'ask__a');
      x.append(a);
      const out = fill(a, raw);
      const finish = () => {
        skip = null;
        out.show(out.total);
        cursor.remove();
        a.removeAttribute('aria-hidden');
        out.links.forEach(l => l.removeAttribute('tabindex'));
        if (stick) toBottom();
        announce(plain(raw));
        resolve();
      };
      const cursor = el('span', 'ask__cursor');
      let stick = true;
      if (reduced() || !open || document.hidden) { finish(); return; }

      a.setAttribute('aria-hidden', 'true');           // read once, complete, from the live region
      out.links.forEach(l => { l.tabIndex = -1; });
      a.append(cursor);
      setPhase('printing');
      const t0 = performance.now();
      let done = false;
      skip = () => { if (!done) { done = true; finish(); } };
      const step = now => {
        if (done) return;
        stick = stick && nearBottom();
        const n = Math.floor((now - t0) * CHARS_PER_SECOND / 1000);
        out.show(n);
        if (stick) toBottom();
        if (n >= out.total) { done = true; finish(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function printError(x, message) {
    const p = el('p', 'ask__err');
    p.append(el('b', '', 'error: '));
    fill(p, message).show(Infinity);
    x.append(p);
    toBottom();
    announce('Error: ' + message);
  }

  /* ── talking to the server ── */
  async function ask(question) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: history.slice(-HISTORY_ITEMS) }),
        signal: ctrl.signal,
        credentials: 'same-origin',
      });
    } catch (e) {
      return { error: e && e.name === 'AbortError'
        ? 'The assistant took too long to answer. Try again in a moment.'
        : 'Could not reach the assistant. Check your connection and try again, or email ' + EMAIL + '.' };
    } finally {
      clearTimeout(timer);
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON: handled below */ }
    const said = data && typeof data.error === 'string' && data.error.length < 300 ? data.error : '';
    if (res.ok && data && typeof data.answer === 'string' && data.answer) return data;
    if (res.status === 429) return { error: said || 'Too many questions for now. Try again in a minute.' };
    if (res.status === 400 || res.status === 403) return { error: said || 'That question could not be sent. Try rewording it.' };
    if ([404, 405, 501].includes(res.status)) return { error: 'The assistant is not running on this copy of the site. Email ' + EMAIL + ' instead.' };
    return { error: said || 'The assistant hit an error (' + res.status + '). Try again in a moment, or email ' + EMAIL + '.' };
  }

  async function submit(text) {
    const question = String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
    if (!question || phase === 'waiting') return;
    if (skip) skip();                                   // finish the answer that is still printing
    const me = ++turn;
    sugg.hidden = true;
    const first = log.querySelector('.ask__sys');
    if (first) first.remove();
    input.value = '';

    const x = addExchange(question);
    const wait = el('p', 'ask__wait');
    wait.setAttribute('aria-hidden', 'true');
    wait.append(el('span', '', '.'), el('span', '', '.'), el('span', '', '.'));
    x.append(wait);
    toBottom();
    setPhase('waiting');

    const result = await ask(question);
    wait.remove();
    if (result.error) {
      printError(x, result.error);
    } else {
      if (result.source === 'gemini') {
        history.push({ role: 'user', text: question }, { role: 'assistant', text: plain(result.answer) });
        history.splice(0, Math.max(0, history.length - HISTORY_ITEMS));
      }
      remember({ q: question, a: result.answer, live: result.source === 'gemini' });
      await print(x, result.answer);
    }
    if (me === turn) setPhase('ready');                 // a newer question may already be waiting
  }

  /* ── the transcript survives a page change within the tab ── */
  function remember(item) {
    stored.push(item);
    stored = stored.slice(-STORE_MAX);
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(stored)); } catch (e) { /* private mode */ }
  }

  function restore() {
    try { stored = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch (e) { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    stored = stored.filter(i => i && typeof i.q === 'string' && typeof i.a === 'string').slice(-STORE_MAX);
    stored.forEach(i => {
      const x = addExchange(i.q.slice(0, MAX_CHARS));
      const a = el('p', 'ask__a');
      fill(a, i.a.slice(0, 1200)).show(Infinity);
      x.append(a);
      if (i.live) history.push({ role: 'user', text: i.q }, { role: 'assistant', text: plain(i.a) });
    });
    history.splice(0, Math.max(0, history.length - HISTORY_ITEMS));
    if (stored.length) sugg.hidden = true;
  }

  /* ── open and close ── */
  function setExpanded(v) {
    document.querySelectorAll('[data-ask-open]').forEach(b => {
      b.setAttribute('aria-expanded', String(v));
      b.setAttribute('aria-controls', 'ask-panel');
    });
  }

  /* phones: keep the sheet above the on-screen keyboard */
  function fitViewport() {
    const vv = window.visualViewport;
    if (!vv || !panel) return;
    const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    if (open && covered > 80) {
      panel.style.setProperty('--ask-bottom', covered + 'px');
      panel.style.setProperty('--ask-max', Math.max(240, vv.height - 8) + 'px');
    } else {
      panel.style.removeProperty('--ask-bottom');
      panel.style.removeProperty('--ask-max');
    }
  }

  function openPanel(from) {
    build();
    if (open) { input.focus({ preventScroll: true }); return; }
    trigger = from instanceof Element ? from : document.activeElement;
    open = true;
    panel.hidden = false;
    document.documentElement.classList.add('ask-open');
    setExpanded(true);
    toBottom();
    fitViewport();
    input.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('ask:open', { detail: { trigger } }));
  }

  function closePanel() {
    if (!open) return;
    if (skip) skip();
    open = false;
    panel.hidden = true;
    document.documentElement.classList.remove('ask-open');
    setExpanded(false);
    fitViewport();
    if (trigger && trigger !== document.body && document.contains(trigger) && trigger.focus) trigger.focus({ preventScroll: true });
    trigger = null;
    document.dispatchEvent(new CustomEvent('ask:close'));
  }

  function init() {
    build();
    document.querySelectorAll('.ask-fab').forEach(b => {
      if (!b.textContent.trim()) b.textContent = 'Ask me anything';
      if (!b.querySelector('[aria-hidden="true"]')) {     // pages may bring their own ">_" glyph
        const glyph = el('span', '', '>_');
        glyph.setAttribute('aria-hidden', 'true');
        b.prepend(glyph);
      }
      if (b.tagName === 'BUTTON' && !b.getAttribute('type')) b.type = 'button';
    });
    document.querySelectorAll('[data-ask-open]').forEach(b => b.setAttribute('aria-haspopup', 'dialog'));
    setExpanded(false);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitViewport);
      window.visualViewport.addEventListener('scroll', fitViewport);
    }
  }

  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-ask-open]');
    if (!t) return;
    e.preventDefault();
    openPanel(t);
  });

  /* a question typed or picked outside the panel: open the panel and send it */
  function askFrom(text, from) {
    const q = String(text || '').replace(/\s+/g, ' ').trim();
    openPanel(from);
    if (q) submit(q);
  }
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('form[data-ask-form]');
    if (!f) return;
    e.preventDefault();
    const field = f.querySelector('input');
    const typed = field ? field.value.replace(/\s+/g, ' ').trim() : '';
    const about = f.dataset.askAbout;                    // a project page names its project, so "it" has a meaning
    if (field) field.value = '';
    askFrom(typed && about ? typed.slice(0, MAX_CHARS - about.length - 24) + ' (asked about: ' + about + ')' : typed, f.querySelector('button') || f);
  });
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-ask-q]');
    if (!t) return;
    e.preventDefault();
    askFrom(t.dataset.askQ, t);
  });

  window.Ask = { open: openPanel, close: closePanel, isOpen: () => open, ask: askFrom };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
