# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads, Distribution to 150+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons + Framer Motion
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (20+ collections)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2 + Email Verification
- **AI**: OpenAI GPT-4o via Emergent LLM Key | **Email**: Resend | **PDF**: reportlab

## Subscription Tiers
| Plan | Price | Revenue Share |
|------|-------|---------------|
| Free | $0 | 20% taken |
| Rise | $9.99/mo | 10% taken |
| Pro | $19.99/mo | 0% (keep 100%) |

## All Completed Features

### Core Auth & Emails
- JWT + Google OAuth + reCAPTCHA + Email Verification
- Welcome emails, Admin sign-up notifications

### Email Domain Management
- Admin page for custom Resend domain configuration

### Subscription & Plan Gating
- 3-tier system with Stripe checkout, sidebar feature gating

### Promo Code / Discount System
- Admin CRUD: create codes with % or $ discount, plan targeting, expiry, max uses, duration
- Public validation endpoint, pricing page integration

### Referral Program (Apr 2026)
- Users get unique referral code + shareable link
- Registration detects ?ref=CODE and completes referral after signup
- Both referrer and new user get a free month of Rise
- Referrer notification on successful referral
- User-facing /referrals page with stats, copy link, share button, referred users list
- Admin /admin/referrals overview with top referrers and recent signups

### Track Editing
- Full edit form on Release Detail page with 12 fields
- PUT /api/tracks/{id} backend endpoint

### Admin Dashboard
- Users, Submissions, Beat Manager, Royalty Import
- Schedules, Reconciliation, Campaigns, Leads
- Email Settings, Promo Codes, Referrals

### Client Features
- Revenue Analytics + Export, Leaderboard, AI Strategy + PDF Export
- Fan Analytics, Goals, Beat catalog, Wallet
- 4-tab Release Wizard, 150+ platforms

### UI/UX Dark Theme
- Animated purple/pink gradients on landing page and all buttons
- Button pairs: filled animated + outline animated border
- Login & Register: blue-to-purple gradient
- Footer KALMORI logo animated, Emergent badge hidden

## All Pages & Routes
`/` `/login` `/register` `/select-role` `/verify-email` `/pricing` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/referrals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import` `/admin/campaigns` `/admin/leads` `/admin/email-settings` `/admin/promo-codes` `/admin/referrals` `/agreement`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials
- P2: Replace simulated DSP data with real API feeds
