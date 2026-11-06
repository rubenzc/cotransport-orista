// Cálculo de kilómetros entre dos lugares. Solución PROVISIONAL sin cuentas ni claves:
//  - Nominatim (OpenStreetMap) convierte el nombre del lugar en coordenadas.
//  - OSRM (servidor público de demostración) calcula la distancia por carretera.
// Ambos son servicios públicos sin garantía: se llaman solo al pulsar «Calcular» (un par de peticiones).
// Cuando openrouteservice vuelva a estar disponible, basta cambiar `routeKm` por una llamada a su API
// (a través de una función de Netlify para no exponer la clave); el resto de la app no cambia.
import { getLang } from './i18n';

export class RoutingError extends Error {
  constructor(public code: 'notFound' | 'failed', public place?: string) {
    super(code);
  }
}

interface Point {
  lat: string;
  lon: string;
}

async function getJSON<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new RoutingError('failed');
    return (await res.json()) as T;
  } catch (e) {
    throw e instanceof RoutingError ? e : new RoutingError('failed');
  } finally {
    clearTimeout(timer);
  }
}

/** «Oristà – Plaça» -> «Oristà»: el detalle tras el guion largo no lo conoce el mapa. */
function placeQuery(place: string): string {
  return place.split(/\s[–—-]\s/)[0].trim();
}

async function geocode(place: string): Promise<Point> {
  const q = encodeURIComponent(placeQuery(place));
  const data = await getJSON<Point[]>(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&accept-language=${getLang()}&q=${q}`,
  );
  if (!data.length) throw new RoutingError('notFound', place);
  return data[0];
}

/** Kilómetros por carretera entre dos lugares (un decimal). */
export async function routeKm(origin: string, destination: string): Promise<number> {
  const a = await geocode(origin);
  // Nominatim pide como máximo 1 petición por segundo
  await new Promise((r) => setTimeout(r, 1100));
  const b = await geocode(destination);
  const data = await getJSON<{ code: string; routes?: { distance: number }[] }>(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`,
  );
  const meters = data.routes?.[0]?.distance;
  if (data.code !== 'Ok' || !meters) throw new RoutingError('failed');
  return Math.max(0.1, Math.round(meters / 100) / 10);
}
