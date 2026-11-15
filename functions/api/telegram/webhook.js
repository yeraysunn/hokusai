// POST /api/telegram/webhook → todo lo que hace el bot de HOKUSAI
//
// Reservas:  botones ✅/❌ en cada aviso · /hoy · /manana · /dia 2026-12-24
// Fidelidad: escanear el QR del cliente (abre el bot con su código) o escribir HK-XXXXXX
//            → ➕ Sumar compra (escribes el importe) · 🎁 Canjear premio · /deshacer
// Ayuda:     /id (muestra tu id y el del chat, para configurarlo) · /ayuda
import {
  json, tg, esStaff, ahoraMadrid, sumarDias, fechaLarga, personasTxt, esc, mail, plantillaMail,
  textoReserva, botonesReserva, refrescar, avisarCliente, PREMIOS, PUNTOS_POR_10, rango, fmtPts
} from '../../_lib.js';

const send = (env, chat_id, text, extra = {}) => tg(env, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

export async function onRequestPost({ request, env }) {
  if (request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const u = await request.json().catch(() => null);
  if (!u) return json({ ok: true });
  try {
    if (u.callback_query) await onCallback(env, u.callback_query);
    else if (u.message?.text) await onMessage(env, u.message);
  } catch (e) {
    console.log('bot error', e && e.stack || e);
  }
  return json({ ok: true }); // siempre 200 para que Telegram no reintente en bucle
}

// ── Mensajes de texto ─────────────────────────────────────
async function onMessage(env, m) {
  const chat = m.chat.id, user = m.from?.id, txt = m.text.trim();
  const quien = m.from?.first_name || 'staff';
  const [cmd0, ...args] = txt.split(/\s+/);
  const cmd = cmd0.toLowerCase().replace(/@.*$/, '');

  if (cmd === '/id') return send(env, chat, `Tu id: <code>${user}</code>\nEste chat: <code>${chat}</code>`);
  if (!esStaff(env, user, chat)) {
    if (m.chat.type === 'private') return send(env, chat, '¡Hola! 🍣 Este bot es solo para el equipo de HOKUSAI.\nReserva tu mesa en ' + (env.SITE_URL || 'https://hokusaisalou.com') + '/reservar');
    return;
  }

  const privado = m.chat.type === 'private';
  if (cmd === '/start' && args[0]?.startsWith('c_')) return abrirTarjeta(env, chat, args[0].slice(2));
  if (cmd === '/start' || cmd === '/ayuda' || cmd === '/help') return send(env, chat,
    '<b>🍣 Bot HOKUSAI</b>\n\n<b>Reservas</b>\n/hoy · /manana · /dia AAAA-MM-DD\nLos avisos nuevos llegan con ✅ Confirmar / ❌ Rechazar.\n\n' +
    '<b>Tarjeta de puntos</b>\nEscanea el QR del cliente con la cámara del móvil, o escribe su código (HK-XXXXXX).\n' +
    `Luego ➕ Sumar compra y escribe el importe (${fmtPts(PUNTOS_POR_10)} pts por cada 10 €).\n/puntos HK-XXXXXX 45,90 · atajo\n/deshacer · anula tu último movimiento (10 min)`);

  if (cmd === '/hoy' || cmd === '/manana' || cmd === '/mañana' || cmd === '/dia') {
    const hoy = ahoraMadrid().fecha;
    const fecha = cmd === '/hoy' ? hoy : cmd === '/dia' ? (args[0] || '') : sumarDias(hoy, 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return send(env, chat, 'Usa: /dia 2026-12-24');
    return listado(env, chat, fecha);
  }

  // Tarjeta de puntos: solo por chat privado con el bot (en el grupo solo van reservas)
  if (!privado) return;
  if (cmd === '/puntos' && args.length >= 2) {
    const c = await cliente(env, args[0]);
    if (!c) return send(env, chat, 'No encuentro esa tarjeta.');
    return sumar(env, chat, c, args[1], quien);
  }
  if (cmd === '/deshacer') return deshacer(env, chat, quien);

  // ¿Código de tarjeta escrito a mano?
  const code = txt.toUpperCase().match(/HK-?[A-Z0-9]{6}/);
  if (code) return abrirTarjeta(env, chat, code[0]);

  // ¿Importe pendiente de sumar?
  const est = await env.DB.prepare('SELECT * FROM bot_estado WHERE chat_id=?').bind(String(chat)).first();
  if (est?.modo === 'sumar' && /^\d+([.,]\d{1,2})?\s*€?$/.test(txt)) {
    const c = await cliente(env, est.codigo);
    await env.DB.prepare('UPDATE bot_estado SET modo=NULL WHERE chat_id=?').bind(String(chat)).run();
    if (c) return sumar(env, chat, c, txt, quien);
  }
}

// ── Botones ───────────────────────────────────────────────
async function onCallback(env, q) {
  const chat = q.message?.chat.id, user = q.from.id, quien = q.from.first_name || 'staff';
  const answer = text => tg(env, 'answerCallbackQuery', { callback_query_id: q.id, text, show_alert: false });
  if (!esStaff(env, user, chat)) return answer('No autorizado');
  const [acc, a, b] = String(q.data || '').split(':');

  if (acc === 'ok' || acc === 'no') {
    const r = await env.DB.prepare('SELECT * FROM reservas WHERE id=?').bind(+a).first();
    if (!r) return answer('No existe');
    if (r.estado !== 'pendiente') { await answer('Ya estaba ' + r.estado); return refrescar(env, r); }
    const estado = acc === 'ok' ? 'confirmada' : 'rechazada';
    await env.DB.prepare(`UPDATE reservas SET estado=?, gestionada_por=? WHERE id=? AND estado='pendiente'`).bind(estado, quien, r.id).run();
    const nr = { ...r, estado, gestionada_por: quien };
    await refrescar(env, nr);
    await answer(estado === 'confirmada' ? 'Confirmada ✅' : 'Rechazada');
    return avisarCliente(env, nr);
  }

  if (acc === 'un') {
    // Deshacer: confirmada/rechazada → vuelve a pendiente con los botones
    const r = await env.DB.prepare('SELECT * FROM reservas WHERE id=?').bind(+a).first();
    if (!r) return answer('No existe');
    if (!['confirmada', 'rechazada'].includes(r.estado)) { await answer('No se puede deshacer'); return refrescar(env, r); }
    await env.DB.prepare(`UPDATE reservas SET estado='pendiente', gestionada_por=NULL WHERE id=? AND estado IN ('confirmada','rechazada')`).bind(r.id).run();
    await refrescar(env, { ...r, estado: 'pendiente', gestionada_por: null });
    return answer('Vuelve a pendiente');
  }
  if (acc === 'sm') {
    await env.DB.prepare(`INSERT INTO bot_estado (chat_id,codigo,modo,actualizado) VALUES (?,?, 'sumar', datetime('now')) ON CONFLICT(chat_id) DO UPDATE SET codigo=excluded.codigo, modo='sumar', actualizado=excluded.actualizado`).bind(String(chat), a).run();
    await answer('');
    return send(env, chat, `💴 Escribe el <b>importe de la cuenta</b> para ${esc(a)} (ej: 45,90)`, { reply_markup: { force_reply: true, input_field_placeholder: '45,90' } });
  }
  if (acc === 'cj') {
    const c = await cliente(env, a); if (!c) return answer('No existe');
    await answer('');
    const kb = PREMIOS.map(p => [{ text: `${c.puntos >= p.puntos ? '🎁' : '🔒'} ${p.nombre} · ${fmtPts(p.puntos)}`, callback_data: `cp:${c.codigo}:${p.id}` }]);
    return send(env, chat, `¿Qué canjea <b>${esc(c.nombre)}</b>? Tiene <b>${fmtPts(c.puntos)}</b> pts.`, { reply_markup: { inline_keyboard: kb } });
  }
  if (acc === 'cp') {
    const c = await cliente(env, a); const p = PREMIOS.find(x => x.id === b);
    if (!c || !p) return answer('No existe');
    const r = await env.DB.prepare('UPDATE clientes SET puntos=puntos-? WHERE id=? AND puntos>=?').bind(p.puntos, c.id, p.puntos).run();
    if (!r.meta.changes) return answer('No tiene puntos suficientes');
    await env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,concepto,staff) VALUES (?,?,?,?)').bind(c.id, -p.puntos, 'Canje: ' + p.nombre, quien).run();
    await answer('Canjeado 🎁');
    await tg(env, 'editMessageReplyMarkup', { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
    return send(env, chat, `🎁 <b>${esc(p.nombre)}</b> canjeado para ${esc(c.nombre)}.\nLe quedan <b>${fmtPts(c.puntos - p.puntos)}</b> pts.`);
  }
  return answer('');
}

// ── Reservas ──────────────────────────────────────────────
async function listado(env, chat, fecha) {
  const { results } = await env.DB.prepare(`SELECT * FROM reservas WHERE fecha=? AND estado IN ('pendiente','confirmada') ORDER BY hora, id`).bind(fecha).all();
  if (!results.length) return send(env, chat, `📅 <b>${fechaLarga(fecha)}</b>\nSin reservas.`);
  const ico = { pendiente: '⏳', confirmada: '✅' };
  let total = 0, hora = '', out = `📅 <b>${fechaLarga(fecha)}</b>\n`;
  for (const r of results) {
    total += r.adultos + r.ninos + r.bebes;
    if (r.hora !== hora) { hora = r.hora; out += `\n<b>${hora}</b>\n`; }
    out += `${ico[r.estado]} ${esc(r.nombre)} · ${personasTxt(r)}${r.cumple ? ' 🎂' : ''}${r.trona ? ' 🪑' : ''}${r.carrito ? ' 👶' : ''} · ${esc(r.telefono)}${r.comentarios ? `\n   📝 ${esc(r.comentarios)}` : ''}\n`;
  }
  return send(env, chat, out + `\n👥 <b>${total} personas</b> en ${results.length} reservas`);
}

// ── Fidelidad ─────────────────────────────────────────────
const cliente = (env, code) => env.DB.prepare('SELECT * FROM clientes WHERE codigo=?').bind(String(code).toUpperCase().replace(/^HK-?/, 'HK-')).first();

async function abrirTarjeta(env, chat, code) {
  const c = await cliente(env, code);
  if (!c) return send(env, chat, `No encuentro la tarjeta ${esc(code)}.`);
  await env.DB.prepare(`INSERT INTO bot_estado (chat_id,codigo,modo,actualizado) VALUES (?,?,NULL,datetime('now')) ON CONFLICT(chat_id) DO UPDATE SET codigo=excluded.codigo, modo=NULL, actualizado=excluded.actualizado`).bind(String(chat), c.codigo).run();
  const rg = rango(c.total);
  return send(env, chat, `🎴 <b>${esc(c.nombre)}</b> · <code>${c.codigo}</code>\n${rg.jp} ${rg.nombre}\n\n💠 <b>${fmtPts(c.puntos)}</b> puntos`, {
    reply_markup: { inline_keyboard: [[{ text: '➕ Sumar compra', callback_data: `sm:${c.codigo}` }, { text: '🎁 Canjear', callback_data: `cj:${c.codigo}` }]] }
  });
}

async function sumar(env, chat, c, importeTxt, quien) {
  const imp = parseFloat(String(importeTxt).replace('€', '').replace(',', '.'));
  if (!(imp > 0) || imp > 2000) return send(env, chat, 'Importe no válido.');
  const pts = Math.floor(imp / 10) * PUNTOS_POR_10;
  if (!pts) return send(env, chat, `Con ${imp.toFixed(2).replace('.', ',')} € no llega a 10 €: no suma puntos.`);
  await env.DB.batch([
    env.DB.prepare('UPDATE clientes SET puntos=puntos+?, total=total+? WHERE id=?').bind(pts, pts, c.id),
    env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,importe,concepto,staff) VALUES (?,?,?,?,?)').bind(c.id, pts, imp, 'Compra', quien)
  ]);
  const antes = rango(c.total), despues = rango(c.total + pts);
  const sube = antes.nombre !== despues.nombre ? `\n\n⚡ ¡SUBE DE RANGO! → ${despues.jp} <b>${despues.nombre}</b>` : '';
  return send(env, chat, `✅ +<b>${fmtPts(pts)}</b> pts para ${esc(c.nombre)} (${imp.toFixed(2).replace('.', ',')} €)\nSaldo: <b>${fmtPts(c.puntos + pts)}</b> pts${sube}`);
}

async function deshacer(env, chat, quien) {
  const m = await env.DB.prepare(`SELECT * FROM movimientos WHERE staff=? AND creado >= datetime('now','-10 minutes') AND concepto NOT LIKE 'Anulado%' ORDER BY id DESC LIMIT 1`).bind(quien).first();
  if (!m) return send(env, chat, 'No hay nada tuyo que deshacer en los últimos 10 minutos.');
  await env.DB.batch([
    env.DB.prepare('UPDATE clientes SET puntos=puntos-?, total=total-? WHERE id=?').bind(m.puntos, m.puntos > 0 ? m.puntos : 0, m.cliente_id),
    env.DB.prepare(`UPDATE movimientos SET concepto='Anulado: ' || concepto WHERE id=?`).bind(m.id),
    env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,concepto,staff) VALUES (?,?,?,?)').bind(m.cliente_id, -m.puntos, 'Corrección', quien)
  ]);
  return send(env, chat, `↩️ Deshecho: ${m.puntos > 0 ? '+' : ''}${fmtPts(m.puntos)} pts (${esc(m.concepto)}).`);
}
