const express = require('express');
const crypto = require('crypto');
const logger = require('../utils/logger');

const router = express.Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const ALLOWED_ROLES = new Set(['rider', 'dispatcher', 'retailer']);

function normalizeRole(role) {
  if (typeof role !== 'string') return 'rider';
  const normalized = role.trim().toLowerCase();
  return ALLOWED_ROLES.has(normalized) ? normalized : 'rider';
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

function getCallbackUrl(req) {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  return `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
}

function getStateSecret(clientSecret) {
  return process.env.OAUTH_STATE_SECRET || clientSecret;
}

function encodeState(payload, secret) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(raw).digest('base64url');
  return `${raw}.${sig}`;
}

function decodeState(state, secret) {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    throw new Error('Invalid OAuth state');
  }

  const [raw, sig] = state.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(raw).digest('base64url');
  const expectedSigBuffer = Buffer.from(expectedSig);
  const sigBuffer = Buffer.from(sig);

  if (expectedSigBuffer.length !== sigBuffer.length || !crypto.timingSafeEqual(expectedSigBuffer, sigBuffer)) {
    throw new Error('OAuth state signature mismatch');
  }

  const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid OAuth state payload');
  }

  const maxAgeMs = 10 * 60 * 1000;
  if (!decoded.ts || Date.now() - decoded.ts > maxAgeMs) {
    throw new Error('OAuth state expired');
  }

  return decoded;
}

function redirectToLoginWithError(res, code) {
  const frontendUrl = getFrontendUrl();
  return res.redirect(`${frontendUrl}/login?oauth_error=${encodeURIComponent(code)}`);
}

async function exchangeCodeForToken({ code, clientId, clientSecret, callbackUrl }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchGoogleUser(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`User info fetch failed: ${response.status} ${text}`);
  }

  return response.json();
}

router.get('/google', (req, res) => {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    logger.error('Google OAuth is not configured: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return redirectToLoginWithError(res, 'google_not_configured');
  }

  const callbackUrl = getCallbackUrl(req);
  const role = normalizeRole(req.query.role);
  const stateSecret = getStateSecret(clientSecret);
  const state = encodeState({ role, ts: Date.now() }, stateSecret);

  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online',
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${query.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    logger.error('Google OAuth callback hit without OAuth config');
    return redirectToLoginWithError(res, 'google_not_configured');
  }

  const callbackUrl = getCallbackUrl(req);
  const { code, state, error } = req.query;

  if (error) {
    logger.warn({ error }, 'Google OAuth denied or failed before callback exchange');
    return redirectToLoginWithError(res, 'google_auth_denied');
  }

  if (!code || !state) {
    return redirectToLoginWithError(res, 'google_missing_code');
  }

  try {
    const stateSecret = getStateSecret(clientSecret);
    const decodedState = decodeState(state, stateSecret);
    const selectedRole = normalizeRole(decodedState.role);

    const tokenData = await exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      callbackUrl,
    });

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('Missing access token from Google token response');
    }

    const profile = await fetchGoogleUser(accessToken);
    const authPayload = {
      token: `google-${crypto.randomBytes(24).toString('hex')}`,
      user: {
        id: profile.sub || profile.email,
        name: profile.name || 'Google User',
        email: profile.email,
        role: selectedRole,
      },
      riderProfile: selectedRole === 'rider'
        ? {
            vehicle_type: 'Motorcycle',
            phone: '',
          }
        : null,
    };

    const frontendUrl = getFrontendUrl();
    const data = encodeURIComponent(JSON.stringify(authPayload));
    return res.redirect(`${frontendUrl}/auth/google/callback?data=${data}`);
  } catch (err) {
    logger.error({ err: err.message }, 'Google OAuth callback failed');
    return redirectToLoginWithError(res, 'google_callback_failed');
  }
});

module.exports = router;