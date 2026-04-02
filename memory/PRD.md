# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Core requirements include Authentication, Subscriptions (Stripe/PayPal), Object Storage for high-res files, AI Features, Artist/User management, Release/Track uploads (with a Wizard), Distribution store management, and a Beat/Instrumental catalog for leasing and purchasing. The frontend must match the user's existing "Kalmori" React Native Expo app UI with a dark, premium aesthetic.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB
- **Storage**: Emergent Object Storage
- **Payments**: Stripe + PayPal
- **Auth**: JWT (Cookie + Bearer) + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI via Emergent LLM Key

## Completed Features

### Phase 1 - Core Platform (Complete)
- [x] JWT + Google Auth with reCAPTCHA v2 registration
- [x] User/Artist management (Legal Name, Stage Name, Country)
- [x] Admin Dashboard with role-based access
- [x] Dark premium UI matching Kalmori mobile app
- [x] Responsive design (mobile + desktop)
- [x] Back navigation on all pages

### Phase 2 - Content & Distribution (Complete)
- [x] 5-step Release Wizard (metadata, tracks, stores, pricing, review)
- [x] Track upload with Object Storage
- [x] Distribution store management
- [x] Spotify Canvas & Content ID pages
- [x] Release detail & management pages

### Phase 3 - Commerce & Payments (Complete)
- [x] Subscription plans (Free/Rising Star/Pro/Label) with Stripe checkout
- [x] Subscription upgrade/downgrade flows
- [x] Beat/Instrumental catalog with CRUD + Object Storage
- [x] Admin Beat Manager (upload, edit, delete beats)
- [x] Featured Beats carousel on Landing Page
- [x] Beat Purchase Checkout (Stripe) with 4 license tiers
- [x] Beat download delivery after purchase
- [x] "My Purchases" page with download buttons
- [x] Wallet system

### Phase 4 - Analytics & Insights (Complete)
- [x] Real-time Streaming Data Ingestion (simulated DSP data from 8 platforms, 14 countries)
- [x] Analytics Overview with real charts (Streams Over Time, Revenue Over Time)
- [x] Platform Breakdown (Spotify, Apple Music, YouTube Music, Amazon Music, TikTok, Tidal, Deezer, SoundCloud)
- [x] Live Streaming Feed tab showing recent events with platform colors & country flags
- [x] AI-powered analytics insights
- [x] Trending This Week analytics on Dashboard
- [x] Audience Map tab

### Phase 5 - Notifications & Communication (Complete)
- [x] Push Notifications system (notification bell with unread count in header)
- [x] Notification dropdown panel with mark-read functionality
- [x] Polling for new notifications (30s interval)
- [x] Email receipt structure (Resend integration ready - MOCKED without API key)
- [x] Beat purchase receipt email templates
- [x] Subscription receipt email templates

### Phase 6 - Backend Architecture (Complete)
- [x] Backend modularization (server.py → core.py + /routes/)
- [x] Reduced server.py from 1686 to ~1000 lines
- [x] Shared Pydantic models in core.py
- [x] Route modules: ai_routes, email_routes, paypal_routes, content_routes, beats_routes

## Key DB Collections
- `users`: {email, password_hash, role, artist_name, plan}
- `releases`: {title, status, tracks, artist_id}
- `tracks`: {title, audio_url}
- `beats`: {title, genre, bpm, key, mood, audio_url, cover_url, prices}
- `beat_purchases`: {user_id, beat_id, license_type, amount, payment_status, session_id}
- `stream_events`: {artist_id, release_id, platform, country, revenue, timestamp}
- `notifications`: {user_id, message, read, created_at}
- `receipts`: {user_id, email, type, amount, details}
- `wallets`: {user_id, balance}

## Key API Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Beats: `/api/beats` (CRUD), `/api/beats/{id}/stream`
- Purchases: `/api/purchases`, `/api/purchases/{id}/download`, `/api/purchases/verify/{session_id}`
- Payments: `/api/payments/create-subscription-checkout`, `/api/payments/create-beat-checkout`
- Analytics: `/api/analytics/overview`, `/api/analytics/chart-data`, `/api/analytics/platform-breakdown`, `/api/analytics/live-feed`
- Notifications: `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/read-all`
- Releases: `/api/releases`, Release Wizard flow

## 3rd Party Integrations
- Stripe (Payments) — System Environment Key
- PayPal (Payments) — User API Key
- Google reCAPTCHA v2 — User-provided keys
- OpenAI (AI Features) — Emergent LLM Key
- Emergent Object Storage — Emergent Integrations
- Emergent Google Auth — Emergent Integrations
- Resend (Email) — MOCKED (ready for user's RESEND_API_KEY)

## Remaining Backlog

### P2 (Medium Priority)
- [ ] Complete Resend API configuration (needs user's RESEND_API_KEY for actual dispatch)

### P3 (Low Priority)
- [ ] Artist Collaboration features (invite collaborators, shared royalty splits)
- [ ] Real DSP data ingestion (replace simulated data with actual API feeds)
- [ ] Advanced push notification preferences
