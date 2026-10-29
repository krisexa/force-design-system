/*!
 * Exaforce Design System — exabot.js
 *
 * <exa-bot>: the interactive full-spectrum Force Exabot. One ES module, no
 * dependencies. It defines the element once, however many times it is loaded,
 * and fetches its artwork from the design system's own SVG
 * (assets/avatars/exabots/full-spectrum/exabot-force-full-spectrum.svg) rather
 * than carrying a copy, so the bot and the static avatar can never drift.
 *
 * Hosted:
 *   <script type="module" src="https://<design-system-host>/v1/exabot.js"><\/script>
 *   <exa-bot size="160"></exa-bot>
 *
 * Astro (pass the SVG URL explicitly: Vite pre-bundles dependencies in dev,
 * which breaks a URL resolved relative to this file):
 *   ---
 *   import exabotSvg from '@exaforce/design-system/assets/avatars/exabots/full-spectrum/exabot-force-full-spectrum.svg?url';
 *   ---
 *   <exa-bot src={exabotSvg} size="160"></exa-bot>
 *   <script>import '@exaforce/design-system/exabot.js';<\/script>
 *
 * Attributes:
 *   size            px, 40–400. Default 132.
 *   label           accessible name. Default "Say hi to Exabot".
 *   lines           what a tap says, "a|b|c", in turn.
 *   <reaction>-line dizzy-line, celebrate-line, confused-line, peek-line,
 *                   pet-line, fling-line, scroll-line.
 *   dizzy-after     taps within 1.5 s that make it spin. Default 5.
 *   sleep           idle seconds before it naps. Default 0 = never.
 *   bubble          "auto" (default) | "right" | "left" | "top". Auto picks,
 *                   each time it speaks, the first of right, left, top that
 *                   fits inside the viewport and any clipping (overflow)
 *                   ancestor, so a bot on either side of a layout works.
 *                   Directional poses (peek, confused, the "?" and "zzz")
 *                   mirror to face the same way, toward the room.
 *   disable         any of "drag pet" (both on by default).
 *   enable          any of "peek scroll" (both off by default): shut its eyes
 *                   while a password field has focus; react to page scroll.
 *   src             SVG URL. Default: the design-system copy beside this file.
 *
 * Colours are not hard-coded. Each reads an --exabot-* custom property, then
 * the design-system semantic token, then a light-theme literal for pages
 * without tokens. On a page with tokens.css the bot follows light, dark and
 * system themes with no extra work; set any of these on the element or an
 * ancestor to override:
 *   --exabot-accent           sparks, "?" and "zzz", shadow tint  (--color-accent)
 *   --exabot-focus            focus ring                          (--color-focus)
 *   --exabot-bubble-surface   speech bubble fill                  (--color-surface-raised)
 *   --exabot-bubble-text      speech bubble text                  (--color-text-primary)
 *   --exabot-bubble-border    speech bubble edge                  (--color-border)
 *   --exabot-bubble-shadow    speech bubble shadow                (--elevation-md)
 *   --exabot-font             speech bubble face                  (--font-family-base)
 *   --exabot-heart            hearts while being petted
 * The artwork itself is fixed brand colour and is never recoloured.
 *
 * Methods: say(text), poke(), hop(), dizzy(), celebrate(text?), confused(text?),
 *          peek(on), stretch(), sleep(), wake()
 * Events (bubble, composed): exabot-poke {line}, exabot-dizzy, exabot-celebrate,
 *          exabot-confused, exabot-peek {on}, exabot-fling {speed}, exabot-pet
 *
 * Reduced motion: every animation stops and nothing is spawned; the bot still
 * talks, looks around and reacts by changing expression.
 */
const DEFAULT_SRC = new URL('./assets/avatars/exabots/full-spectrum/exabot-force-full-spectrum.svg', import.meta.url).href;

