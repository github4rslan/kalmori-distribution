# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads with a professional Wizard, Distribution to 37+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons + Framer Motion
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (15+ collections)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2
- **AI**: OpenAI GPT-4o via Emergent LLM Key | **Email**: Resend | **PDF**: reportlab

## All Completed Features

### Core: Auth, Admin Dashboard, Responsive dark premium UI
### Content: 4-tab Release Wizard, UPC auto-gen, Spotify Canvas, Content ID
### Commerce: Stripe subs (4 tiers) + upgrade/downgrade, Beat catalog, My Purchases, Wallet
### Analytics: DSP simulation, Streaming Feed, CSV import, Share Stats
### Fan Analytics: Listener Growth, Countries, Platform Engagement, Peak Hours, Pre-save
### AI Release Strategy + Save/Compare + PDF Export
### AI Smart Notifications: 7-day trend analysis, categorized insights, bell badges
### Weekly Digest Emails: Branded HTML, preview modal, Settings toggle
### Revenue Analytics: Summary cards, monthly trend, platform breakdown, royalty splits, what-if calculator
### Release Leaderboard: Top-3 podium, sparklines, hot streak/rising badges, sort/filter
### Goal Tracking & Milestones (Apr 2026)
- 7 goal types: streams, monthly_streams, countries, revenue, releases, presave_subs, collaborations
- Create goals with custom titles, targets, optional deadlines
- Preset target buttons per goal type (e.g. 1k, 5k, 10k, 50k, 100k for streams)
- Real-time progress bars with current/target values and percentages
- Deadline countdown (days remaining)
- Auto-completion: goals automatically marked complete when current metric >= target
- Milestone celebration notifications (type='milestone')
- Completed milestones with golden ACHIEVED badge and gold progress bar
- Current metrics overview (7 cards showing live values)
- Delete goals functionality
### Artist Profile Public Page (Apr 2026)
- Shareable link-in-bio URL at /artist/:slug
- Cinematic dark premium design with glassmorphic cards, gradient accents, framer-motion animations
- Hero section: avatar, artist name, genre/country, bio, stream stats
- Social links row: Spotify, Apple Music, Instagram, Twitter, Website
- Released music grid with cover art and stream counts
- Pre-save campaign cards with gradient CTA buttons
- Sticky "Share Profile" button with copy-to-clipboard
- KALMORI brand badge linking back to home
- Custom slug management in Settings > Public Profile tab
- Slug auto-generation from artist name, validation (2-50 chars, unique)
- "What fans will see" completeness checklist in Settings
- 404 error page for non-existent artist slugs
### Notifications: 9 preferences (email + push + digest)
### Collaborations, Beat Search/Filter, Social Sharing, Pre-Save Campaigns

## All Pages & Routes
`/` `/login` `/register` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin/*`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (placeholder ready)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
