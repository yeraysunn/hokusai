// HOKUSAI · utilidades compartidas de las Functions

export const TZ = 'Europe/Madrid';

// Turnos (deben coincidir con Reservar.dc.html)
const slots = (h, m, eh, em) => { const o = []; for (let t = h * 60 + m; t <= eh * 60 + em; t += 15) o.push(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')); return o; };
export const HORAS = [...slots(12, 30, 15, 30), ...slots(19, 30, 22, 30)];

// Fidelidad: 1.000 puntos por cada 10 € completos (≈10 % de vuelta)
export const PUNTOS_POR_10 = 1000;
export const PREMIOS = [
  { id: 'mochi',   jp: 'モチ',     nombre: 'Mochi a elegir',             nota: 'Cualquier mochi de la carta',            puntos: 6000 },
  { id: 'pastel',  jp: 'ケーキ',   nombre: 'Postre especial',            nota: 'Pasteles y bolas de la carta',           puntos: 7000 },
  { id: 'buffet1', jp: 'ランチ',   nombre: 'Buffet de mediodía',         nota: 'De lunes a viernes al mediodía',         puntos: 17000 },
  { id: 'buffet2', jp: 'ディナー', nombre: 'Buffet de noche',            nota: 'Noches, fines de semana y festivos',     puntos: 23000 }
];
// Rangos anime según los puntos ganados en total
export const RANGOS = [
  { min: 0,      jp: '見習い', nombre: 'Minarai', sub: 'Aprendiz' },
  { min: 10000,  jp: '先輩',   nombre: 'Senpai',  sub: 'Cliente de la casa' },
  { min: 40000,  jp: '板前',   nombre: 'Itamae',  sub: 'Maestro del rollo' },
  { min: 100000, jp: '将軍',   nombre: 'Shōgun',  sub: 'Leyenda de Hokusai' }
];
export const rango = total => { let r = RANGOS[0]; for (const x of RANGOS) if (total >= x.min) r = x; const i = RANGOS.indexOf(r); return { ...r, siguiente: RANGOS[i + 1] || null }; };

export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
});
export const err = (msg, status = 400) => json({ ok: false, error: msg }, status);

export async function body(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return null;
  try { return await request.json(); } catch { return null; }
}

export const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
export const digits = v => String(v ?? '').replace(/\D/g, '');
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

export function token(len = 24) {
  const a = new Uint8Array(len); crypto.getRandomValues(a);
  return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}
export function codigoTarjeta() {
  const a = new Uint8Array(6); crypto.getRandomValues(a);
  return 'HK-' + [...a].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
}

// Fecha/hora actual en Madrid
export function ahoraMadrid() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
}
export function sumarDias(fecha, n) {
  const d = new Date(fecha + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function fechaLarga(fecha) {
  const s = new Date(fecha + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return s[0].toUpperCase() + s.slice(1);
}
export const personasTxt = r => [r.adultos && `${r.adultos} adulto${r.adultos > 1 ? 's' : ''}`, r.ninos && `${r.ninos} niño${r.ninos > 1 ? 's' : ''}`, r.bebes && `${r.bebes} bebé${r.bebes > 1 ? 's' : ''}`].filter(Boolean).join(', ');
export const fmtPts = n => String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const ESTADOS = { pendiente: '⏳ Pendiente', confirmada: '✅ CONFIRMADA', rechazada: '❌ RECHAZADA', cancelada: '🚫 CANCELADA por el cliente' };
export function telefonoTxt(t) {
  const d = String(t || '').replace(/[^\d+]/g, '');
  if (/^\d{9}$/.test(d)) return '+34' + d;
  if (/^34\d{9}$/.test(d)) return '+' + d;
  return d || String(t || '');
}
export function textoReserva(r) {
  const dia = fechaLarga(r.fecha).toLowerCase().replace(",", "");
  const extras = [r.cumple && '🎂 Cumpleaños', r.trona && '🪑 Trona', r.carrito && '👶 Carrito'].filter(Boolean).join(' · ');
  return `🍣 <b>Nueva reserva</b>\n\n` +
    `👤 <b>Nombre:</b> ${esc(r.nombre)}\n` +
    `📞 <b>Teléfono:</b> ${esc(telefonoTxt(r.telefono))}\n` +
    (r.email ? `📧 <b>Email:</b> ${esc(r.email)}\n` : '') +
    `📅 <b>Día:</b> ${dia}\n` +
    `🕐 <b>Hora:</b> ${r.hora}\n` +
    `👥 <b>Personas:</b> ${personasTxt(r)}` +
    (extras ? `\n${extras}` : '') + (r.comentarios ? `\n📝 <b>Comentarios:</b> ${esc(r.comentarios)}` : '') +
    (r.estado !== 'pendiente' ? `\n\n${ESTADOS[r.estado] || r.estado}` + (r.gestionada_por ? ` · ${esc(r.gestionada_por)}` : '') : '');
}
export const botonesReserva = r => r.estado === 'pendiente'
  ? { inline_keyboard: [[{ text: '✅ Confirmar', callback_data: `ok:${r.id}` }, { text: '❌ Rechazar', callback_data: `no:${r.id}` }]] }
  : { inline_keyboard: [] };

// ── Telegram ───────────────────────────────────────────────
export async function tg(env, method, payload) {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${String(env.TELEGRAM_BOT_TOKEN).trim()}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
  });
  return r.json().catch(() => null);
}
export const staffIds = env => String(env.TELEGRAM_STAFF_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
export const esStaff = (env, userId, chatId) => staffIds(env).includes(String(userId)) || String(chatId) === String(env.TELEGRAM_CHAT_ID || '').trim();

// ── Email (Resend) ─────────────────────────────────────────
export async function mail(env, to, subject, html) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html })
  });
  return r.ok;
}
export function plantillaMail(titulo, cuerpo, boton) {
  return `<!doctype html><html><body style="margin:0;background:#FAF3E3;font-family:Arial,Helvetica,sans-serif;color:#141414">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" style="max-width:520px;background:#FFFBF2;border:3px solid #141414;border-radius:8px" cellpadding="0" cellspacing="0">
<tr><td style="background:#141414;color:#FFE600;padding:16px 22px;font-size:20px;font-weight:bold;letter-spacing:2px">HOKUSAI <span style="color:#D7263D">北斎</span></td></tr>
<tr><td style="padding:24px 22px"><h1 style="margin:0 0 14px;font-size:26px;text-transform:uppercase">${titulo}</h1>${cuerpo}
${boton ? `<p style="margin:22px 0 0"><a href="${boton.href}" style="display:inline-block;background:#D7263D;color:#FAF3E3;border:3px solid #141414;border-radius:6px;padding:12px 20px;font-weight:bold;text-decoration:none">${boton.txt}</a></p>` : ''}
</td></tr>
<tr><td style="padding:14px 22px;border-top:2px solid #141414;font-size:12px">HOKUSAI Sushi · Carrer del Carrilet, 9 · Salou</td></tr>
</table></td></tr></table></body></html>`;
}