if (typeof customElements !== 'undefined' && !customElements.get('exa-bot')) {
  const DEFAULT_LINES = ['Hi there!', 'Ready when you are.', 'Ask me anything.', 'Boop.', 'That tickles.', 'Still here.', 'Want a summary of today?'];
  const DEF = { dizzy: 'Whoa… dizzy.', celebrate: 'Nice work!', confused: 'Hmm?', peek: 'Not looking!', pet: 'Mmm, that’s nice.', fling: 'Wheee!', scroll: 'Welcome back up!' };
  /* Sparks: the theme accent plus three hues taken from the artwork itself. */
  const SPARK = ['var(--_accent)', '#F97BFF', '#FDB03F', '#22D6FF'];
  const OPT_IN = ['peek', 'scroll'];
  const SIDES = ['right', 'left', 'top'];
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const all = new Set();
  const svgs = new Map();
  const loadSvg = (url) => {
    if (!svgs.has(url)) {
      svgs.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }));
    }
    return svgs.get(url);
  };
  let lastMove = Date.now(), uid = 0;

  const CSS = `
:host{display:inline-block;position:relative;-webkit-tap-highlight-color:transparent;
  --_accent:var(--exabot-accent,var(--color-accent,#4f46e5));
  --_focus:var(--exabot-focus,var(--color-focus,var(--_accent)));
  --_bubble-bg:var(--exabot-bubble-surface,var(--color-surface-raised,#fff));
  --_bubble-fg:var(--exabot-bubble-text,var(--color-text-primary,#09090b));
  --_bubble-border:var(--exabot-bubble-border,var(--color-border,#e4e4e7));
  --_bubble-shadow:var(--exabot-bubble-shadow,var(--elevation-md,0 1px 2px rgb(24 24 27/.06),0 6px 16px -6px rgb(24 24 27/.16)));
  --_font:var(--exabot-font,var(--font-family-base,system-ui,-apple-system,"Segoe UI",sans-serif));
  --_heart:var(--exabot-heart,#ec4899)}
button{all:unset;position:relative;display:inline-flex;justify-content:center;align-items:flex-start;cursor:grab;border-radius:22%;width:var(--s);height:calc(var(--s)*1.14);touch-action:none;user-select:none;-webkit-user-select:none}
:host([disable~="drag"]) button{touch-action:manipulation}
button:focus-visible{outline:2px solid var(--_focus);outline-offset:4px}
.dragging{cursor:grabbing}
.drag{display:block;position:relative;will-change:transform}
.bot{position:relative;display:block;width:var(--s);height:var(--s);rotate:var(--tilt,0deg);transition:rotate .4s cubic-bezier(.3,1.4,.5,1),scale .3s ease;animation:float 4.2s ease-in-out infinite}
.bot svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 90%}
.eyes{transform-box:fill-box;transform-origin:center;transition:scale .2s,transform .25s}
.eye{transform-box:fill-box;transform-origin:center;transition:transform .2s}
.look{transition:transform .25s ease-out}
.body{transform-box:fill-box;transform-origin:50% 100%}
.shadow{position:absolute;left:50%;bottom:3%;width:64%;height:9%;translate:-50% 0;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--_accent) 24%,transparent),transparent);animation:shadow 4.2s ease-in-out infinite;transition:scale .3s,opacity .3s}
.dragging .shadow{scale:.6;opacity:.4}
@keyframes float{0%,100%{translate:0 0}50%{translate:0 calc(var(--s)*-.06)}}
@keyframes shadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.7}}
@media (hover:hover){button:hover .body{animation:squish .6s cubic-bezier(.3,1.5,.5,1)}button:hover .bot{scale:1.05}button:hover .eyes{scale:1 .78}}
@keyframes squish{0%{transform:scale(1,1)}30%{transform:scale(1.08,.9)}60%{transform:scale(.96,1.05)}100%{transform:scale(1,1)}}
.blink .eyes{animation:blink .22s ease-in-out}
@keyframes blink{50%{transform:scaleY(.1)}}
.asleep .eyes{transform:scaleY(.14);transition:transform .5s}
.asleep .bot{animation-duration:7s}
.hop svg{animation:hop .72s cubic-bezier(.3,1.3,.5,1)}
@keyframes hop{0%{transform:translateY(0) rotate(0)}35%{transform:translateY(-20%) rotate(calc(-8deg*var(--dir,1)))}70%{transform:translateY(0) rotate(calc(4deg*var(--dir,1)))}100%{transform:none}}
.dizzy svg{animation:dizzy 1.25s ease-in-out;transform-origin:50% 50%}
@keyframes dizzy{0%{transform:rotate(0)}20%{transform:rotate(360deg)}40%{transform:rotate(340deg)}55%{transform:rotate(375deg)}70%{transform:rotate(352deg)}100%{transform:rotate(360deg)}}
.stretch .body{animation:stretch 1.1s ease-in-out}
@keyframes stretch{0%,100%{transform:scale(1,1)}40%{transform:scale(.94,1.08)}60%{transform:scale(1.04,.96)}}
.wake svg{animation:wake .6s ease-out}
@keyframes wake{0%{transform:translateY(3%) scale(.96)}50%{transform:translateY(-6%) scale(1.04)}100%{transform:none}}
.celebrate svg{animation:celebrate 1.1s cubic-bezier(.3,1.2,.5,1)}
@keyframes celebrate{0%{transform:none}18%{transform:translateY(-24%) scale(1.06) rotate(-7deg)}36%{transform:translateY(0) scale(1.1,.9)}56%{transform:translateY(-14%) rotate(7deg)}76%{transform:translateY(0) scale(1.05,.95)}100%{transform:none}}
.celebrate .eyes,.pet .eyes{transform:translateY(-8%) scaleY(.34)}
.confused .bot{rotate:calc(16deg*var(--dir,1))}
.confused .eye-1,.mirror.confused .eye-2{transform:scaleY(.55)}
.confused .eye-2,.mirror.confused .eye-1{transform:scale(1.12)}
.peek .bot{rotate:calc(-14deg*var(--dir,1))}
.peek .eyes{transform:scaleY(.1)}
.dragging .eyes{scale:1.14}
.pet .bot{animation:sway .9s ease-in-out infinite}
@keyframes sway{0%,100%{rotate:-6deg}50%{rotate:6deg}}
.zzz,.q{position:absolute;top:-3%;right:-4%;font:600 calc(var(--s)*.14)/1 var(--_font);color:var(--_accent);pointer-events:none;opacity:0}
.asleep .zzz{opacity:1}
.zzz span{display:inline-block;animation:zz 2.4s infinite;opacity:0}
.zzz span:nth-child(2){animation-delay:.8s;font-size:.8em}
.zzz span:nth-child(3){animation-delay:1.6s;font-size:.62em}
@keyframes zz{0%{opacity:0;transform:translate(0,4px)}30%{opacity:1}100%{opacity:0;transform:translate(calc(6px*var(--dir,1)),-10px)}}
.q{font-size:calc(var(--s)*.2);right:2%;top:-8%}
.mirror .zzz{right:auto;left:-4%}
.mirror .q{right:auto;left:2%}
.confused .q{animation:q 1.6s ease-out}
@keyframes q{0%{opacity:0;transform:translateY(6px) scale(.6)}15%{opacity:1;transform:translateY(0) scale(1.1)}25%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}
.say{position:absolute;z-index:2;white-space:nowrap;background:var(--_bubble-bg);color:var(--_bubble-fg);border:1px solid var(--_bubble-border);box-shadow:var(--_bubble-shadow);padding:5px 10px;font:500 max(12px,calc(var(--s)*.095))/1.4 var(--_font);letter-spacing:-.005em;opacity:0;pointer-events:none;transition:opacity .18s,transform .25s cubic-bezier(.3,1.5,.5,1)}
[data-side="right"] .say{left:calc(100% - 6px);top:4%;border-radius:12px 12px 12px 4px;transform:translateY(6px) scale(.9);transform-origin:left bottom}
[data-side="left"] .say{right:calc(100% - 6px);top:4%;border-radius:12px 12px 4px 12px;transform:translateY(6px) scale(.9);transform-origin:right bottom}
[data-side="top"] .say{left:50%;bottom:calc(100% + 4px);border-radius:12px;transform:translate(-50%,6px) scale(.9);transform-origin:center bottom}
.saying .say{opacity:1;transform:none}
[data-side="top"].saying .say{transform:translate(-50%,0)}
.spark{position:absolute;left:50%;top:44%;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:var(--h);pointer-events:none;animation:spark .75s cubic-bezier(.2,.8,.3,1) forwards}
@keyframes spark{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
.heart{position:absolute;top:18%;left:var(--x);color:var(--_heart);font:400 calc(var(--s)*.13)/1 var(--_font);pointer-events:none;animation:heart 1.1s ease-out forwards}
@keyframes heart{0%{opacity:0;transform:translateY(0) scale(.5)}20%{opacity:1;transform:translateY(-10%) scale(1)}100%{opacity:0;transform:translate(var(--d),calc(var(--s)*-.45)) scale(.9)}}
@media (prefers-reduced-motion:reduce){.bot,.shadow,button:hover .body,.blink .eyes,.hop svg,.dizzy svg,.stretch .body,.wake svg,.celebrate svg,.pet .bot,.zzz span,.confused .q{animation:none!important}.zzz span,.confused .q{opacity:1}.say,.bot,.eyes,.eye,.look{transition:none}}
`;

  class ExaBot extends HTMLElement {
    static get observedAttributes() { return ['size', 'label', 'src', 'bubble']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._clicks = []; this._line = 0; this._deep = false; this._dir = 1; }
    connectedCallback() { if (!this._btn) this._render(); all.add(this); listen(); }
    disconnectedCallback() { all.delete(this); if (!all.size) unlisten(); }
    attributeChangedCallback(n) {
      if (!this._btn) return;
      if (n === 'src') this._load();
      else if (n === 'label') this._btn.setAttribute('aria-label', this._label());
      else if (n === 'bubble') this._orient();
      else this._applySize();
    }
    get lines() {
      const a = (this.getAttribute('lines') || '').split('|').map((s) => s.trim()).filter(Boolean);
      return a.length ? a : DEFAULT_LINES;
    }
    _label() { return this.getAttribute('label') || 'Say hi to Exabot'; }
    _ln(k) { return this.getAttribute(k + '-line') || DEF[k]; }
    _on(k) {
      const has = (attr) => (this.getAttribute(attr) || '').split(/[\s,]+/).includes(k);
      return OPT_IN.includes(k) ? has('enable') : !has('disable');
    }
    _has(c) { return !!this._btn && this._btn.classList.contains(c); }
    get asleep() { return this._has('asleep'); }
    _busy() { return this._has('peek') || this._has('pet') || this._has('dragging') || this._has('confused'); }
    _emit(n, detail) { this.dispatchEvent(new CustomEvent('exabot-' + n, { bubbles: true, composed: true, detail })); }
    _applySize() {
      const s = Math.max(40, Math.min(400, +this.getAttribute('size') || 132));
      this.style.setProperty('--s', s + 'px');
    }
    _render() {
      this.shadowRoot.innerHTML = `<style>${CSS}</style><button type="button"><span class="shadow"></span><span class="drag"><span class="bot"><span class="zzz" aria-hidden="true"><span>z</span><span>z</span><span>z</span></span><span class="q" aria-hidden="true">?</span></span><span class="say" aria-live="polite"></span></span></button>`;
      const b = this._btn = this.shadowRoot.querySelector('button');
      b.setAttribute('aria-label', this._label());
      this._bot = this.shadowRoot.querySelector('.bot');
      this._bubble = this.shadowRoot.querySelector('.say');
      this._drag = this.shadowRoot.querySelector('.drag');
      b.dataset.side = SIDES.includes(this.getAttribute('bubble')) ? this.getAttribute('bubble') : 'right';
      this._applySize();
      this._load();

      b.addEventListener('click', () => { if (this._suppress) { this._suppress = false; return; } this.poke(); });
      b.addEventListener('pointerdown', (e) => this._down(e));
      b.addEventListener('pointermove', (e) => this._move(e));
      b.addEventListener('pointerup', (e) => this._up(e));
      b.addEventListener('pointercancel', (e) => this._up(e));
      b.addEventListener('contextmenu', (e) => { if (this._has('pet')) e.preventDefault(); });
    }
    /* The artwork arrives after the shell, which already holds the bot's full
       size, so the page does not shift when it lands. */
    _load() {
      const url = this.getAttribute('src') || DEFAULT_SRC;
      this._src = url;
      loadSvg(url).then((raw) => { if (this._src === url) this._mount(raw); }).catch(() => {
        console.warn('Could not load the Exabot artwork.');
      });
    }
    _mount(raw) {
      this._bot.querySelector('svg')?.remove();
      const id = 'xb' + (++uid);
      const tpl = document.createElement('template');
      tpl.innerHTML = raw.replace(/exabot-/g, id + '-');
      const svg = tpl.content.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('role'); svg.setAttribute('aria-hidden', 'true');
      svg.querySelector('metadata')?.remove();
      this._look = null;
      const eyes = svg.querySelector('[id$="-eyes"]');
      if (eyes) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        eyes.parentNode.insertBefore(g, eyes); g.appendChild(eyes);
        eyes.classList.add('eyes'); g.classList.add('look'); this._look = g;
        [...eyes.children].forEach((e, i) => e.classList.add('eye', 'eye-' + (i + 1)));
      }
      const body = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      body.classList.add('body');
      [...svg.childNodes].filter((n) => n.nodeName !== 'defs' && n.nodeName !== 'title').forEach((n) => body.appendChild(n));
      svg.appendChild(body);
      this._bot.prepend(svg);
      if (this.asleep) this.sleep();
    }
    /* ---------- drag to fling, hold to pet ---------- */
    _down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.wake();
      this._pd = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, hist: [[e.clientX, e.clientY, e.timeStamp]] };
      try { this._btn.setPointerCapture(e.pointerId); } catch (_) {}
      clearTimeout(this._lpT);
      if (this._on('pet')) this._lpT = setTimeout(() => { if (this._pd && !this._pd.moved) this._petStart(); }, 480);
    }
    _move(e) {
      const p = this._pd; if (!p || e.pointerId !== p.id) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.hist.push([e.clientX, e.clientY, e.timeStamp]); if (p.hist.length > 6) p.hist.shift();
      if (!p.moved) {
        if (Math.hypot(dx, dy) < 6 || !this._on('drag') || this._has('pet')) return;
        p.moved = true; clearTimeout(this._lpT);
        this._btn.classList.add('dragging'); this.say('Whoa!');
      }
      const s = this.getBoundingClientRect().width, lim = s * 1.6;
      const k = (v) => Math.sign(v) * lim * (1 - Math.exp(-Math.abs(v) / lim)); // rubber band
      this._drag.style.transition = 'none';
      this._drag.style.transform = `translate(${k(dx)}px,${k(dy)}px) rotate(${Math.max(-25, Math.min(25, dx / 6))}deg)`;
    }
    _up(e) {
      const p = this._pd; if (!p || e.pointerId !== p.id) return;
      this._pd = null; clearTimeout(this._lpT);
      if (this._has('pet')) { this._petStop(); this._suppress = true; return; }
      if (!p.moved) return;
      this._suppress = true;
      const h = p.hist, a = h[0], z = h[h.length - 1], dt = Math.max(16, z[2] - a[2]);
      const speed = Math.hypot(z[0] - a[0], z[1] - a[1]) / dt;
      this._btn.classList.remove('dragging');
      this._drag.style.transition = RM() ? 'none' : 'transform .8s cubic-bezier(.25,1.7,.45,1)';
      this._drag.style.transform = '';
      if (speed > .9) { setTimeout(() => this._flash('dizzy', 1300), 120); this.say(this._ln('fling')); this._sparks(10); }
      else this.say('Phew.');
      this._emit('fling', { speed });
      setTimeout(() => { this._suppress = false; }, 50);
    }
    _petStart() {
      this._btn.classList.add('pet'); this.say(this._ln('pet')); this._emit('pet');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
      const heart = () => {
        if (RM()) return;
        const h = document.createElement('span'); h.className = 'heart'; h.textContent = '♥'; h.setAttribute('aria-hidden', 'true');
        h.style.setProperty('--x', (25 + Math.random() * 50) + '%');
        h.style.setProperty('--d', (Math.random() * 40 - 20) + 'px');
        this._btn.appendChild(h); setTimeout(() => h.remove(), 1150);
      };
      heart(); this._petT = setInterval(() => { heart(); if (!this._has('saying')) this.say(this._ln('pet')); }, 300);
    }
    _petStop() { clearInterval(this._petT); this._btn.classList.remove('pet'); }
    /* ---------- reactions ---------- */
    _flash(cls, ms) {
      const b = this._btn; b.classList.remove('hop', 'dizzy', 'stretch', 'celebrate'); void b.offsetWidth;
      b.classList.add(cls); clearTimeout(this['_t' + cls]);
      this['_t' + cls] = setTimeout(() => b.classList.remove(cls), ms);
    }
    _sparks(n = 7, big = 1) {
      if (RM()) return;
      const s = this.getBoundingClientRect().width;
      for (let i = 0; i < n; i++) {
        const sp = document.createElement('span'); sp.className = 'spark';
        const a = (i / n) * Math.PI * 2 + Math.random() * .5, r = s * (.44 + Math.random() * .2) * big;
        sp.style.setProperty('--dx', Math.cos(a) * r + 'px');
        sp.style.setProperty('--dy', Math.sin(a) * r - 10 + 'px');
        sp.style.setProperty('--h', SPARK[i % SPARK.length]);
        this._btn.appendChild(sp); setTimeout(() => sp.remove(), 800);
      }
    }
    /* Which side the bubble goes, and which way directional poses face. The
       bubble is measured with its new text before it shows, against the
       viewport narrowed to the nearest ancestor that clips overflow. */
    _orient() {
      if (!this._btn) return;
      const mode = this.getAttribute('bubble');
      const r = this.getBoundingClientRect();
      let side = SIDES.includes(mode) ? mode : null;
      if (!side) {
        let lo = 0, hi = innerWidth;
        for (let el = this.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
          if (getComputedStyle(el).overflowX === 'visible') continue;
          const c = el.getBoundingClientRect(); lo = Math.max(lo, c.left); hi = Math.min(hi, c.right); break;
        }
        const bw = this._bubble.offsetWidth, m = 8;
        side = r.right - 6 + bw <= hi - m ? 'right' : r.left + 6 - bw >= lo + m ? 'left' : 'top';
      }
      this._dir = side === 'left' || (side === 'top' && r.left + r.width / 2 > innerWidth / 2) ? -1 : 1;
      this._btn.dataset.side = side;
      this._btn.classList.toggle('mirror', this._dir < 0);
      this._btn.style.setProperty('--dir', this._dir);
    }
    say(t) {
      if (!this._btn) return;
      this._bubble.textContent = t; this._orient(); this._btn.classList.add('saying');
      clearTimeout(this._sayT); this._sayT = setTimeout(() => this._btn.classList.remove('saying'), 1900);
    }
    wake() {
      lastMove = Date.now();
      if (!this.asleep) return;
      this._btn.classList.remove('asleep'); if (this._look) this._look.style.transform = '';
      this._btn.classList.add('wake'); setTimeout(() => this._btn.classList.remove('wake'), 700);
    }
    sleep() { if (!this._btn) return; this._orient(); this._btn.classList.add('asleep'); if (this._look) this._look.style.transform = 'translate(0px,6px)'; }
    hop() { if (!this._btn) return; this.wake(); this._flash('hop', 750); this._sparks(); }
    stretch() { if (!this._btn) return; this._flash('stretch', 1200); }
    dizzy() { if (!this._btn) return; this.wake(); this._flash('dizzy', 1300); this._sparks(); this.say(this._ln('dizzy')); this._emit('dizzy'); }
    celebrate(t) { if (!this._btn) return; this.wake(); this._flash('celebrate', 1150); this._sparks(14, 1.25); this.say(t || this._ln('celebrate')); this._emit('celebrate'); }
    confused(t) {
      if (!this._btn) return;
      this.wake(); this.say(t || this._ln('confused'));
      const b = this._btn; b.classList.remove('confused'); void b.offsetWidth; b.classList.add('confused');
      if (this._look) this._look.style.transform = `translate(${6 * this._dir}px,-8px)`;
      clearTimeout(this._cT); this._cT = setTimeout(() => b.classList.remove('confused'), 1600);
      this._emit('confused');
    }
    /* Called directly, peek() always works; only the automatic password-field
       trigger is opt-in (enable="peek"). */
    peek(on = true) {
      if (!this._btn) return;
      this.wake();
      if (on) this.say(this._ln('peek')); else this._btn.classList.remove('saying');
      this._btn.classList.toggle('peek', !!on);
      if (this._look) this._look.style.transform = on ? `translate(${-14 * this._dir}px,10px)` : '';
      this._emit('peek', { on: !!on });
    }
    poke() {
      if (!this._btn) return;
      const now = Date.now(), need = Math.max(2, +this.getAttribute('dizzy-after') || 5);
      this._clicks = this._clicks.filter((t) => now - t < 1500); this._clicks.push(now);
      if (this._clicks.length >= need) { this._clicks = []; this.dizzy(); return; }
      const L = this.lines, line = L[this._line++ % L.length];
      this.hop(); this.say(line); this._emit('poke', { line });
    }
    /* ---------- ambient ---------- */
    _track(x, y) {
      if (!this._btn) return;
      const r = this.getBoundingClientRect(); if (!r.width) return;
      const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.width / 2), d = Math.hypot(dx, dy) || 1;
      if (!this._has('peek')) this.style.setProperty('--tilt', Math.max(-9, Math.min(9, dx / 40)) + 'deg');
      if (this.asleep) { if (d < Math.max(320, r.width * 2)) this.wake(); return; }
      if (this._has('peek') || this._has('confused') || this._has('pet')) return;
      const m = Math.min(18, d / 14);
      if (this._look) this._look.style.transform = `translate(${dx / d * m}px,${dy / d * m}px)`;
    }
    _scroll(dy, y) {
      if (!this._btn || !this._on('scroll') || this.asleep || this._busy()) return;
      const r = this.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (this._look && dy) {
        this._look.style.transform = `translate(0px,${dy > 0 ? 14 : -14}px)`;
        clearTimeout(this._scT); this._scT = setTimeout(() => { if (!this._busy() && this._look) this._look.style.transform = ''; }, 700);
      }
      if (y > 400) this._deep = true;
      if (y < 4 && this._deep) { this._deep = false; this.hop(); this.say(this._ln('scroll')); }
    }
    _idle() {
      if (!this._btn || this.asleep || !this._look || this._busy()) return;
      const idle = Date.now() - lastMove, sl = +this.getAttribute('sleep') || 0;
      if (sl > 0 && idle > sl * 1000) { this.sleep(); return; }
      if (idle > 3500) {
        const g = [[-16, 2], [16, 2], [0, -10], [-10, 8], [10, -6], [0, 0]][Math.floor(Math.random() * 6)];
        this._look.style.transform = `translate(${g[0]}px,${g[1]}px)`;
        if (Math.random() < .18 && !RM()) this.stretch();
      }
    }
  }

  /* Page-level listeners and timers exist only while at least one bot is on
     the page, and pointer tracking runs at most once per frame. */
  let px = 0, py = 0, frame = 0, lastY = 0, timers = [];
  const track = (x, y) => {
    lastMove = Date.now(); px = x; py = y;
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; all.forEach((b) => b._track(px, py)); });
  };
  const onPointer = (e) => track(e.clientX, e.clientY);
  const onTouch = (e) => { const t = e.touches[0]; if (t) track(t.clientX, t.clientY); };
  const onDown = () => { lastMove = Date.now(); };
  const onScroll = () => { const y = scrollY, dy = y - lastY; lastY = y; lastMove = Date.now(); all.forEach((b) => b._scroll(dy, y)); };
  const isPw = (t) => t && t.matches && t.matches('input[type="password"]');
  const onFocusIn = (e) => { if (isPw(e.target)) all.forEach((b) => { if (b._on('peek')) b.peek(true); }); };
  const onFocusOut = (e) => { if (isPw(e.target)) all.forEach((b) => { if (b._has('peek')) b.peek(false); }); };
  const passive = { passive: true };
  const listen = () => {
    if (timers.length) return;
    lastY = scrollY;
    addEventListener('pointermove', onPointer, passive);
    addEventListener('touchmove', onTouch, passive);
    addEventListener('touchstart', onTouch, passive);
    addEventListener('pointerdown', onDown, passive);
    addEventListener('scroll', onScroll, passive);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    timers = [
      setInterval(() => {
        if (document.hidden) return;
        all.forEach((b) => {
          if (!b._btn || b.asleep || b._busy() || Math.random() >= .45) return;
          b._btn.classList.add('blink'); setTimeout(() => b._btn.classList.remove('blink'), 240);
        });
      }, 2600),
      setInterval(() => { if (!document.hidden) all.forEach((b) => b._idle()); }, 2400),
    ];
  };
  const unlisten = () => {
    removeEventListener('pointermove', onPointer, passive);
    removeEventListener('touchmove', onTouch, passive);
    removeEventListener('touchstart', onTouch, passive);
    removeEventListener('pointerdown', onDown, passive);
    removeEventListener('scroll', onScroll, passive);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    timers.forEach(clearInterval); timers = [];
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  customElements.define('exa-bot', ExaBot);
}
