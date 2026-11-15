// POST /api/visita {p: página, r: referrer, e: evento?} → estadística anónima, sin cookies
// El "visitante" es un hash de IP + navegador + día: no se guarda la IP y cambia cada día.
import { ahoraMadrid } from '../_lib.js';

const ORIGENES = [
  [/instagram\./i, 'Instagram'], [/facebook\.|fb\./i, 'Facebook'], [/tiktok\./i, 'TikTok'],
  [/google\./i, 'Google'], [/thefork|eltenedor/i, 'TheFork'], [/tripadvisor/i, 'Tripadvisor'], [/bing\.|duckduckgo|yahoo/i, 'Otros buscadores']
];
const EVENTOS = ['llamar', 'whatsapp', 'como_llegar', 'reservar', 'reserva_enviada', 'instagram', 'tiktok', 'carta', 'tarjeta'];

export async function onRequestPost({ request, env }) {
  try {
    const d = JSON.parse(await request.text() || '{}');
    const pagina = String(d.p || '/').slice(0, 80).replace(/\.dc\.html$/i, '').replace(/%20/g, ' ');
    const evento = EVENTOS.includes(d.e) ? d.e : null;
    let origen = 'Directo / QR';
    const ref = String(d.r || '');
    const utm = String(d.u || '');
    if (utm) origen = utm.slice(0, 30);
    else if (ref && !ref.includes(new URL(request.url).hostname)) origen = (ORIGENES.find(([re]) => re.test(ref)) || [null, 'Otras webs'])[1];
    else if (ref) origen = 'Interno';
    const ua = request.headers.get('user-agent') || '';
    if (/bot|crawl|spider|preview|headless/i.test(ua)) return new Response(null, { status: 204 });
    const dia = ahoraMadrid().fecha;
    const raw = `${request.headers.get('cf-connecting-ip') || ''}|${ua}|${dia}|${env.TELEGRAM_WEBHOOK_SECRET || ''}`;
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const visitante = [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare('INSERT INTO visitas (dia,visitante,pagina,origen,evento) VALUES (?,?,?,?,?)').bind(dia, visitante, pagina, origen, evento).run();
  } catch (e) { /* las estadísticas nunca deben romper la web */ }
  return new Response(null, { status: 204 });
}
