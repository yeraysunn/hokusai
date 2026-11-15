// GET /api/telegram/setup?key=TELEGRAM_WEBHOOK_SECRET → conecta el bot a esta web (una sola vez)
import { json, tg } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.TELEGRAM_WEBHOOK_SECRET || url.searchParams.get('key') !== env.TELEGRAM_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const hook = await tg(env, 'setWebhook', {
    url: `${url.origin}/api/telegram/webhook`, secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'], drop_pending_updates: true
  });
  const cmds = await tg(env, 'setMyCommands', { commands: [
    { command: 'hoy', description: 'Reservas de hoy' },
    { command: 'manana', description: 'Reservas de mañana' },
    { command: 'dia', description: 'Reservas de un día (AAAA-MM-DD)' },
    { command: 'puntos', description: 'Sumar puntos: /puntos HK-XXXXXX 45,90' },
    { command: 'deshacer', description: 'Anular mi último movimiento de puntos' },
    { command: 'id', description: 'Ver mi id y el del chat' },
    { command: 'ayuda', description: 'Cómo funciona el bot' }
  ] });
  const t = String(env.TELEGRAM_BOT_TOKEN || '');
  const diag = { longitud: t.length, formato_ok: /^\d{8,12}:[A-Za-z0-9_-]{30,}$/.test(t.trim()), espacios: t !== t.trim(), id_bot: (t.trim().match(/^(\d+):/) || [])[1] || null };
  const rk = String(env.RESEND_API_KEY || '').trim();
  const resend = { longitud: rk.length, formato_ok: /^re_[A-Za-z0-9_]{20,}$/.test(rk), remitente: env.MAIL_FROM || null };
  if (url.searchParams.get('probar_email') === '1' && rk) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${rk}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: ['delivered@resend.dev'], subject: 'Prueba Hokusai', html: '<p>Prueba</p>' }) });
    resend.prueba = { status: r.status, respuesta: (await r.text()).slice(0, 300) };
  }
  return json({ webhook: hook, comandos: cmds, clave: diag, resend });
}
