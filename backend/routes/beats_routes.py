from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
import os
from io import BytesIO

logger = logging.getLogger(__name__)

VOICE_TAG_PATH = os.path.join(os.path.dirname(__file__), '..', 'kalmori_tag.mp3')

# Default platform fee percentage taken from each beat sale
DEFAULT_PLATFORM_FEE_PCT = 15.0

def _watermark_audio(audio_bytes: bytes, tag_interval_sec: int = 15) -> bytes:
    """Overlay voice tag on audio at regular intervals"""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(BytesIO(audio_bytes))
        tag = AudioSegment.from_mp3(VOICE_TAG_PATH) - 2  # slightly quieter
        tag_interval_ms = tag_interval_sec * 1000
        watermarked = audio
        position = 3000  # start 3s in
        while position < len(audio) - len(tag):
            watermarked = watermarked.overlay(tag, position=position)
            position += tag_interval_ms
        buf = BytesIO()
        watermarked.export(buf, format="mp3", bitrate="192k")
        return buf.getvalue()
    except Exception as e:
        logger.error(f"Watermark failed: {e}")
        return audio_bytes


beats_router = APIRouter(prefix="/api/beats", tags=["Beats"])

# Will be set from server.py
db = None
put_object = None
get_object = None
get_current_user = None
require_admin = None
APP_NAME = "tunedrop"

def init_beats_routes(database, put_obj_fn, get_obj_fn, get_user_fn, require_admin_fn):
    global db, put_object, get_object, get_current_user, require_admin
    db = database
    put_object = put_obj_fn
    get_object = get_obj_fn
    get_current_user = get_user_fn
    require_admin = require_admin_fn


PRODUCER_ROLES = {"producer", "label", "label_producer", "admin"}


async def _require_producer_or_admin(request: Request):
    """Allow producer, label, label_producer, or admin"""
    user = await get_current_user(request)
    role = user.get("user_role") or user.get("role") or ""
    if role not in PRODUCER_ROLES:
        raise HTTPException(status_code=403, detail="Only producers and labels can perform this action")
    return user


class BeatCreate(BaseModel):
    title: str
    genre: str
    bpm: int = 120
    key: str = "Cm"
    mood: str = ""
    tags: List[str] = []
    price_basic: float = 29.99
    price_premium: float = 79.99
    price_unlimited: float = 149.99
    price_exclusive: float = 499.99
    description: Optional[str] = ""


class BeatSaleRequest(BaseModel):
    beat_id: str
    license_type: str  # basic_lease, premium_lease, unlimited_lease, exclusive
    buyer_id: str
    amount: float


class PlatformFeeUpdate(BaseModel):
    fee_percentage: float  # 0-100


@beats_router.get("")
async def list_beats(
    genre: Optional[str] = None, mood: Optional[str] = None,
    search: Optional[str] = None, key: Optional[str] = None,
    bpm_min: Optional[int] = None, bpm_max: Optional[int] = None,
    price_min: Optional[float] = None, price_max: Optional[float] = None,
    sort_by: Optional[str] = "newest",
    producer_id: Optional[str] = None,
    limit: int = 50
):
    query = {"status": "active"}
    if genre:
        query["genre"] = {"$regex": genre, "$options": "i"}
    if mood:
        query["mood"] = {"$regex": mood, "$options": "i"}
    if key:
        query["key"] = {"$regex": f"^{key}", "$options": "i"}
    if producer_id:
        query["created_by"] = producer_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"genre": {"$regex": search, "$options": "i"}},
            {"mood": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
            {"producer_name": {"$regex": search, "$options": "i"}},
        ]
    if bpm_min is not None or bpm_max is not None:
        bpm_q = {}
        if bpm_min is not None:
            bpm_q["$gte"] = bpm_min
        if bpm_max is not None:
            bpm_q["$lte"] = bpm_max
        query["bpm"] = bpm_q
    if price_min is not None or price_max is not None:
        price_q = {}
        if price_min is not None:
            price_q["$gte"] = price_min
        if price_max is not None:
            price_q["$lte"] = price_max
        query["prices.basic_lease"] = price_q

    sort_field = "created_at"
    sort_dir = -1
    if sort_by == "price_low":
        sort_field = "prices.basic_lease"; sort_dir = 1
    elif sort_by == "price_high":
        sort_field = "prices.basic_lease"; sort_dir = -1
    elif sort_by == "bpm_low":
        sort_field = "bpm"; sort_dir = 1
    elif sort_by == "bpm_high":
        sort_field = "bpm"; sort_dir = -1
    elif sort_by == "plays":
        sort_field = "plays"; sort_dir = -1

    beats = await db.beats.find(query, {"_id": 0}).sort(sort_field, sort_dir).limit(limit).to_list(limit)
    total = await db.beats.count_documents(query)
    return {"beats": beats, "total": total}


