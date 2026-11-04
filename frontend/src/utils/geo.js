// Address geocoding (OpenStreetMap Nominatim) with a localStorage cache, plus polyline decoding.
const CACHE_KEY = 'geocode-cache-v1';
const COLOMBO = [6.9271, 79.8612];

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
};
const writeCache = (cache) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage unavailable */ }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lookup = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=lk&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const [hit] = await res.json();
  return hit ? [parseFloat(hit.lat), parseFloat(hit.lon)] : null;
};

// Try the full address, then progressively coarser versions ("45 Temple Road, Nugegoda" -> "Nugegoda")
export const geocode = async (address) => {
  const cache = readCache();
  if (address in cache) return cache[address];

  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  let result = null;
  for (let i = 0; i < parts.length && !result; i += 1) {
    if (i > 0) await sleep(1100); // Nominatim allows ~1 request per second
    result = await lookup(parts.slice(i).join(', '));
  }

  cache[address] = result; // cache misses too so we do not retry on every render
  writeCache(cache);
  return result;
};

// Decode a Google encoded polyline into [lat, lng] pairs
export const decodePolyline = (str = '') => {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    for (const axis of ['lat', 'lng']) {
      let shift = 0, result = 0, byte;
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') lat += delta; else lng += delta;
    }
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
};

export { COLOMBO };
