// GET  /api/admin/carta → todos los cambios guardados
// POST /api/admin/carta {clave, agotado?, oculto?, nombre?, descripcion?, precio?, restablecer?}
import { json, err, body, clean, ahoraMadrid } from '../../_lib.js';

export async function onRequestGet({ env }) {
  const hoy = ahoraMadrid().fecha;
  const { results } = await env.DB.prepare('SELECT * FROM carta_cambios').all();
  return json({ ok: true, hoy, cambios: Object.fromEntries(results.map(r => [r.clave, { oculto: !!r.oculto, agotado: r.agotado_dia === hoy, nombre: r.nombre || '', descripcion: r.descripcion || '', precio: r.precio || '' }])) });
}

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const clave = clean(d?.clave, 160);
  if (!/^[pb]:[^:]+:.+/.test(clave)) return err('Plato no válido.');
  if (d.restablecer) { await env.DB.prepare('DELETE FROM carta_cambios WHERE clave=?').bind(clave).run(); return json({ ok: true }); }
  const hoy = ahoraMadrid().fecha;
  const cur = await env.DB.prepare('SELECT * FROM carta_cambios WHERE clave=?').bind(clave).first() || {};
  const val = (k, max) => k in d ? (clean(d[k], max) || null) : (cur[k] ?? null);
  let precio = val('precio', 20);
  if (precio && /^\d+([.,]\d{1,2})?$/.test(precio)) precio = Number(precio.replace(',', '.')).toFixed(2).replace('.', ',') + ' €';
  const row = {
    oculto: 'oculto' in d ? (d.oculto ? 1 : 0) : (cur.oculto || 0),
    agotado_dia: 'agotado' in d ? (d.agotado ? hoy : null) : (cur.agotado_dia ?? null),
    nombre: val('nombre', 80), descripcion: val('descripcion', 300), precio
  };
  if (!row.oculto && !row.agotado_dia && !row.nombre && !row.descripcion && !row.precio) {
    await env.DB.prepare('DELETE FROM carta_cambios WHERE clave=?').bind(clave).run();
    return json({ ok: true, cambio: { oculto: false, agotado: false, nombre: '', descripcion: '', precio: '' } });
  }
  await env.DB.prepare(`INSERT INTO carta_cambios (clave,oculto,agotado_dia,nombre,descripcion,precio,actualizado) VALUES (?,?,?,?,?,?,datetime('now'))
    ON CONFLICT(clave) DO UPDATE SET oculto=excluded.oculto, agotado_dia=excluded.agotado_dia, nombre=excluded.nombre, descripcion=excluded.descripcion, precio=excluded.precio, actualizado=excluded.actualizado`)
    .bind(clave, row.oculto, row.agotado_dia, row.nombre, row.descripcion, row.precio).run();
  return json({ ok: true, cambio: { oculto: !!row.oculto, agotado: row.agotado_dia === hoy, nombre: row.nombre || '', descripcion: row.descripcion || '', precio: row.precio || '' } });
}
