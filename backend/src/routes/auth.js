const express = require('express');

const router = express.Router();

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

router.get('/google', (req, res) => {
  const frontendUrl = getFrontendUrl();
  const demoUser = {
    token: `demo-token-google-${Date.now()}`,
    user: {
      id: 'google-demo-user',
      name: 'Google User',
      email: 'demo@reflex.co.ke',
      role: 'rider',
    },
    riderProfile: {
      vehicle_type: 'Motorcycle',
      phone: '+254712345678',
    },
  };

  const data = encodeURIComponent(JSON.stringify(demoUser));
  res.redirect(`${frontendUrl}/auth/google/callback?data=${data}`);
});

router.get('/google/callback', (req, res) => {
  const frontendUrl = getFrontendUrl();
  const { data } = req.query;

  if (data) {
    return res.redirect(`${frontendUrl}/auth/google/callback?data=${data}`);
  }

  return res.redirect(`${frontendUrl}/login`);
});

module.exports = router;