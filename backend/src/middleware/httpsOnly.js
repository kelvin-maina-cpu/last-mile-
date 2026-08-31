/**
 * Redirect HTTP to HTTPS in production.
 * No-op in development or behind a TLS-terminating proxy.
 */
function httpsOnly(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Set HSTS header (1 year, include subdomains, allow preload list)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // If behind a proxy that terminates TLS (e.g. nginx, Cloudflare, ALB),
  // req.protocol will already be 'https' — skip the redirect.
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  // Direct HTTP connection (no proxy) — redirect
  if (!req.secure && req.get('host')) {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }

  next();
}

module.exports = httpsOnly;
