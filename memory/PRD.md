# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads with a professional Wizard, Distribution to 37+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (15+ collections including saved_strategies)
- **Storage**: Emergent Object Storage
- **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Email**: Resend (configured)
- **PDF**: reportlab (server-side PDF generation)

## All Completed Features

### Core Platform
- JWT + Google Auth + reCAPTCHA v2, Admin Dashboard, Responsive dark premium UI

### Content & Distribution
- Professional 4-tab Release Wizard (General Info, Tracks & Assets, Territory with 37 platforms, Summary)
- UPC auto-generation, Copyright/Production lines, Booklet uploads, Volume management
- Spotify Canvas, Content ID pages

### Commerce & Payments
- Stripe subscriptions (4 tiers) + upgrade/downgrade, Beat catalog + Object Storage
- Beat Purchase (4 license tiers), Download delivery, My Purchases page, Wallet system

### Analytics & Insights
- Realistic DSP simulation engine (8 platforms, 14 countries, peak hours, growth curves)
- Live Streaming Feed, Platform Breakdown, AI-powered insights, CSV import
- Share Your Stats social cards with milestone tracking

### Fan Analytics Dashboard
- Listener Growth chart (30 days), Top Listener Countries with flag emojis
- Platform Engagement donut chart, Peak Listening Hours bar chart
- Pre-save subscriber tracking, campaign analytics

### AI Release Strategy
- AI-powered release strategy recommendations using GPT-4o
- Analyzes geography, peak hours, platform engagement, pre-save subs
- Returns: optimal day/time, platform tactics, geographic targeting, timeline, tips
- Fallback strategy when AI unavailable

### Save & Compare Strategies
- Save strategies with custom labels, view/delete in scrollable panel
- Compare mode: select 2 strategies for side-by-side analysis
- Compares: Best Day, Time, Streams, Platform, Country, First Week, Priorities, Timeline

### Strategy Export to PDF
- Server-side PDF generation with Kalmori branding via reportlab
- Sections: release window, platform strategy, geographic targeting, timeline, tips
- Export from current results or saved strategy cards
- Filename: Kalmori_Strategy_{label}_{date}.pdf

### AI-Powered Smart Notifications (Apr 2026)
- Analyzes 7-day streaming trends: country growth, platform shifts, peak hour changes
- GPT-4o generates 3-5 actionable insights with categories (growth/geographic/platform/timing/campaign)
- Each insight has: priority level, metric value, action suggestion
- Stored as notifications with type='ai_insight' in unified notification system
- Smart Insights section on Fan Analytics with "Analyze Trends" button
- Notification bell shows AI insights with lightning bolt icon, "AI Insight" label, metric badges

### Notifications & Communication
- Push Notifications (bell + dropdown + 30s polling)
- 8 notification preferences (email + push toggles)
- Resend email receipts (beat + subscription + collaboration templates)

### Collaborations
- Invite system, Accept/Decline, Royalty split management

### Beat Catalog Search/Filter
- Search/filter by genre/mood/key/BPM/price, Sort options, Share buttons

### Social Sharing & Pre-Save Campaigns
- OG Meta Tags, Public share endpoints
- Campaign manager with countdown timer, subscriber tracking

### Integrations
- Spotify for Artists connection placeholder (OAuth-ready)

## All Pages & Routes
`/` `/login` `/register` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/settings` `/presave/:id` `/spotify-canvas` `/content-id` `/admin/*`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (placeholder ready)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
