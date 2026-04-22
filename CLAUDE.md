# Kalmori - Music Distribution Platform

## Project Overview
Kalmori is a professional music distribution platform where artists, producers, and labels distribute music to 150+ streaming platforms, sell beats, manage royalties, collaborate, and grow their fanbase.

## Repository
- **GitHub**: https://github.com/github4rslan/kalmori-distribution
- **Branch**: `main` — always work on main, never create feature branches

## Deployment
| Service | Platform | URL | Root Dir | Watches |
|---------|----------|-----|----------|---------|
| Backend | Render | https://kalmori-distribution.onrender.com | `backend/` | `main` branch |
| Frontend | Vercel | https://kalmori-distribution.vercel.app | `frontend/` | `main` branch |

---

## Tech Stack
- **Backend**: Python 3, FastAPI, Uvicorn, MongoDB Atlas (Motor async driver)
- **Frontend**: React (Create React App + Craco + Tailwind CSS)
- **Database**: MongoDB Atlas — `arslanfaisalcluster.c9kh5er.mongodb.net/kalmori_local`
- **File Storage**: Cloudinary (cloud_name: `dhabplawv`)
- **Email**: Resend — sender `noreply@kalmori.org`, domain `kalmori.org`
- **Auth**: JWT via HTTP-only cookies (`access_token`)
- **Payments**: Stripe (live keys), PayPal (payouts)
- **Music APIs**: Spotify OAuth integration
- **reCAPTCHA**: Google reCAPTCHA v2 on registration

---

## Local Development

Start everything using the batch file:
```
C:\Users\Arsla\Desktop\Open-Preelyfe-Music.bat
```
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Manual Start
```bash
# Backend
cd backend
uvicorn server:app --reload --port 8000

# Frontend
cd frontend
npm start
```

---

## Project Structure
```
Website-Kalmori-/
├── backend/
│   ├── server.py              # Main FastAPI app + core routes
│   ├── core.py                # DB, models, helpers, Cloudinary storage
│   ├── kalmori_routes.py      # CMS, cart, credits, social, payments (critical)
│   ├── routes/
│   │   ├── admin_routes.py       # Admin dashboard, users, royalty import
│   │   ├── ai_routes.py          # AI metadata, descriptions, strategy (needs OpenAI key)
│   │   ├── analytics_routes.py   # Streams, revenue, goals, fan analytics
│   │   ├── beats_routes.py       # Beat bank, upload, licensing, platform fee
│   │   ├── collab_routes.py      # Collaborations, splits, invites
│   │   ├── content_routes.py     # Spotify Canvas, YouTube Content ID
│   │   ├── email_routes.py       # Email notifications, password reset
│   │   ├── label_routes.py       # Label dashboard, roster, payouts
│   │   ├── messages_routes.py    # In-app messaging, file sharing
│   │   ├── page_builder_routes.py # Admin CMS drag-and-drop page editor
│   │   ├── payouts_routes.py     # Admin payout management, batch processing
│   │   ├── paypal_routes.py      # PayPal payment integration
│   │   ├── royalty_routes.py     # Producer royalty splits, earnings
│   │   ├── spotify_routes.py     # Spotify OAuth + artist data
│   │   └── subscription_routes.py # Plans, promo codes, referrals
│   ├── .env                   # Local env vars (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js             # Auth context, global axios config, all routes
│   │   ├── services/api.js    # All 96 API call methods
│   │   ├── pages/             # 64 page components
│   │   └── components/        # DashboardLayout, AdminLayout, 48 UI components
│   ├── .env                   # Local env vars (gitignored)
│   ├── jsconfig.json          # Path aliases (@/*)
│   └── .npmrc                 # legacy-peer-deps=true (required for Vercel)
├── vercel.json                # Vercel build + rewrite config
└── CLAUDE.md                  # This file
```

---

## Environment Variables

### Backend (Render)
| Key | Value / Description |
|-----|---------------------|
| `MONGO_URL` | MongoDB Atlas connection string |
| `DB_NAME` | `kalmori_local` |
| `JWT_SECRET` | JWT signing secret (strong random string) |
| `FRONTEND_URL` | `https://kalmori-distribution.vercel.app` |
| `RESEND_API_KEY` | Resend email API key |
| `SENDER_EMAIL` | `noreply@kalmori.org` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret key |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key (from Cloudinary dashboard) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (from Cloudinary dashboard) |
| `STRIPE_API_KEY` | Stripe live secret key (`sk_live_...`) |
| `PAYPAL_CLIENT_ID` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal app client secret |
| `PAYPAL_MODE` | `sandbox` or `live` |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `ADMIN_EMAIL` | `admin@local.dev` |
| `ADMIN_PASSWORD` | Admin login password |
| `EMERGENT_LLM_KEY` | **DEAD** — replace with real OpenAI key when ready |

