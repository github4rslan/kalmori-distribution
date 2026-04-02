# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Core requirements include Authentication, Subscriptions (Stripe/PayPal), Object Storage for high-res files, AI Features, Artist/User management, Release/Track uploads (with a Wizard), Distribution store management, and a Beat/Instrumental catalog for leasing and purchasing. The frontend must match the user's existing "Kalmori" React Native Expo app UI with a dark, premium aesthetic.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB
- **Storage**: Emergent Object Storage
- **Payments**: Stripe + PayPal
- **Auth**: JWT (Cookie + Bearer) + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI via Emergent LLM Key
- **Email**: Resend (configured with real API key)

## Completed Features

### Phase 1 - Core Platform
- [x] JWT + Google Auth with reCAPTCHA v2
- [x] User/Artist management, Admin Dashboard
- [x] Dark premium UI, Responsive design

### Phase 2 - Content & Distribution
- [x] **Professional 4-Tab Release Wizard** (General Info, Tracks & Assets, Territory & Platform Rights, Summary)
- [x] 26 distributed platforms + 11 not-distributed platforms with colored icons
- [x] UPC auto-generation, Copyright/Production lines, Compilation support
- [x] Volume management for multi-disc releases
- [x] Cover Art + Booklet uploads
- [x] Territory & rights confirmation (Yes/No)
- [x] Summary with "missing item" validation badges
- [x] Spotify Canvas & Content ID pages

### Phase 3 - Commerce & Payments
- [x] Stripe subscription plans + upgrade/downgrade
- [x] Beat/Instrumental catalog with Object Storage
- [x] Beat Purchase Checkout (4 license tiers)
- [x] Beat download delivery + My Purchases page
- [x] Wallet system

### Phase 4 - Analytics & Insights
- [x] Real-time Streaming Data from 8 DSPs, 14 countries
- [x] Live Streaming Feed, Platform Breakdown
- [x] AI-powered insights, CSV data import
- [x] Share Your Stats social cards with milestones

### Phase 5 - Notifications & Communication
- [x] Push Notifications (bell + dropdown + polling)
- [x] 8 notification preferences (email + push toggles)
- [x] Resend email receipts (beat + subscription templates)

### Phase 6 - Collaborations
- [x] Collaborator invite system, Accept/Decline
- [x] Royalty split management per release
- [x] Email + in-app notifications for invitations

### Phase 7 - Backend Architecture
- [x] Modularized: server.py + core.py + /routes/ (ai, email, paypal, content, beats, collab)

## Key DB Collections
- `users`, `releases`, `tracks`, `beats`, `beat_purchases`
- `stream_events`, `notifications`, `notification_preferences`
- `collaborations`, `receipts`, `wallets`, `subscriptions`

## Key API Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`
- Releases: `/api/releases`, `/api/tracks`, `/api/distributions/submit/{id}`
- Beats: `/api/beats`, `/api/beats/{id}/stream`
- Purchases: `/api/purchases`, `/api/purchases/{id}/download`
- Payments: `/api/payments/create-subscription-checkout`, `/api/payments/create-beat-checkout`
- Analytics: `/api/analytics/overview`, `/api/analytics/chart-data`, `/api/analytics/platform-breakdown`, `/api/analytics/live-feed`, `/api/analytics/import`
- Stats: `/api/stats/milestones`, `/api/stats/share-card`
- Notifications: `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/read-all`
- Settings: `/api/settings/notification-preferences`
- Collaborations: `/api/collaborations`, `/api/collaborations/invite`, `/api/collaborations/{id}/accept`

## 3rd Party Integrations
- Stripe, PayPal, Google reCAPTCHA v2, OpenAI (Emergent LLM Key), Emergent Object Storage, Emergent Google Auth, Resend (real API key)

## Remaining Backlog
- [ ] Real DSP API integration (replace simulated data)
- [ ] Advanced beat catalog search/filter
- [ ] Social sharing deep links
