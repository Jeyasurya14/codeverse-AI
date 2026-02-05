# MNC-Grade AI Mentor

The AI Mentor is configured for **top-level, MNC (Multi-National Company) grade** guidance: senior-level expertise, professional tone, and production-ready responses.

---

## What Makes It MNC-Grade

### Backend (OpenAI system prompt)

- **Persona:** Senior software engineer / tech lead with experience at top-tier tech companies (FAANG and global MNCs).
- **Expertise:** Algorithms & data structures, system design, clean code, design patterns, code review, technical interviews, best practices (SOLID, DRY, testing), career growth.
- **Response style:**
  - Concise and actionable; bullets or numbered steps when helpful.
  - Markdown: **bold**, `code`, and fenced ```code blocks``` with language tags.
  - Algorithms: time/space complexity (Big O) when relevant.
  - Design: scale, trade-offs, real-world constraints.
  - Code: clean, maintainable solutions; edge cases and testing when appropriate.
- **Tone:** Professional and encouraging, no filler.
- **Rules:** Same language as the user; short clarifying question if vague; no made-up APIs; structured breakdowns for long topics (e.g. Overview → Approach → Code → Complexity).

### Frontend

- **Title:** "AI Mentor" with subtitle: "Senior-level guidance · Algorithms · System design".
- **Welcome card:** Value proposition and four **suggested prompts** (tap to fill input):
  - Explain time complexity and optimizations
  - Design a rate limiter for a high-traffic API
  - Code review and cleaner patterns
  - Walk through "Design a URL shortener"
- **Placeholder:** "Algorithms, system design, code review..."
- **Loading:** "Preparing response..." and mentor icon (school) for assistant messages.

### API (backend)

- **Model:** `OPENAI_MODEL` from env (default `gpt-4o-mini`). Use `gpt-4o` in `backend/.env` for higher quality.
- **max_tokens:** 1536 for fuller answers.
- **temperature:** 0.6 for consistent, professional output.

---

## How to Use Your OpenAI API Key

1. **Backend only:** Set your key in **`backend/.env`**:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```
2. **Start backend:** `cd backend && npm start`. You should see: `AI Mentor: ready`.
3. **App:** Point `EXPO_PUBLIC_API_URL` to the backend (e.g. `http://localhost:3000` for local dev). Open the app and use the **AI Mentor** tab.

See **`docs/AI_MENTOR_SETUP.md`** for full setup and troubleshooting.

---

## Summary

| Layer    | Change |
|----------|--------|
| Backend  | MNC-grade system prompt, 1536 max_tokens, 0.6 temperature, optional context hint |
| Frontend | Title "AI Mentor", subtitle, suggested prompts, professional copy and loading text |
| API key  | Used only in `backend/.env`; frontend never sees it |

The mentor is designed to feel like a senior engineer at a top tech company: precise, structured, and production-oriented.
