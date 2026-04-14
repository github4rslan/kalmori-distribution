"""Subscription Plans, Promo Codes, and Referral Program routes"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import os, uuid

from core import db, get_current_user, SUBSCRIPTION_PLANS

subscription_router = APIRouter(prefix="/api", tags=["Subscriptions"])


# ============= SUBSCRIPTION ENDPOINTS =============
@subscription_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@subscription_router.get("/subscriptions/my-plan")
async def get_my_plan(request: Request):
    user = await get_current_user(request)
    plan = user.get("plan", "free")
    plan_info = SUBSCRIPTION_PLANS.get(plan, SUBSCRIPTION_PLANS["free"])
    subscription = await db.subscriptions.find_one({"user_id": user["id"]}, {"_id": 0})
    return {
        "plan": plan,
        "name": plan_info["name"],
        "status": subscription.get("status", "active") if subscription else ("active" if plan != "free" else "free"),
        "revenue_share": plan_info["revenue_share"],
        "max_releases": plan_info.get("max_releases", 1),
        "locked_features": plan_info.get("locked", []),
    }

@subscription_router.post("/subscriptions/upgrade")
async def upgrade_subscription(plan: str, request: Request, session_id: Optional[str] = None):
    """
    Activate a plan after Stripe payment.
    - If session_id provided: verify with Stripe directly (primary path)
    - If no session_id and plan is free: allow downgrade without payment
    - Never silently swallows errors — always returns a clear message
    """
    import stripe as stripe_sdk
    user = await get_current_user(request)

    if plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    target_plan = SUBSCRIPTION_PLANS[plan]
    now = datetime.now(timezone.utc).isoformat()

    # Free downgrade — no payment needed
    if target_plan["price"] == 0:
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "free"}})
        await db.subscriptions.update_one(
            {"user_id": user["id"]},
            {"$set": {"user_id": user["id"], "plan": "free", "status": "free", "updated_at": now}},
            upsert=True
        )
        return {"message": "Plan changed to Free.", "plan": "free", "status": "free"}

    # Paid plan — must have a valid Stripe session_id
    if not session_id:
        raise HTTPException(
            status_code=400,
            detail="No payment session found. Please complete checkout first."
        )

    # Verify with Stripe directly
    stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_sdk.api_key:
        raise HTTPException(status_code=503, detail="Payment system is not configured. Please contact support.")

    try:
        session = stripe_sdk.checkout.Session.retrieve(session_id)
    except stripe_sdk.error.InvalidRequestError:
        raise HTTPException(
            status_code=400,
            detail=f"Payment session not found. If you were charged, please contact support with session ID: {session_id}"
        )
    except stripe_sdk.error.AuthenticationError:
        raise HTTPException(status_code=503, detail="Payment system authentication failed. Please contact support.")
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach payment provider. Please try again or contact support. (Ref: {session_id})"
        )

    # Validate payment status
    if session.payment_status != "paid":
        raise HTTPException(
            status_code=402,
            detail=f"Payment not completed. Status: '{session.payment_status}'. Please complete payment and try again."
        )

    # Validate session belongs to this user
    session_user_id = (session.metadata or {}).get("user_id", "")
    if session_user_id != user["id"]:
        raise HTTPException(
            status_code=403,
            detail="This payment session does not belong to your account."
        )

    # Validate plan matches what was purchased
    session_plan = (session.metadata or {}).get("plan", "")
    if session_plan and session_plan != plan:
        raise HTTPException(
            status_code=400,
            detail=f"Session was for '{session_plan}' plan but '{plan}' was requested. Please contact support."
        )

    # Check session hasn't already been used for a different upgrade (prevent replay)
    already_used = await db.payment_transactions.find_one(
        {"session_id": session_id, "payment_status": "paid"},
        {"_id": 0}
    )

    # Mark transaction as paid (idempotent)
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": "paid", "paid_at": now}},
        upsert=False
    )

    # Activate plan
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": plan}})
    await db.subscriptions.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"], "plan": plan, "status": "active",
            "price": target_plan["price"], "session_id": session_id,
            "updated_at": now
        }},
        upsert=True
    )

    return {
        "message": f"Successfully upgraded to {target_plan['name']}! Welcome.",
        "plan": plan,
        "status": "active",
        "already_active": bool(already_used),
    }

# ============= PLAN SALE CAMPAIGN =============

def _parse_dt(s: str) -> datetime:
    """Parse ISO datetime string, handling 'Z' suffix for Python < 3.11."""
    return datetime.fromisoformat(s.replace("Z", "+00:00"))

@subscription_router.get("/plan-sale")
async def get_plan_sale():
    """Public endpoint — returns active sale campaign or null."""
    sale = await db.plan_sale.find_one({"active": True}, {"_id": 0})
    if not sale:
        return {"active": False}
    # Check expiry
    if sale.get("ends_at"):
        try:
            ends = _parse_dt(sale["ends_at"])
            if ends.tzinfo is None:
                ends = ends.replace(tzinfo=timezone.utc)
            if ends < datetime.now(timezone.utc):
                await db.plan_sale.update_many({"active": True}, {"$set": {"active": False}})
                return {"active": False}
        except Exception:
            pass
    return sale

@subscription_router.get("/admin/plan-sale")
async def get_admin_plan_sale(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    sale = await db.plan_sale.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    return sale or {}

@subscription_router.put("/admin/plan-sale")
async def save_plan_sale(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    allowed = {"name", "active", "rise_discount", "pro_discount", "ends_at"}
    updates = {k: v for k, v in body.items() if k in allowed}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    # Validate discounts
    for field in ("rise_discount", "pro_discount"):
        if field in updates:
            val = float(updates[field])
            if val < 0 or val > 100:
                raise HTTPException(status_code=400, detail=f"{field} must be 0–100")
            updates[field] = val
    existing = await db.plan_sale.find_one({}, sort=[("created_at", -1)])
    if existing:
        await db.plan_sale.update_one({"_id": existing["_id"]}, {"$set": updates})
    else:
        updates["id"] = f"sale_{uuid.uuid4().hex[:12]}"
        updates.setdefault("created_at", datetime.now(timezone.utc).isoformat())
        await db.plan_sale.insert_one(updates)
    result = await db.plan_sale.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    return result


class SubscriptionCheckout(BaseModel):
    plan: str
    origin_url: str
    promo_code: Optional[str] = None

@subscription_router.post("/subscriptions/checkout")
async def create_subscription_checkout(data: SubscriptionCheckout, request: Request):
    import stripe as stripe_sdk
    user = await get_current_user(request)
    if data.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan_info = SUBSCRIPTION_PLANS[data.plan]
    if plan_info["price"] == 0:
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "free"}})
        return {"message": "Downgraded to Free", "redirect_url": None}
    stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")

    # Resolve active plan sale campaign discount first
    final_price = plan_info["price"]
    sale_discount = 0.0
    sale_doc = await db.plan_sale.find_one({"active": True}, {"_id": 0})
    if sale_doc:
        if sale_doc.get("ends_at"):
            try:
                ends = _parse_dt(sale_doc["ends_at"])
                if ends.tzinfo is None:
                    ends = ends.replace(tzinfo=timezone.utc)
                if ends < datetime.now(timezone.utc):
                    sale_doc = None
            except Exception:
                pass
    if sale_doc:
        pct_field = f"{data.plan}_discount"
        pct = float(sale_doc.get(pct_field, 0))
        if pct > 0:
            sale_discount = round(plan_info["price"] * pct / 100, 2)
            final_price = max(round(plan_info["price"] - sale_discount, 2), 0.50)

    # Resolve promo code discount (stacks on top of sale price if both present)
    promo_doc = None
    discount_amount = 0.0
    if data.promo_code:
        code_upper = data.promo_code.strip().upper()
        promo_doc = await db.promo_codes.find_one({"code": code_upper, "active": True}, {"_id": 0})
        if promo_doc:
            # Check expiry
            if promo_doc.get("expires_at"):
                try:
                    exp = _parse_dt(promo_doc["expires_at"])
                    if exp.tzinfo is None:
                        exp = exp.replace(tzinfo=timezone.utc)
                    if exp < datetime.now(timezone.utc):
                        promo_doc = None
                except Exception:
                    pass
            # Check usage limit
            if promo_doc and promo_doc.get("max_uses") and promo_doc.get("used_count", 0) >= promo_doc["max_uses"]:
                promo_doc = None
            # Check plan applicability
            if promo_doc and promo_doc.get("applicable_plans") and data.plan not in promo_doc["applicable_plans"]:
                promo_doc = None
        if promo_doc:
            if promo_doc["discount_type"] == "percent":
                discount_amount = round(final_price * promo_doc["discount_value"] / 100, 2)
            else:
                discount_amount = min(promo_doc["discount_value"], final_price)
            final_price = max(round(final_price - discount_amount, 2), 0.50)  # Stripe min $0.50

    # Build Stripe session
    try:
        session = stripe_sdk.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"Kalmori {plan_info['name']} Plan"},
                    "unit_amount": int(final_price * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{data.origin_url}/pricing?subscription=success&plan={data.plan}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{data.origin_url}/pricing?subscription=cancelled",
            metadata={
                "user_id": user["id"],
                "plan": data.plan,
                "type": "subscription",
                "promo_code": promo_doc["code"] if promo_doc else "",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not create payment session: {str(e)}")

    # Save pending transaction — promo usage incremented only after payment confirmed (via webhook)
    await db.payment_transactions.insert_one({
        "id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.id,
        "user_id": user["id"],
        "amount": final_price,
        "original_amount": plan_info["price"],
        "sale_discount": sale_discount,
        "discount_amount": discount_amount,
        "promo_code": promo_doc["code"] if promo_doc else None,
        "sale_name": sale_doc["name"] if sale_doc else None,
        "currency": "usd",
        "type": "subscription",
        "plan": data.plan,
        "payment_status": "pending",
        "provider": "stripe",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "checkout_url": session.url,
        "session_id": session.id,
        "final_price": final_price,
        "original_price": plan_info["price"],
        "sale_discount": sale_discount,
        "discount_amount": discount_amount,
    }


# ============= PROMO CODES =============
class PromoCodeCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    applicable_plans: List[str] = ["rise", "pro"]
    max_uses: int = 100
    duration_months: int = 0
    expires_at: Optional[str] = None
    active: bool = True

@subscription_router.post("/admin/promo-codes")
async def create_promo_code(data: PromoCodeCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    code_upper = data.code.strip().upper()
    existing = await db.promo_codes.find_one({"code": code_upper})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    doc = {
        "id": f"promo_{uuid.uuid4().hex[:12]}",
        "code": code_upper,
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "applicable_plans": data.applicable_plans,
        "max_uses": data.max_uses,
        "used_count": 0,
        "duration_months": data.duration_months,
        "expires_at": data.expires_at,
        "active": data.active,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.promo_codes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@subscription_router.get("/admin/promo-codes")
async def list_promo_codes(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    codes = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return codes

@subscription_router.put("/admin/promo-codes/{promo_id}")
async def update_promo_code(promo_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    allowed = {"active", "max_uses", "expires_at", "discount_value", "discount_type", "applicable_plans", "duration_months"}
    updates = {k: v for k, v in body.items() if k in allowed}
    await db.promo_codes.update_one({"id": promo_id}, {"$set": updates})
    updated = await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})
    return updated

@subscription_router.delete("/admin/promo-codes/{promo_id}")
async def delete_promo_code(promo_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.promo_codes.delete_one({"id": promo_id})
    return {"message": "Promo code deleted"}

@subscription_router.post("/promo-codes/validate")
async def validate_promo_code(request: Request):
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    promo = await db.promo_codes.find_one({"code": code, "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid or expired promo code")
    if promo.get("expires_at"):
        if datetime.fromisoformat(promo["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="This promo code has expired")
    if promo.get("max_uses") and promo.get("used_count", 0) >= promo["max_uses"]:
        raise HTTPException(status_code=400, detail="This promo code has reached its usage limit")
    return {
        "valid": True, "code": promo["code"],
        "discount_type": promo["discount_type"], "discount_value": promo["discount_value"],
        "duration_months": promo.get("duration_months", 0),
        "applicable_plans": promo.get("applicable_plans", ["rise", "pro"]),
    }

@subscription_router.post("/promo-codes/redeem")
async def redeem_promo_code(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    code = body.get("code", "").strip().upper()
    plan = body.get("plan", "")
    promo = await db.promo_codes.find_one({"code": code, "active": True})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    await db.promo_codes.update_one({"code": code}, {"$inc": {"used_count": 1}})
    await db.promo_redemptions.insert_one({
        "id": f"redemption_{uuid.uuid4().hex[:12]}",
        "user_id": user["id"], "promo_id": promo["id"], "code": code, "plan": plan,
        "discount_type": promo["discount_type"], "discount_value": promo["discount_value"],
        "redeemed_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": f"Promo code {code} applied successfully"}


# ============= REFERRAL PROGRAM =============
@subscription_router.get("/referral/my-link")
async def get_referral_link(request: Request):
    user = await get_current_user(request)
    existing = await db.referrals.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        return existing
    ref_code = f"KAL{user['id'][-6:].upper()}"
    doc = {
        "id": f"ref_{uuid.uuid4().hex[:12]}",
        "user_id": user["id"],
        "referral_code": ref_code,
        "total_referrals": 0,
        "successful_referrals": 0,
        "rewards_earned": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.referrals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@subscription_router.get("/referral/stats")
async def get_referral_stats(request: Request):
    user = await get_current_user(request)
    ref = await db.referrals.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ref:
        return {"total_referrals": 0, "successful_referrals": 0, "rewards_earned": 0, "referred_users": []}
    referred = await db.referral_signups.find(
        {"referrer_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {**ref, "referred_users": referred}

@subscription_router.post("/referral/validate")
async def validate_referral_code(request: Request):
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="No referral code provided")
    ref = await db.referrals.find_one({"referral_code": code}, {"_id": 0})
    if not ref:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    referrer = await db.users.find_one({"id": ref["user_id"]}, {"_id": 0, "artist_name": 1, "name": 1})
    return {
        "valid": True,
        "code": code,
        "referrer_name": referrer.get("artist_name") or referrer.get("name", "A Kalmori user"),
        "reward": "Both you and the referrer get a free month of Rise!",
    }

@subscription_router.post("/referral/complete")
async def complete_referral(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        return {"message": "No referral code"}
    ref = await db.referrals.find_one({"referral_code": code})
    if not ref or ref["user_id"] == user["id"]:
        return {"message": "Invalid referral"}
    existing = await db.referral_signups.find_one({"referred_user_id": user["id"]})
    if existing:
        return {"message": "Already used a referral"}
    await db.referral_signups.insert_one({
        "id": f"refsignup_{uuid.uuid4().hex[:12]}",
        "referrer_id": ref["user_id"],
        "referred_user_id": user["id"],
        "referred_name": user.get("artist_name") or user.get("name", ""),
        "referred_email": user.get("email", ""),
        "referral_code": code,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.referrals.update_one({"referral_code": code}, {
        "$inc": {"total_referrals": 1, "successful_referrals": 1, "rewards_earned": 1}
    })
    referrer = await db.users.find_one({"id": ref["user_id"]})
    if referrer and referrer.get("plan") == "free":
        await db.users.update_one({"id": ref["user_id"]}, {"$set": {"plan": "rise"}})
    await db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": ref["user_id"],
        "type": "referral_reward",
        "message": f"Your referral {user.get('artist_name', user.get('name', 'Someone'))} just signed up! You earned a free month of Rise.",
        "read": False,
        "action_url": "/wallet",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if user.get("plan") == "free":
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "rise"}})
    await db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user["id"],
        "type": "referral_welcome",
        "message": "Welcome! Your referral code gave you a free month of Rise. Enjoy!",
        "read": False,
        "action_url": "/dashboard",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "Referral completed! Both you and the referrer earned a free month of Rise."}

@subscription_router.get("/admin/referral/overview")
async def admin_referral_overview(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_referrals = await db.referral_signups.count_documents({})
    total_referrers = await db.referrals.count_documents({"total_referrals": {"$gt": 0}})
    all_signups = await db.referral_signups.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    top_referrers = await db.referrals.find(
        {"total_referrals": {"$gt": 0}}, {"_id": 0}
    ).sort("successful_referrals", -1).to_list(10)
    for ref in top_referrers:
        u = await db.users.find_one({"id": ref["user_id"]}, {"_id": 0, "artist_name": 1, "email": 1, "name": 1})
        if u:
            ref["artist_name"] = u.get("artist_name") or u.get("name", "")
            ref["email"] = u.get("email", "")
    return {
        "total_referrals": total_referrals,
        "total_referrers": total_referrers,
        "recent_signups": all_signups[:20],
        "top_referrers": top_referrers,
    }
