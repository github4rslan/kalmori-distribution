# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads, Distribution to 150+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons
- **Backend**: FastAPI (server.py + core.py + /routes/)
- **Database**: MongoDB (30+ collections)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google OAuth + reCAPTCHA v2 + Email Verification
- **AI**: OpenAI via Emergent LLM Key (TTS voice tags, GPT strategies)
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
- Beat Purchase with License Contracts (4-tier, digital signature, Stripe checkout, PDF contracts)
- Beat Preview Watermark System (OpenAI TTS voice tag, auto-overlay, clean download post-purchase)
- Producer Royalty Split System (auto-created on license, monthly calculation, wallet credits, admin override)
- **Admin Payout Dashboard** (batch-process payouts, individual status updates, CSV export, search/filter, stats overview, payment history tracking)
- Admin Dashboard (users, submissions, beats, royalty import, campaigns, leads, email settings, promo codes, referrals, analytics reports, contracts, payouts)
- Client Features (revenue analytics, leaderboard, AI strategy, fan analytics, goals, beat catalog, wallet, royalty splits, 4-tab release wizard, 150+ platforms)
- UI Dark Theme (animated purple/pink gradients)

## All Routes
`/` `/login` `/register` `/select-role` `/verify-email` `/pricing` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/collab-hub` `/messages` `/royalty-splits` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/referrals` `/calendar` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import` `/admin/campaigns` `/admin/leads` `/admin/email-settings` `/admin/promo-codes` `/admin/referrals` `/admin/analytics-reports` `/admin/contracts` `/admin/payouts` `/agreement`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials
- P2: Replace simulated DSP data with real API feeds
