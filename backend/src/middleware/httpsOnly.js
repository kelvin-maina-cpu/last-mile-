/**
 * Redirect HTTP to HTTPS in production.
 * No-op in development or behind a TLS-terminating proxy.
 */
function httpsOnly(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Browsers do not follow redirects for preflight requests.
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Set HSTS header (1 year, include subdomains, allow preload list)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Proxy header can include multiple values like "https,http".
  const forwardedProtoHeader = req.headers['x-forwarded-proto'];
  const forwardedProto = typeof forwardedProtoHeader === 'string'
    ? forwardedProtoHeader.split(',')[0].trim()
    : null;

  if (forwardedProto === 'http' && req.headers.host) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  // Direct HTTP connection (no proxy) — redirect.
  if (!req.secure && req.get('host')) {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }

  next();
}

module.exports = httpsOnly;
