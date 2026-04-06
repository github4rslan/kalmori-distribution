# Kalmori — TuneCore Clone / Digital Music Distribution Platform

## Problem Statement
Build a TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Core requirements include Authentication, Subscriptions, Object Storage, AI Features, Artist management, Release/Track uploads, Distribution, Beat Marketplace, Admin Page Builder, and Kalmori white-labeling.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion + @dnd-kit
- **Backend**: FastAPI (Python) + MongoDB
- **Payments**: Stripe + PayPal | **Storage**: Emergent Object Storage
- **AI**: Emergent LLM Key (OpenAI) | **Email**: Resend API
- **Auth**: JWT + Google OAuth | **DSP**: Spotify Web API (spotipy)

## Implemented Features (All Tested)
1-32. Core platform features (Auth, Subscriptions, Releases, Distribution, Analytics, AI, Beats, Contracts, Messaging, Royalty Splits, Payouts, Artist Profiles, Page Builder, Spotify, Cookie Consent, Feature Announcements, etc.)
33. **Analytics Cleanup** — Removed ALL simulated/fake data. Endpoints return real DB data only (zeros when empty). Startup seeder removed. Random fallbacks removed.
34. **CSV Import Admin-Only** — Only admins can import streaming data via CSV. Returns 403 for non-admin. "Import CSV" button hidden for artists/producers.
35. **Removed Fake Percentages** — Stats cards no longer show hardcoded +12.5%/+8.2% change indicators
36. **Admin Feature Announcements UI** — Full CRUD admin page at /admin/feature-announcements. Create announcements with title, description, category, plan tier (free/rise/pro), icon, and color. Publishes notifications to all users. Delete with confirmation.
37. **Global Axios Token Refresh** — Auto-refreshes access token on 401 responses. Queues failed requests during refresh. Fixes Spotify page redirect issue.
38. **Spotify Error Handling** — Shows error state with message instead of silently redirecting to login page on non-401 errors.

## Subscription Tiers
| Feature | Free | Rise | Pro |
|---------|------|------|-----|
| Spotify Data | Locked | Locked | Unlocked |
| Beat Marketplace | Locked | Unlocked | Unlocked |
| In-App Messaging | Locked | Unlocked | Unlocked |
| Royalty Splits | Locked | Locked | Unlocked |
| AI Strategy | Locked | Locked | Unlocked |
| Fan Analytics | Locked | Unlocked | Unlocked |

## DB Collections
users, releases, tracks, stream_events, artist_profiles, beats, contracts, conversations, messages, typing_status, royalty_splits, split_earnings, wallets, withdrawals, payout_settings, goals, notifications, notification_preferences, presave_campaigns, collaboration_posts, collab_invites, saved_strategies, digest_log, page_layouts, spotify_connections, feature_announcements, cookie_consents, imported_royalties

## Remaining Tasks
- P0: Deploy to kalmori.org (Save to Github)
- P1: Admin Royalty Import Dashboard enhancements (column mapping, preview, import history)
- P1: Apple Music Analytics API integration (pending user credentials)
- P2: Server.py refactoring into /routes/ modules
- P3: YouTube Music / other DSP integrations
