# SellerPilot — Environment Setup Guide (ENV Setup)

**Gujarati:** નીચે દરેક variable માટે **ક્યાંથી મેળવવું** અને **કેવી રીતે `.env` માં મૂકવું** — step-by-step.

**English:** Step-by-step instructions for every credential used in this project.

---

## Quick start

```bash
cp .env.example .env
# Fill REQUIRED section first, then optional services
npm install
npm run db:seed
npm run dev
```

---

## 1. MONGODB_URI (Required)

| | |
|---|---|
| **શું છે** | Database — users, reports, payments |
| **Website** | https://www.mongodb.com/cloud/atlas |
| **Free tier** | M0 cluster (512MB) |

### Steps

1. Sign up → **Create deployment** → choose **M0 FREE**.
2. **Database Access** → Add user → username + strong password → save.
3. **Network Access** → **Add IP** → `0.0.0.0/0` (dev) or Vercel IPs (prod).
4. **Database** → **Connect** → **Drivers** → copy connection string.
5. Replace `<password>` with your user password (URL-encode special chars).
6. Paste in `.env`:

```env
MONGODB_URI="mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/sellerpilot?retryWrites=true&w=majority"
```

---

## 2. AUTH_SECRET (Required)

| | |
|---|---|
| **શું છે** | Encrypts login sessions (NextAuth JWT) |
| **Never share** | GitHub, chat, screenshots |

### Generate (Windows PowerShell)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```env
AUTH_SECRET="paste-output-here"
```

Optional separate secret for **refresh JWT** (defaults to `AUTH_SECRET` if omitted):

```env
JWT_REFRESH_SECRET="another-long-random-string"
```

Login issues a **refresh token** (httpOnly cookie). Dashboard and APIs require a valid refresh JWT; session renews via `POST /api/auth/refresh` every ~15 minutes.

---

## 3. AUTH_URL & APP_URL (Required)

| Variable | Local | Production (Vercel) |
|----------|-------|---------------------|
| `AUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| `APP_URL` | same | same |
| `AUTH_TRUST_HOST` | `true` | `true` |

Used for: login redirects, email links, cron callbacks, QStash webhooks.

---

## 4. Google OAuth (Optional)

| | |
|---|---|
| **Website** | https://console.cloud.google.com |
| **Use** | "Continue with Google" on login |

### Steps

1. New project → **APIs & Services** → **Credentials**.
2. **OAuth consent screen** → External → fill app name & email.
3. **Create Credentials** → **OAuth client ID** → **Web application**.
4. **Authorized redirect URIs:**
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`
5. Copy Client ID & Secret:

```env
AUTH_GOOGLE_ID="xxxxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"
```

---

## 5. ADMIN_EMAIL (Recommended)

| | |
|---|---|
| **Use** | Your account becomes ADMIN after seed |

```env
ADMIN_EMAIL="your@gmail.com"
```

Then: register on site with **same email** → run `npm run db:seed` → log out & log in.

---

## 6. BLOB_READ_WRITE_TOKEN (Recommended on Vercel)

| | |
|---|---|
| **Website** | Vercel Dashboard → your project → **Storage** → **Blob** |
| **Use** | Store uploaded CSV files for large reports |

1. Create Blob store → connect to project.
2. Copy **Read-Write token**:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

---

## 7. Razorpay (Payments / buy credits)

| | |
|---|---|
| **Website** | https://dashboard.razorpay.com |
| **Mode** | Test keys for dev, Live keys for production |

1. Sign up → complete KYC for live mode.
2. **Settings** → **API Keys** → Generate test keys.
3. Add to `.env`:

```env
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
```

4. Vercel: add same vars → redeploy.

---

## 8. Resend (Email)

| | |
|---|---|
| **Website** | https://resend.com |
| **Free tier** | 100 emails/day |

1. Sign up → **API Keys** → Create → copy `re_xxx`.
2. **Domains** (optional): verify your domain for production `EMAIL_FROM`.
3. Dev can use: `onboarding@resend.dev`

```env
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="SellerPilot <onboarding@resend.dev>"
```

**Used for:** report ready email, Meesho reminders, weekly digest.

---

## 9. OpenAI (AI Insights — optional)

| | |
|---|---|
| **Website** | https://platform.openai.com/api-keys |

1. Create API key → billing enabled.
2. Add credits on account.

```env
OPENAI_API_KEY="sk-xxxxx"
OPENAI_MODEL="gpt-4o-mini"
```

Without key: rule-based insights still work.

---

## 10. Twilio WhatsApp (optional)

| | |
|---|---|
| **Website** | https://console.twilio.com |
| **Use** | Send WhatsApp report summary |

1. Create account → **Messaging** → try WhatsApp sandbox.
2. Copy Account SID, Auth Token, WhatsApp sender.

```env
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

Without Twilio: app uses **wa.me** share link (no API cost).

---

## 11. CRON_SECRET (Required on production)

| | |
|---|---|
| **Use** | Protects `/api/cron/reminders` and `/api/cron/weekly-digest` |

Generate:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
CRON_SECRET="your-long-random-hex"
```

**Vercel:** add `CRON_SECRET` in Environment Variables. Crons in `vercel.json` run automatically; Vercel sends `Authorization: Bearer <CRON_SECRET>` when configured.

**Local test:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reminders
```

---

## 12. Upstash QStash (optional — large CSV queue)

| | |
|---|---|
| **Website** | https://console.upstash.com → **QStash** |
| **Use** | Background processing for large CSV files |

1. Create QStash → copy **QSTASH_TOKEN**.
2. Copy **Current** and **Next** signing keys.

```env
QSTASH_TOKEN="eyxxxxx"
QSTASH_CURRENT_SIGNING_KEY="sig_xxxxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxxxx"
```

3. Set `APP_URL` to your public URL (QStash calls `/api/jobs/process-report`).

**Production:** `QSTASH_CURRENT_SIGNING_KEY` is **required** (webhook signature verified).

---

## Vercel deployment checklist

Add **all** variables in: Project → **Settings** → **Environment Variables**

| Variable | Production |
|----------|------------|
| MONGODB_URI | ✅ |
| AUTH_SECRET | ✅ |
| AUTH_URL | ✅ your domain |
| APP_URL | ✅ your domain |
| AUTH_TRUST_HOST | true |
| CRON_SECRET | ✅ |
| ADMIN_EMAIL | ✅ |
| BLOB_READ_WRITE_TOKEN | ✅ |
| RESEND_API_KEY | if using email |
| RAZORPAY_* | if using payments |
| Others | as needed |

Then: **Redeploy** after changing env.

---

## Security notes

- Never commit `.env` to Git (only `.env.example` with placeholders).
- Use **different** `AUTH_SECRET` and `CRON_SECRET` per environment.
- In production always set `CRON_SECRET` and QStash signing keys.
- API keys (`sp_live_...`) are shown once — store safely.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MONGODB_URI` not found | Copy `.env.example` → `.env`, fill URI |
| UntrustedHost on login | `AUTH_TRUST_HOST=true`, correct `AUTH_URL` |
| Google login fails | Redirect URI must match exactly |
| Emails not sending | Check `RESEND_API_KEY`, verify domain |
| Cron 401 | Set `CRON_SECRET` on Vercel |
| Payments 503 | Add Razorpay keys |

---

© SellerPilot — update this file when new integrations are added.
