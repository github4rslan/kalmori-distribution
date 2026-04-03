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
- Auth (JWT + Google OAuth + reCAPTCHA), Responsive dark premium UI
- Welcome email on sign-up (energetic music-industry vibe)
- Email template system with reusable email_base wrapper

### Admin Dashboard (Full Upgrade — Apr 2026)
- **Overview**: 6 stat cards (Total Users, Releases, Pending Review, Revenue, Total Streams, This Week Streams)
- **Platform Analytics**: Platform Streams breakdown, Top Markets, Top Artists (clickable), Monthly stream trend, Active artists count
- **User Management**: Search, pagination, View/Edit per user, role/plan/status editing
- **User Detail Page** (/admin/users/:userId): Full profile view with stats grid (streams, revenue, releases, pre-saves, goals), inline profile editor (name, artist_name, bio, genre, country, social links, role, plan, status), platform breakdown, country breakdown, weekly stream trends, releases table, goals & milestones
- Submissions review, Beat Manager

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
- Marketing-focused with feature showcases (9 feature cards)
- Stats row: 150+ Platforms, 100% Royalties, 24/7 Analytics, AI Strategy
- Sign-up form: wider 2-column layout, styled Terms/reCAPTCHA

### Other
- Notifications: 9 preferences (email + push + digest)
- Collaborations, Beat Search/Filter, Social Sharing, Pre-Save Campaigns

## All Pages & Routes
`/` `/login` `/register` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (placeholder ready)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
