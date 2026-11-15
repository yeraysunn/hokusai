// GET /api/fidelidad/tarjeta?t=TOKEN → datos de la tarjeta del cliente
import { json, err, clean, rango, PREMIOS } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const t = clean(new URL(request.url).searchParams.get('t'), 40);
  if (!t) return err('Falta el enlace.');
  const c = await env.DB.prepare('SELECT * FROM clientes WHERE token=?').bind(t).first();
  if (!c) return err('No encontramos esta tarjeta.', 404);
  const { results } = await env.DB.prepare('SELECT puntos, importe, concepto, creado FROM movimientos WHERE cliente_id=? ORDER BY id DESC LIMIT 15').bind(c.id).all();
  return json({
    ok: true,
    tarjeta: { nombre: c.nombre, codigo: c.codigo, puntos: c.puntos, total: c.total, desde: c.creada.slice(0, 10), rango: rango(c.total) },
    qr: env.BOT_USERNAME ? `https://t.me/${env.BOT_USERNAME}?start=c_${c.codigo}` : c.codigo,
    premios: PREMIOS, movimientos: results
  });
}
