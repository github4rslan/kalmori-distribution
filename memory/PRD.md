# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads with a professional Wizard, Distribution to 37+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (15+ collections)
- **Storage**: Emergent Object Storage
- **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Email**: Resend (configured)
- **PDF**: reportlab

## All Completed Features

### Core Platform
- JWT + Google Auth + reCAPTCHA v2, Admin Dashboard, Responsive dark premium UI

### Content & Distribution
- Professional 4-tab Release Wizard, UPC auto-generation, Spotify Canvas, Content ID

### Commerce & Payments
- Stripe subscriptions (4 tiers) + upgrade/downgrade, Beat catalog + Object Storage
- Beat Purchase (4 license tiers), Download delivery, My Purchases, Wallet

### Analytics & Insights
- DSP simulation engine (8 platforms, 14 countries), Streaming Feed, CSV import, Share Your Stats

### Fan Analytics Dashboard
- Listener Growth, Top Countries, Platform Engagement, Peak Hours, Pre-save tracking

### AI Release Strategy + Save & Compare + PDF Export
- GPT-4o powered recommendations, save/compare side-by-side, branded PDF one-pager

### AI-Powered Smart Notifications
- 7-day trend analysis, categorized insights, lightning bolt badges in notification bell

### Automated Weekly Digest Emails
- Branded HTML email with stats, AI insights, releases. Preview modal, Send Now, Settings toggle

### Revenue Analytics & Royalty Calculator (Apr 2026)
- 4 summary cards: Gross Revenue, Platform Fee, Net Revenue, Your Take
- Monthly Revenue Trend area chart (6 months)
- Earnings by Platform: horizontal bar chart + detailed table (streams, rate, gross, net per platform)
- Platform rates: Spotify $0.004, Apple Music $0.008, YouTube $0.002, Amazon $0.004, Tidal $0.012, Deezer $0.003, Pandora $0.002, SoundCloud $0.003
- Collaborator Royalty Splits section (pulls from accepted collaborations)
- What-If Revenue Calculator: input stream count + custom platform mix, shows projected earnings
- Per-Stream Rate Guide for 8 platforms
- Plan-aware fee deduction (free=15%, rise/pro=0%)

### Notifications & Communication
- 9 notification preferences (email + push + weekly digest)

### Collaborations, Beat Search/Filter, Social Sharing, Pre-Save Campaigns
- All fully implemented

## All Pages & Routes
`/` `/login` `/register` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/settings` `/presave/:id` `/spotify-canvas` `/content-id` `/admin/*`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (placeholder ready)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