### Frontend (Vercel)
| Key | Value / Description |
|-----|---------------------|
| `REACT_APP_BACKEND_URL` | `https://kalmori-distribution.onrender.com` |
| `REACT_APP_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 site key |

---

## User Roles
| Role | Description | Key Pages |
|------|-------------|-----------|
| `artist` | Musicians — upload & distribute music | `/dashboard`, `/releases`, `/analytics` |
| `producer` | Beat makers — sell beats to artists | `/beat-bank` |
| `label` | Record labels — manage artists & rosters | `/label`, `/beat-bank` |
| `label_producer` | Label that also sells beats | `/label`, `/beat-bank` |
| `admin` | Platform administrator | `/admin` and all `/admin/*` routes |

### Role Checking Pattern (frontend)
```js
const role = user?.user_role || user?.role;
const isAdmin = role === 'admin';
const isProducer = ['producer', 'label', 'label_producer'].includes(role);
```

---

## Auth Flow
- JWT stored as HTTP-only cookie `access_token` (60 min expiry)
- Refresh token in cookie `refresh_token` (7 days)
- **ALL axios calls auto-include cookies** — `axios.defaults.withCredentials = true` set globally in `App.js`
- `fetch()` calls must use `credentials: 'include'` manually

### Login
```
POST /api/auth/login → sets access_token + refresh_token cookies
```

### Token Refresh
```
POST /api/auth/refresh → issues new access_token from refresh_token
```

### Admin Credentials (local dev)
- Email: `admin@local.dev`
- Password: `Admin123!`

---

## Registration Flow
1. `/register` — Email + Password + reCAPTCHA (Step 1)
2. Personal details: name, country, address (Step 2)
3. Submit → backend validates reCAPTCHA, hashes password, stores user
4. Redirect to `/select-role` → user picks artist/producer/label
5. Welcome email + verification email sent via Resend

---

## File Storage (Cloudinary)
All file uploads go through `put_object()` in `core.py` → Cloudinary.

| Upload Type | Endpoint | Resource Type |
|-------------|----------|---------------|
| User avatar | `POST /api/users/avatar` | image |
| Release cover art | `POST /api/releases/{id}/cover` | image |
| Track audio (WAV/MP3/FLAC) | `POST /api/tracks/{id}/audio` | video (Cloudinary uses video for audio) |
| Beat audio + watermarked preview | `POST /api/beats/{id}/audio` | video |
| Beat cover art | `POST /api/beats/{id}/cover` | image |
| Chat file attachments | Messages route | image/video/raw |
| Page builder images | Admin page builder route | image |

Files are served via direct Cloudinary `secure_url` — no backend proxying.
Stream/download endpoints use `302 RedirectResponse` to Cloudinary URL.

### Test Cloudinary
```bash
cd backend
python -c "
import cloudinary, cloudinary.api
from dotenv import load_dotenv; load_dotenv()
import os
cloudinary.config(cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'], api_key=os.environ['CLOUDINARY_API_KEY'], api_secret=os.environ['CLOUDINARY_API_SECRET'], secure=True)
print(cloudinary.api.ping())
"
```

---

## Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| PRIMARY | `#7C4DFF` | Buttons, links, accents |
| SECONDARY | `#E040FB` | Highlights, gradients |
| HIGHLIGHT | `#FFD700` | Gold badges, premium indicators |
| ALERT | `#FF3B30` | Errors, warnings, destructive actions |

Always use these colors. Never introduce new brand colors without asking.

---

## Subscription Plans
| Plan | Price | Revenue Share | Key Features |
|------|-------|---------------|--------------|
| Free | $0 | Kalmori keeps 20% | Unlimited releases, basic analytics |
| Rise | $24.99/mo | Kalmori keeps 5% | Pay-per-single, fan analytics, beat marketplace |
| Pro | $49.99/mo | Artist keeps 100% | Everything, AI features, albums, content ID |

Feature gate check: `check_feature_access(user_plan, feature_name)` in `core.py`

---

## Beat Bank (Producer/Label Feature)
- Producers/labels upload beats with audio + cover art
- Platform fee (admin-configurable %) deducted from each sale
- Remaining revenue goes to producer
- Admin can view all beats, override anything, set platform fee
- Beat streaming uses watermarked preview; full file unlocked after purchase
- Routes: `backend/routes/beats_routes.py`
- Frontend: `frontend/src/pages/ProducerBeatBankPage.jsx`
- Admin: `frontend/src/pages/AdminBeatsPage.jsx`

---

## Known Dead / Broken Features
| Feature | Status | Fix Required |
|---------|--------|--------------|
| AI metadata suggestions | Broken | Replace `EMERGENT_LLM_KEY` with real OpenAI key, refactor `ai_routes.py` |
| AI release strategy | Broken | Same as above |
| AI analytics insights | Broken | Same as above |
| TTS voice tags | Broken | Same as above |
| Spotify Canvas upload | Broken | `content_routes.py` still uses dead Emergent storage — migrate to Cloudinary |
| Google login/signup | Disabled | Replaced with toast: "Google login coming soon" |
| `emergentintegrations` Stripe | Broken | `subscription_routes.py` — refactor to use `stripe` SDK directly |

---

## Automated Checks

### 1. Python Syntax Check (run after editing any .py file)
```bash
cd backend
python -c "
import ast, os, sys
errors = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['__pycache__','venv','.venv']]
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            try:
                ast.parse(open(path, encoding='utf-8').read())
            except SyntaxError as e:
                errors.append(f'{path}: {e}')
if errors:
    print('SYNTAX ERRORS FOUND:')
    [print(e) for e in errors]
    sys.exit(1)
else:
    print('All Python files OK')
"
```

### 2. Frontend Build Check (run after editing any frontend file)
```bash
cd frontend
npm run build 2>&1 | tail -20
```

### 3. Backend Import Check (catches missing packages)
```bash
cd backend
python -c "import server; print('Backend imports OK')"
```

### 4. API Smoke Tests — Local
```bash
# Health check
curl -s http://localhost:8000/api/health

# Admin login
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin123!"}' | python -m json.tool

# Registration test
curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}' | python -m json.tool
```

### 5. API Smoke Tests — Live Site
```bash
# Backend alive
curl -s https://kalmori-distribution.onrender.com/api/health

# Admin login live
curl -s -X POST https://kalmori-distribution.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin123!"}' | python -m json.tool
```

### 6. Cloudinary Test
```bash
cd backend
python -c "
import cloudinary, cloudinary.api, cloudinary.uploader, io, os
from dotenv import load_dotenv; load_dotenv()
cloudinary.config(cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'], api_key=os.environ['CLOUDINARY_API_KEY'], api_secret=os.environ['CLOUDINARY_API_SECRET'], secure=True)
print('Ping:', cloudinary.api.ping())
gif = b'GIF89a\x01\x00\x01\x00\x00\xff\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x00;'
r = cloudinary.uploader.upload(io.BytesIO(gif), public_id='kalmori/test', resource_type='image', overwrite=True)
print('Upload OK:', r['secure_url'])
cloudinary.uploader.destroy('kalmori/test', resource_type='image')
print('Cloudinary fully working')
"
```

---

## Issue Detection Guide

When something breaks, check in this exact order:

### Login / Auth Issues
1. Check Render deploy finished — backend takes 2-3 min to restart
2. Check `access_token` cookie is set in browser DevTools → Application → Cookies
3. If 401 on all requests → JWT secret mismatch between Render env var and code
4. If CORS error → check `_allowed_origins` in `server.py` includes the frontend URL
5. If cookie not sending → confirm `axios.defaults.withCredentials = true` in `App.js`

### Registration Issues
1. 400 Bad Request → likely reCAPTCHA mismatch — check `REACT_APP_RECAPTCHA_SITE_KEY` (Vercel) matches `RECAPTCHA_SECRET_KEY` (Render)
2. "Email already registered" not showing → CORS was blocking response body (fixed)
3. CORS error on register → `allow_origins` must list explicit origins, not `"*"` when `allow_credentials=True`

### File Upload Issues
1. Check Cloudinary env vars on Render: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
2. Run Cloudinary test above
3. Check browser Network tab for upload request — look for 500 response with detail
4. Audio files use `resource_type="video"` in Cloudinary (this is correct — Cloudinary's naming)

### Deployment Issues
- **Render not deploying** → Verify repo is `github4rslan/kalmori-distribution`, branch `main`, root dir `backend/`
- **Vercel not deploying** → Verify root dir is `frontend/` in Vercel project settings
- **Render sleeping** → Free tier sleeps after 15 min inactivity, takes ~30s to wake on first request
- **Build failing on Render** → Check `requirements.txt` — package version conflicts
- **Build failing on Vercel** → Check `.npmrc` has `legacy-peer-deps=true`

### Email Issues
1. Check `RESEND_API_KEY` is set on Render
2. Verify `kalmori.org` domain is verified in Resend dashboard
3. Check sender is `noreply@kalmori.org` — must match verified domain

### Payment Issues
1. Stripe → Check `STRIPE_API_KEY` on Render is live key `sk_live_...` not test key
2. PayPal → Check `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` on Render

### AI Feature Issues
- All AI features are currently disabled — `EMERGENT_LLM_KEY` is a dead key
- Will return 500 errors — this is expected behavior
- Fix: Replace with real OpenAI API key + refactor `ai_routes.py` to use `openai` SDK directly

---

## Coding Rules (Follow Every Time)

### General
- Always read a file before editing it — never edit blind
- Commit to `main` only — never create feature branches
- Never include "Claude", "AI", or "generated" in commit messages
- Keep commits focused — one logical change per commit
- After every user-approved change, run the relevant checks, commit the focused change, and push to `origin main` so Render/Vercel can deploy it

### Backend
- Always run Python syntax check after editing `.py` files
- Every new endpoint needs auth: use `get_current_user(request)` or `require_admin(request)`
- Never store file paths as URLs — always store the Cloudinary `result["url"]`
- Use `result["url"]` not `result["path"]` from `put_object()`
- Stream endpoints use `302 RedirectResponse(url=cloudinary_url)` — not backend proxying
- New routes go in `backend/routes/` — register them at bottom of `server.py`

### Frontend
- All axios calls automatically include cookies (`withCredentials` is global in `App.js`)
- `fetch()` calls must manually include `credentials: 'include'`
- Role check pattern: `const role = user?.user_role || user?.role`
- Always use brand colors: `#7C4DFF`, `#E040FB`, `#FFD700`, `#FF3B30`
- New pages go in `frontend/src/pages/` → register in `App.js` → add to `DashboardLayout.jsx` nav if needed
- Google login button stays visible but shows toast: "Google login coming soon"

### Security
- Never log passwords, tokens, or API keys
- Never commit `.env` files
- Input validation at API boundaries only — trust internal code
- Admin routes protected by `require_admin()` on backend AND `AdminRoute` wrapper on frontend

---

## Adding a New Feature (Checklist)

- [ ] Backend: Create route in appropriate `routes/` file or `server.py`
- [ ] Backend: Add auth guard (`get_current_user` or `require_admin`)
- [ ] Backend: Register router in `server.py` at bottom
- [ ] Frontend: Create page in `frontend/src/pages/`
- [ ] Frontend: Add API method in `frontend/src/services/api.js`
- [ ] Frontend: Register route in `App.js`
- [ ] Frontend: Add nav item in `DashboardLayout.jsx` with role guard if needed
- [ ] Test: Run Python syntax check
- [ ] Test: Run frontend build check
- [ ] Test: Manual smoke test on local
- [ ] Commit and push to `main`

---

## Key Historical Fixes
- `allow_origins=["*"]` with `allow_credentials=True` is invalid CORS — fixed to explicit origin list
- File storage migrated from dead `integrations.emergentagent.com` → Cloudinary
- `emergentintegrations` package removed from active import paths
- Google auth disabled (dead `auth.emergentagent.com`) — replaced with toast
- `legacy-peer-deps=true` in `.npmrc` required for Vercel npm install
- Revenue CSV/PDF export uses axios with `withCredentials: true` (not plain href links)
- Notification dropdown fixed for mobile with `fixed` positioning
- `jsconfig.json` — added `checkJs: false` to suppress VS Code deprecation warning
- Single git remote — only `github4rslan/kalmori-distribution` watched by Render + Vercel