@beats_router.get("/admin/all")
async def admin_list_all_beats(request: Request, limit: int = 100):
    """Admin: list ALL beats including inactive, with full producer info"""
    await require_admin(request)
    beats = await db.beats.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    total = await db.beats.count_documents({})
    # Enrich with producer info
    for beat in beats:
        producer = await db.users.find_one({"id": beat.get("created_by")}, {"_id": 0, "password_hash": 0})
        beat["producer_info"] = producer or {}
    return {"beats": beats, "total": total}


@beats_router.get("/my")
async def my_beats(request: Request):
    """Producer: get own beats"""
    user = await _require_producer_or_admin(request)
    beats = await db.beats.find({"created_by": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    total = await db.beats.count_documents({"created_by": user["id"]})
    return {"beats": beats, "total": total}


@beats_router.get("/my/sales")
async def my_beat_sales(request: Request):
    """Producer: get own beat sales log"""
    user = await _require_producer_or_admin(request)
    sales = await db.beat_sales.find({"producer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total_revenue = sum(s.get("producer_amount", 0) for s in sales)
    platform_revenue = sum(s.get("platform_fee_amount", 0) for s in sales)
    return {"sales": sales, "total_revenue": total_revenue, "platform_revenue": platform_revenue, "count": len(sales)}


@beats_router.get("/admin/sales")
async def admin_all_sales(request: Request):
    """Admin: get all beat sales"""
    await require_admin(request)
    sales = await db.beat_sales.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    total = sum(s.get("amount", 0) for s in sales)
    platform_total = sum(s.get("platform_fee_amount", 0) for s in sales)
    return {"sales": sales, "total_revenue": total, "platform_revenue": platform_total, "count": len(sales)}


@beats_router.get("/platform-fee")
async def get_platform_fee(request: Request):
    """Get platform fee setting"""
    try:
        await get_current_user(request)
    except:
        pass
    setting = await db.settings.find_one({"key": "beat_platform_fee"})
    fee = setting["value"] if setting else DEFAULT_PLATFORM_FEE_PCT
    return {"fee_percentage": fee}


@beats_router.put("/platform-fee")
async def update_platform_fee(data: PlatformFeeUpdate, request: Request):
    """Admin: update platform fee percentage"""
    await require_admin(request)
    if not (0 <= data.fee_percentage <= 100):
        raise HTTPException(status_code=400, detail="Fee must be between 0 and 100")
    await db.settings.update_one(
        {"key": "beat_platform_fee"},
        {"$set": {"key": "beat_platform_fee", "value": data.fee_percentage, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"fee_percentage": data.fee_percentage, "message": "Platform fee updated"}


@beats_router.get("/{beat_id}")
async def get_beat(beat_id: str):
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    return beat


@beats_router.post("")
async def create_beat(beat: BeatCreate, request: Request):
    """Producer, label, or admin can create beats"""
    user = await _require_producer_or_admin(request)
    beat_id = f"beat_{uuid.uuid4().hex[:12]}"
    beat_doc = {
        "id": beat_id,
        "title": beat.title,
        "genre": beat.genre,
        "bpm": beat.bpm,
        "key": beat.key,
        "mood": beat.mood,
        "tags": beat.tags,
        "description": beat.description or "",
        "prices": {
            "basic_lease": beat.price_basic,
            "premium_lease": beat.price_premium,
            "unlimited_lease": beat.price_unlimited,
            "exclusive": beat.price_exclusive,
        },
        "audio_url": None,
        "preview_url": None,
        "cover_url": None,
        "stems_url": None,
        "has_stems": False,
        "duration": None,
        "status": "active",
        "plays": 0,
        "sales_count": 0,
        "total_revenue": 0.0,
        "created_by": user["id"],
        "producer_name": user.get("artist_name") or user.get("name") or user["email"],
        "producer_email": user.get("email", ""),
        "producer_role": user.get("user_role") or user.get("role"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.beats.insert_one(beat_doc)
    beat_doc.pop("_id", None)
    try:
        import asyncio
        from routes.email_routes import send_admin_beat_notification
        asyncio.ensure_future(send_admin_beat_notification(
            producer_name=beat_doc["producer_name"],
            producer_email=beat_doc["producer_email"],
            beat_title=beat_doc["title"],
            genre=beat_doc.get("genre", ""),
            bpm=beat_doc.get("bpm", 0),
        ))
    except Exception as e:
        pass
    return beat_doc


@beats_router.post("/{beat_id}/audio")
async def upload_beat_audio(beat_id: str, request: Request, file: UploadFile = File(...)):
    """Producer (owner) or admin can upload audio"""
    user = await _require_producer_or_admin(request)
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    # Only owner or admin
    role = user.get("user_role") or user.get("role") or ""
    if beat["created_by"] != user["id"] and role != "admin":
        raise HTTPException(status_code=403, detail="Not your beat")

    allowed = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/wave", "audio/x-m4a", "audio/mp4"]
    content_type = file.content_type or "audio/mpeg"
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {content_type}")

    ext = file.filename.split(".")[-1] if "." in file.filename else "mp3"
    file_id = uuid.uuid4().hex
    path = f"{APP_NAME}/beats/{beat_id}/{file_id}.{ext}"
    data = await file.read()

    audio_result = put_object(path, data, content_type)
    audio_url = audio_result["url"]

    preview_url = audio_url
    preview_path = f"{APP_NAME}/beats/{beat_id}/{file_id}_preview.mp3"
    try:
        watermarked = _watermark_audio(data)
        preview_result = put_object(preview_path, watermarked, "audio/mpeg")
        preview_url = preview_result["url"]
    except Exception as e:
        logger.warning(f"Preview generation failed for {beat_id}: {e}")

    await db.beats.update_one(
        {"id": beat_id},
        {"$set": {"audio_url": audio_url, "preview_url": preview_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"audio_url": audio_url, "preview_url": preview_url, "message": "Audio uploaded with watermarked preview"}


@beats_router.post("/{beat_id}/cover")
async def upload_beat_cover(beat_id: str, request: Request, file: UploadFile = File(...)):
    """Producer (owner) or admin can upload cover"""
    user = await _require_producer_or_admin(request)
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    role = user.get("user_role") or user.get("role") or ""
    if beat["created_by"] != user["id"] and role != "admin":
        raise HTTPException(status_code=403, detail="Not your beat")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/beats/{beat_id}/cover.{ext}"
    data = await file.read()
    content_type = file.content_type or "image/jpeg"
    cover_result = put_object(path, data, content_type)
    cover_url = cover_result["url"]
    await db.beats.update_one(
        {"id": beat_id},
        {"$set": {"cover_url": cover_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"cover_url": cover_url}


@beats_router.get("/{beat_id}/stream")
async def stream_beat(beat_id: str):
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat or not beat.get("audio_url"):
        raise HTTPException(status_code=404, detail="Audio not found")

    from fastapi.responses import RedirectResponse
    stream_url = beat.get("preview_url") or beat["audio_url"]
    await db.beats.update_one({"id": beat_id}, {"$inc": {"plays": 1}})
    return RedirectResponse(url=stream_url, status_code=302)


@beats_router.put("/{beat_id}")
async def update_beat(beat_id: str, update: dict, request: Request):
    """Producer (owner) or admin can update"""
    user = await _require_producer_or_admin(request)
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    role = user.get("user_role") or user.get("role") or ""
    if beat["created_by"] != user["id"] and role != "admin":
        raise HTTPException(status_code=403, detail="Not your beat")

    allowed_fields = {"title", "genre", "bpm", "key", "mood", "tags", "prices", "status", "duration", "description"}
    update_data = {k: v for k, v in update.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.beats.update_one({"id": beat_id}, {"$set": update_data})
    updated = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    return updated


@beats_router.delete("/{beat_id}")
async def delete_beat(beat_id: str, request: Request):
    """Producer (owner) or admin can delete"""
    user = await _require_producer_or_admin(request)
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    role = user.get("user_role") or user.get("role") or ""
    if beat["created_by"] != user["id"] and role != "admin":
        raise HTTPException(status_code=403, detail="Not your beat")
    await db.beats.delete_one({"id": beat_id})
    return {"message": "Beat deleted"}


@beats_router.post("/{beat_id}/record-sale")
async def record_beat_sale(beat_id: str, sale: BeatSaleRequest, request: Request):
    """Record a beat sale and split revenue between producer and platform"""
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")

    # Get platform fee
    setting = await db.settings.find_one({"key": "beat_platform_fee"})
    fee_pct = setting["value"] if setting else DEFAULT_PLATFORM_FEE_PCT

    platform_fee_amount = round(sale.amount * (fee_pct / 100), 2)
    producer_amount = round(sale.amount - platform_fee_amount, 2)

    sale_doc = {
        "id": f"sale_{uuid.uuid4().hex[:12]}",
        "beat_id": beat_id,
        "beat_title": beat.get("title", ""),
        "producer_id": beat.get("created_by"),
        "producer_name": beat.get("producer_name", ""),
        "buyer_id": sale.buyer_id,
        "license_type": sale.license_type,
        "amount": sale.amount,
        "platform_fee_pct": fee_pct,
        "platform_fee_amount": platform_fee_amount,
        "producer_amount": producer_amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.beat_sales.insert_one(sale_doc)
    sale_doc.pop("_id", None)

    # Update beat stats
    await db.beats.update_one(
        {"id": beat_id},
        {"$inc": {"sales_count": 1, "total_revenue": producer_amount}}
    )

    # Credit producer wallet
    await db.wallets.update_one(
        {"user_id": beat.get("created_by")},
        {"$inc": {"balance": producer_amount, "total_earnings": producer_amount}},
        upsert=True
    )

    return sale_doc


@beats_router.post("/{beat_id}/watermark")
async def regenerate_watermark(beat_id: str, request: Request):
    """Admin: Regenerate watermarked preview"""
    await require_admin(request)
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat or not beat.get("audio_url"):
        raise HTTPException(status_code=404, detail="Beat audio not found")
    import requests as _requests
    audio_data = _requests.get(beat["audio_url"], timeout=60).content
    preview_path = f"tunedrop/beats/{beat_id}/preview_{beat_id}.mp3"
    watermarked = _watermark_audio(audio_data)
    preview_result = put_object(preview_path, watermarked, "audio/mpeg")
    preview_url = preview_result["url"]
    await db.beats.update_one(
        {"id": beat_id},
        {"$set": {"preview_url": preview_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"preview_url": preview_url, "message": "Watermark preview regenerated"}


# ─── STEMS UPLOAD ────────────────────────────────────────────────────────────

@beats_router.post("/{beat_id}/stems")
async def upload_beat_stems(beat_id: str, request: Request, file: UploadFile = File(...)):
    """Producer (owner) or admin can upload stems (ZIP file)"""
    user = await _require_producer_or_admin(request)
    beat = await db.beats.find_one({"id": beat_id})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    role = user.get("user_role") or user.get("role") or ""
    if beat["created_by"] != user["id"] and role != "admin":
        raise HTTPException(status_code=403, detail="Not your beat")

    allowed = ["application/zip", "application/x-zip-compressed", "application/octet-stream",
               "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/flac"]
    content_type = file.content_type or "application/zip"
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "zip"

    file_id = uuid.uuid4().hex
    path = f"{APP_NAME}/beats/{beat_id}/stems_{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, content_type)
    stems_url = result["url"]

    await db.beats.update_one(
        {"id": beat_id},
        {"$set": {"stems_url": stems_url, "has_stems": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"stems_url": stems_url, "message": "Stems uploaded successfully"}


# ─── BEAT CHECKOUT (Stripe) ──────────────────────────────────────────────────

@beats_router.post("/{beat_id}/checkout")
async def beat_checkout(beat_id: str, request: Request):
    """Initiate Stripe checkout for a beat purchase"""
    import stripe as stripe_sdk
    import json
    user = await get_current_user(request)
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")
    if beat.get("status") != "active":
        raise HTTPException(status_code=400, detail="Beat is not available for purchase")

    body = await request.json()
    license_type = body.get("license_type", "basic_lease")
    origin_url = body.get("origin_url", "")

    price_map = {
        "basic_lease": beat.get("prices", {}).get("basic_lease", 29.99),
        "premium_lease": beat.get("prices", {}).get("premium_lease", 79.99),
        "unlimited_lease": beat.get("prices", {}).get("unlimited_lease", 149.99),
        "exclusive": beat.get("prices", {}).get("exclusive", 499.99),
    }
    amount = price_map.get(license_type, 29.99)

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=503, detail="Payment processing not configured")
    stripe_sdk.api_key = stripe_api_key

    license_labels = {
        "basic_lease": "Basic Lease",
        "premium_lease": "Premium Lease",
        "unlimited_lease": "Unlimited Lease",
        "exclusive": "Exclusive Rights",
    }

    try:
        purchase_id = f"bpurch_{uuid.uuid4().hex[:12]}"
        session = stripe_sdk.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{beat['title']} — {license_labels.get(license_type, license_type)}",
                        "description": f"By {beat.get('producer_name', 'Producer')}",
                    },
                    "unit_amount": int(amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{origin_url}/beat-bank?purchase=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin_url}/beat-bank?purchase=cancelled",
            metadata={
                "type": "beat_purchase",
                "beat_id": beat_id,
                "user_id": user["id"],
                "license_type": license_type,
                "purchase_id": purchase_id,
            }
        )
        now = datetime.now(timezone.utc).isoformat()
        await db.beat_purchases.insert_one({
            "id": purchase_id,
            "session_id": session.id,
            "beat_id": beat_id,
            "beat_title": beat.get("title", ""),
            "buyer_id": user["id"],
            "buyer_email": user.get("email", ""),
            "producer_id": beat.get("created_by"),
            "license_type": license_type,
            "amount": amount,
            "payment_status": "pending",
            "created_at": now,
        })
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Beat checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")


# ─── DOWNLOAD AFTER PURCHASE ─────────────────────────────────────────────────

@beats_router.get("/{beat_id}/download")
async def download_beat(beat_id: str, request: Request):
    """Download full audio + stems after verified purchase"""
    from fastapi.responses import JSONResponse
    user = await get_current_user(request)

    # Check if user has a completed purchase for this beat
    purchase = await db.beat_purchases.find_one({
        "beat_id": beat_id,
        "buyer_id": user["id"],
        "payment_status": "paid",
    }, {"_id": 0})

    # Admin can always download
    role = user.get("user_role") or user.get("role") or ""
    beat = await db.beats.find_one({"id": beat_id}, {"_id": 0})
    if not beat:
        raise HTTPException(status_code=404, detail="Beat not found")

    is_owner = beat.get("created_by") == user["id"]
    is_admin = role == "admin"

    if not purchase and not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Purchase required to download this beat")

    files = {}
    if beat.get("audio_url"):
        files["audio"] = beat["audio_url"]
    if beat.get("stems_url"):
        files["stems"] = beat["stems_url"]

    return {
        "beat_id": beat_id,
        "title": beat.get("title"),
        "license_type": purchase.get("license_type") if purchase else "owner",
        "files": files,
    }


# ─── PURCHASE HISTORY ────────────────────────────────────────────────────────

@beats_router.get("/my/purchases")
async def my_beat_purchases(request: Request):
    """Get all beats purchased by the current user"""
    user = await get_current_user(request)
    purchases = await db.beat_purchases.find(
        {"buyer_id": user["id"], "payment_status": "paid"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Attach beat info
    for p in purchases:
        beat = await db.beats.find_one({"id": p["beat_id"]}, {"_id": 0, "title": 1, "cover_url": 1, "producer_name": 1})
        if beat:
            p["beat"] = beat
    return purchases
