// api/_lib/whitelist.js
const allowedOrigins = [
  'xupi.my.id',                // domain web utama Manhwa Scraper
//  'www.xupi.my.id',
//  '7u7-neko.vercel.app',       // domain web 7u7 Neko itu sendiri (biar bisa diakses langsung juga)
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
