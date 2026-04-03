# Kalmori - TuneCore Clone PRD

## Original Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians with Authentication, Subscriptions, Object Storage, AI Features, Release/Track uploads with a professional Wizard, Distribution to 150+ platforms, Beat/Instrumental catalog, and dark premium UI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts + Phosphor Icons + Framer Motion
- **Backend**: FastAPI (modularized: server.py + core.py + /routes/)
- **Database**: MongoDB (18+ collections incl. email_verifications, campaigns, import_schedules)
- **Storage**: Emergent Object Storage | **Payments**: Stripe + PayPal
- **Auth**: JWT + Google Social Login + reCAPTCHA v2 + Email Verification
- **AI**: OpenAI GPT-4o via Emergent LLM Key | **Email**: Resend | **PDF**: reportlab
- **File Parsing**: openpyxl (XLSX), pdfplumber (PDF), csv (CSV)

## Route Files
- `server.py` (~2,500 lines) - Auth (with email verification), Artist, Release, Track, Distribution, Payments, Wallet, Analytics, Revenue Export (CSV/PDF), Goals, Notifications, Fan Analytics, Spotify, Artist Public Profile
- `routes/admin_routes.py` - Admin Dashboard, Users, Submissions, Analytics, Royalty Import with auto-notifications, Distributor Templates, Reconciliation (bulk actions), Import Schedules
- `routes/email_routes.py` - Email verification, Welcome emails, Admin sign-up notifications, Marketing Campaigns CRUD, Lead Follow-Up system, Password Reset, Digest emails
- `routes/label_routes.py` - Label Dashboard, Roster, Royalty Splits, Payout Export (Kalmori-branded)
- `routes/ai_routes.py` - AI Strategy, Smart Insights, PDF Export
- `routes/beats_routes.py` - Beat catalog CRUD
- `routes/collab_routes.py` - Collaborations
- `routes/paypal_routes.py` - PayPal payments
- `routes/content_routes.py` - Content ID, Spotify Canvas

## All Completed Features

### Core Auth & Emails
- JWT + Google OAuth + reCAPTCHA + Email Verification (token with 24h expiry)
- Welcome emails (Artist and Producer/Label differentiated)
- Admin notification on every new sign-up (in-app + email)
- Resend verification endpoint for users

### Admin Dashboard
- Overview stats, Platform Analytics, User Detail Page, Submissions review, Beat Manager
- Multi-Format Royalty Import (CSV/XLSX/PDF) with auto-notifications
- Distributor Template Manager, Smart Reconciliation with Bulk Actions
- Import Schedules (weekly/monthly recurring reminders)
- **Marketing Campaigns**: Create, preview, send branded email campaigns to targeted audiences (all/artists/producers)
- **Lead Follow-Up**: Track abandoned drafts (releases, beats), send individual or bulk reminders, stale detection (24h+)

### White-Label Branding
- All client-facing exports/emails say "Kalmori Distribution" — never the real distributor

### Client Features (Artist + Producer parity)
- Revenue Analytics with Kalmori Distribution integration + Revenue Export (CSV/PDF)
- Release Leaderboard, AI Release Strategy + PDF Export, AI Smart Notifications
- Fan Analytics, Goal Tracking & Milestones
- 4-tab Release Wizard, 150 streaming platforms, Stripe subs, Beat catalog, Wallet
- Artist Profile Public Page, Pre-Save Campaigns, Collaborations

## All Pages & Routes
`/` `/login` `/register` `/select-role` `/verify-email` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import` `/admin/campaigns` `/admin/leads`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (user has developer account)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
- NOTE: Email delivery to non-owner addresses requires configuring a custom domain in Resend (currently using onboarding@resend.dev test domain)
