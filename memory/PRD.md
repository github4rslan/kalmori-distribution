# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads with a professional Wizard, Distribution to 150+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons + Framer Motion
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (15+ collections)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI GPT-4o via Emergent LLM Key | **Email**: Resend | **PDF**: reportlab

## All Completed Features

### Core
- Auth (JWT + Google OAuth + reCAPTCHA), Admin Dashboard, Responsive dark premium UI
- Welcome email on sign-up (energetic music-industry vibe)
- Email template system with reusable email_base wrapper

### Content
- 4-tab Release Wizard, UPC auto-gen, Spotify Canvas, Content ID
- 150 streaming platforms with region-based filtering, search, Select All

### Commerce
- Stripe subs (4 tiers) + upgrade/downgrade, Beat catalog, My Purchases, Wallet

### Analytics
- DSP simulation, Streaming Feed, CSV import, Share Stats
- Fan Analytics: Listener Growth, Countries, Platform Engagement, Peak Hours, Pre-save
- Revenue Analytics: Summary cards, monthly trend, platform breakdown, royalty splits, what-if calculator
- Release Leaderboard: Top-3 podium, sparklines, hot streak/rising badges, sort/filter

### AI Features
- AI Release Strategy + Save/Compare + PDF Export
- AI Smart Notifications: 7-day trend analysis, categorized insights, bell badges

### Email
- Weekly Digest Emails: Branded HTML, preview modal, Settings toggle
- Welcome email on registration
- Beat purchase receipt, subscription receipt, release approved/rejected, payment received, password reset

### Growth
- Goal Tracking & Milestones (7 goal types, auto-completion, deadline countdown)
- Artist Profile Public Page (/artist/:slug with link-in-bio, social links, pre-save)

### Landing Page
- Marketing-focused with feature showcases (9 feature cards: AI Strategy, Analytics, Revenue Calculator, Leaderboard, Goals, Artist Profile, Fan Analytics, Smart Notifications, Beat Marketplace)
- Stats row: 150+ Platforms, 100% Royalties, 24/7 Analytics, AI Strategy
- Sign-up form: wider 2-column layout, styled Terms/reCAPTCHA

### Other
- Notifications: 9 preferences (email + push + digest)
- Collaborations, Beat Search/Filter, Social Sharing, Pre-Save Campaigns

## All Pages & Routes
`/` `/login` `/register` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin/*`

## Remaining Backlog
- P0: Admin Dashboard Upgrade (view/edit artist profiles, see individual stats, admin analytics, mirror artist features)
- P1: Real Spotify OAuth with API credentials (placeholder ready)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
