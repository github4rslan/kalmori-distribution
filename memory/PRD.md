# TuneDrop / Kalmori - Product Requirements Document

## Overview
A TuneCore clone / high-volume digital content aggregator and B2B e-commerce platform for musicians. Built as a React Web Application matching the user's existing "Kalmori" React Native Expo app design.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python) + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT (cookie-based) + Google OAuth (Emergent)
- **Payments**: Stripe (via Emergent Integrations)
- **Storage**: Emergent Object Storage
- **Email**: Resend (optional, via env var)

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main backend (auth, releases, tracks, admin, wallet, AI, etc.)
│   ├── kalmori_routes.py  # GitHub-merged routes (CMS, Cart, Credits, Social, Testimonials, etc.)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/ (PublicLayout, AdminLayout, DashboardLayout, GlobalFooter)
│   │   └── pages/ (15+ pages: Landing, Pricing, Services, Admin, Dashboard, etc.)
│   └── .env
└── memory/ (PRD.md, test_credentials.md)
```

## Completed Features

### Frontend (All pages pixel-perfect clone of Kalmori app)
- [x] Landing Page with slideshow hero, typewriter animation, platform logos
- [x] Pricing Page (Free, Single, EP, Album plans)
- [x] Services, Stores, Contact, About pages
- [x] Leasing/Instrumentals page
- [x] Privacy Policy & Terms pages
- [x] PublicLayout with slide-out menu matching Kalmori exactly
- [x] Admin Dashboard UI with routing
- [x] User Dashboard (DashboardLayout)
- [x] Auth pages (Login/Register)

### Backend - Core (server.py)
- [x] JWT cookie-based auth (register, login, logout, me, refresh)
- [x] Google OAuth via Emergent Integrations
- [x] Release CRUD (create, list, get, delete)
- [x] Track CRUD with audio file upload to Object Storage
- [x] Distribution management (distribute to stores, status tracking)
- [x] Payment processing (Stripe checkout, status, webhooks)
- [x] Wallet system (balance, earnings tracking)
- [x] Wallet withdrawal requests
- [x] Analytics endpoints (overview, streams, revenue)
- [x] AI features (metadata suggestions, descriptions, analytics insights)
- [x] Subscription plans management
- [x] Notifications system
- [x] Admin dashboard (stats, submissions review, user management)
- [x] Ingestion/Review engine (pending review → approved → distributed)
- [x] Split payments (track-level royalty splits)
- [x] File serving (cover art, audio from Object Storage)
- [x] Admin user seeding on startup

### Backend - Kalmori GitHub Merge (kalmori_routes.py) [Apr 2, 2026]
- [x] CMS system (slides, pricing plans, legal pages, full page editor)
- [x] CMS instrumentals content management
- [x] Shopping Cart (CRUD + Stripe checkout)
- [x] Credits system (purchase, wallet-based, webhooks)
- [x] Payment Methods (PayPal, bank - CRUD)
- [x] Extended Wallet (Kalmori format with credits)
- [x] Extended Withdrawals
- [x] Social features (follow/unfollow artists, follower count)
- [x] Promotion Orders (with email notifications via Resend)
- [x] Instrumental/Beat Requests (with email notifications)
- [x] Testimonials (CRUD with admin approval)
- [x] Theme settings (per-user customization)
- [x] Analytics chart data & platform breakdown
- [x] Public releases showcase
- [x] Video serving from Object Storage (with range requests)
- [x] reCAPTCHA verification page
- [x] Admin CMS endpoints (slides, pricing, legal, full pages, instrumentals)
- [x] Default CMS content initialization on startup

## Upcoming Tasks (P1)
- [ ] AI Features integration (metadata generation, analytics summaries) using Emergent LLM Key
- [ ] Advanced Analytics Dashboard (Audience Map, TikTok UGC trends)
- [ ] Email notifications & password reset workflows
- [ ] PayPal payment integration

## Future Tasks (P2)
- [ ] Beat audio previews on the Leasing page
- [ ] Backend modularization (split server.py into distinct router files)
- [ ] YouTube Content ID / Spotify Canvas
- [ ] Video file uploads

## Key API Endpoints
### Auth: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
### Releases: /api/releases (CRUD), /api/public-releases
### Tracks: /api/tracks (CRUD + audio upload)
### Payments: /api/payments/checkout, /api/payments/status, /api/payments/create-promotion-checkout
### Cart: /api/cart (CRUD), /api/cart/add, /api/cart/checkout
### CMS: /api/cms/slides, /api/cms/pricing, /api/cms/legal, /api/cms/pages, /api/cms/page/{id}, /api/cms/instrumentals
### Admin: /api/admin/dashboard, /api/admin/submissions, /api/admin/cms/*
### Social: /api/artists/{id}/follow, /api/artists/{id}/follower-count
### Orders: /api/orders/promotion-service, /api/orders/instrumental-request
### Testimonials: /api/testimonials
### Wallet: /api/wallet, /api/kalmori-wallet, /api/credits
### Analytics: /api/analytics/chart-data, /api/analytics/platform-breakdown

## DB Collections
users, releases, tracks, distributions, royalties, wallets, submissions, splits, admin_actions, notifications, payment_transactions, stores, subscriptions, cart, orders, promotion_orders, instrumental_requests, testimonials, themes, followers, payment_methods, withdrawals, transactions, cms_slides, cms_pricing, cms_legal, cms_pages, cms_full_pages, cms_instrumentals

## Testing
- iteration_7.json: 100% pass (27/27 backend, frontend OK)
