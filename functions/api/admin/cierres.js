// POST /api/admin/cierres {fecha, horas:[...], cerrar:true|false} → abre o cierra horas a reservas
import { json, err, body, HORAS } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const fecha = String(d?.fecha || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return err('Fecha no válida.');
  const horas = (Array.isArray(d.horas) ? d.horas : []).filter(h => HORAS.includes(h));
  if (!horas.length) return err('Sin horas.');
  const st = horas.map(h => d.cerrar
    ? env.DB.prepare('INSERT OR IGNORE INTO cierres (fecha,hora) VALUES (?,?)').bind(fecha, h)
    : env.DB.prepare('DELETE FROM cierres WHERE fecha=? AND hora=?').bind(fecha, h));
  await env.DB.batch(st);
  const { results } = await env.DB.prepare('SELECT hora FROM cierres WHERE fecha=?').bind(fecha).all();
  return json({ ok: true, cerradas: results.map(x => x.hora) });
}
