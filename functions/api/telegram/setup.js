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
  return json({ webhook: hook, comandos: cmds });
}
