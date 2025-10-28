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
  res.send('Backend running');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], type = 'text' } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });
    if (!process.env.PERPLEXITY_API_KEY) return res.status(500).json({ error: 'API key not set' });

    if (type === 'image') {
      // Call Perplexity Image Generation API
      const imageResponse = await fetch('https://api.perplexity.ai/image/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: message,
          n: 1,
          size: "1024x1024"
        })
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        return res.status(500).json({ error: 'Image API error', details: errorText });
      }

      const imageData = await imageResponse.json();
      // Assuming response structure contains 'data' array with objects having 'url'
      const imageUrl = imageData.data && imageData.data[0] && imageData.data[0].url;

      if (!imageUrl) {
        return res.status(500).json({ error: 'Invalid image response from API' });
      }

      return res.json({ type: 'image', imageUrl });
    }

    // Default to text chat
    const messages = [
      { role: 'system', content: 'You are a helpful AI.' },
      ...history,
      { role: 'user', content: message }
    ];

    const textResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Sonar Deep Research',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      return res.status(500).json({ error: 'Text API error', details: errorText });
    }

    const data = await textResponse.json();
    const botReply = data.choices[0].message.content;
    res.json({ type: 'text', response: botReply });

  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
