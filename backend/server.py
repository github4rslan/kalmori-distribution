"""
TuneDrop / Kalmori - Music Distribution Platform
Modularized server entry point.
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from io import BytesIO
import os
import logging
import uuid
import random

# Import shared core (db, models, helpers)
from core import (
    db, client, logger, APP_NAME, EMERGENT_KEY,
    # Models
    UserCreate, UserLogin, UserResponse, ArtistProfile,
    ReleaseCreate, ReleaseResponse, TrackCreate, TrackResponse,
    DistributionStore, WalletResponse, WithdrawalRequest, PaymentCheckout,
    AnalyticsResponse, AIMetadataRequest, AIDescriptionRequest,
    Collaborator, SplitCreate, SplitUpdate,
    AdminReviewAction, AdminUserUpdate,
    # Helpers
    hash_password, verify_password, create_access_token, create_refresh_token,
    generate_upc, generate_isrc, get_current_user, require_admin,
    init_storage, put_object, get_object, get_jwt_secret, JWT_ALGORITHM,
)
import jwt
import requests
import secrets

# Create the main app
app = FastAPI(title="TuneDrop Music Distribution API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Verify reCAPTCHA if token provided
    recaptcha_secret = os.environ.get("RECAPTCHA_SECRET_KEY")
    if recaptcha_secret and user_data.recaptcha_token:
        try:
            recap_resp = requests.post("https://www.google.com/recaptcha/api/siteverify",
                data={"secret": recaptcha_secret, "response": user_data.recaptcha_token}, timeout=10)
            recap_data = recap_resp.json()
            if not recap_data.get("success"):
                raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
        except requests.RequestException:
            pass  # Allow registration if reCAPTCHA service is down

    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "id": user_id, "email": email,
        "name": user_data.name or user_data.artist_name or email.split("@")[0],
        "artist_name": user_data.artist_name or user_data.name or email.split("@")[0],
        "password_hash": hash_password(user_data.password),
        "role": "artist", "user_role": user_data.user_role or "artist", "plan": "free",
        "avatar_url": None, "legal_name": user_data.legal_name or "",
        "country": user_data.country or "", "state": user_data.state or "",
        "town": user_data.town or "", "post_code": user_data.post_code or "",
        "phone_number": user_data.phone_number or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    await db.wallets.insert_one({
        "user_id": user_id, "balance": 0.0, "pending_balance": 0.0,
        "currency": "USD", "total_earnings": 0.0, "total_withdrawn": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"access_token": access_token, "refresh_token": refresh_token, "user": user_doc}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(user["id"], email)
    refresh_token = create_refresh_token(user["id"])
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    user.pop("password_hash", None)
    return {"access_token": access_token, "refresh_token": refresh_token, "user": user}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user["id"], user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/session")
async def process_google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    try:
        resp = requests.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=10)
        resp.raise_for_status()
        session_data = resp.json()
        email = session_data["email"].lower()
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {
                "id": user_id, "email": email, "name": session_data["name"],
                "artist_name": session_data["name"], "password_hash": "",
                "role": "artist", "plan": "free",
                "avatar_url": session_data.get("picture"), "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
            await db.wallets.insert_one({
                "user_id": user_id, "balance": 0.0, "pending_balance": 0.0,
                "currency": "USD", "total_earnings": 0.0, "total_withdrawn": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        access_token = create_access_token(user["id"], email)
        refresh_token_val = create_refresh_token(user["id"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        response.set_cookie(key="refresh_token", value=refresh_token_val, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=400, detail="Failed to process Google authentication")

# ============= ARTIST ENDPOINTS =============
@api_router.get("/artists/profile")
async def get_artist_profile(request: Request):
    user = await get_current_user(request)
    profile = await db.artist_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        return {"user_id": user["id"], "artist_name": user.get("artist_name", user["name"]),
                "bio": None, "genre": None, "country": None, "website": None,
                "spotify_url": None, "apple_music_url": None, "instagram": None, "twitter": None}
    return profile

@api_router.put("/artists/profile")
async def update_artist_profile(profile: ArtistProfile, request: Request):
    user = await get_current_user(request)
    profile_doc = profile.model_dump()
    profile_doc["user_id"] = user["id"]
    profile_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.artist_profiles.update_one({"user_id": user["id"]}, {"$set": profile_doc}, upsert=True)
    await db.users.update_one({"id": user["id"]}, {"$set": {"artist_name": profile.artist_name}})
    return {"message": "Profile updated", **profile_doc}

@api_router.post("/artists/avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/avatars/{user['id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type)
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_url": result["path"]}})
    return {"avatar_url": result["path"]}

# ============= RELEASE ENDPOINTS =============
@api_router.post("/releases", response_model=ReleaseResponse)
async def create_release(release: ReleaseCreate, request: Request):
    user = await get_current_user(request)
    release_id = f"rel_{uuid.uuid4().hex[:12]}"
    release_doc = {"id": release_id, "upc": generate_upc(), "artist_id": user["id"],
        "artist_name": user.get("artist_name", user["name"]), **release.model_dump(),
        "cover_art_url": None, "status": "draft", "track_count": 0,
        "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.releases.insert_one(release_doc)
    release_doc.pop("_id", None)
    return release_doc

@api_router.get("/releases")
async def get_releases(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    query = {"artist_id": user["id"]}
    if status: query["status"] = status
    return await db.releases.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/releases/{release_id}")
async def get_release(release_id: str, request: Request):
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": release_id, "artist_id": user["id"]}, {"_id": 0})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    release["tracks"] = await db.tracks.find({"release_id": release_id}, {"_id": 0}).sort("track_number", 1).to_list(50)
    return release

@api_router.post("/releases/{release_id}/cover")
async def upload_cover_art(release_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": release_id, "artist_id": user["id"]})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    if not file.content_type.startswith("image/"): raise HTTPException(status_code=400, detail="File must be an image")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/covers/{user['id']}/{release_id}/{uuid.uuid4()}.{ext}"
    result = put_object(path, await file.read(), file.content_type)
    await db.releases.update_one({"id": release_id}, {"$set": {"cover_art_url": result["path"]}})
    return {"cover_art_url": result["path"]}

@api_router.put("/releases/{release_id}")
async def update_release(release_id: str, release: ReleaseCreate, request: Request):
    user = await get_current_user(request)
    existing = await db.releases.find_one({"id": release_id, "artist_id": user["id"]})
    if not existing: raise HTTPException(status_code=404, detail="Release not found")
    await db.releases.update_one({"id": release_id}, {"$set": {**release.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Release updated"}

@api_router.delete("/releases/{release_id}")
async def delete_release(release_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.releases.delete_one({"id": release_id, "artist_id": user["id"], "status": "draft"})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Release not found or cannot be deleted")
    await db.tracks.delete_many({"release_id": release_id})
    return {"message": "Release deleted"}

# ============= TRACK ENDPOINTS =============
@api_router.post("/tracks", response_model=TrackResponse)
async def create_track(track: TrackCreate, request: Request):
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": track.release_id, "artist_id": user["id"]})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    track_id = f"trk_{uuid.uuid4().hex[:12]}"
    track_doc = {"id": track_id, "isrc": generate_isrc(), "artist_id": user["id"],
        **track.model_dump(), "audio_url": None, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()}
    await db.tracks.insert_one(track_doc)
    await db.releases.update_one({"id": track.release_id}, {"$inc": {"track_count": 1}})
    track_doc.pop("_id", None)
    return track_doc

@api_router.post("/tracks/{track_id}/audio")
async def upload_audio(track_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    track = await db.tracks.find_one({"id": track_id, "artist_id": user["id"]})
    if not track: raise HTTPException(status_code=404, detail="Track not found")
    allowed = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav", "audio/flac"]
    if file.content_type not in allowed: raise HTTPException(status_code=400, detail="File must be WAV, MP3, or FLAC")
    ext = file.filename.split(".")[-1] if "." in file.filename else "wav"
    path = f"{APP_NAME}/audio/{user['id']}/{track['release_id']}/{track_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type)
    duration = len(data) // (44100 * 2 * 2)
    await db.tracks.update_one({"id": track_id}, {"$set": {"audio_url": result["path"], "duration": duration, "status": "ready"}})
    return {"audio_url": result["path"], "duration": duration}

@api_router.get("/tracks/{track_id}/stream")
async def stream_audio(track_id: str, request: Request):
    await get_current_user(request)
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track or not track.get("audio_url"): raise HTTPException(status_code=404, detail="Track or audio not found")
    data, content_type = get_object(track["audio_url"])
    return StreamingResponse(BytesIO(data), media_type=content_type,
        headers={"Content-Disposition": f"inline; filename={track['title']}.{track['audio_url'].split('.')[-1]}"})

@api_router.delete("/tracks/{track_id}")
async def delete_track(track_id: str, request: Request):
    user = await get_current_user(request)
    track = await db.tracks.find_one({"id": track_id, "artist_id": user["id"]})
    if not track: raise HTTPException(status_code=404, detail="Track not found")
    await db.tracks.delete_one({"id": track_id})
    await db.releases.update_one({"id": track["release_id"]}, {"$inc": {"track_count": -1}})
    return {"message": "Track deleted"}

# ============= DISTRIBUTION =============
DSP_STORES = [
    {"store_id": "spotify", "store_name": "Spotify", "icon": "spotify"},
    {"store_id": "apple_music", "store_name": "Apple Music", "icon": "apple"},
    {"store_id": "amazon_music", "store_name": "Amazon Music", "icon": "amazon"},
    {"store_id": "youtube_music", "store_name": "YouTube Music", "icon": "youtube"},
    {"store_id": "tidal", "store_name": "Tidal", "icon": "tidal"},
    {"store_id": "deezer", "store_name": "Deezer", "icon": "deezer"},
    {"store_id": "soundcloud", "store_name": "SoundCloud", "icon": "soundcloud"},
    {"store_id": "pandora", "store_name": "Pandora", "icon": "pandora"},
    {"store_id": "tiktok", "store_name": "TikTok", "icon": "tiktok"},
    {"store_id": "instagram", "store_name": "Instagram/Facebook", "icon": "instagram"},
]

@api_router.get("/distributions/stores")
async def get_distribution_stores():
    return DSP_STORES

@api_router.post("/distributions/submit/{release_id}")
async def submit_distribution(release_id: str, stores: List[str], request: Request):
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": release_id, "artist_id": user["id"]}, {"_id": 0})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    if not release.get("cover_art_url"): raise HTTPException(status_code=400, detail="Release must have cover art")
    tracks = await db.tracks.find({"release_id": release_id, "audio_url": {"$ne": None}}).to_list(50)
    if not tracks: raise HTTPException(status_code=400, detail="Release must have at least one track with audio")
    if user.get("plan") != "free" and release.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Payment required before distribution")
    for store_id in stores:
        store = next((s for s in DSP_STORES if s["store_id"] == store_id), None)
        if store:
            await db.distributions.update_one({"release_id": release_id, "store_id": store_id},
                {"$set": {"release_id": release_id, "artist_id": user["id"], "store_id": store_id,
                    "store_name": store["store_name"], "status": "pending_review",
                    "submitted_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    submission_id = f"sub_{uuid.uuid4().hex[:12]}"
    await db.submissions.update_one({"release_id": release_id},
        {"$set": {"id": submission_id, "release_id": release_id, "artist_id": user["id"],
            "artist_name": user.get("artist_name", user["name"]), "release_title": release["title"],
            "release_type": release["release_type"], "genre": release.get("genre", ""),
            "track_count": len(tracks), "stores": stores, "status": "pending_review",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_at": None, "reviewed_by": None, "review_notes": None}}, upsert=True)
    await db.releases.update_one({"id": release_id}, {"$set": {"status": "pending_review", "submitted_stores": stores}})
    await db.notifications.insert_one({"id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": "admin",
        "type": "new_submission", "message": f"New submission: {release['title']} by {user.get('artist_name', user['name'])}",
        "release_id": release_id, "read": False, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": f"Submitted for review to {len(stores)} stores", "stores": stores, "status": "pending_review"}

@api_router.get("/distributions/{release_id}")
async def get_distribution_status(release_id: str, request: Request):
    user = await get_current_user(request)
    return await db.distributions.find({"release_id": release_id, "artist_id": user["id"]}, {"_id": 0}).to_list(20)

# ============= PAYMENTS (Stripe) =============
RELEASE_PRICES = {"single": 20.00, "ep": 35.00, "album": 50.00}

@api_router.post("/payments/checkout")
async def create_checkout(checkout: PaymentCheckout, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": checkout.release_id, "artist_id": user["id"]})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    if user.get("plan") == "free":
        await db.releases.update_one({"id": checkout.release_id}, {"$set": {"payment_status": "free_tier"}})
        return {"message": "Free tier activated", "redirect_url": None}
    amount = RELEASE_PRICES.get(release["release_type"], 20.00)
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=amount, currency="usd",
        success_url=f"{checkout.origin_url}/releases/{checkout.release_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{checkout.origin_url}/releases/{checkout.release_id}?payment=cancelled",
        metadata={"release_id": checkout.release_id, "user_id": user["id"], "release_type": release["release_type"]}))
    await db.payment_transactions.insert_one({"id": f"txn_{uuid.uuid4().hex[:12]}", "session_id": session.session_id,
        "user_id": user["id"], "release_id": checkout.release_id, "amount": amount, "currency": "usd",
        "payment_status": "pending", "provider": "stripe", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn["payment_status"] != "paid":
            await db.payment_transactions.update_one({"session_id": session_id},
                {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
            await db.releases.update_one({"id": txn["release_id"]}, {"$set": {"payment_status": "paid"}})
    return {"status": status.status, "payment_status": status.payment_status,
        "amount": status.amount_total / 100, "currency": status.currency}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.payment_status == "paid":
            release_id = webhook_response.metadata.get("release_id")
            if release_id:
                await db.releases.update_one({"id": release_id}, {"$set": {"payment_status": "paid"}})
                await db.payment_transactions.update_one({"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# ============= WALLET =============
@api_router.get("/wallet", response_model=WalletResponse)
async def get_wallet(request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0})
    if not wallet:
        wallet = {"balance": 0.0, "pending_balance": 0.0, "currency": "USD", "total_earnings": 0.0, "total_withdrawn": 0.0}
    return wallet

@api_router.post("/wallet/withdraw")
async def request_withdrawal(withdrawal: WithdrawalRequest, request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["id"]})
    if not wallet or wallet["balance"] < withdrawal.amount: raise HTTPException(status_code=400, detail="Insufficient balance")
    if withdrawal.amount < 10: raise HTTPException(status_code=400, detail="Minimum withdrawal is $10")
    withdrawal_id = f"wd_{uuid.uuid4().hex[:12]}"
    await db.withdrawals.insert_one({"id": withdrawal_id, "user_id": user["id"], "amount": withdrawal.amount,
        "method": withdrawal.method, "paypal_email": withdrawal.paypal_email, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()})
    await db.wallets.update_one({"user_id": user["id"]}, {"$inc": {"balance": -withdrawal.amount, "pending_balance": withdrawal.amount}})
    return {"message": "Withdrawal requested", "withdrawal_id": withdrawal_id}

@api_router.get("/wallet/withdrawals")
async def get_withdrawals(request: Request):
    user = await get_current_user(request)
    return await db.withdrawals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

# ============= ANALYTICS =============
@api_router.get("/analytics/overview")
async def get_analytics_overview(request: Request):
    user = await get_current_user(request)
    releases = await db.releases.find({"artist_id": user["id"]}, {"_id": 0}).to_list(100)
    release_ids = [r["id"] for r in releases]
    pipeline = [{"$match": {"release_id": {"$in": release_ids}}},
        {"$group": {"_id": None, "total_streams": {"$sum": "$streams"}, "total_downloads": {"$sum": "$downloads"}, "total_earnings": {"$sum": "$earnings"}}}]
    result = await db.royalties.aggregate(pipeline).to_list(1)
    totals = result[0] if result else {"total_streams": 0, "total_downloads": 0, "total_earnings": 0.0}
    ts = totals.get("total_streams", 0)
    streams_by_store = {"Spotify": int(ts*0.45), "Apple Music": int(ts*0.25), "YouTube Music": int(ts*0.15), "Amazon Music": int(ts*0.10), "Other": int(ts*0.05)}
    streams_by_country = {"US": int(ts*0.35), "UK": int(ts*0.15), "DE": int(ts*0.10), "CA": int(ts*0.08), "AU": int(ts*0.07), "Other": int(ts*0.25)}
    daily_streams = []
    base = totals.get("total_streams", 1000) // 30
    for i in range(30):
        d = datetime.now(timezone.utc) - timedelta(days=29-i)
        v = random.uniform(0.7, 1.3)
        daily_streams.append({"date": d.strftime("%Y-%m-%d"), "streams": int(base*v), "earnings": round(base*v*0.004, 2)})
    return {"total_streams": ts, "total_downloads": totals.get("total_downloads", 0),
        "total_earnings": round(totals.get("total_earnings", 0.0), 2), "streams_by_store": streams_by_store,
        "streams_by_country": streams_by_country, "daily_streams": daily_streams, "release_count": len(releases)}

@api_router.get("/analytics/release/{release_id}")
async def get_release_analytics(release_id: str, request: Request):
    user = await get_current_user(request)
    release = await db.releases.find_one({"id": release_id, "artist_id": user["id"]})
    if not release: raise HTTPException(status_code=404, detail="Release not found")
    royalties = await db.royalties.find({"release_id": release_id}, {"_id": 0}).to_list(100)
    return {"release_id": release_id, "title": release["title"],
        "total_streams": sum(r.get("streams", 0) for r in royalties),
        "total_earnings": round(sum(r.get("earnings", 0) for r in royalties), 2), "royalties": royalties}

@api_router.get("/analytics/trending")
async def get_trending(request: Request):
    user = await get_current_user(request)
    releases = await db.releases.find({"artist_id": user["id"]}, {"_id": 0}).to_list(100)
    trending = []
    for r in releases:
        royalties = await db.royalties.find({"release_id": r["id"]}, {"_id": 0}).to_list(10)
        streams = sum(roy.get("streams", 0) for roy in royalties)
        # Simulate trending data for releases with distributions
        if r.get("status") == "distributed" or streams > 0:
            base_streams = max(streams, random.randint(100, 5000))
            week_change = round(random.uniform(-15, 45), 1)
            trending.append({
                "release_id": r["id"], "title": r["title"], "release_type": r.get("release_type", "single"),
                "cover_art_url": r.get("cover_art_url"), "genre": r.get("genre", ""),
                "streams_this_week": int(base_streams * random.uniform(0.2, 0.4)),
                "total_streams": base_streams, "change_percent": week_change,
                "top_store": random.choice(["Spotify", "Apple Music", "YouTube Music", "TikTok"]),
                "top_country": random.choice(["US", "UK", "NG", "JM", "CA", "DE"]),
            })
    trending.sort(key=lambda x: x["streams_this_week"], reverse=True)
    return {"trending": trending[:10], "period": "last_7_days"}

# ============= SUBSCRIPTIONS =============
SUBSCRIPTION_PLANS = {
    "free": {"name": "Free", "price": 0, "revenue_share": 15, "features": ["Basic distribution", "Standard analytics"]},
    "rise": {"name": "Rise", "price": 9.99, "revenue_share": 0, "features": ["All platforms", "Keep 100% royalties", "Priority support"]},
    "pro": {"name": "Pro", "price": 19.99, "revenue_share": 0, "features": ["All Rise features", "YouTube Content ID", "Spotify Canvas", "Advanced analytics"]}
}

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/subscriptions/upgrade")
async def upgrade_subscription(plan: str, request: Request):
    user = await get_current_user(request)
    if plan not in SUBSCRIPTION_PLANS: raise HTTPException(status_code=400, detail="Invalid plan")
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": plan}})
    await db.subscriptions.update_one({"user_id": user["id"]}, {"$set": {
        "user_id": user["id"], "plan": plan, "status": "active",
        "price": SUBSCRIPTION_PLANS[plan]["price"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }}, upsert=True)
    return {"message": f"Upgraded to {SUBSCRIPTION_PLANS[plan]['name']} plan", "plan": plan}

from pydantic import BaseModel as PydanticBaseModel
class SubscriptionCheckout(PydanticBaseModel):
    plan: str
    origin_url: str

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(data: SubscriptionCheckout, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    user = await get_current_user(request)
    if data.plan not in SUBSCRIPTION_PLANS: raise HTTPException(status_code=400, detail="Invalid plan")
    plan_info = SUBSCRIPTION_PLANS[data.plan]
    if plan_info["price"] == 0:
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "free"}})
        return {"message": "Downgraded to Free", "redirect_url": None}
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url)
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=plan_info["price"], currency="usd",
        success_url=f"{data.origin_url}/pricing?subscription=success&plan={data.plan}&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{data.origin_url}/pricing?subscription=cancelled",
        metadata={"user_id": user["id"], "plan": data.plan, "type": "subscription"}))
    await db.payment_transactions.insert_one({"id": f"txn_{uuid.uuid4().hex[:12]}", "session_id": session.session_id,
        "user_id": user["id"], "amount": plan_info["price"], "currency": "usd", "type": "subscription",
        "plan": data.plan, "payment_status": "pending", "provider": "stripe",
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"checkout_url": session.url, "session_id": session.session_id}

# ============= NOTIFICATIONS =============
@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one({"id": notification_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# ============= ADMIN =============
@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_releases = await db.releases.count_documents({})
    total_tracks = await db.tracks.count_documents({})
    pending = await db.submissions.count_documents({"status": "pending_review"})
    approved = await db.submissions.count_documents({"status": "approved"})
    rejected = await db.submissions.count_documents({"status": "rejected"})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    rev = await db.payment_transactions.aggregate(pipeline).to_list(1)
    plan_pipeline = [{"$group": {"_id": "$plan", "count": {"$sum": 1}}}]
    plan_result = await db.users.aggregate(plan_pipeline).to_list(10)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    return {"total_users": total_users, "total_releases": total_releases, "total_tracks": total_tracks,
        "pending_submissions": pending, "approved_submissions": approved, "rejected_submissions": rejected,
        "total_revenue": round(rev[0]["total"] if rev else 0, 2),
        "users_by_plan": {r["_id"]: r["count"] for r in plan_result},
        "new_users_week": await db.users.count_documents({"created_at": {"$gte": week_ago}}),
        "new_releases_week": await db.releases.count_documents({"created_at": {"$gte": week_ago}})}

@api_router.get("/admin/submissions")
async def get_submissions(request: Request, status: Optional[str] = None, page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {"status": status} if status else {}
    skip = (page - 1) * limit
    total = await db.submissions.count_documents(query)
    subs = await db.submissions.find(query, {"_id": 0}).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"submissions": subs, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/admin/submissions/{release_id}")
async def get_submission_detail(release_id: str, request: Request):
    await require_admin(request)
    submission = await db.submissions.find_one({"release_id": release_id}, {"_id": 0})
    if not submission: raise HTTPException(status_code=404, detail="Submission not found")
    release = await db.releases.find_one({"id": release_id}, {"_id": 0})
    tracks = await db.tracks.find({"release_id": release_id}, {"_id": 0}).sort("track_number", 1).to_list(50)
    artist = await db.users.find_one({"id": submission["artist_id"]}, {"_id": 0, "password_hash": 0})
    return {"submission": submission, "release": release, "tracks": tracks, "artist": artist}

@api_router.put("/admin/submissions/{release_id}/review")
async def review_submission(release_id: str, review: AdminReviewAction, request: Request):
    admin = await require_admin(request)
    submission = await db.submissions.find_one({"release_id": release_id})
    if not submission: raise HTTPException(status_code=404, detail="Submission not found")
    if submission["status"] != "pending_review": raise HTTPException(status_code=400, detail="Submission already reviewed")
    new_status = "approved" if review.action == "approve" else "rejected"
    now = datetime.now(timezone.utc).isoformat()
    await db.submissions.update_one({"release_id": release_id},
        {"$set": {"status": new_status, "reviewed_at": now, "reviewed_by": admin["id"], "review_notes": review.notes}})
    if review.action == "approve":
        await db.releases.update_one({"id": release_id}, {"$set": {"status": "distributed"}})
        await db.distributions.update_many({"release_id": release_id}, {"$set": {"status": "live", "approved_at": now}})
        notify_msg = "Your release has been approved and is now live on all selected stores!"
    else:
        await db.releases.update_one({"id": release_id}, {"$set": {"status": "rejected", "rejection_reason": review.notes}})
        await db.distributions.update_many({"release_id": release_id}, {"$set": {"status": "rejected"}})
        notify_msg = f"Your release was not approved. Reason: {review.notes or 'Does not meet guidelines.'}"
    await db.notifications.insert_one({"id": f"notif_{uuid.uuid4().hex[:12]}", "user_id": submission["artist_id"],
        "type": "review_result", "message": notify_msg, "release_id": release_id, "read": False, "created_at": now})
    await db.admin_actions.insert_one({"id": f"act_{uuid.uuid4().hex[:12]}", "admin_id": admin["id"],
        "action": f"review_{review.action}", "target_type": "release", "target_id": release_id,
        "notes": review.notes, "created_at": now})
    return {"message": f"Submission {new_status}", "status": new_status}

@api_router.get("/admin/users")
async def admin_get_users(request: Request, page: int = 1, limit: int = 20, search: Optional[str] = None):
    await require_admin(request)
    query = {}
    if search:
        query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"email": {"$regex": search, "$options": "i"}}, {"artist_name": {"$regex": search, "$options": "i"}}]
    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for u in users: u["release_count"] = await db.releases.count_documents({"artist_id": u["id"]})
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, update: AdminUserUpdate, request: Request):
    admin = await require_admin(request)
    user = await db.users.find_one({"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    update_doc = {}
    if update.role: update_doc["role"] = update.role
    if update.plan: update_doc["plan"] = update.plan
    if update.status: update_doc["status"] = update.status
    if update_doc:
        update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_doc})
    await db.admin_actions.insert_one({"id": f"act_{uuid.uuid4().hex[:12]}", "admin_id": admin["id"],
        "action": "update_user", "target_type": "user", "target_id": user_id,
        "notes": str(update_doc), "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "User updated"}

# ============= SPLIT PAYMENTS =============
@api_router.post("/splits")
async def create_split(split: SplitCreate, request: Request):
    user = await get_current_user(request)
    track = await db.tracks.find_one({"id": split.track_id, "artist_id": user["id"]})
    if not track: raise HTTPException(status_code=404, detail="Track not found")
    total_pct = sum(c.percentage for c in split.collaborators)
    if total_pct > 100: raise HTTPException(status_code=400, detail="Total split percentages cannot exceed 100%")
    if total_pct < 0: raise HTTPException(status_code=400, detail="Percentages must be positive")
    owner_pct = 100.0 - total_pct
    split_id = f"split_{uuid.uuid4().hex[:12]}"
    split_doc = {"id": split_id, "track_id": split.track_id, "release_id": track["release_id"],
        "owner_id": user["id"], "owner_name": user.get("artist_name", user["name"]),
        "owner_percentage": owner_pct, "collaborators": [c.model_dump() for c in split.collaborators],
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.splits.update_one({"track_id": split.track_id}, {"$set": split_doc}, upsert=True)
    return {"message": "Split agreement created", "split_id": split_id, "owner_percentage": owner_pct}

@api_router.get("/splits/{track_id}")
async def get_split(track_id: str, request: Request):
    await get_current_user(request)
    split = await db.splits.find_one({"track_id": track_id}, {"_id": 0})
    if not split: return {"track_id": track_id, "collaborators": [], "owner_percentage": 100.0}
    return split

@api_router.put("/splits/{track_id}")
async def update_split(track_id: str, update: SplitUpdate, request: Request):
    user = await get_current_user(request)
    track = await db.tracks.find_one({"id": track_id, "artist_id": user["id"]})
    if not track: raise HTTPException(status_code=404, detail="Track not found")
    total_pct = sum(c.percentage for c in update.collaborators)
    if total_pct > 100: raise HTTPException(status_code=400, detail="Total split percentages cannot exceed 100%")
    await db.splits.update_one({"track_id": track_id}, {"$set": {
        "collaborators": [c.model_dump() for c in update.collaborators],
        "owner_percentage": 100.0 - total_pct, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Split updated", "owner_percentage": 100.0 - total_pct}

@api_router.delete("/splits/{track_id}")
async def delete_split(track_id: str, request: Request):
    user = await get_current_user(request)
    track = await db.tracks.find_one({"id": track_id, "artist_id": user["id"]})
    if not track: raise HTTPException(status_code=404, detail="Track not found")
    await db.splits.delete_one({"track_id": track_id})
    return {"message": "Split agreement removed"}

# ============= FILE SERVING =============
@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request, auth: Optional[str] = Query(None)):
    token = request.cookies.get("access_token") or auth
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "): token = auth_header[7:]
    if not token: raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=404, detail="File not found")

# ============= HEALTH =============
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============= REGISTER ROUTERS =============
app.include_router(api_router)

from kalmori_routes import kalmori_router, init_cms_content
app.include_router(kalmori_router)

from routes.ai_routes import ai_router
from routes.email_routes import email_router
from routes.paypal_routes import paypal_router
from routes.content_routes import content_router
from routes.beats_routes import beats_router, init_beats_routes
init_beats_routes(db, put_object, get_object, get_current_user, require_admin)
app.include_router(ai_router)
app.include_router(email_router)
app.include_router(paypal_router)
app.include_router(content_router)
app.include_router(beats_router)

# CORS
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"], expose_headers=["*"])

# ============= STARTUP =============
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.releases.create_index("artist_id")
    await db.releases.create_index("id", unique=True)
    await db.tracks.create_index("release_id")
    await db.tracks.create_index("id", unique=True)
    await db.distributions.create_index([("release_id", 1), ("store_id", 1)])
    await db.royalties.create_index("release_id")
    await db.wallets.create_index("user_id", unique=True)
    await db.submissions.create_index("release_id", unique=True)
    await db.submissions.create_index("status")
    await db.splits.create_index("track_id", unique=True)
    await db.admin_actions.create_index("admin_id")
    await db.beats.create_index("id", unique=True)
    await db.beats.create_index("genre")

    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tunedrop.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "id": admin_id, "email": admin_email, "name": "Admin",
            "artist_name": "TuneDrop Admin", "password_hash": hash_password(admin_password),
            "role": "admin", "plan": "pro", "avatar_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.wallets.insert_one({
            "user_id": admin_id, "balance": 0.0, "pending_balance": 0.0,
            "currency": "USD", "total_earnings": 0.0, "total_withdrawn": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")

    # Seed demo beats
    if await db.beats.count_documents({}) == 0:
        demo_beats = [
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "Midnight Drip", "genre": "Trap", "bpm": 140, "key": "Cm", "mood": "Dark", "tags": ["dark","trap","808"], "duration": "3:24"},
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "Golden Hour", "genre": "R&B/Soul", "bpm": 85, "key": "Eb", "mood": "Chill", "tags": ["chill","rnb","smooth"], "duration": "3:45"},
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "City Lights", "genre": "Hip-Hop", "bpm": 92, "key": "Am", "mood": "Energetic", "tags": ["boom bap","hiphop"], "duration": "2:58"},
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "Lagos Nights", "genre": "Afrobeats", "bpm": 105, "key": "F#m", "mood": "Party", "tags": ["afro","dancehall"], "duration": "3:12"},
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "Sunday Morning", "genre": "Gospel", "bpm": 78, "key": "G", "mood": "Uplifting", "tags": ["gospel","uplifting"], "duration": "4:01"},
            {"id": f"beat_{uuid.uuid4().hex[:12]}", "title": "Neon Dreams", "genre": "Pop", "bpm": 120, "key": "Dm", "mood": "Happy", "tags": ["pop","dance"], "duration": "3:33"},
        ]
        for b in demo_beats:
            b.update({"prices": {"basic_lease": 29.99, "premium_lease": 79.99, "unlimited_lease": 149.99, "exclusive": 499.99},
                "audio_url": None, "preview_url": None, "cover_url": None, "status": "active", "plays": 0,
                "created_by": "system", "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()})
        await db.beats.insert_many(demo_beats)
        logger.info(f"Seeded {len(demo_beats)} demo beats")

    # Initialize CMS
    await init_cms_content()

    # Write test credentials
    from pathlib import Path
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin User
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/session (Google OAuth)
""")

@app.on_event("shutdown")
async def shutdown():
    client.close()
