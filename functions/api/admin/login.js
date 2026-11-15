// POST /api/admin/login {password} → cookie de sesión 30 días
// GET  /api/admin/login → ¿hay sesión?   ·   DELETE → cerrar sesión
import { json, body } from '../../_lib.js';
import { passwordOk, crearSesion, cerrarSesion, sesionOk } from '../../_admin.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ ok: false, error: 'Falta configurar ADMIN_PASSWORD en Cloudflare.' }, 503);
  const d = await body(request);
  if (!(await passwordOk(env, d?.password))) {
    await new Promise(r => setTimeout(r, 1200)); // frena a quien prueba contraseñas
    return json({ ok: false, error: 'Contraseña incorrecta.' }, 401);
  }
  return json({ ok: true }, 200, { 'set-cookie': await crearSesion(env) });
}
export async function onRequestGet({ request, env }) {
  return json({ ok: await sesionOk(request, env) });
}
export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'set-cookie': cerrarSesion() });
}
