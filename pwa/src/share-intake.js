// The site and the classic service worker use the same receiver, including offline.
async function readLocationForm(request) {
  const contentType = request.headers.get('content-type') || '';
  const encoding = contentType.split(';')[0].trim().toLowerCase();
  if (!['multipart/form-data', 'application/x-www-form-urlencoded'].includes(encoding) || !request.body) return null;

  // Bound the entire POST before the multipart parser can allocate files.
  const bytes = new Uint8Array(32768);
  const reader = request.body.getReader();
  let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      if (value.byteLength > bytes.length - length) {
        void reader.cancel().catch(() => {});
        return null;
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
    const body = bytes.subarray(0, length);
    if (encoding === 'application/x-www-form-urlencoded') return new URLSearchParams(new TextDecoder().decode(body));
    return await new Response(body, {headers: {'Content-Type': contentType}}).formData();
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

async function locationAttachment(form) {
  const files = form.getAll('location');
  if (files.length !== 1) return null;
  const file = files[0];
  if (typeof file === 'string' || file.size > 16384) return null;
  const mime = file.type.split(';')[0].toLowerCase();
  if (mime !== 'text/plain' && mime !== 'text/uri-list') return null;
  const text = (await file.text()).trim();
  if (!text || text.length > 4096 || text.includes('\u0000')) return null;
  if (mime === 'text/plain') return ['text', text];
  const links = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  return links.length === 1 ? ['url', links[0]] : null;
}

globalThis.foamaShareRedirect = async function (request) {
  const target = new URL('./journey.html', request.url);
  const fields = new URLSearchParams();
  function add(key, value, limit) {
    if (typeof value !== 'string') return;
    const clean = value.trim().replace(/\r\n?/g, '\n');
    if (!clean || clean.length > limit) return;
    fields.set(key, clean);
    if (fields.toString().length > 7600) fields.delete(key);
  }
  const form = await readLocationForm(request);
  if (form) {
    add('url', form.get('url'), 4096);
    add('text', form.get('text'), 4096);
    if (!fields.size) {
      const attachment = await locationAttachment(form);
      if (attachment) add(attachment[0], attachment[1], 4096);
    }
    add('title', form.get('title'), 160);
  }
  // A navigation to this fragment sends only the journey shell URL to the server.
  target.hash = 'share?' + fields.toString();
  return new Response(null, {status: 303, headers: {
    Location: target.href, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'
  }});
};
