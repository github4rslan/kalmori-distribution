# Kalmori — TuneCore Clone / Digital Music Distribution Platform

## Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Core requirements include Authentication, Subscriptions, Object Storage, AI Features, Artist management, Release/Track uploads, Distribution, Beat Marketplace, and Kalmori white-labeling. Must include Admin-only Elementor-style Page Builder with full visual control.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion + @dnd-kit
- **Backend**: FastAPI (Python) + MongoDB
- **Payments**: Stripe + PayPal | **Storage**: Emergent Object Storage
- **AI**: Emergent LLM Key (OpenAI) | **Email**: Resend API
- **Auth**: JWT + Google OAuth | **DSP**: Spotify Web API (spotipy)
- **PDF**: reportlab | **Audio**: pydub + ffmpeg | **QR**: qrcode

## Implemented Features (All Tested)
1-18. Core features (Auth, Subscriptions, Releases, Distribution, Analytics, AI, Beats, Contracts, Messaging, Royalty Splits, Payouts, Artist Profiles, etc.)
19. **Admin Page Builder V1** — Drag-and-drop, 12 block types
20. **Page Builder V2** — Custom CSS, Image uploads, Block duplication, Multi-page
21. **Page Builder Auto-Seeding** — Landing (14), About (5), Pricing (4) blocks from live site
22. **Reset to Default** — Toolbar button to revert any page to original content
23. **Template Library** — 10 pre-built feature templates (Beat Marketplace, Spotify, AI, Collab Hub, Royalty Splits, Artist Profile, Leaderboard, Distribution CTA, Subscription Plans, Content Protection)
24. **Spotify DSP OAuth** — Real artist data, top tracks, albums, related artists
25. **Admin User Cleanup** — Delete all non-admin users
26. **Updated Subscription Gating** — New features added to tier locks (spotify_data, beat_marketplace, messaging, royalty_splits)

## Subscription Tiers
| Feature | Free | Rise | Pro |
|---------|------|------|-----|
| Spotify Data | Locked | Locked | Unlocked |
| Beat Marketplace | Locked | Unlocked | Unlocked |
| In-App Messaging | Locked | Unlocked | Unlocked |
| Royalty Splits | Locked | Locked | Unlocked |
| AI Strategy | Locked | Locked | Unlocked |
| Fan Analytics | Locked | Unlocked | Unlocked |

## Remaining Tasks
- P0: Deploy to kalmori.org (Save to Github)
- P0: Add custom domain to Resend (kalmori.org) for email delivery
- P2: Further server.py refactoring
- P3: Apple Music / YouTube Music integration
