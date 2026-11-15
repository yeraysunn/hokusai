// HOKUSAI · utilidades del panel
(function () {
  var A = window.HK = {};
  A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  A.fmt = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  A.api = function (url, data, method) {
    return fetch(url, data || method ? { method: method || 'POST', headers: { 'content-type': 'application/json' }, body: data ? JSON.stringify(data) : undefined } : {})
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Error de conexión' }; }); })
      .then(function (j) { if (j && j.login) { location.href = '/admin/?volver=' + encodeURIComponent(location.pathname + location.search); throw new Error('login'); } return j; });
  };
  var t;
  A.toast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on'); clearTimeout(t); t = setTimeout(function () { el.classList.remove('on'); }, 2400);
  };
  A.header = function (actual) {
    var tabs = [['reservas', 'Reservas', 'ヨヤク'], ['fidelidad', 'Tarjetas', 'ポイント'], ['carta', 'Carta', 'メニュー'], ['estadisticas', 'Estadísticas', 'トウケイ']];
    var h = '<header class="top"><span class="hanko">北斎</span><a class="brand" href="/admin/"><b>HOKUSAI</b><small>管理 · PANEL</small></a><span class="sp"></span><button class="out" type="button" id="salir">SALIR</button></header>' +
      '<nav class="tabs" aria-label="Secciones">' + tabs.map(function (x) { return '<a href="/admin/' + x[0] + '/"' + (x[0] === actual ? ' aria-current="page"' : '') + '>' + x[1] + ' <span>' + x[2] + '</span></a>'; }).join('') + '</nav>';
    document.body.insertAdjacentHTML('afterbegin', h);
    document.getElementById('salir').onclick = function () { A.api('/api/admin/login', null, 'DELETE').then(function () { location.href = '/admin/'; }); };
  };
})();
