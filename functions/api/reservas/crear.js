// POST /api/reservas/crear → guarda la reserva y avisa al grupo de Telegram
import { json, err, body, clean, digits, validEmail, token, HORAS, ahoraMadrid, sumarDias, tg, textoReserva, botonesReserva } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  if (!d) return err('Petición no válida.');
  if (d.web) return json({ ok: true, reserva: { token: 'x' } }); // honeypot: bots

  const fecha = clean(d.fecha, 10), hora = clean(d.hora, 5);
  const adultos = Math.max(0, Math.min(20, parseInt(d.adultos) || 0));
  const ninos = Math.max(0, Math.min(20, parseInt(d.ninos) || 0));
  const bebes = Math.max(0, Math.min(10, parseInt(d.bebes) || 0));
  const nombre = clean(d.nombre, 80), telefono = clean(d.telefono, 30), email = clean(d.email, 120).toLowerCase();
  const comentarios = clean(d.comentarios, 500);
  const tel = env.TELEFONO || '622 01 59 96';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return err('Elige un día.');
  if (!HORAS.includes(hora)) return err('Elige una hora.');
  if (adultos + ninos < 1) return err('Indica cuántas personas venís.');
  if (adultos + ninos + bebes > 20) return err(`Para grupos de más de 20 personas llámanos al ${tel}.`);
  if (nombre.length < 2) return err('Escribe tu nombre.');
  if (digits(telefono).length < 9) return err('Escribe tu teléfono.');
  if (email && !validEmail(email)) return err('Revisa el email.');
  if (!d.privacidad) return err('Tienes que aceptar la política de privacidad.');

  const now = ahoraMadrid();
  if (fecha < now.fecha || fecha > sumarDias(now.fecha, 180)) return err('Esa fecha no está disponible.');
  if (new Date(fecha + 'T12:00:00Z').getUTCDay() === 2) return err('Los martes estamos cerrados. Elige otro día.');
  const [h, m] = hora.split(':').map(Number);
  if (fecha === now.fecha && h * 60 + m <= now.min + 30) return err(`Esa hora ya no se puede reservar online. Llámanos al ${tel}.`);

  // Aforo por franja
  const max = parseInt(env.MAX_PERSONAS_FRANJA || '40');
  const ocu = await env.DB.prepare(`SELECT COALESCE(SUM(adultos+ninos),0) n FROM reservas WHERE fecha=? AND hora=? AND estado IN ('pendiente','confirmada')`).bind(fecha, hora).first();
  if (ocu.n + adultos + ninos > max) return err(`Esa hora está completa. Prueba otra o llámanos al ${tel}.`, 409);

  // Evitar duplicados del mismo teléfono ese día
  const dup = await env.DB.prepare(`SELECT token FROM reservas WHERE fecha=? AND telefono=? AND estado IN ('pendiente','confirmada')`).bind(fecha, telefono).first();
  if (dup) return err('Ya tienes una reserva ese día. Revisa tu email o llámanos para cambiarla.', 409);

  const t = token();
  const r = { fecha, hora, adultos, ninos, bebes, nombre, telefono, email, comentarios, cumple: d.cumple ? 1 : 0, trona: d.trona ? 1 : 0, carrito: d.carrito ? 1 : 0 };
  const ins = await env.DB.prepare(`INSERT INTO reservas (token,fecha,hora,adultos,ninos,bebes,nombre,telefono,email,comentarios,cumple,trona,carrito) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(t, fecha, hora, adultos, ninos, bebes, nombre, telefono, email || null, comentarios || null, r.cumple, r.trona, r.carrito).run();
  const id = ins.meta.last_row_id;

  // Aviso a Telegram con botones
  const full = { ...r, id, estado: 'pendiente', email: email || null, comentarios: comentarios || null };
  const res = await tg(env, 'sendMessage', {
    chat_id: env.TELEGRAM_CHAT_ID, text: '🔔 NUEVA\n' + textoReserva(full), parse_mode: 'HTML', reply_markup: botonesReserva(full)
  });
  if (!res?.ok) {
    // Si el equipo no recibe el aviso, no damos la reserva por hecha: el cliente verá la opción de WhatsApp
    await env.DB.prepare('DELETE FROM reservas WHERE id=?').bind(id).run();
    console.log('telegram error', JSON.stringify(res));
    return err(`No se pudo enviar la reserva. Llámanos al ${tel} o escríbenos por WhatsApp.`, 503);
  }
  await env.DB.prepare('UPDATE reservas SET tg_chat=?, tg_msg=? WHERE id=?').bind(String(res.result.chat.id), res.result.message_id, id).run();

  const site = env.SITE_URL || new URL(request.url).origin;
  return json({ ok: true, reserva: { id, token: t, estado: 'pendiente' }, enlace: `${site}/reserva/?t=${t}` });
}
