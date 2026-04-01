# TuneDrop - Music Distribution Platform PRD

## Original Problem Statement
Build a TuneCore-like music distribution platform that manages the lifecycle of music from upload to distribution across hundreds of digital service providers (DSPs).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Emergent Object Storage
- **Payments**: Stripe integration
- **Auth**: JWT + Google OAuth

## User Personas
1. **Independent Artist** - Uploads and distributes music
2. **Admin** - Manages platform, views analytics

## Core Requirements
- User authentication (JWT + Google OAuth)
- Artist profile management
- Release creation with UPC generation
- Track management with ISRC codes
- Audio/Video file uploads
- Cover art uploads
- Distribution to 10+ DSPs (simulated)
- Royalty tracking & analytics
- Subscription plans (Free/Rise/Pro)
- Wallet & withdrawals

## What's Been Implemented (April 2026)
- [x] Landing page with hero, features, pricing
- [x] JWT authentication (register/login/logout)
- [x] Google OAuth integration
- [x] Dashboard with stats and charts
- [x] Release management with UPC codes
- [x] Track management with ISRC codes
- [x] Audio file upload & streaming
- [x] Cover art upload
- [x] Distribution store selection
- [x] Stripe payment checkout
- [x] Analytics with Recharts
- [x] Wallet & withdrawal system
- [x] Settings & profile editing
- [x] AI-powered description generation (GPT-5.2)
- [x] AI analytics insights

## P0/P1/P2 Features Remaining
### P0 (Critical)
- [ ] PayPal payment integration (currently simulated)
- [ ] Real DSP API integration

### P1 (Important)
- [ ] YouTube Content ID integration
- [ ] Spotify Canvas support
- [ ] Email notifications
- [ ] Password reset flow

### P2 (Nice to have)
- [ ] Video file uploads
- [ ] Collaborative releases
- [ ] Revenue split management
- [ ] Mobile app

## Next Tasks
1. Implement PayPal payment flow
2. Add email notifications for releases
3. Implement password reset flow
4. Add more detailed royalty tracking
