# StockAI — AI-powered stock analysis platform

Real-time stock analysis, portfolio tracking, AI reports, and PDF export.  
Built with Next.js 14 · Supabase · Stripe · Claude API.

---

## Stack

| Layer       | Tech                        |
|-------------|-----------------------------|
| Frontend    | Next.js 14 (App Router)     |
| Styling     | Tailwind CSS                |
| Auth + DB   | Supabase                    |
| Payments    | Stripe (subscription)       |
| AI          | Anthropic Claude API        |
| Data        | Yahoo Finance (public API)  |
| PDF         | reportlab (Python service)  |
| Mobile      | React Native / Expo (next)  |

---

## Quick start

```bash
# 1. Clone and install
git clone <repo>
cd stockai
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in: Supabase, Stripe, Anthropic keys

# 3. Run development server
npm run dev
# → http://localhost:3000
```

---

## Project structure

```
src/
├── app/
│   ├── dashboard/        # Main dashboard
│   ├── search/           # Stock search + [ticker] detail
│   ├── portfolio/        # Portfolio tracker
│   ├── pricing/          # Pricing plans
│   ├── checkout/         # Stripe checkout
│   ├── signup/           # Auth (signup + login)
│   └── api/
│       ├── stock/[ticker]        # Yahoo Finance + AI analysis
│       ├── ai/market-summary     # Daily AI market brief
│       ├── report/pdf            # PDF generation endpoint
│       ├── stripe/
│       │   ├── create-checkout   # Create Stripe session
│       │   └── webhook           # Handle Stripe events
│       └── auth/
│           ├── callback          # OAuth callback
│           └── signout           # Sign out
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx         # Sidebar + main wrapper
│   └── ui/
│       ├── MetricCard.tsx
│       ├── WatchlistCard.tsx
│       ├── AiSummaryCard.tsx
│       ├── StockReport.tsx
│       ├── PortfolioTable.tsx
│       └── PricingCards.tsx
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client
│       └── server.ts             # Server client
└── types/index.ts
```

---

## Key design decisions

### Zero hallucination architecture
The AI (Claude) **never generates numbers**.  
Flow: `Yahoo Finance → verified data object → Claude reads it → Claude writes only narrative`.  
Every number in the UI has a source citation.

### Supabase schema (run in Supabase SQL editor)
```sql
create table subscriptions (
  user_id           uuid references auth.users primary key,
  status            text default 'trial',
  stripe_customer_id text,
  trial_ends_at     timestamptz default now() + interval '3 days',
  current_period_end timestamptz
);

create table positions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users,
  ticker     text not null,
  shares     numeric not null,
  avg_cost   numeric not null,
  created_at timestamptz default now()
);

create table watchlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users,
  ticker     text not null,
  added_at   timestamptz default now()
);
```

### Stripe setup
1. Create products in Stripe dashboard: Pro Monthly ($19) and Pro Annual ($149)
2. Copy price IDs to `.env.local`
3. Set up webhook pointing to `/api/stripe/webhook`
4. Events to listen: `checkout.session.completed`, `customer.subscription.deleted`

---

## Next steps

- [ ] React Native / Expo mobile app (shared logic)
- [ ] PDF generation via Python reportlab microservice
- [ ] Price alerts (Supabase Edge Functions + cron)
- [ ] Portfolio chart (Recharts)
- [ ] Branding — logo + name TBD

---

## Notes
- Logo and app name: **TBD** — placeholder "StockAI" used throughout
- All financial data from Yahoo Finance public API (no license required for personal use; verify terms for commercial use)
- AI analysis: Claude claude-sonnet-4-20250514 via Anthropic API
