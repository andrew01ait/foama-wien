import {coordinate} from './journey-geometry.mjs?v=0.12.3';
import {normalizedStationName} from './station-search.mjs?v=0.12.3';
import {addressParts,compatibleAddress,describeSharedPin,postalAddress} from './shared-address.mjs?v=0.12.3';

const links = /(?:https?:\/\/|geo:)[^\s<>"“”]+/gi;
const pair = /^([+-]?\d{1,3}(?:\.\d+)?)\s*[,;]\s*([+-]?\d{1,3}(?:\.\d+)?)(?:\s*\(([^()]*)\))?$/;
const localPair = /^([+-]?\d{1,3},\d+)\s*;\s*([+-]?\d{1,3},\d+)$/;
const spacedPair = /^([+-]?\d{1,3}\.\d+)\s+([+-]?\d{1,3}\.\d+)$/;
function coordinatesIn(text) {
  return text.match(localPair) || text.match(pair) || text.match(spacedPair);
}
const googleHost = /^(?:(?:www|maps)\.)?google\.(?:com|at|de|ch|fr|it|co\.uk|cz|sk|hu|pl|nl|es|be)$/i;
const compact = value => String(value || '').replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim();
function name(value) {
  const text = compact(value).replace(/\s*[-–·|]\s*Google Maps$/i, '');
  return text.length <= 160 && !/^(?:Google Maps|Maps|Standort|Location|Dropped pin|Gesetzte Markierung)$/i.test(text)
    && !/(?:[a-z][\w+.-]*:\/\/|^geo:|^www\.)/i.test(text) ? text : '';
}
function point(lat, lon, label) {
  const decimal = /^[+-]?\d{1,3}(?:[.,]\d+)?$/;
  if (!decimal.test(lat) || !decimal.test(lon)) return null;
  const coords = coordinate({lat: Number(String(lat).replace(',', '.')), lon: Number(String(lon).replace(',', '.'))});
  if (!coords) return null;
  return {kind: 'point', point: {...coords, name: name(label) || 'Geteilter Kartenpunkt'}};
}
function valueTarget(value, label) {
  const text = compact(value);
  const match = coordinatesIn(text);
  if (match) return point(match[1], match[2], match[3] || label);
  return name(text) ? {kind: 'query', query: name(text)} : null;
}
function decode(value) {
  try { return decodeURIComponent(value); } catch { return ''; }
}
function mapURL(raw) {
  try {
    const url = new URL(raw);
    return !url.username && !url.password && !url.port && ['https:', 'http:', 'geo:'].includes(url.protocol) ? url : null;
  } catch { return null; }
}
export function googleMapsShortUrl(raw) {
  const url = mapURL(raw);
  if (url?.protocol !== 'https:') return null;
  if (url.hostname === 'maps.app.goo.gl' && /^\/[a-z0-9_-]{4,96}\/?$/i.test(url.pathname)
    || url.hostname === 'goo.gl' && /^\/maps\/[a-z0-9_-]{4,96}\/?$/i.test(url.pathname)) {
    return url.origin + url.pathname;
  }
  return null;
}

function googleDestination(url, label) {
  if (!googleHost.test(url.hostname) || !(url.hostname.startsWith('maps.') || /^\/maps(?:\/|$)/.test(url.pathname))) return null;
  const params = url.searchParams;
  const parts = url.pathname.split('/').map(part => decode(part.replace(/\+/g, ' ')));
  const direction = parts.indexOf('dir');
  for (const key of ['destination', 'daddr']) {
    if (params.has(key)) return valueTarget(params.get(key), label);
  }
  if (direction >= 0) {
    // A camera center and the first listed stop can both be far from the destination.
    const route = parts.slice(direction + 1);
    const end = route.findIndex(part => /^@|^data=/.test(part));
    const stops = route.slice(0, end < 0 ? route.length : end).filter((part, i) => i === 0 || part);
    return stops.length > 1 ? valueTarget(stops.at(-1), label) : null;
  }
  const place = parts.indexOf('place'), search = parts.indexOf('search');
  const slug = place >= 0 ? parts[place + 1] : search >= 0 ? parts[search + 1] : '';
  const placeLabel = slug && !/^@|^data=/.test(slug) ? slug : '';
  const data = parts.find(part => part.startsWith('data=')) || params.get('data') || '';
  const pin = data.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)(?=!|$)/);
  if (pin) {
    const target = point(pin[1], pin[2], placeLabel || label);
    const query = name(params.get('query') || params.get('q'));
    if (target && query && !coordinatesIn(query)) target.point = describeSharedPin(target.point, query);
    return target;
  }
  for (const key of ['query', 'q']) {
    const query = params.get(key);
    if (query && !/^(?:place_id:|loc:0x)/i.test(query)) return valueTarget(query.replace(/^loc:/i, ''), label);
  }
  if (placeLabel) return valueTarget(placeLabel, label);
  if (place >= 0 || search >= 0 || data || params.has('cid') || params.has('ftid')) return null;
  const camera = parts.find(part => part.startsWith('@'))?.match(/^@(-?[\d.]+),(-?[\d.]+)(?:,|$)/);
  return camera ? point(camera[1], camera[2], label) : valueTarget(params.get('center') || params.get('ll'), label);
}
export function locationFromMapUrl(raw, label = '') {
  const url = mapURL(raw);
  if (!url) return null;
  const p = url.searchParams;
  if (url.protocol === 'geo:') {
    const query = p.get('q');
    if (query) return valueTarget(query, label);
    const coords = decode(url.pathname).split(';')[0].split(',');
    return coords.length >= 2 ? point(coords[0], coords[1], label) : null;
  }
  if (url.hostname === 'maps.apple.com') {
    const destination = p.get('daddr') || p.get('destination');
    if (destination) return valueTarget(destination, label);
    const coords = p.get('coordinate') || p.get('ll');
    if (coords) {
      const target = valueTarget(coords, p.get('name') || p.get('q') || label);
      if (target?.kind === 'point') target.point = describeSharedPin(target.point, name(p.get('address')));
      return target;
    }
    return valueTarget(p.get('address') || p.get('q') || p.get('name'), label);
  }
  if (/^(?:www\.)?(?:openstreetmap\.org|osm\.org)$/.test(url.hostname)) {
    if (p.has('mlat') || p.has('mlon')) return point(p.get('mlat'), p.get('mlon'), label);
    if (url.pathname === '/' && /^#map=/.test(url.hash)) {
      const [, lat, lon] = url.hash.slice(5).split('/');
      return point(lat, lon, label);
    }
    return null;
  }
  return googleDestination(url, label);
}
export function parseLocationShare({title = '', text = '', url = ''} = {}) {
  const lines = text.split(/\r?\n/).map(line => line.replace(links, '').trim()).filter(Boolean);
  const heading = name(title.replace(links, ''));
  const label = name(lines[0]) || heading;
  const accompanying = lines.filter(line => !coordinatesIn(line)).map(name).filter(Boolean).join('\n');
  const plain = name(lines.join(', ')) || name(postalAddress(addressParts(accompanying))) || label;
  function withAddress(item) {
    if (item?.kind === 'point') item.point = describeSharedPin(item.point, accompanying, heading);
    if (item?.kind === 'query') {
      const address = addressParts(accompanying, item.query, heading);
      if (address.street) item.query = postalAddress(address).slice(0, 160);
    }
    return item;
  }
  let shortcut = null;
  for (const source of [url, text, title]) {
    if (/^geo:/i.test(source) && !source.includes('\n')) {
      const geo = locationFromMapUrl(source.trim(), label);
      if (geo) return withAddress(geo);
    }
    for (const token of source.match(links) || []) {
      const raw = token.replace(/[.,!]+$/, '');
      const shortUrl = googleMapsShortUrl(raw);
      if (shortUrl) { shortcut ??= shortUrl; continue; }
      const result = locationFromMapUrl(raw, label);
      if (result) return withAddress(result);
    }
  }
  for (const line of lines) {
    const match = coordinatesIn(line);
    if (match) return withAddress(point(match[1], match[2], match[3] || (line === label ? heading : label))) || {kind: 'empty'};
  }
  const embedded = lines.join(' ').match(/(?:^|[^\d.])([+-]?\d{1,2}\.\d+)\s*,\s*([+-]?\d{1,3}\.\d+)(?![\d.])/);
  if (embedded) {
    const pin = point(embedded[1], embedded[2], name(title));
    if (pin) return withAddress(pin);
  }
  if (shortcut) {
    const fallback = plain || heading;
    return {kind: 'short', url: shortcut, fallback, ...(heading && heading !== fallback ? {title:heading} : {})};
  }
  return withAddress(valueTarget(plain)) || {kind: 'empty'};
}
export function sharedStations(stops, query) {
  const key = normalizedStationName(query);
  if (!key) return [];
  const exact = stops.filter(stop => normalizedStationName(stop.name) === key && coordinate(stop));
  if (exact.length) return exact;
  const base = text => text.replace(/(?: [su])+$/, '');
  return stops.filter(stop => base(normalizedStationName(stop.name)) === base(key) && coordinate(stop));
}

// Geocoders often return nearby house numbers alongside an exact address.
export function exactSharedAddresses(rows, query) {
  const wanted = normalizedStationName(query);
  const address = addressParts(query);
  return rows.filter(row => row.kind === 'address' && /\d/.test(row.name) &&
    ([row.name, [row.name, row.detail].filter(Boolean).join(' ')].some(label => normalizedStationName(label) === wanted)
      || (normalizedStationName(address.street) === normalizedStationName(row.name)
        && compatibleAddress(address, addressParts([row.name,row.detail].filter(Boolean).join(', '))))));
}
