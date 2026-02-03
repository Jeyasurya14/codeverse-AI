# Backend: AI Chat API

The app calls your backend for real AI replies. Implement this so the AI Mentor uses GPT-4 / Claude etc. and token usage is enforced server-side.

## Endpoint

**POST** `/ai/chat`

### Request

- **Headers**
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>` (if user is logged in)
- **Body (JSON)**
  - `message` (string, required): The user’s message.
  - `context` (string, optional): Optional context (e.g. current article title/summary for “Ask about this article”).

### Response (200)

- **Body (JSON)**
  - `reply` (string): The assistant’s reply.
  - `tokensUsed` (number): Tokens consumed for this turn (so the app can deduct from local balance and stay in sync).

### Errors

- **402 Unauthorized** – Insufficient token balance. The app will show “Insufficient tokens. Please recharge to continue.”
- **4xx/5xx** – Any `message` in the JSON body is shown to the user; otherwise a generic error is shown.

## Backend responsibilities

1. **Auth** – Identify the user from `Authorization` (or session) and load their token balance.
2. **Token check** – Before calling the LLM, ensure the user has enough tokens (e.g. reserve a reasonable max per request).
3. **Call LLM** – Call OpenAI, Anthropic, or another provider with `message` (and optionally `context` in the system/user prompt).
4. **Count usage** – Compute tokens used (e.g. from the provider’s usage field).
5. **Deduct and persist** – Deduct `tokensUsed` from the user’s balance in your DB and return `reply` and `tokensUsed` in the response.

## App configuration

Set the backend base URL so the app uses your API instead of the mock:

- **Expo**: In `.env` or app config set `EXPO_PUBLIC_API_URL=https://your-api.com` (no trailing slash).
- If unset or set to the default placeholder, the app uses an in-app mock reply so it still runs without a backend.

## Example (Node/Express)

```js
app.post('/ai/chat', authMiddleware, async (req, res) => {
  const { message, context } = req.body;
  const userId = req.user.id;
  const balance = await getTokenBalance(userId);
  if (balance < 100) {
    return res.status(402).json({ message: 'Insufficient tokens.' });
  }
  const { reply, usage } = await callOpenAI(message, context);
  const tokensUsed = usage.total_tokens;
  await deductTokens(userId, tokensUsed);
  res.json({ reply, tokensUsed });
});
```
