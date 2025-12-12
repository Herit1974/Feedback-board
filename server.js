// server.js — Feedback Board (improved logging, validation, health, graceful shutdown)
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory store (resets when container restarts)
const feedback = [
  { id: 1, name: 'System', message: 'Welcome to the Feedback Board!' }
];

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request-logging middleware — prints timestamp, method, path, and (trimmed) body
app.use((req, res, next) => {
  // Prepare a small, safe body preview for logs
  let bodyPreview = '';
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      // truncate long values to avoid huge logs
      const safeBody = {};
      Object.keys(req.body).forEach(k => {
        let v = req.body[k];
        if (typeof v === 'string') {
          v = v.length > 200 ? v.slice(0, 200) + '...<truncated>' : v;
        }
        safeBody[k] = v;
      });
      bodyPreview = JSON.stringify(safeBody);
    }
  } catch (e) {
    bodyPreview = '[unserializable]';
  }

  console.log(`${new Date().toISOString()} ${req.ip} ${req.method} ${req.originalUrl} ${bodyPreview}`);
  next();
});

// --- Routes ---

// Health check (useful for readiness/liveness probes)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get all feedback
app.get('/api/feedback', (req, res) => {
  res.json({ feedback });
});

// Add new feedback
app.post('/api/feedback', (req, res) => {
  const rawName = (req.body && req.body.name) ? String(req.body.name) : '';
  const rawMessage = (req.body && req.body.message) ? String(req.body.message) : '';

  const name = rawName.trim().slice(0, 100);       // max 100 chars
  const message = rawMessage.trim().slice(0, 1000); // max 1000 chars

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const newItem = {
    id: feedback.length + 1,
    name,
    message,
    createdAt: new Date().toISOString()
  };
  feedback.push(newItem);

  // Log the saved item (short)
  console.log(`${new Date().toISOString()} Saved feedback id=${newItem.id} name="${newItem.name}"`);

  res.status(201).json(newItem);
});

// Fallback — serve index.html for any other route (SPA-friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
const server = app.listen(PORT, () => {
  console.log(`Feedback Board app listening on port ${PORT}`);
});

// Graceful shutdown for container stop/restart
function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
  // Force exit after 10s if not closed
  setTimeout(() => {
    console.error('Forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
