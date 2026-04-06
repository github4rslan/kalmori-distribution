# Kalmori — TuneCore Clone / Digital Content Aggregator

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Artist/User management, Release/Track uploads, Distribution store management, Beat/Instrumental catalog, and strict Kalmori white-labeling.

## Product Requirements
- Client Revenue Dashboards, Payout Exports, Admin Royalty Imports
- Subscription tier gating (Free 20% / Rise 5% / Pro 0%)
- Marketing Campaigns, Contract generation, Audio watermarking
- In-App messaging, Admin-only Page Builder
- Role-Based Access (Artist, Producer, Label, Admin)

## Architecture
- Frontend: React + Tailwind CSS + Shadcn/UI
- Backend: FastAPI (Python) with modular route files
- Database: MongoDB (Motor async driver)
- 3rd Party: Stripe, PayPal, Resend, Spotify Web API, OpenAI (Emergent LLM), Emergent Object Storage, Emergent Google Auth

## Modular Backend Route Structure
```
/app/backend/
├── server.py (~2258 lines — auth, releases, tracks, distributions, payments, wallet, collab, calendar, notifications, splits, contracts, purchases, presave, sharing, artist profiles, settings)
├── core.py (DB, models, auth helpers, SUBSCRIPTION_PLANS, check_feature_access)
├── routes/
│   ├── analytics_routes.py (analytics overview, release analytics, trending, leaderboard, goals, revenue, CSV import, fan analytics)
│   ├── subscription_routes.py (plans, my-plan, upgrade, checkout, promo codes, referrals)
│   ├── admin_routes.py (admin panel, user management, deletion)
│   ├── ai_routes.py (AI strategies, PDF export, smart insights)
│   ├── beats_routes.py (beat CRUD, marketplace)
│   ├── collab_routes.py (collaboration hub)
│   ├── content_routes.py (content management)
│   ├── email_routes.py (email sending, weekly digest)
│   ├── label_routes.py (label management)
│   ├── messages_routes.py (in-app messaging)
│   ├── page_builder_routes.py (drag-and-drop page builder)
│   ├── payouts_routes.py (payout processing)
│   ├── paypal_routes.py (PayPal integration)
│   ├── royalty_routes.py (royalty management)
│   └── spotify_routes.py (Spotify integration)
```

## Subscription Plans
| Plan | Price | Revenue Share | Release Types | Key Features |
|------|-------|--------------|---------------|-------------|
| Free | $0 | 20% to Kalmori | Unlimited (Singles, EPs, Albums) | Basic analytics, 150+ platforms, ISRC codes |
| Rise | $24.99/release | 5% to Kalmori | Singles only | Advanced analytics, Fan Analytics, Messaging, Beat Marketplace, Goals |
| Pro | $49.99/month | 0% (keep 100%) | All types | AI Strategy, Revenue Exports, YouTube Content ID, Spotify Canvas, Pre-Save, Collabs, Royalty Splits |

## What's Been Implemented
- Authentication (JWT + Google OAuth) with role selection (Artist/Producer/Label)
- Full release/track upload wizard with object storage
- Distribution to 150+ stores (simulated DSP data, real Spotify API)
- Beat marketplace with contracts and purchases
- Stripe + PayPal payment processing
- AI Release Strategy (OpenAI via Emergent LLM)
- Revenue Analytics & Royalty Calculator with PDF/CSV export
- Fan Analytics, Release Leaderboard, Goal Tracking
- Admin dashboard (user mgmt, royalty imports, feature announcements, notification bank)
- In-app messaging, Collaboration hub
- Drag-and-drop Page Builder (admin)
- FAQ page, Pricing page with promo code support
- Referral program
- Cookie consent, Artist public profiles with QR codes
- Weekly digest emails via Resend

## Completed Refactoring (2026-04-06)
- Extracted analytics/goals/revenue/fan-analytics from server.py → analytics_routes.py
- Extracted subscriptions/promo-codes/referrals from server.py → subscription_routes.py
- Moved SUBSCRIPTION_PLANS and check_feature_access to core.py
- server.py reduced from 3550 to 2258 lines
- Iteration 72: 100% pass rate (32 backend, 14 frontend)

## Remaining Backlog
- P1: Apple Music Analytics API OAuth integration (pending user credentials)
- P2: YouTube Music / other DSP integrations
- P3: Replace remaining simulated DSP data with real API feeds
