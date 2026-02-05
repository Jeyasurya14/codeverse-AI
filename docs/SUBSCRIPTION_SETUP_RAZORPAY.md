# Monthly subscription setup (Razorpay – India)

Production-grade monthly subscriptions for CodeVerse using **Razorpay** (India): recurring billing, webhook signature verification, and idempotent event handling.

---

## 1. Razorpay account and API keys

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. **API Keys**: Settings → API Keys → Generate Key. Copy **Key ID** and **Key Secret**.
3. Use **Test Mode** for development; switch to **Live** for production.

---

## 2. Create subscription plans in Razorpay

Plans define price and billing interval. Create one plan per tier (monthly).

1. In Dashboard: **Subscriptions** → **Plans** → **Create Plan**.
2. Create four plans (or fewer if you don’t offer all tiers):

| Plan name  | Billing | Amount (INR) | Copy Plan ID   |
|------------|---------|--------------|----------------|
| Starter    | Monthly | 199          | `plan_xxxx`    |
| Learner    | Monthly | 499          | `plan_xxxx`    |
| Pro        | Monthly | 999          | `plan_xxxx`    |
| Unlimited  | Monthly | 1999         | `plan_xxxx`    |

3. Set **Billing cycle** to **Monthly**.
4. After creating each plan, copy the **Plan ID** (e.g. `plan_xxxxxxxxxxxx`).

---

## 3. Backend environment variables

Add to your backend `.env` (and to your host’s env, e.g. Render):

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxx          # or rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Plan IDs from Dashboard (Subscriptions → Plans)
RAZORPAY_PLAN_STARTER=plan_xxxx
RAZORPAY_PLAN_LEARNER=plan_xxxx
RAZORPAY_PLAN_PRO=plan_xxxx
RAZORPAY_PLAN_UNLIMITED=plan_xxxx
```

- **RAZORPAY_WEBHOOK_SECRET**: Set in step 4 when configuring the webhook.

---

## 4. Webhook in Razorpay Dashboard

1. **Settings** → **Webhooks** → **Add New Webhook**.
2. **URL**: `https://your-backend-domain.com/api/webhooks/razorpay`  
   (must be HTTPS in production).
3. **Secret**: Generate or set a strong secret; put the same value in `RAZORPAY_WEBHOOK_SECRET`.
4. **Events**: Subscribe at least to:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.halted` (optional)
5. Save. Razorpay will send a test event; your backend should respond `200 OK`.

---

## 5. Database migration

Run the subscription migration so the backend can store subscriptions and webhook idempotency:

```bash
psql "$DATABASE_URL" -f database/migration_subscriptions_razorpay.sql
```

This creates (if not exists):

- `users.razorpay_customer_id` (optional)
- `subscriptions` table (Razorpay subscription ↔ user and plan)
- `subscription_webhook_events` table (idempotency for webhooks)

---

## 6. Backend behaviour (production-grade)

- **Webhook**
  - Uses **raw body** for signature verification (no JSON parsing before HMAC).
  - Verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` (HMAC-SHA256).
  - Rejects invalid/missing signature with `400`.
  - Inserts event id into `subscription_webhook_events`; **duplicate events are ignored** (idempotent).
- **Subscription state**
  - On `subscription.activated` / `subscription.charged`: updates `subscriptions` and sets `users.subscription_plan` to the plan tied to that Razorpay plan.
  - On `subscription.cancelled` / `subscription.completed` / `subscription.halted`: updates subscription row and, when appropriate, sets user back to `free` (e.g. when cancelled or past period end).
- **Create subscription**
  - `POST /api/subscription/create` (Bearer token) with body `{ "planId": "starter" | "learner" | "pro" | "unlimited" }`.
  - Creates or reuses Razorpay customer (by user email), creates subscription with `notes.user_id = userId`.
  - Returns `subscriptionId`, `shortUrl` (open in browser/WebView to pay).

---

## 7. API summary

| Method | Endpoint                      | Auth | Description |
|--------|-------------------------------|------|-------------|
| GET    | `/api/subscription/plans`     | No   | List plans (prices, limits, `enabled` per plan). |
| POST   | `/api/subscription/create`   | Yes  | Create subscription; body `{ "planId": "starter" }`. Returns `shortUrl` to complete payment. |
| POST   | `/api/webhooks/razorpay`     | No*  | Razorpay webhook (raw body; verified by signature). |

\* Secured by webhook secret and signature, not Bearer.

---

## 8. App flow (high level)

1. User chooses a plan (e.g. from Recharge or Settings).
2. App calls `POST /api/subscription/create` with `planId` and Bearer token.
3. Backend creates Razorpay subscription and returns `shortUrl`.
4. App opens `shortUrl` in browser or WebView (user pays with UPI/card/etc.).
5. Razorpay sends webhooks; backend updates `subscriptions` and `users.subscription_plan`.
6. App can refetch user profile or `/tokens/usage` to see updated plan/limits.

---

## 9. Production checklist

- [ ] Razorpay account in **Live** mode for production.
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and all `RAZORPAY_PLAN_*` set in production env.
- [ ] `RAZORPAY_WEBHOOK_SECRET` set and webhook URL **HTTPS** and reachable.
- [ ] Migration `migration_subscriptions_razorpay.sql` applied to production DB.
- [ ] Webhook events subscribed: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`.
- [ ] App opens `shortUrl` over HTTPS (or in-app browser) so payment page loads and redirects correctly.

---

## 10. Testing (test mode)

1. Use **Test** API keys and **Test** plans in Razorpay.
2. Use Razorpay test cards (e.g. `4111 1111 1111 1111`) or test UPI.
3. Expose webhook URL via ngrok or similar: `https://xxxx.ngrok.io/api/webhooks/razorpay`, and set it (and the same secret) in Dashboard.
4. Create a subscription from the app and complete payment; confirm webhook is received and user’s `subscription_plan` and `subscriptions` row update correctly.
