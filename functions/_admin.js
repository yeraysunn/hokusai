// HOKUSAI · sesión del panel de admin (cookie firmada, 30 días)
export const COOKIE = 'hk_admin';
const DIAS = 30;
const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function clave(env) {
  // Cambiar ADMIN_PASSWORD cierra todas las sesiones abiertas
  return crypto.subtle.importKey('raw', enc.encode(`${env.ADMIN_PASSWORD}::${env.TELEGRAM_WEBHOOK_SECRET || 'hk'}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function firma(env, txt) { return b64(await crypto.subtle.sign('HMAC', await clave(env), enc.encode(txt))); }

function igual(a, b) {
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export async function passwordOk(env, pass) {
  if (!env.ADMIN_PASSWORD || typeof pass !== 'string') return false;
  // compara huellas de igual longitud para no filtrar nada por tiempos
  const h = async s => b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return igual(await h(pass), await h(String(env.ADMIN_PASSWORD)));
}

export async function crearSesion(env) {
  const exp = String(Date.now() + DIAS * 864e5);
  const v = `${exp}.${await firma(env, exp)}`;
  return `${COOKIE}=${v}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Strict`;
}
export const cerrarSesion = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function sesionOk(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const c = (request.headers.get('cookie') || '').split(/;\s*/).find(x => x.startsWith(COOKIE + '='));
  if (!c) return false;
  const [exp, sig] = c.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return igual(sig, await firma(env, exp));
}
