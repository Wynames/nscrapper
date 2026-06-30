// api/_lib/whitelist.js
const allowedOrigins = [
  'xupi.my.id',
//  'www.xupi.my.id',
  // tambahkan domain lain jika perlu
];

function extractHostname(header) {
  if (!header) return null;
  try {
    const url = new URL(header);
    return url.hostname;
  } catch (_) {
    const cleaned = header.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    return cleaned || null;
  }
}

export function isAllowed(req) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host ? req.headers.host.split(':')[0] : null;

  const candidates = [
    extractHostname(origin),
    extractHostname(referer),
    host,
  ].filter(Boolean);

  return candidates.some(candidate =>
    allowedOrigins.some(domain => candidate === domain || candidate.endsWith('.' + domain))
  );
}
