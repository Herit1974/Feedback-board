const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store (resets when container restarts)
const feedback = [
  { id: 1, name: 'System', message: 'Welcome to the Feedback Board!' }
];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: get all feedback
app.get('/api/feedback', (req, res) => {
  res.json({ feedback });
});

// API: add new feedback
app.post('/api/feedback', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  const newItem = {
    id: feedback.length + 1,
    name,
    message
  };
  feedback.push(newItem);
  res.status(201).json(newItem);
});

// Fallback: serve index.html for root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Feedback Board app listening on port ${PORT}`);
});
