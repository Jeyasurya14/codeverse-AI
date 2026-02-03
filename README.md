# CodeVerse – Learn Programming (Mobile App)

A React Native Expo mobile app for learning programming languages with article-style content (basics to advance, W3Schools/GeeksforGeeks style), a separate user dashboard, and an **AI Mentor** with a token system. Built for future expansion (GPT-4.1 / 4o-mini, interview prep, more features).

## Tech stack

- **App:** React Native (Expo SDK 54), TypeScript
- **Navigation:** React Navigation (native stack + bottom tabs)
- **Auth:** Google & GitHub login (OAuth – backend exchange required)
- **Database:** PostgreSQL (schema in `database/schema.sql`)

## Theme

- **Primary:** Blue  
- **Secondary:** Yellow  
- **Background:** Dark blue with neon-style borders and glow on buttons/cards  

## Features

- **Login:** Google or GitHub (mock in-app; plug in your OAuth backend)
- **Onboarding:** Get-started carousel highlighting advantages
- **Home:** Quick access to Programming, AI Mentor, Dashboard, token balance
- **Programming:** Browse languages → view articles (basics to advance)
- **Dashboard:** Profile, AI token usage, recharge entry, learning placeholder
- **AI Mentor:** Chat-style UI; 300 free tokens, then recharge
- **Recharge:** Token packs (Starter 500 / Learner 1500 / Pro 5000 / Unlimited 15000) with prices; payment integration is placeholder

## AI token system

- **Free limit:** 300 tokens per user
- After that, users **recharge** with one of the packs (prices in `src/constants/theme.ts`: `AI_TOKENS.RECHARGE_PACKS`)
- Future: use GPT-4.1 for complex queries and 4o-mini for lighter usage; enforce limits and billing on your backend

## Run the app

```bash
npm install
npm start
```

Then open in Expo Go (scan QR), or run `npm run android` / `npm run ios` for a dev build.

## Configuration

- **API base URL:** Set `EXPO_PUBLIC_API_URL` in your environment (e.g. in `.env`) so the app calls your backend. Used in `src/services/api.ts`. Example: `EXPO_PUBLIC_API_URL=https://api.yourdomain.com`
- **Deep linking:** The app uses the scheme `codeverse`. When the user is logged in, opening `codeverse://recharge` (e.g. from an email or push notification link) navigates to the Recharge tokens screen.

## Backend (your side)

1. **PostgreSQL:** Run `database/schema.sql` to create tables (users, token_usage, programming_languages, articles, user_progress, token_purchases).
2. **Auth:** Implement OAuth with Google and GitHub; exchange the code (and PKCE `code_verifier` if used) on your server and return a JWT. Point the app’s login flow to that backend (see `src/screens/LoginScreen.tsx` and `src/services/api.ts`).
3. **Content:** Populate `programming_languages` and `articles`; add REST or GraphQL endpoints and replace mock data in `src/data/mockContent.ts` with `src/services/api.ts` calls.
4. **AI:** Implement `/ai/chat` (or similar) that checks token balance, calls GPT-4.1/4o-mini, and decrements tokens. Use `src/services/api.ts` from the app.
5. **Payments:** Integrate Stripe (or RevenueCat) for token packs; update `RechargeTokensScreen` and backend to create payment intents and credit tokens on success.

## Project structure

```
src/
  constants/theme.ts    # Colors, spacing, AI token limits & pack prices
  context/              # AuthContext, TokenContext
  components/           # NeonButton, etc.
  screens/              # Login, Onboarding, Home, Dashboard, Programming, Article*, AI Mentor, Recharge
  data/mockContent.ts   # Mock languages & articles (replace with API)
  services/api.ts       # Backend API client (auth, languages, articles, AI, tokens)
  navigation/           # Root stack + tabs
  types/
database/
  schema.sql            # PostgreSQL schema
```

## Adding more features later

- **Interview prep:** Reuse AI Mentor flow with an “Interview mode” prompt and optional token/product for premium prep.
- **GPT-4.1 / 4o-mini:** In your backend, route by intent or message length; deduct tokens per request and optionally offer higher-tier plans with more 4.1 usage.
