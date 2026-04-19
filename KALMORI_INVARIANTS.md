# Kalmori Invariants

Shared rules file. Read by Claude Code (`regression-guard` agent) and Codex (`AGENTS.md` references this).
Every rule below is a line the codebase must never cross. Violations are bugs.

---

## UX / Feedback Invariants

1. **Never show the same error in two places.** If `setError(msg)` sets inline UI state, do NOT also `toast.error(msg)` for the same failure. Pick one:
   - Inline banner → login, register, forms with persistent validation
   - Toast → transient actions (save, delete, copy, upload success)
   - Known offender: `LoginPage.jsx` handleLogin — fires both on catch
2. **Never surface raw backend `detail` strings** without checking they are strings. FastAPI can return `detail` as a dict/list on validation errors — render would throw "Objects are not valid as React child."
3. **Loading state must always reset.** Every `setLoading(true)` needs a matching `setLoading(false)` in `finally`. Never in `try` only.
4. **One source of truth per notification.** If an axios interceptor already surfaces errors globally, page-level catch blocks must not re-toast.

---

## Navigation UX

1. Route changes must reset scroll. Enforced via `<ScrollToTop />` mounted inside the top-level `<BrowserRouter>` in `App.js`. Do not remove or move this component.
2. Route changes must move keyboard focus to `<main>`. Enforced via `<FocusOnRouteChange />` next to `<ScrollToTop />`. Every layout's `<main>` must have `tabIndex={-1}`.
3. All modals/drawers/mobile menus must call `useBodyScrollLock(isOpen)` from `frontend/src/hooks/useBodyScrollLock.js`. No raw fixed overlays without it.
4. No raw numeric or arbitrary z- values in JSX (no `z-50`, no `z-[9999]`). Use the named tokens from `tailwind.config.js`: `z-nav`, `z-dropdown`, `z-modal`, `z-toast`, `z-cookie`.

---

## Auth Invariants

1. Every backend endpoint except `/auth/*` and `/api/health` must guard with `get_current_user(request)` or `require_admin(request)`.
2. Login errors return `401` with generic message `"Invalid email or password"` — never leak whether the email exists.
3. `access_token` cookie: `httponly=True`, `secure=True`, `samesite="none"`, `max_age=3600`, `path="/"`.
4. `refresh_token` cookie: 7-day expiry, same security flags.
5. Frontend: `axios.defaults.withCredentials = true` is set globally in `App.js` — do not override per-call.
6. `fetch()` calls must include `credentials: 'include'` manually.
7. Role check pattern: `const role = user?.user_role || user?.role` — never just `user.role`.

---

## CORS Invariants

1. `allow_origins=["*"]` with `allow_credentials=True` is **invalid** — always use explicit origin list.
2. New deployment URLs must be added to `_allowed_origins` in `server.py`.

---

## File Upload Invariants

1. All uploads go through `put_object()` in `core.py` → Cloudinary.
2. Store `result["url"]` in DB. **Never** `result["path"]`.
3. Audio files (WAV/MP3/FLAC) → `resource_type="video"` (Cloudinary convention).
4. Stream/download endpoints use `302 RedirectResponse(url=cloudinary_url)` — never proxy through backend.
5. Beat audio uploads also generate watermarked preview — both URLs stored.

---

## Subscription / Payment Invariants

1. Feature gates: `check_feature_access(user_plan, feature_name)` — never inline role/plan checks for paid features.
2. Stripe uses `stripe` SDK directly — not `emergentintegrations` (dead package).
3. Revenue share: Free 80/20, Rise 95/5, Pro 100/0 (artist keeps the first number).
4. Platform fee on beat sales is admin-configurable — read from DB, not hardcoded.

---

## Brand / Design Invariants

1. **Brand colors are fixed:**
   - `#7C4DFF` — PRIMARY (buttons, links, accents)
   - `#E040FB` — SECONDARY (highlights, gradients)
   - `#FFD700` — HIGHLIGHT (gold badges, premium)
   - `#FF3B30` — ALERT (errors, destructive)
2. Never introduce a new brand color without explicit user approval.
3. Tailwind arbitrary-value hex must match one of the four above — no `#7468F8`, `#0095FF`, etc. unless explicitly sanctioned (the login page's blue gradient is a known exception — do not propagate).

---

## Structural Invariants (adding new code)

### New backend endpoint
- [ ] Lives in `backend/routes/*.py` or `server.py`
- [ ] Has `get_current_user` or `require_admin` auth guard
- [ ] Router registered at bottom of `server.py`
- [ ] Python syntax check passes

### New frontend page
- [ ] Lives in `frontend/src/pages/`
- [ ] API method added to `frontend/src/services/api.js`
- [ ] Route registered in `App.js`
- [ ] Nav item in `DashboardLayout.jsx` with role guard (if user-visible)
- [ ] `npm run build` passes

---

## Known Dead Features — do not "fix" without migration

- AI routes (`ai_routes.py`) — `EMERGENT_LLM_KEY` is dead. 500 errors are expected until replaced with real OpenAI key.
- Google login — disabled intentionally. Button shows toast "coming soon."
- Spotify Canvas upload — `content_routes.py` still references dead Emergent storage.
- `emergentintegrations` Stripe wrapper — must refactor to direct `stripe` SDK.

---

## Commit Hygiene

1. One logical change per commit.
2. Commit only to `main`. No feature branches.
3. Commit messages must **not** contain: `Claude`, `AI`, `generated`, `Co-Authored-By`.
4. Never commit `.env` files or Cloudinary/Stripe keys.

---

## Historical Bugs — Do Not Regress

- CORS: `allow_origins=["*"]` + `allow_credentials=True` combo (fixed, never restore)
- File storage on `integrations.emergentagent.com` (dead, migrated to Cloudinary)
- Revenue export via plain `href` links (fixed — must use axios with `withCredentials`)
- Notification dropdown mobile positioning (fixed with `fixed` positioning)
- `legacy-peer-deps=true` in `.npmrc` (required for Vercel — do not remove)
