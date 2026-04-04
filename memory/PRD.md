# Kalmori — TuneCore Clone / Digital Music Distribution Platform

## Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Core requirements include Authentication, Subscriptions, Object Storage for high-res files, AI Features, Artist/User management, Release/Track uploads, Distribution store management, Beat Marketplace, and strict Kalmori white-labeling.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB
- **Payments**: Stripe + PayPal
- **Storage**: Emergent Object Storage
- **AI**: Emergent LLM Key (OpenAI) for strategies, TTS for voice tags
- **Email**: Resend API (support@kalmori.org → submitkalmori@gmail.com)
- **Auth**: JWT + Google OAuth (Emergent)
- **PDF**: reportlab
- **Audio**: pydub + ffmpeg
- **QR**: qrcode (Python)

## Key Credentials
- Admin: admin@kalmori.com / MAYAsimpSON37!!
- All system emails route to submitkalmori@gmail.com
- Minimum withdrawal threshold: $100

## Implemented Features (All Tested & Verified)
1. Auth (JWT + Google OAuth + reCAPTCHA + Password Reset)
2. Subscription Plans (Free/Pro/Label) with Stripe Checkout
3. Release/Track Wizard (4-tab flow with audio upload)
4. Distribution Management (store selection, status tracking)
5. Fan Analytics Dashboard (streams, demographics, geo)
6. AI Release Strategy (Emergent LLM)
7. Save & Compare Strategies
8. Strategy Export to PDF (reportlab)
9. AI Smart Notifications
10. Weekly Digest Emails (Resend)
11. Revenue Analytics & Royalty Calculator
12. Release Performance Leaderboard
13. Goal Tracking & Milestones
14. Artist Public Profile (shareable link-in-bio)
15. Pre-Save Campaigns
16. Beat Marketplace (4-tier licensing)
17. Beat Purchase Contracts with E-Signatures + PDF Generation
18. AI Audio Watermarking (OpenAI TTS voice tags + pydub)
19. Collaboration Hub (posts, invites, messaging)
20. In-App Messaging (real-time chat, file/audio sharing, read receipts, typing indicators)
21. Producer Royalty Split System
22. Admin Payout Dashboard (batch processing, CSV export)
23. Automated Payout Scheduling ($100 threshold)
24. **Artist Profile Enhancements** (Audio Preview Player, Custom Theme Colors, QR Code Generator) — *Apr 2026*
25. **Landing Page Overhaul** (12 feature cards + 3 detailed highlights: Beat Marketplace, Collaboration, Artist Profiles) — *Apr 2026*
26. **Backend Refactoring** (server.py 3962→3500 lines; extracted messages_routes.py, royalty_routes.py, payouts_routes.py) — *Apr 2026*

## Backend Route Files
- `server.py` — Auth, Releases, Tracks, Distribution, Analytics, Goals, Wallet, Subscriptions, Purchases, Calendar, Social, Pre-Save, Notifications, Artist Profile
- `routes/messages_routes.py` — In-App Messaging / Chat
- `routes/royalty_routes.py` — Producer Royalty Splits
- `routes/payouts_routes.py` — Admin Payout Dashboard
- `routes/ai_routes.py` — AI Strategy, Smart Insights, PDF Export
- `routes/email_routes.py` — Email notifications, digests
- `routes/beats_routes.py` — Beat Marketplace, watermarking
- `routes/collab_routes.py` — Collaboration Hub
- `routes/admin_routes.py` — Admin user management
- `routes/content_routes.py` — Content CRUD
- `routes/label_routes.py` — Label management
- `routes/paypal_routes.py` — PayPal integration

## DB Collections
users, releases, tracks, stream_events, artist_profiles, beats, contracts, conversations, messages, typing_status, royalty_splits, split_earnings, wallets, withdrawals, payout_settings, goals, notifications, notification_preferences, presave_campaigns, collaboration_posts, collab_invites, saved_strategies, digest_log

## Remaining / Future Tasks
- P1: Real DSP API OAuth (Spotify/Apple Music credentials needed)
- P2: Further server.py refactoring (analytics, purchases sections)
- P3: Replace simulated DSP data with real API feeds
