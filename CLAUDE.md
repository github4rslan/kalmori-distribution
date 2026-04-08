# Kalmori - Music Distribution Platform

## Project Overview
Kalmori is a music distribution platform where artists, producers, and labels can distribute music to streaming platforms.

## Repository
- **GitHub**: https://github.com/github4rslan/kalmori-distribution
- **Branch**: `main` (always work on main, never create feature branches)

## Deployment
| Service | Platform | URL | Watches |
|---------|----------|-----|---------|
| Backend | Render | https://kalmori-distribution.onrender.com | `main` branch, `backend/` folder |
| Frontend | Vercel | https://kalmori-distribution.vercel.app | `main` branch, `frontend/` folder |

## Stack
- **Backend**: Python, FastAPI, Uvicorn, MongoDB Atlas (Motor async driver)
- **Frontend**: React (Create React App + Craco + Tailwind CSS)
- **Database**: MongoDB Atlas — `arslanfaisalcluster.c9kh5er.mongodb.net/kalmori_local`
- **Email**: Resend with verified domain `kalmori.org`, sender `noreply@kalmori.org`
- **Auth**: JWT via HTTP-only cookies
- **Payments**: Stripe (live), PayPal payouts
- **Music**: Spotify integration

## Local Development
Start everything using the batch file on the desktop:
```
C:\Users\Arsla\Desktop\Open-Preelyfe-Music.bat
```
- Backend runs on: http://localhost:8000
- Frontend runs on: http://localhost:3000

### Manual Start
```bash
# Backend
cd backend
uvicorn server:app --reload --port 8000

# Frontend
cd frontend
npm start
```

## Project Structure
```
Website-Kalmori-/
├── backend/          # FastAPI backend (Render root directory)
│   ├── server.py     # Main app + all API routes
│   ├── core.py       # Shared models, helpers, db connection
│   ├── routes/       # Extra route modules (email, etc.)
│   ├── .env          # Local env vars (git ignored)
│   └── requirements.txt
├── frontend/         # React frontend (Vercel root directory)
│   ├── src/
│   │   ├── App.js         # Auth context, routing
│   │   ├── services/api.js # All API calls
│   │   ├── pages/         # Page components
│   │   └── components/    # Shared components
│   ├── .env          # Local env vars (git ignored)
│   └── .npmrc        # legacy-peer-deps=true (required for Vercel)
├── vercel.json       # Vercel build config
└── CLAUDE.md         # This file
```

## Environment Variables

### Backend (Render)
| Key | Description |
|-----|-------------|
| `MONGO_URL` | MongoDB Atlas connection string |
| `DB_NAME` | `kalmori_local` |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Resend email API key |
| `SENDER_EMAIL` | `noreply@kalmori.org` |
| `FRONTEND_URL` | `https://kalmori-distribution.vercel.app` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret key |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `STRIPE_API_KEY` | Stripe live secret key |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |

### Frontend (Vercel)
| Key | Description |
|-----|-------------|
| `REACT_APP_BACKEND_URL` | `https://kalmori-distribution.onrender.com` |
| `REACT_APP_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 site key |

## User Types
| Role | Description | Dashboard |
|------|-------------|-----------|
| `artist` | Musicians who upload and distribute music | Artist dashboard |
| `producer` | Beat makers who sell beats to artists | Producer dashboard |
| `label` | Record labels managing multiple artists | Label dashboard |
| `admin` | Platform administrator | Admin panel at `/admin` |

## Admin Access
- Login at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Render env vars
- Admin panel: `/admin`

## Registration Flow
1. User goes to `/register`
2. Step 1: Email + Password + reCAPTCHA
3. Step 2: Personal details (name, country, address)
4. After register → `/select-role` to choose artist/producer/label
5. Welcome email + verification email sent via Resend

## Key Decisions / Fixes Applied
- `allow_origins=["*"]` with `allow_credentials=True` is invalid CORS — fixed to explicit origin list
- `emergentintegrations` package removed (not on PyPI)
- Google AI / grpcio packages removed (conflict with Python 3.14)
- `legacy-peer-deps=true` in `.npmrc` required for Vercel npm install
- Backend memory path changed from hardcoded `/app/memory` to relative path
- Revenue CSV/PDF export uses axios with `withCredentials: true` (not plain href links)
