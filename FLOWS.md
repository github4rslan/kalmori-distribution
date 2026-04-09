# Kalmori — Flow Testing, Validation & UI/UX Standards

> **Instructions for AI agents (Codex, Claude, etc.):**
> Before touching any page, read this file in full. Every flow, validation rule, UI standard, and mobile/web requirement is defined here. Your job is to make sure everything in this document is implemented correctly and consistently across the entire codebase.

---

## 1. Design System — Non-Negotiable Rules

### Brand Colors (never introduce new ones)
| Token | Hex | Usage |
|-------|-----|-------|
| PRIMARY | `#7C4DFF` | Buttons, links, active states, focus rings |
| SECONDARY | `#E040FB` | Gradients, highlights, accents |
| HIGHLIGHT | `#FFD700` | Gold badges, premium, pending states |
| ALERT | `#EF4444` | Errors, rejections, destructive actions |
| SUCCESS | `#22C55E` | Approved, live, completed states |
| WARNING | `#FF9500` | Processing, in-progress states |

### Typography
- **Page titles**: `text-xl sm:text-2xl font-bold text-white`
- **Section headings**: `text-base font-semibold text-white`
- **Body**: `text-sm text-white` or `text-sm text-[#A1A1AA]`
- **Labels/metadata**: `text-[11px] text-[#555] uppercase tracking-wider`
- **Monospace** (ISRC, UPC, codes): `font-mono text-[#E040FB]`

### Status Badge Standard
Every status badge must follow this exact pattern — never just show raw DB values like `distributed` or `pending_review`:

| DB Status | Display Label | Color |
|-----------|--------------|-------|
| `distributed` | Live | `#22C55E` |
| `pending_review` | Under Review | `#FFD700` |
| `processing` | Processing | `#FF9500` |
| `rejected` | Rejected | `#EF4444` |
| `draft` | Draft | `#A1A1AA` |
| `approved` | Approved | `#22C55E` |
| `pending` | Pending | `#FFD700` |
| `completed` | Completed | `#22C55E` |
| `suspended` | Suspended | `#EF4444` |

Badge pattern:
```jsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
  style={{ backgroundColor: `${color}15`, color }}>
  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
  {label}
</span>
```

### Backgrounds & Cards
- Page background: `#0a0a0a`
- Card/panel background: `#111` or `#141414`
- Inner card/nested: `#0d0d0d`
- Borders: `border-white/10` (standard), `border-white/8` (subtle)
- Hover rows: `hover:bg-white/5`

---

## 2. Mobile & Web Optimization Rules

**Every page and component must pass these checks:**

### Layout
- [ ] All content fits within `px-4 sm:px-6` horizontal padding — no horizontal overflow
- [ ] Tables use `overflow-x-auto` wrapper — never break layout on mobile
- [ ] Non-critical table columns are hidden on small screens: `hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`
- [ ] Grid layouts use responsive cols: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Modals/dialogs: bottom-sheet on mobile (`items-end`), centered on desktop (`sm:items-center`)
- [ ] Filter chips/tabs: `overflow-x-auto scrollbar-hide` — horizontally scrollable on mobile

### Touch Targets
- [ ] All buttons/interactive elements minimum `h-9` (36px) height on mobile
- [ ] Tap targets minimum 44×44px — use `p-2` or larger for icon buttons
- [ ] No hover-only interactions — everything accessible via tap

### Typography Scaling
- [ ] Headings scale: `text-xl sm:text-2xl` — never fixed large on mobile
- [ ] Long text uses `truncate` with `min-w-0` on flex children

### Forms
- [ ] All inputs use `h-9 text-sm` minimum
- [ ] Form grids: `grid-cols-1 sm:grid-cols-2` — never multi-column on mobile
- [ ] Select dropdowns use native `<select>` styled with `bg-[#141414] border border-white/10 text-white`

---

## 3. User Flows — Full Journey Validation

### Flow 1: Artist Registration
**Path:** `/register` → `/select-role` → `/dashboard`

