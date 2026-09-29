/*!
 * Exaforce Design System — theme.js
 *
 * Applies the visitor's saved colour mode BEFORE first paint and exposes a
 * small API for theme toggles. Plain script, no module, no dependencies.
 *
 * Load it synchronously in <head> (no defer/async), ideally before the
 * stylesheet, so the page never flashes the wrong theme:
 *
 *   <script src="https://<design-system-host>/v1/theme.js"></script>
 *
 * Options, as data attributes on the script tag:
 *   data-key="theme"       localStorage key. Default "theme" — the key
 *                          exaforce.com already uses, so a visitor's choice
 *                          carries across properties on the same origin.
 *   data-default="dark"    mode to apply when nothing is saved:
 *                          "light" | "dark" | "system". Default "system".
 *
 * Stored values are "light" | "dark" | "system". "system" removes the
 * data-theme attribute so the stylesheet's prefers-color-scheme rule decides.
 * The semantic tokens are written for exactly these three states — see
 * tokens/semantic.css.
 *
 * Wiring, no JavaScript required on the consuming page:
 *   <button data-theme-toggle>…</button>          cycles light → dark → system
 *   <button data-theme-toggle="dark">…</button>   sets that mode
 *   <span data-theme-label data-theme-word="Theme"></span>
 *                                                 text kept as "Theme: dark"
 *
 * Programmatic:
 *   ExaforceTheme.get()       "light" | "dark" | "system"
 *   ExaforceTheme.resolved()  "light" | "dark"  (what is actually showing)
 *   ExaforceTheme.set(mode)
 *   ExaforceTheme.cycle()
 *   document.documentElement.addEventListener('exaforce:theme', e => e.detail)
 */
(function () {
  var root = document.documentElement;
  var script = document.currentScript;
  var KEY = (script && script.getAttribute('data-key')) || 'theme';
  var DEFAULT = (script && script.getAttribute('data-default')) || 'system';
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function valid(m) {
    return m === 'light' || m === 'dark' || m === 'system';
  }
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return valid(v) ? v : null;
    } catch (e) {
      return null; /* storage blocked — fall through to the default */
    }
  }
  function apply(m) {
    if (m === 'light' || m === 'dark') root.setAttribute('data-theme', m);
    else root.removeAttribute('data-theme');
  }
  function get() {
    var e = root.getAttribute('data-theme');
    return e === 'light' || e === 'dark' ? e : 'system';
  }
  function resolved() {
    var m = get();
    if (m !== 'system') return m;
    return mq.matches ? 'dark' : 'light';
  }
  function labels() {
    var els = document.querySelectorAll('[data-theme-label]');
    var m = get();
    var text = m === 'system' ? 'system (' + resolved() + ')' : m;
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = (els[i].getAttribute('data-theme-word') || 'Theme') + ': ' + text;
    }
  }
  function set(m) {
    if (!valid(m)) return;
    apply(m);
    try {
      localStorage.setItem(KEY, m);
    } catch (e) {
      /* storage blocked — the choice still holds for this page */
    }
    labels();
    try {
      root.dispatchEvent(new CustomEvent('exaforce:theme', { detail: { mode: m, resolved: resolved() } }));
    } catch (e) {}
  }
  function cycle() {
    var m = get();
    set(m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light');
  }
  function wire() {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].__exaforceTheme) continue;
      btns[i].__exaforceTheme = true;
      btns[i].addEventListener('click', function (ev) {
        var v = ev.currentTarget.getAttribute('data-theme-toggle');
        if (valid(v)) set(v);
        else cycle();
      });
    }
    labels();
  }

  apply(read() || (valid(DEFAULT) ? DEFAULT : 'system'));

  window.ExaforceTheme = { get: get, resolved: resolved, set: set, cycle: cycle, wire: wire, key: KEY };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
  if (mq.addEventListener) mq.addEventListener('change', labels);
})();
