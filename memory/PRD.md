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

## Route Files
- `server.py` (2,185 lines) - Auth, Artist, Release, Track, Distribution, Payments, Wallet, Analytics, Goals, Notifications, Fan Analytics, Spotify, Artist Public Profile
- `routes/admin_routes.py` (606 lines) - Admin Dashboard, Users, Submissions, Analytics, Royalty Import, Distributor Templates, Reconciliation
- `routes/label_routes.py` (304 lines) - Label Dashboard, Roster, Royalty Splits, Payout Export
- `routes/ai_routes.py` - AI Strategy, Smart Insights, PDF Export
- `routes/email_routes.py` - Email templates, Digest
- `routes/beats_routes.py` - Beat catalog CRUD
- `routes/collab_routes.py` - Collaborations
- `routes/paypal_routes.py` - PayPal payments
- `routes/content_routes.py` - Content ID, Spotify Canvas

## All Completed Features

### Core
- Auth (JWT + Google OAuth + reCAPTCHA), Responsive dark premium UI
- Multi-step sign-up (CD Baby style), Role Selection (/select-role), Welcome emails
- Password requirements: 12+ chars, 1 number, 1 capital, no spaces

### Label Dashboard
- Dedicated dashboard at /label with 3 tabs: Overview, Royalty Splits, Payouts
- Roster management, Collective analytics, Platform & Country breakdowns
- Royalty Splits per artist (editable, validated to 100%)
- Payout Reports export (CSV & PDF with split calculations)

### Admin Dashboard
- Overview stats, Platform Analytics, User Detail Page with full editor
- Submissions review, Beat Manager
- **Royalty Import System** (Admin-only): CSV upload, fuzzy match ALL platform users, email notifications, import history, manual assignment
- **Distributor Template Manager**: Save/reuse column mappings for CD Baby, DistroKid, RouteNote etc. CRUD with template selector on import
- **Smart Royalty Reconciliation**: Auto-detect duplicate entries across imports, flag revenue discrepancies, summary dashboard

### Content & Commerce
- 4-tab Release Wizard with professional track form
- 150 streaming platforms, Stripe subs (4 tiers), Beat catalog, Wallet

### Analytics & AI
- Revenue Analytics, Release Leaderboard, AI Release Strategy + PDF Export
- AI Smart Notifications, Fan Analytics, Goal Tracking & Milestones

### Growth
- Artist Profile Public Page (/artist/:slug), Pre-Save Campaigns, Collaborations

## All Pages & Routes
`/` `/login` `/register` `/select-role` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (user has developer account, will provide credentials)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
