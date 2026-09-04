const express = require('express');
const router = express.Router();
const { ValidationError } = require('../utils/errors');
const { answerQuestion } = require('../services/assistantService');

// POST /api/chat — Reflex Assistant: answer a question about the app
router.post('/', (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new ValidationError('Validation failed', ['Message is required']);
    }

    const reply = answerQuestion(message.trim());
    res.json({ message: reply });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
