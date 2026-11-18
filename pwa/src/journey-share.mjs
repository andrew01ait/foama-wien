import {parseLocationShare,sharedStations,exactSharedAddresses} from './share-location.mjs?v=0.12.2';
import {coordinate,inJourneyArea} from './journey-geometry.mjs?v=0.12.2';
import {uniqueJourneyPlaces} from './journey-planning.mjs?v=0.12.2';

export function takeLocationShare(location, history) {
  if (!location.hash.startsWith('#share?')) return null;
  const fields = new URLSearchParams(location.hash.slice(7));
  history.replaceState(null, '', location.pathname + location.search);
  return {title: fields.get('title') || '', text: fields.get('text') || '', url: fields.get('url') || ''};
}

export function mountJourneyShare({document: doc, client, loadStops, choose, writeQuery, getStart, plan, createMap}) {
  const el = id => doc.getElementById(id);
  const panel = el('sharedDestination'), holder = el('sharedMap'), message = el('sharedStatus');
  const label = el('sharedName'), options = el('sharedChoices'), route = el('sharedRoute');
  const start = el('sharedStart'), edit = el('sharedEdit'), retry = el('sharedRetry');
  const visible = () => !doc.hidden && !el('journeyForm').hidden && !el('journeySearch').hidden;
  let original, pending, selected, requestId = 0, loading = false;
  let map, mapId = 0, openingMap = false;

  function description(point) {
    return [point.detail, point.lat.toFixed(5) + ', ' + point.lon.toFixed(5)].filter(Boolean).join(' · ');
  }
  function stopLookup() {
    requestId++;
    loading = false;
    client.abort();
  }
  function clearMap() {
    mapId++;
    openingMap = false;
    map?.destroy();
    map = null;
  }
  async function showMap() {
    if (!selected || !visible() || openingMap || map) return;
    openingMap = true;
    const id = ++mapId;
    const current = () => id === mapId && visible();
    try {
      const next = await createMap({holder, stops: [], center: selected, destination: selected, isCurrent: current});
      if (current()) map = next;
      else next.destroy();
    } catch {
      if (current()) message.textContent += ' Karte gerade nicht verfügbar.';
    } finally {
      if (id === mapId) openingMap = false;
    }
  }
  function routeLabel() {
    const from = getStart();
    route.textContent = from?.kind === 'current' ? 'Route von meinem Standort' : from?.name ? 'Route ab ' + from.name : 'Verbindungen suchen';
    start.textContent = from?.kind === 'current' ? 'Anderen Start wählen' : 'Start ändern';
  }
  function display(point) {
    clearMap();
    selected = coordinate(point) ? point : null;
    holder.hidden = !selected;
    route.hidden = start.hidden = !inJourneyArea(selected);
    edit.hidden = !!selected && !route.hidden;
    retry.hidden = true;
    options.replaceChildren();
    label.textContent = selected?.name || '';
    message.textContent = selected ? [description(selected),
      !inJourneyArea(selected) ? 'Das Ziel liegt außerhalb des österreichischen Planungsgebiets.' : ''].filter(Boolean).join(' · ') : '';
    routeLabel();
    if (selected) void showMap();
  }
  function pointChanged(kind, point) {
    if (kind === 'from') { routeLabel(); if (inJourneyArea(selected)) message.textContent = description(selected); return; }
    stopLookup();
    pending = null;
    display(point);
    if (!selected) message.textContent = 'Adresse oder Haltestelle im Zielfeld auswählen.';
  }
  function offer(rows) {
    options.replaceChildren();
    for (const row of rows) {
      const button = doc.createElement('button'), detail = doc.createElement('small');
      button.type = 'button';
      button.textContent = row.name;
      detail.textContent = row.detail || [row.provider ? 'Haltestelle' : '', row.lat.toFixed(5) + ', ' + row.lon.toFixed(5)].filter(Boolean).join(' · ');
      button.append(detail);
      button.addEventListener('click', () => choose(row));
      options.append(button);
    }
    message.textContent = 'Welches Ziel meinst du?';
    edit.hidden = false;
  }
  async function resolve() {
    if (!pending || loading || !visible()) return;
    const id = ++requestId;
    const current = () => id === requestId && visible();
    let item = pending;
    loading = true;
    retry.hidden = true;
    try {
      if (item.kind === 'short') {
        message.textContent = 'Kartenlink wird geöffnet …';
        try { item = (await client.mapLink(item.url)).destination; }
        catch (error) {
          if (!current()) return;
          if (!item.fallback) throw error;
          item = {kind: 'query', query: item.fallback};
        }
        if (!current()) return;
        if (item.kind === 'point' && item.point.name === 'Geteilter Kartenpunkt' && pending.fallback) item.point = {...item.point, name: pending.fallback};
      }
      if (item.kind === 'point') { choose(item.point); return; }
      if (item.kind !== 'query') {
        message.textContent = 'Kein Ziel erkannt. Gib eine Adresse oder Haltestelle ein oder wähle einen Punkt auf der Karte.';
        pending = null;
        return;
      }
      writeQuery(item.query);
      label.textContent = item.query;
      message.textContent = 'Ziel wird gesucht …';
      let matches = sharedStations(await loadStops(), item.query);
      if (!current()) return;
      if (!matches.length) {
        const {places} = await client.places(item.query);
        if (!current()) return;
        const exact = exactSharedAddresses(places, item.query);
        matches = exact.length ? exact : places;
      }
      const rows = uniqueJourneyPlaces(matches);
      pending = null;
      if (rows.length === 1) choose(rows[0]);
      else if (rows.length) offer(rows);
      else {
        message.textContent = 'Kein passendes Ziel gefunden. Ergänze Straße, Hausnummer oder Stadt.';
        edit.hidden = false;
      }
    } catch {
      if (!current()) return;
      pending = null;
      retry.hidden = edit.hidden = false;
      message.textContent = 'Das geteilte Ziel konnte nicht geladen werden. Versuche es erneut oder wähle eine Adresse oder Haltestelle.';
    } finally {
      if (id === requestId) loading = false;
    }
  }
  function pause() {
    if (loading) stopLookup();
    clearMap();
  }
  function visibility() {
    if (!visible()) { pause(); return; }
    if (pending) void resolve();
    else if (selected) void showMap();
  }
  function focusPanel() {
    el('sharedHeading').focus({preventScroll: true});
    panel.scrollIntoView({block: 'start'});
  }
  function focusUnresolved() {
    if (!pending && !options.children.length) return false;
    focusPanel();
    return true;
  }
  function open(payload) {
    stopLookup();
    original = parseLocationShare(payload);
    pending = original;
    panel.hidden = false;
    display(null);
    writeQuery(original.kind === 'query' ? original.query : original.fallback || '');
    if (visible()) focusPanel();
    visibility();
  }
  function focusInput(id) {
    const input = el(id);
    input.focus({preventScroll: true});
    input.select();
    input.scrollIntoView({block: 'center'});
  }
  edit.addEventListener('click', () => focusInput('journeyTo'));
  start.addEventListener('click', () => focusInput('journeyFrom'));
  retry.addEventListener('click', () => { pending = original; void resolve(); });
  route.addEventListener('click', async () => {
    if (!inJourneyArea(selected) || route.disabled) return;
    route.disabled = true;
    try {
      const destination = selected;
      message.textContent = 'Verbindungen werden gesucht …';
      await plan();
      if (selected !== destination) return;
      message.textContent = description(selected);
      const result = el('journeyStatus');
      if (visible() && result.textContent && !el('fromChoices').children.length && !el('toChoices').children.length) {
        message.textContent = result.textContent;
        panel.scrollIntoView({block: 'start'});
      }
    } finally { route.disabled = false; }
  });
  return {open, pointChanged, visibility, pause, focusUnresolved};
}
