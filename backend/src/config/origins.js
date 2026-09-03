function parseCsv(value) {
  if (!value) return [];

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return null;
  const trimmed = origin.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function addOrigin(list, origin) {
  const normalized = normalizeOrigin(origin);
  if (normalized && !list.includes(normalized)) {
    list.push(normalized);
  }
}

function buildAllowedOrigins() {
  const origins = [];
  const frontendUrl = process.env.FRONTEND_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const extraOrigins = parseCsv(process.env.CORS_ORIGINS);

  addOrigin(origins, frontendUrl);
  addOrigin(origins, vercelUrl);
  extraOrigins.forEach((origin) => addOrigin(origins, origin));

  if (process.env.NODE_ENV !== 'production') {
    addOrigin(origins, 'http://localhost:5173');
    addOrigin(origins, 'http://localhost:3000');
  }

  return origins;
}

module.exports = {
  buildAllowedOrigins,
};