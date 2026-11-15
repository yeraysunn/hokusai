// Candado de la tarjeta de fidelidad.
// Mientras FIDELIDAD_ACTIVA no sea "1", /fidelidad y /api/fidelidad devuelven 404,
// salvo para quien entre una vez con  /fidelidad/?preview=FIDELIDAD_PREVIEW_KEY  (queda guardado en una cookie 30 días).
const COOKIE = 'hk_preview';

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  const p = url.pathname;
  if (!(p.startsWith('/fidelidad') || p.startsWith('/api/fidelidad'))) return next();

  const activa = String(env.FIDELIDAD_ACTIVA) === '1';
  const key = env.FIDELIDAD_PREVIEW_KEY;
  if (!activa) {
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
  }
  const res = await next();
  const out = new Response(res.body, res);
  if (!activa) out.headers.set('x-robots-tag', 'noindex, nofollow');
  return out;
}
