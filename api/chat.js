const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/', (req, res) => {
  res.send('Proxy backend running');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], type = 'text' } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    const BACKEND_URL = 'https://perplexity-chatbot-backend-git-main-niteshs-projects-f6f9f7c7.vercel.app/api/chat';

    // Forward request to your actual backend URL
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, type })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from backend URL:', errorText);
      return res.status(500).json({ error: 'Upstream backend failure', details: errorText });
    }

    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error('Error in proxy /api/chat:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
