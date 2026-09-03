function parseCsv(value) {
  if (!value) return [];

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function addOrigin(list, origin) {
  if (origin && !list.includes(origin)) {
    list.push(origin);
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