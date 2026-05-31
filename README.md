# SellerPilot — Meesho Seller Analytics & P&L

Next.js SaaS for Meesho sellers: upload settlement CSV, calculate real profit/loss, SKU analytics, returns & RTO tracking.

## Stack

| Layer | Service |
|-------|---------|
| **Database** | **MongoDB Atlas** (free M0) + Mongoose |
| **Hosting** | Vercel |
| **Files (CSV)** | Vercel Blob |
| **Auth** | NextAuth (Google + Email) |
| **Payments** | Razorpay |

## Quick start

### 1. MongoDB Atlas (free)

1. https://www.mongodb.com/cloud/atlas → Create cluster (M0 free)
2. Database Access → user + password
3. Network Access → Allow `0.0.0.0/0` (dev) or Vercel IPs
4. Connect → copy connection string

### 2. `.env` file

```bash
cp .env.example .env
```

**Full credential guide (Gujarati + English):** see **[ENV_SETUP.md](./ENV_SETUP.md)** — MongoDB, Google, Razorpay, Resend, OpenAI, Twilio, Cron, QStash, Blob — step by step.

```env
MONGODB_URI="mongodb+srv://USER:PASS@cluster.mongodb.net/sellerpilot?retryWrites=true&w=majority"
AUTH_SECRET="your-32-char-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

### 3. Install & run

```bash
npm install
npm run db:seed
npm run dev
```

Open http://localhost:3000

### 4. Admin user

1. Register on the app  
2. Set `ADMIN_EMAIL=your@email.com` in `.env`  
3. `npm run db:seed`  
4. Log out & log in → **Admin** in sidebar  

## Deploy on Vercel

1. Push to GitHub → Import on Vercel  
2. Env vars: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`  
3. Enable Vercel Blob in Storage  
4. Deploy  

## Project structure

```
src/
  models/       # Mongoose schemas (User, Report, OrderLine, …)
  lib/mongodb.ts
  app/          # Next.js pages & API
scripts/seed.ts
```

## Gujarati — સંક્ષિપ્ત

- **Database:** MongoDB Atlas (free) — PostgreSQL/Neon નહીં  
- **ORM:** Mongoose  
- `.env` માં `MONGODB_URI` ભરો  
- `npm run db:seed` → credit packages  
- Register → CSV upload → dashboard  
- **Phase 4:** Agency (`/dashboard/agency`) + Developer API (`/dashboard/developer`)

## Phase 3 (implemented)

| Feature | How |
|---------|-----|
| **Flipkart / Amazon / Shopsy CSV** | Upload with marketplace selector on Reports |
| **Email reports** | Resend — auto on complete + manual send (1 credit) |
| **WhatsApp** | Twilio API or wa.me share link (1 credit) |
| **OpenAI insights** | Set `OPENAI_API_KEY` — GPT-enhanced analysis |
| **Meesho reminders** | Monthly email cron if no report uploaded |

### Phase 3 env vars

```env
RESEND_API_KEY=re_xxx
EMAIL_FROM="SellerPilot <you@yourdomain.com>"
OPENAI_API_KEY=sk-xxx
CRON_SECRET=random-secret
APP_URL=https://your-app.vercel.app
```

Vercel Cron runs `/api/cron/reminders` daily at 6 AM UTC.

## Phase 4 (implemented)

| Feature | How |
|---------|-----|
| **Agency multi-store** | `/dashboard/agency` — create org, add up to 25 stores, combined P&L |
| **Store-tagged uploads** | Reports page → pick client store when in an agency |
| **REST API** | `/dashboard/developer` — API keys, `POST/GET /api/v1/reports`, `GET /api/v1/account` |
| **Weekly digest email** | Settings → weekly digest; cron Mondays 7 AM UTC |

### API usage

```bash
# Create key in Developer page, then:
curl -H "Authorization: Bearer sp_live_xxx" https://your-app.vercel.app/api/v1/account
```

Vercel Cron also runs `/api/cron/weekly-digest` on Mondays.

## Phase 5 (implemented)

| Feature | How |
|---------|-----|
| **State-wise orders map** | CSV with `State` or `Pincode` → `/dashboard/states` — hover map shows order count & revenue |
| **Full report page** | `/dashboard/reports/[id]` — P&L, map, SKU, orders, AI |
| **Demo report (free)** | `/demo-report` — no login/credits; preview before purchase |
| **Report picker** | Analytics, SKU, Returns, RTO, States — switch reports |
| **Sample CSV** | `/sample-meesho.csv` — 30 orders across 20+ states |

### Gujarati — State map

- Excel/CSV ma **State** ke **Pincode** column hovo joy
- Map par state hover karo → ketla orders & revenue te state na
- Demo: `/demo-report` (purchase vagar joi shakay)

## License

Private — SellerPilot
