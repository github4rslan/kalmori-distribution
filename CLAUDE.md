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
| `CLOUDINARY_CLOUD_NAME` | `dhabplawv` |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

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

## Automated Checks (Run Before Every Push)

### Backend Health Check
```bash
cd backend
python -c "
import ast, os, sys
errors = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['__pycache__', 'venv', '.venv', 'node_modules']]
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            try:
                ast.parse(open(path).read())
            except SyntaxError as e:
                errors.append(f'{path}: {e}')
if errors:
    print('SYNTAX ERRORS:')
    for e in errors: print(e)
    sys.exit(1)
else:
    print('All Python files OK')
"
```

### Frontend Build Check
```bash
cd frontend
npm run build --silent 2>&1 | tail -5
```

### API Endpoint Smoke Test (requires local backend running)
```bash
# Health
curl -s http://localhost:8000/api/health | python -m json.tool

# Auth check
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin123!"}' | python -m json.tool
```

### Live Site Smoke Test
```bash
# Backend live
curl -s https://kalmori-distribution.onrender.com/api/health

# Auth live
curl -s -X POST https://kalmori-distribution.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin123!"}' | python -m json.tool
```

### Cloudinary Connection Test
```bash
cd backend
python -c "
import cloudinary, cloudinary.api
cloudinary.config(cloud_name='dhabplawv', api_key='882247917397356', api_secret='eWseftCBRNpu2lAWuuANj7RQosA', secure=True)
r = cloudinary.api.ping()
print('Cloudinary:', r['status'])
"
```

## Issue Detection Checklist

When something breaks, check in this order:

1. **CORS error in browser** → Check `server.py` `_allowed_origins` list includes the frontend URL
2. **401 on all API calls** → JWT cookie not being sent → ensure `withCredentials: true` on axios
3. **Upload fails** → Check Cloudinary env vars on Render (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
4. **Registration 400** → Check reCAPTCHA key matches between Vercel (`REACT_APP_RECAPTCHA_SITE_KEY`) and Render (`RECAPTCHA_SECRET_KEY`)
5. **Render not deploying** → Check it's watching `github4rslan/kalmori-distribution` repo, `main` branch, root dir `backend/`
6. **Vercel not deploying** → Check root directory is `frontend/` in Vercel project settings
7. **Email not sending** → Check `RESEND_API_KEY` on Render and that `kalmori.org` domain is verified in Resend dashboard
8. **AI features error** → Expected — needs real OpenAI key in `EMERGENT_LLM_KEY`
9. **Stripe payment fails** → Check `STRIPE_API_KEY` on Render is live key (not `sk_test_`)

## Common Agent Tasks

When asked to fix a bug:
1. Read the relevant file first — never edit blind
2. Check both backend route AND frontend API call
3. Always use `withCredentials: true` on frontend axios calls
4. Run backend syntax check after editing Python files
5. Commit to `main` only — no feature branches
6. Never include "Claude" or "AI" in commit messages

When adding a new page/feature:
1. Add backend route in `server.py` or appropriate `routes/` file
2. Add frontend page in `frontend/src/pages/`
3. Register route in `frontend/src/App.js`
4. Add nav item in `frontend/src/components/DashboardLayout.jsx` if needed
5. Use brand colors: PRIMARY `#7C4DFF`, SECONDARY `#E040FB`, HIGHLIGHT `#FFD700`, ALERT `#FF3B30`
6. Role-guard pages: check `user?.user_role || user?.role`

## Key Decisions / Fixes Applied
- `allow_origins=["*"]` with `allow_credentials=True` is invalid CORS — fixed to explicit origin list
- `emergentintegrations` package removed (not on PyPI)
- Google AI / grpcio packages removed (conflict with Python 3.14)
- `legacy-peer-deps=true` in `.npmrc` required for Vercel npm install
- Backend memory path changed from hardcoded `/app/memory` to relative path
- Revenue CSV/PDF export uses axios with `withCredentials: true` (not plain href links)
