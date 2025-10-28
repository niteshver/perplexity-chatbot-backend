const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Chat API route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'API key not set' });
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI.' },
      ...history,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'API error', details: errorText });
    }
    const data = await response.json();
    const botReply = data.choices[0].message.content;
    res.json({ response: botReply });
  } catch (err) {
    res.status(500).json({ error: 'Error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
