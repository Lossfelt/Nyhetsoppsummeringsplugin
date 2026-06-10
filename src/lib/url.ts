// Normaliserer en URL for bruk som cache-nøkkel: stripper sporingsparametre
// og fragment, og lar små variasjoner peke på samme oppføring.

const TRACKING_EXACT = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'spm',
  'cmpid',
  'icid',
]);

function isTracking(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.startsWith('utm_') || TRACKING_EXACT.has(lower);
}

export function normalizeUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return input.trim();
  }

  for (const key of [...url.searchParams.keys()]) {
    if (isTracking(key)) url.searchParams.delete(key);
  }

  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  const query = url.searchParams.toString();
  url.search = query ? `?${query}` : '';

  return url.toString();
}
