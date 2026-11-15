// Candado de las partes privadas (reservas por Telegram y tarjeta de fidelidad).
// Mientras su interruptor no sea "1", devuelven 404 salvo para quien haya entrado una vez con
//   /fidelidad/?preview=FIDELIDAD_PREVIEW_KEY   o   /reservar-telegram?preview=FIDELIDAD_PREVIEW_KEY
// (queda guardado en una cookie 30 días en ese navegador).
// El webhook del bot (/api/telegram/*) nunca se bloquea: los botones del grupo tienen que funcionar.
const COOKIE = 'hk_preview';

const ZONAS = [
  { activa: env => String(env.FIDELIDAD_ACTIVA) === '1', prefijos: ['/fidelidad', '/api/fidelidad'] },
  { activa: env => String(env.RESERVAS_ACTIVA) === '1', prefijos: ['/reservar-telegram', '/api/reservas', '/reserva/', '/reserva'] }
];

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  const p = url.pathname.toLowerCase();
  const zona = ZONAS.find(z => z.prefijos.some(x => p === x || p.startsWith(x.endsWith('/') ? x : x + '/') || p.startsWith(x + '.')));
  if (!zona || zona.activa(env)) return next();

  const key = env.FIDELIDAD_PREVIEW_KEY;
  const q = url.searchParams.get('preview');
  if (key && q === key) {
    url.searchParams.delete('preview');
    return new Response(null, { status: 302, headers: {
      location: url.pathname + url.search,
      'set-cookie': `${COOKIE}=${encodeURIComponent(key)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
    } });
  }
  const cookie = (request.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  const ok = key && cookie && decodeURIComponent(cookie.slice(COOKIE.length + 1)) === key;
  if (!ok) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'x-robots-tag': 'noindex' } });

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('x-robots-tag', 'noindex, nofollow');
  return out;
}
