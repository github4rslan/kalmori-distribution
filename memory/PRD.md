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
- **File Parsing**: openpyxl (XLSX), pdfplumber (PDF), csv (CSV)

## Route Files
- `server.py` (~2,400 lines) - Auth, Artist, Release, Track, Distribution, Payments, Wallet, Analytics, Revenue Export, Goals, Notifications, Fan Analytics, Spotify, Artist Public Profile
- `routes/admin_routes.py` - Admin Dashboard, Users, Submissions, Analytics, Royalty Import (CSV/XLSX/PDF) with auto-notifications, Distributor Templates, Reconciliation
- `routes/label_routes.py` - Label Dashboard, Roster, Royalty Splits, Payout Export (Kalmori-branded)
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

### Label Dashboard
- Dedicated dashboard at /label with 3 tabs: Overview, Royalty Splits, Payouts
- Roster management, Collective analytics, Platform & Country breakdowns
- Royalty Splits per artist, Kalmori-branded Payout Reports (CSV & PDF)

### Admin Dashboard
- Overview stats, Platform Analytics, User Detail Page, Submissions review, Beat Manager
- **Multi-Format Royalty Import** (Admin-only): Accepts CSV, Excel (.xlsx), and PDF files
- **Distributor Template Manager**: CRUD for column mappings
- **Smart Royalty Reconciliation**: Duplicate detection, revenue discrepancy flagging
- **Auto-Notification on Import**: When admin uploads royalty data, all matched users get in-app notifications + email notifications

### White-Label Branding
- All client-facing exports/emails say "Kalmori Distribution" — never the real distributor
- Admin panel shows real distributor names (only admin sees this)

### Content & Commerce
- 4-tab Release Wizard, 150 streaming platforms, Stripe subs, Beat catalog, Wallet

### Analytics & AI
- Revenue Analytics with Kalmori Distribution integration, Release Leaderboard
- AI Release Strategy + PDF Export, AI Smart Notifications
- Fan Analytics, Goal Tracking & Milestones

### Client Revenue Dashboard (Completed Apr 3, 2026)
- 3 tabs: Overview, Kalmori Earnings, Calculator
- Merges streaming revenue with Kalmori imported royalties
- Kalmori Earnings tab: branded platform breakdown, monthly trends, split-adjusted take
- Combined summary cards: Total Earnings, Streaming Revenue, Kalmori Earnings, Your Take

### Revenue Export (Completed Apr 3, 2026)
- Artists/Producers can download personal Kalmori-branded earnings as CSV or PDF
- CSV includes: header, streaming earnings by platform, Kalmori distribution earnings, combined totals
- PDF includes: styled report with tables for streaming + Kalmori earnings and combined summary
- Export dropdown on Revenue Analytics page

### Auto-Notification System (Completed Apr 3, 2026)
- On royalty import, matched users receive in-app notifications (type: royalty_update)
- Email notifications sent to matched users' email on file
- Message includes earnings amount and Kalmori Distribution branding

### Growth
- Artist Profile Public Page, Pre-Save Campaigns, Collaborations

## All Pages & Routes
`/` `/login` `/register` `/select-role` `/label` `/instrumentals` `/dashboard` `/releases` `/releases/new` `/analytics` `/wallet` `/purchases` `/collaborations` `/presave-manager` `/fan-analytics` `/revenue` `/leaderboard` `/goals` `/settings` `/presave/:id` `/artist/:slug` `/spotify-canvas` `/content-id` `/admin` `/admin/submissions` `/admin/users` `/admin/users/:userId` `/admin/beats` `/admin/royalty-import`

## Remaining Backlog
- P1: Real Spotify OAuth with API credentials (user has developer account)
- P2: Apple Music / YouTube Music API connections
- P2: Replace simulated DSP data with real API feeds
- P3: Automated distributor report scheduler
- P4: Bulk reconciliation actions