**Steps:**
1. User enters email + password + reCAPTCHA → POST `/api/auth/register`
2. Backend validates reCAPTCHA, hashes password, creates user
3. Backend sends welcome email + verification email (Resend)
4. Backend creates `new_signup` notification for ALL admins with `action_url: /admin/users/{user_id}`
5. User lands on `/select-role` → picks Artist / Producer / Label
6. User lands on `/dashboard`

**Validations to check:**
- [ ] reCAPTCHA required — form cannot submit without it
- [ ] Email already registered → shows toast error (not a blank crash)
- [ ] Password must meet minimum requirements — show inline error
- [ ] Role selection is required before accessing dashboard
- [ ] Admin notification is created with correct `related_id` = new user's ID

---

### Flow 2: Release Creation & Distribution
**Path:** `/releases/new` (wizard) → `/releases/:id` → distribute → `pending_review`

**Steps:**
1. Artist fills release wizard (title, genre, type, cover art, tracks, stores)
2. POST `/api/releases` → redirect to `/releases/:id`
3. Artist uploads cover art → POST `/api/releases/:id/cover`
4. Artist adds tracks → POST `/api/tracks` → upload audio → POST `/api/tracks/:id/audio`
5. Artist selects stores → clicks Distribute → POST `/api/distributions/submit/:id`
6. Release status becomes `pending_review`
7. Admin gets `new_submission` notification with `action_url: /admin/submissions?release={release_id}`

**Validations to check:**
- [ ] Release title required — cannot submit empty
- [ ] At least 1 track required before distribution
- [ ] Each track requires audio upload before distribution
- [ ] ISRC auto-generate button works
- [ ] Store selection: at least 1 store required
- [ ] After distribution: status badge shows **"Under Review"** (not raw `pending_review`)
- [ ] Release detail page shows yellow **"Under Review"** notice banner
- [ ] Dashboard recent releases shows cover art + correct status label
- [ ] `/releases` filter tab "Under Review" shows this release

---

### Flow 3: Admin Reviews Submission
**Path:** `/admin/submissions` → modal → approve/reject

**Steps:**
1. Admin opens Notification Bank → sees `new_submission` notification
2. Clicking notification navigates to `/admin/submissions?release={id}` and auto-opens that submission
3. Admin reviews 4 tabs: Release / Artist / Stores / Audio
4. Admin plays audio via custom player in Audio tab
5. Admin adds optional notes → clicks Approve or Reject
6. PUT `/api/admin/submissions/:id/review`
7. On approve: release status → `distributed`, distribution status → `live`
8. On reject: release status → `rejected` with `rejection_reason`
9. Artist gets `review_result` notification with `action_url: /releases/{release_id}`

**Validations to check:**
- [ ] Submission modal opens via URL param `?release=id` (notification deep link works)
- [ ] All 4 tabs render without errors even if data is missing (graceful empty states)
- [ ] Audio player plays/pauses/scrubs correctly
- [ ] Approve/Reject buttons disabled while request is in flight (`reviewing` state)
- [ ] After action: modal closes, list refreshes, submission moves to correct filter
- [ ] Artist notification is created with correct `action_url`

---

### Flow 4: Artist Sees Approved Release
**Path:** Artist notification bell → `/releases/:id`

**Steps:**
1. Artist sees bell notification: "Your release has been approved and is now live!"
2. Clicking notification navigates to `/releases/{release_id}`
3. Release detail shows green **"Live on Streaming Platforms"** banner
4. Banner lists all distributed platform chips
5. `/releases` page shows status **"Live"** badge
6. Dashboard shows **"Live"** in recent releases

**Validations to check:**
- [ ] Notification bell updates unread count within 30s (polling interval)
- [ ] Clicking notification marks it as read AND navigates
- [ ] Release detail: `distributed_platforms` array renders as chips — not empty
- [ ] Status badge everywhere says "Live" not `distributed`
- [ ] Analytics page starts accumulating data for this release

---

### Flow 5: Artist Sees Rejected Release
**Path:** Artist notification bell → `/releases/:id`

**Steps:**
1. Artist gets `review_result` notification with rejection reason
2. Clicking navigates to `/releases/{release_id}`
3. Release detail shows red **"Release Not Approved"** banner with reason
4. Artist can edit and resubmit

