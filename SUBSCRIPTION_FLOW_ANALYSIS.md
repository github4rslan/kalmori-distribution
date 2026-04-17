# Subscription Upgrade Flow — Complete Analysis
**Date:** 2026-04-14  
**Status:** Broken — plan does not activate after payment

---

## How the Flow Is Supposed to Work

```
User clicks "Upgrade to Pro"
        ↓
POST /api/subscriptions/checkout  (backend creates Stripe session, saves txn as "pending")
        ↓
User is redirected to checkout.stripe.com
        ↓
User pays with card
        ↓
Stripe redirects to: /pricing?subscription=success&plan=pro&session_id=cs_xxx
        ↓
PricingPage calls POST /api/subscriptions/upgrade?plan=pro&session_id=cs_xxx
        ↓
Backend verifies session with Stripe → marks txn "paid" → sets user.plan = "pro"
        ↓
Frontend refreshes auth → user badge shows "PRO" → redirect to /settings
```

---

## Bugs Found (in order of severity)

---

### BUG 1 — Critical: `session_id` metadata mismatch (upgrade always fails)

**File:** `backend/routes/subscription_routes.py` line 47

**Code:**
```python
if session.payment_status == "paid" and session.metadata.get("user_id") == user["id"]:
```

**Problem:**  
`user["id"]` is the MongoDB user ID (a UUID string like `usr_abc123`).  
`session.metadata.get("user_id")` is what was stored when creating the Stripe session.

Looking at the checkout creation (line 208):
```python
metadata={"user_id": user["id"], "plan": data.plan, ...}
```

This looks correct — BUT the Stripe Checkout Session metadata values are **always strings**, and `user["id"]` is already a string. So this should match.

**However**, the real problem is the `except Exception: pass` on line 52. If the Stripe API call fails for ANY reason (network, wrong API key, invalid session ID), it silently swallows the error and the transaction never gets marked "paid". Then the check on line 54 finds no paid transaction and returns **402 Payment Required**.

The user paid, but the system has no way to know because the error is hidden.

---

### BUG 2 — Critical: `success_url` always points to `/pricing`, never `/settings`

**File:** `backend/routes/subscription_routes.py` line 206

```python
success_url=f"{data.origin_url}/pricing?subscription=success&plan={data.plan}&session_id={{CHECKOUT_SESSION_ID}}",
```

When checkout is started from **SettingsPage**, `origin_url` = `https://kalmori-distribution.vercel.app`.  
So success_url = `https://kalmori-distribution.vercel.app/pricing?subscription=success&plan=pro&session_id=cs_xxx`

This is fine for PricingPage — it handles the params. BUT:
- After successful upgrade, PricingPage does `setTimeout(() => window.location.assign('/settings'), 500)` 
- The user sees `/pricing` flash briefly, then `/settings`
- If anything goes wrong during that 500ms (network, JS error), the user stays on `/pricing` with no feedback

The bigger issue: **SettingsPage also added upgrade handling** (`useEffect` checks for `subscription=success` in query params) — but Stripe NEVER redirects to `/settings`, it always goes to `/pricing`. So the SettingsPage handler is dead code.

---

### BUG 3 — Critical: Race condition / token expiry during upgrade

**File:** `frontend/src/pages/PricingPage.jsx` line 119–129

```javascript
useEffect(() => {
  // ...
  axios.post(upgradeUrl, {}, { withCredentials: true })
    .then(async () => {
      updateUser?.({ plan });
      await checkAuth?.();
      ...
    }).catch(() => toast.error('Failed to activate plan'));
}, []);
```

The Stripe checkout session can take several minutes (user fills card details slowly). During that time, the JWT `access_token` cookie (60 min expiry from login) may still be valid — but if the user had been logged in for a while before starting checkout, the token could expire during or just after Stripe checkout. The upgrade call would then get a 401, caught by `.catch()`, and just show "Failed to activate plan" with no retry mechanism.

---

### BUG 4 — Moderate: `plan !== current_plan` guard prevents re-activation

**File:** `backend/routes/subscription_routes.py` line 40

```python
if target_plan["price"] > 0 and plan != current_plan:
```

If admin had manually set the user to "rise" plan, and user is now upgrading to "pro", this is fine.  
BUT: if for any reason the DB already shows `plan = "pro"` (e.g. a partial previous attempt), this guard skips the payment check entirely and upgrades immediately without verifying payment. This is a **security issue** — anyone who knows their DB plan is already "pro" can call this endpoint without paying.

