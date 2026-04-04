# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads, Distribution to 150+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons
- **Backend**: FastAPI (server.py + core.py + /routes/)
- **Database**: MongoDB (30+ collections)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google OAuth + reCAPTCHA v2 + Email Verification
- **AI**: OpenAI via Emergent LLM Key (TTS for voice tags, GPT for strategies)
- **Email**: Resend (support@kalmori.org) | **PDF**: reportlab
- **Audio**: pydub + ffmpeg (watermark processing)

## All Completed Features
- Auth (JWT + Google OAuth + reCAPTCHA + Email Verification)
- Subscription tiers (Free/Rise/Pro) with Stripe, plan gating
- Promo Codes & Referral Program
- Analytics Email Reports (weekly/monthly, custom domain kalmori.org)
- Track Editing (12-field form) & Release Calendar
- Collaboration Hub (posts, invites, security-hardened)
- In-App Messaging (file/audio sharing, read receipts, typing indicators)
- Beat Purchase with License Contracts (4-tier: Basic/Premium/Unlimited/Exclusive, digital signature, Stripe checkout, PDF contracts, admin dashboard)
- **Beat Preview Watermark System** (auto-generated "Kalmori" voice tag via OpenAI TTS, overlaid at 15s intervals, preview plays tagged version, purchase delivers clean untagged original)
- Admin Dashboard (users, submissions, beats, royalty import, campaigns, leads, email settings, promo codes, referrals, analytics reports, contracts)
- Client Features (revenue analytics, leaderboard, AI strategy, fan analytics, goals, beat catalog, wallet, 4-tab release wizard, 150+ platforms)
- UI Dark Theme (animated purple/pink gradients)

## All Routes
`/` `/login` `/register` `/select-role` `/verify-email` `/pricing` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/collab-hub` `/messages` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/referrals` `/calendar` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import` `/admin/campaigns` `/admin/leads` `/admin/email-settings` `/admin/promo-codes` `/admin/referrals` `/admin/analytics-reports` `/admin/contracts` `/agreement`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials
- P2: Replace simulated DSP data with real API feeds
