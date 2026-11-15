// GET /api/admin/estadisticas?dias=7|30|90 → resumen para el panel
import { json, ahoraMadrid, sumarDias } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const dias = [7, 30, 90].includes(parseInt(new URL(request.url).searchParams.get('dias'))) ? parseInt(new URL(request.url).searchParams.get('dias')) : 7;
  const hoy = ahoraMadrid().fecha;
  const desde = sumarDias(hoy, -(dias - 1));
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
  const [porDia, origenes, eventos, paginas, totV, res, resDia, tarjetas] = await env.DB.batch([
    q(`SELECT dia, COUNT(DISTINCT visitante) v, SUM(evento IS NULL) pv FROM visitas WHERE dia>=? GROUP BY dia ORDER BY dia`, desde),
    q(`SELECT origen, COUNT(DISTINCT dia||visitante) n FROM visitas WHERE dia>=? AND evento IS NULL AND origen<>'Interno' GROUP BY origen ORDER BY n DESC`, desde),
    q(`SELECT evento, COUNT(*) n FROM visitas WHERE dia>=? AND evento IS NOT NULL GROUP BY evento ORDER BY n DESC`, desde),
    q(`SELECT pagina, COUNT(*) n FROM visitas WHERE dia>=? AND evento IS NULL GROUP BY pagina ORDER BY n DESC LIMIT 8`, desde),
    q(`SELECT COUNT(DISTINCT dia||visitante) v, SUM(evento IS NULL) pv FROM visitas WHERE dia>=?`, desde),
    q(`SELECT COUNT(*) n, COALESCE(SUM(adultos+ninos+bebes),0) p, SUM(estado='no_vino') nv, SUM(estado='cancelada') c FROM reservas WHERE date(creada)>=?`, desde),
    q(`SELECT date(creada) dia, COUNT(*) n FROM reservas WHERE date(creada)>=? GROUP BY dia`, desde),
    q(`SELECT COUNT(*) n FROM clientes WHERE date(creada)>=?`, desde)
  ]);
  const serie = [];
  const mapV = Object.fromEntries(porDia.results.map(r => [r.dia, r]));
  const mapR = Object.fromEntries(resDia.results.map(r => [r.dia, r.n]));
  for (let i = 0; i < dias; i++) { const d = sumarDias(desde, i); serie.push({ dia: d, visitantes: mapV[d]?.v || 0, paginas: mapV[d]?.pv || 0, reservas: mapR[d] || 0 }); }
  const t = totV.results[0], r = res.results[0];
  return json({
    ok: true, dias, desde, hoy, serie,
    kpis: { visitantes: t.v || 0, paginas: t.pv || 0, reservas: r.n || 0, personas: r.p || 0, conversion: t.v ? Math.round((r.n || 0) / t.v * 1000) / 10 : 0, tarjetas: tarjetas.results[0].n || 0, noVinieron: r.nv || 0, canceladas: r.c || 0 },
    origenes: origenes.results, eventos: eventos.results, paginas: paginas.results
  });
}
