// HOKUSAI · HTTPS + aviso de cookies (sin dependencias)
(function () {
  var h = location.hostname;
  if (location.protocol === 'http:' && h && h !== 'localhost' && !/^127\.|^192\.168\./.test(h)) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
    return;
  }
  var KEY = 'hokusai-cookies';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    window.dispatchEvent(new CustomEvent('hokusai-consent', { detail: v }));
    close();
  }
  var el;
  function close() { if (el) { el.remove(); el = null; } }
  function btn(txt, primary, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.onclick = fn;
    b.style.cssText = 'min-height:48px;padding:0 18px;border:3px solid #141414;border-radius:6px;cursor:pointer;font:700 15px "DM Sans",system-ui,sans-serif;' +
      (primary ? 'background:#D7263D;color:#FAF3E3;box-shadow:4px 4px 0 #141414' : 'background:#FAF3E3;color:#141414');
    return b;
  }
  function open() {
    if (el) return;
    el = document.createElement('div');
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Aviso de cookies');
    el.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:200;max-width:560px;margin-left:auto;background:#FAF3E3;color:#141414;border:3px solid #141414;border-radius:8px;box-shadow:6px 6px 0 #141414;padding:18px 20px;display:flex;flex-direction:column;gap:12px;font:500 15px/1.5 "DM Sans",system-ui,sans-serif';
    var t = document.createElement('strong');
    t.textContent = 'Cookies';
    t.style.cssText = 'font:400 24px Anton,sans-serif;letter-spacing:.04em;text-transform:uppercase';
    var p = document.createElement('p');
    p.style.margin = '0';
    p.innerHTML = 'Usamos almacenamiento técnico para recordar tu idioma. Con tu permiso cargamos el mapa de Google, que puede instalar cookies propias. <a href="Legal.dc.html#cookies" style="color:#1B2A6B;font-weight:700">Más información</a>';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';
    row.appendChild(btn('Aceptar todas', true, function () { set('all'); }));
    row.appendChild(btn('Solo necesarias', false, function () { set('necessary'); }));
    el.appendChild(t); el.appendChild(p); el.appendChild(row);
    document.body.appendChild(el);
  }
  window.hokusaiCookies = { open: open, get: get, set: set, allowed: function () { return get() === 'all'; } };
  function init() { if (!get()) open(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