**Validations to check:**
- [ ] Rejection reason displays correctly (from `release.rejection_reason`)
- [ ] Status badge shows "Rejected" in red everywhere
- [ ] `/releases` filter "Rejected" shows this release
- [ ] Distribution section reappears so artist can resubmit (status !== `distributed`)

---

### Flow 6: Admin Views User Detail
**Path:** Admin Notification Bank → `new_signup` notification → `/admin/users/:userId`

**Steps:**
1. New user registers → admin gets `new_signup` notification
2. Notification has `action_url: /admin/users/{user_id}` and `related_id: user_id`
3. Clicking navigates directly to `/admin/users/:userId`
4. Admin sees full profile: stats, releases, platform breakdown, goals, beats, promotions
5. Admin can edit profile fields, change plan/role/status → PUT `/api/admin/users/:id/profile`

**Validations to check:**
- [ ] Page loads without crash (no React hooks-after-return violations)
- [ ] All `useState` hooks declared before any conditional returns
- [ ] Edit form saves correctly and refreshes data
- [ ] Back button returns to `/admin/users`
- [ ] Beats and promotions sections only render if data exists (no empty sections)

---

### Flow 7: Beat Purchase (Producer → Artist)
**Path:** Producer uploads beat → Artist buys → both get notifications

**Steps:**
1. Producer uploads beat with audio + cover + prices → POST `/api/beats`
2. Beat appears in marketplace `/beat-bank`
3. Artist purchases → POST `/api/beats/:id/purchase`
4. Producer gets `beat_sold` notification → navigates to `/wallet`
5. Artist gets purchase confirmation → navigates to `/purchases`

**Validations to check:**
- [ ] Beat audio plays watermarked preview before purchase
- [ ] Full audio unlocked after purchase
- [ ] Producer wallet balance updates
- [ ] Purchase appears in artist's `/purchases` page

---

### Flow 8: Notification Bank (Admin)
**Path:** `/admin/notifications`

**Steps:**
1. Admin opens Notification Bank
2. Sees all notifications with type icons and color coding
3. Clicking any notification marks it read AND navigates to correct page
4. Search filters by message text
5. Type filter narrows by notification type
6. Read/Unread filter works
7. Delete removes from list immediately (optimistic UI)
8. "Mark All Read" clears all unread indicators

**Validations to check:**
- [ ] Every notification type routes to correct page (see routing table below)
- [ ] Action buttons (mark read, delete) stop click propagation — don't trigger navigation
- [ ] Pagination works: prev/next pages load correctly
- [ ] Empty state shows when no notifications match filters

**Notification routing table:**
| Type | Navigates to |
|------|-------------|
| `new_signup` | `/admin/users/{related_id}` |
| `new_submission` | `/admin/submissions?release={related_id}` |
| `beat_purchased` | `/admin/beats` |
| `payout_completed` | `/admin/payouts` |
| `subscription_upgraded` | `/admin/users` |
| `new_message` | `/admin` |
| `feature_announcement` | `/admin/feature-announcements` |

---

## 4. Component-Level UI Checks

### Every Page Must Have
- [ ] Loading spinner while fetching — centered, using brand color `border-[#7C4DFF]`
- [ ] Empty state with icon + message + CTA when list is empty
- [ ] Error handling — failed API calls show `toast.error(...)`, never silent failures
- [ ] `data-testid` attributes on key elements for automated testing

### Forms
- [ ] Disabled state on submit button while request in flight
- [ ] Success toast on save: `toast.success('...')`
- [ ] Error toast on failure: `toast.error(err.response?.data?.detail || 'Action failed')`
- [ ] No bare `alert()` calls — replace with toast

### Tables
- [ ] Empty state row when no data (never just blank space)
- [ ] Hover state on rows: `hover:bg-white/5`
- [ ] Clickable rows navigate correctly (entire row, not just a button)
- [ ] Pagination controls disabled correctly at boundaries

### Modals / Drawers
- [ ] Clicking outside (backdrop) closes modal
- [ ] X button closes modal
- [ ] Scroll works within modal — `overflow-y-auto` on content area
- [ ] Actions (save/submit) pinned to bottom — not lost in scroll
- [ ] Bottom-sheet behavior on mobile (`rounded-t-3xl`, slides from bottom)