More practically: if a user pays for Pro but the upgrade fails on first call, the DB plan is still "rise". On retry with the same `session_id`, the Stripe session is retrieved and verified correctly — this part is fine. But if retried without `session_id`, it fails with 402.

---

### BUG 5 — Moderate: No webhook = no reliable payment confirmation

The current design relies on the **success redirect URL** to confirm payment. This is fragile:
- User could close the browser tab after paying before Stripe redirects
- Network issues could break the redirect
- The correct approach is a **Stripe webhook** (`checkout.session.completed`) that independently marks the transaction as "paid"

Currently there is no webhook handler at all.

---

### BUG 6 — Minor: `updateUser({ plan })` updates frontend state with string only

**File:** `frontend/src/pages/PricingPage.jsx` line 124

```javascript
updateUser?.({ plan });
```

`plan` here is a string like `"pro"`. The `updateUser` function merges this into the user context. But the sidebar plan badge reads `user?.plan || user?.user_role` — if `updateUser` doesn't properly deep-merge, the badge might not refresh. The `checkAuth()` call on line 125 should fix this by refetching the full user, but it's `await`ed after `updateUser`, meaning the user briefly sees stale data.

---

### BUG 7 — Minor: Promo usage counted before payment confirmed

**File:** `backend/routes/subscription_routes.py` line 215–216

```python
if promo_doc:
    await db.promo_codes.update_one({"code": promo_doc["code"]}, {"$inc": {"used_count": 1}})
```

Promo usage is incremented when the Stripe session is **created**, not when payment is **confirmed**. If the user abandons checkout after seeing the Stripe page, the promo code usage count is still incremented. Over time this causes promo codes to appear "used up" when they weren't actually redeemed.

---

## The Fix Plan (recommended approach)

### Phase 1 — Immediate fix (no webhook needed)

**Step 1: Remove the silent `except: pass` — surface the actual error**
- In the upgrade endpoint, if Stripe verification fails, log the error and return it to the frontend
- Add a specific error message: "Could not verify payment with Stripe. Please contact support with your session ID."

**Step 2: Simplify the upgrade flow — trust Stripe's redirect URL**
- Remove the `payment_status: "paid"` DB check entirely
- Instead: verify directly with Stripe API using `session_id`, confirm `payment_status == "paid"` and `metadata.user_id == user["id"]`, then upgrade immediately
- No more "pending transaction" dependency

**Step 3: Add a manual retry button on PricingPage and SettingsPage**
- If upgrade fails, show: "Payment received but plan not activated. [Click here to activate]"
- Store `session_id` in localStorage as fallback

**Step 4: Fix the success redirect flow**
- After upgrade success on PricingPage, do a hard page reload to `/settings` (not `assign` after `history.replaceState`)
- Make sure `checkAuth()` completes before redirect

### Phase 2 — Proper fix (with Stripe webhook)

**Add `POST /api/webhooks/stripe`:**
- Listens for `checkout.session.completed`
- Verifies Stripe signature
- Marks transaction "paid"
- Sets `user.plan` in DB
- No frontend dependency — works even if user closes browser

---

## Current State Summary

| Step | Status | Issue |
|------|--------|-------|
| User clicks Upgrade | ✅ Works | |
| Stripe session created | ✅ Works | Promo usage incremented too early |
| Stripe checkout page | ✅ Works | |
| Stripe payment | ✅ Works | |
| Stripe redirects to /pricing | ✅ Works | |
| session_id passed to upgrade | ✅ Works | |
| Stripe API verification | ❌ Silently fails | `except: pass` hides real error |
| Transaction marked "paid" | ❌ Never happens | Depends on silent verification |
| Plan activated in DB | ❌ Never happens | Fails with 402 |
| Frontend shows new plan | ❌ Never happens | |

---

## Root Cause (one sentence)

The Stripe API call in the upgrade endpoint is wrapped in `except: pass`, so if the verification fails for any reason (network, API key issue, wrong session), the error is swallowed, the transaction stays "pending", and the 402 is returned — leaving the user on Rise despite having paid.

---

## What to Build

1. **Remove the payment transaction dependency** — verify with Stripe directly, upgrade immediately if `payment_status == "paid"`
2. **Expose errors** — never `pass` on exceptions in payment flows; always return a clear error
3. **Add Stripe webhook** — reliable background confirmation independent of redirect
4. **Move promo increment** — only count promo usage after payment confirmed
5. **Better UX** — clear error messages, retry button, don't silently fail
