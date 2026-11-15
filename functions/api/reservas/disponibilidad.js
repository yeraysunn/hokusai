// GET /api/reservas/disponibilidad?fecha=YYYY-MM-DD → horas completas ese día
import { json, err, clean } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const fecha = clean(new URL(request.url).searchParams.get('fecha'), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return err('Fecha no válida.');
  const max = parseInt(env.MAX_PERSONAS_FRANJA || '40');
  const { results } = await env.DB.prepare(`SELECT hora, SUM(adultos+ninos) n FROM reservas WHERE fecha=? AND estado IN ('pendiente','confirmada') GROUP BY hora`).bind(fecha).all();
  return json({ ok: true, completas: results.filter(x => x.n >= max).map(x => x.hora), libres: Object.fromEntries(results.map(x => [x.hora, Math.max(0, max - x.n)])) });
}
