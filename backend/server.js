/**
 * CodeVerse API – runs on Render or locally.
 * Implements POST /ai/chat per docs/BACKEND_AI_CHAT.md.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Health check (Render uses this to know the service is up)
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'codeverse-api',
    ai: openai ? 'openai' : 'mock',
  });
});

/**
 * POST /ai/chat
 * Body: { message: string, context?: string }
 * Response: { reply: string, tokensUsed: number }
 * 402: insufficient tokens (app shows recharge message)
 */
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid "message" in body.' });
    }

    // Optional: validate JWT and load user token balance from DB (see database/schema.sql)
    // const userId = req.user?.id; const balance = await getTokenBalance(userId);
    // if (balance < 100) return res.status(402).json({ message: 'Insufficient tokens.' });

    if (openai) {
      const systemContent =
        context && context.trim()
          ? `You are a friendly programming mentor. The user is learning in this context: ${context.trim()}. Explain clearly and concisely.`
          : 'You are a friendly programming mentor. Explain concepts clearly and concisely. Help with code and interview prep.';

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a reply.";
      const tokensUsed =
        completion.usage?.total_tokens ?? Math.ceil((message.length + reply.length) / 4);

      return res.json({ reply, tokensUsed });
    }

    // No OPENAI_API_KEY: return mock so the app still works
    const mockReply =
      "I'm the CodeVerse AI mentor. Set OPENAI_API_KEY on Render (and redeploy) to enable real AI. Until then, try the articles in the app for learning!";
    res.json({ reply: mockReply, tokensUsed: 50 });
  } catch (err) {
    console.error('/ai/chat error:', err.message);
    if (err.status === 401) {
      return res.status(500).json({ message: 'Invalid OpenAI API key. Check OPENAI_API_KEY.' });
    }
    if (err.status === 429) {
      return res.status(503).json({ message: 'AI is busy. Please try again in a moment.' });
    }
    res.status(500).json({ message: err.message || 'AI request failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`CodeVerse API listening on port ${PORT}`);
});
