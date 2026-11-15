// GET  /api/reservas/estado?t=TOKEN → estado de la reserva (página del cliente)
// POST /api/reservas/estado {t, accion:'cancelar'} → el cliente cancela
import { json, err, body, clean, fechaLarga, personasTxt, esc, tg, ahoraMadrid, textoReserva, botonesReserva } from '../../_lib.js';

const publica = r => ({ fecha: r.fecha, fechaTxt: fechaLarga(r.fecha), hora: r.hora, personas: personasTxt(r), nombre: r.nombre, estado: r.estado });

export async function onRequestGet({ request, env }) {
  const t = clean(new URL(request.url).searchParams.get('t'), 40);
  if (!t) return err('Falta el enlace.');
  const r = await env.DB.prepare('SELECT * FROM reservas WHERE token=?').bind(t).first();
  if (!r) return err('No encontramos esta reserva.', 404);
  return json({ ok: true, reserva: publica(r) });
}

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const t = clean(d?.t, 40);
  if (!t || d.accion !== 'cancelar') return err('Petición no válida.');
  const r = await env.DB.prepare('SELECT * FROM reservas WHERE token=?').bind(t).first();
  if (!r) return err('No encontramos esta reserva.', 404);
  if (!['pendiente', 'confirmada'].includes(r.estado)) return err('Esta reserva ya no se puede cancelar.');
  const now = ahoraMadrid();
  if (r.fecha < now.fecha) return err('Esta reserva ya ha pasado.');

  await env.DB.prepare(`UPDATE reservas SET estado='cancelada', gestionada_por='cliente' WHERE id=?`).bind(r.id).run();
  if (r.tg_msg) await tg(env, 'editMessageText', { chat_id: r.tg_chat, message_id: r.tg_msg, text: textoReserva({ ...r, estado: 'cancelada', gestionada_por: 'el cliente' }), parse_mode: 'HTML', reply_markup: botonesReserva({ estado: 'cancelada' }) });
  // En el grupo solo se edita el mensaje de la reserva (sin mensajes extra)
  return json({ ok: true, reserva: publica({ ...r, estado: 'cancelada' }) });
}
