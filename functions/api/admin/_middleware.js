// Todo /api/admin/* exige sesión, salvo el login
import { sesionOk } from '../../_admin.js';

export async function onRequest({ request, env, next }) {
  const p = new URL(request.url).pathname;
  if (p === '/api/admin/login' || p === '/api/admin/login/') return next();
  if (!(await sesionOk(request, env))) {
    return new Response(JSON.stringify({ ok: false, error: 'Sesión caducada', login: true }), { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('cache-control', 'no-store');
  return out;
}