### Navigation
- [ ] Active nav item highlighted in sidebar
- [ ] Admin can switch to artist view via "Artist View" link
- [ ] Artist cannot access `/admin/*` routes (redirected)
- [ ] Unauthenticated users cannot access any `/dashboard`, `/releases`, etc.

---

## 5. Auth & Role Guard Checks

| Route | Access |
|-------|--------|
| `/dashboard`, `/releases/*`, `/analytics`, `/wallet` | Any authenticated user |
| `/beat-bank` | `producer`, `label`, `label_producer` only |
| `/label` | `label`, `label_producer` only |
| `/admin/*` | `admin` only |
| `/artist/:slug` | Public (no auth required) |
| `/presave/:campaignId` | Public |

**Role check pattern (always use this):**
```js
const role = user?.user_role || user?.role;
const isAdmin = role === 'admin';
const isProducer = ['producer', 'label', 'label_producer'].includes(role);
```

---

## 6. API Integration Checks

### Auth Headers
- All `axios` calls automatically include cookies — `axios.defaults.withCredentials = true` is set globally in `App.js`
- `fetch()` calls must manually include `credentials: 'include'`
- Never pass auth tokens manually in headers — always use cookies

### Error Handling Pattern
```js
try {
  const res = await axios.get(`${API}/endpoint`);
  // handle success
} catch (err) {
  toast.error(err.response?.data?.detail || 'Something went wrong');
} finally {
  setLoading(false);
}
```

### File Uploads
- Cover art: `POST /api/releases/:id/cover` — `multipart/form-data`, image only
- Track audio: `POST /api/tracks/:id/audio` — `multipart/form-data`, audio only (WAV/MP3/FLAC)
- Beat audio: `POST /api/beats/:id/audio` — same
- All files stored in Cloudinary — backend returns `secure_url`
- Audio files use `resource_type="video"` in Cloudinary (this is correct)

---

## 7. Known Dead / Disabled Features (Do Not Fix Without Instructions)

| Feature | Status | Notes |
|---------|--------|-------|
| AI metadata suggestions | Broken | Needs real OpenAI key — returns 500 |
| AI release strategy | Broken | Same |
| Spotify Canvas upload | Broken | Needs Cloudinary migration |
| Google login | Disabled | Shows toast "Google login coming soon" |
| Stripe subscriptions | Broken | Needs refactor from `emergentintegrations` to `stripe` SDK |

**Do not attempt to fix these unless explicitly asked. They are expected to fail.**

---

## 8. Quick Smoke Test Checklist

Run these after any change to verify nothing is broken:

### Backend
```bash
cd backend
# Syntax check all Python files
python -c "
import ast, os, sys
errors = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['__pycache__','venv','.venv']]
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            try: ast.parse(open(path, encoding='utf-8').read())
            except SyntaxError as e: errors.append(f'{path}: {e}')
if errors: [print(e) for e in errors]; sys.exit(1)
else: print('All Python files OK')
"

# Import check
python -c "import server; print('Backend imports OK')"

# Health check (server must be running)
curl -s http://localhost:8000/api/health
```

### Frontend
```bash
cd frontend
npm run build 2>&1 | tail -20
```

### Manual Flow Tests (in browser)
- [ ] Login as admin → see admin dashboard
- [ ] Login as artist → see artist dashboard  
- [ ] Open `/releases` → filter chips visible, cover art shows
- [ ] Open a distributed release → green "Live on Stores" banner + platform chips
- [ ] Open a pending release → yellow "Under Review" banner
- [ ] Open `/admin/submissions` → table loads, click row opens modal
- [ ] Open `/admin/notifications` → click a notification → navigates correctly
- [ ] Open `/admin/users/:id` → page loads without crash

---

## 9. Commit Rules

- Always run Python syntax check after editing any `.py` file
- Always run `npm run build` after editing frontend files before pushing
- Commit to `main` only — never create feature branches
- Never include "Claude", "AI", or "generated" in commit messages
- One logical change per commit
- Never commit `.env` files
