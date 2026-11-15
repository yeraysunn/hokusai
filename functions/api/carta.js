// GET /api/carta → cambios vigentes de la carta (para la página pública). Caché corta: los cambios salen en < 1 minuto.
import { json, ahoraMadrid } from '../_lib.js';

export async function onRequestGet({ env }) {
  const hoy = ahoraMadrid().fecha;
  const { results } = await env.DB.prepare('SELECT * FROM carta_cambios').all();
  const cambios = {};
  for (const r of results) {
    const o = {};
    if (r.oculto) o.oculto = 1;
    if (r.agotado_dia === hoy) o.agotado = 1;
    if (r.nombre) o.nombre = r.nombre;
    if (r.descripcion) o.descripcion = r.descripcion;
    if (r.precio != null && r.precio !== '') o.precio = r.precio;
    if (Object.keys(o).length) cambios[r.clave] = o;
  }
  return json({ ok: true, cambios }, 200, { 'cache-control': 'public, max-age=30' });
}
