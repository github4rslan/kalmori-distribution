"""Shared database, helpers, and models used across all route modules."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import uuid
import secrets
import bcrypt
import jwt
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.api
from io import BytesIO
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_ALGORITHM = "HS256"
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Cloudinary Storage
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")  # kept for any legacy references
APP_NAME = "tunedrop"
storage_key = None  # kept for legacy compatibility

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", "dhabplawv"),
    api_key=os.environ.get("CLOUDINARY_API_KEY", "882247917397356"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", "eWseftCBRNpu2lAWuuANj7RQosA"),
    secure=True,
)

# ============= MODELS =============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    artist_name: Optional[str] = None
    user_role: Optional[str] = "artist"
    legal_name: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    town: Optional[str] = None
    post_code: Optional[str] = None
    phone_number: Optional[str] = None
    recaptcha_token: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    artist_name: Optional[str] = None
    role: str = "artist"
    plan: str = "free"
    avatar_url: Optional[str] = None
    created_at: str

class ArtistProfile(BaseModel):
    artist_name: str
    bio: Optional[str] = None
    genre: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    spotify_url: Optional[str] = None
    apple_music_url: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None

class ReleaseCreate(BaseModel):
    title: str
    release_type: str = "single"
    genre: str
    subgenre: Optional[str] = None
    release_date: str
    description: Optional[str] = None
    explicit: bool = False
    language: str = "en"
    title_version: Optional[str] = None
    label: Optional[str] = None
    catalog_number: Optional[str] = None
    production_year: Optional[str] = None
    copyright_line: Optional[str] = None
    production_line: Optional[str] = None
    is_compilation: Optional[bool] = False
    main_artist: Optional[str] = None
    territory: Optional[str] = "worldwide"
    distributed_platforms: Optional[List[str]] = []
    rights_confirmed: Optional[bool] = True

class ReleaseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    upc: str
    title: str
    release_type: str
    genre: str
    subgenre: Optional[str] = None
    release_date: str
    description: Optional[str] = None
    explicit: bool
    language: str
    title_version: Optional[str] = None
    label: Optional[str] = None
    catalog_number: Optional[str] = None
    production_year: Optional[str] = None
    copyright_line: Optional[str] = None
    production_line: Optional[str] = None
    is_compilation: Optional[bool] = False
    main_artist: Optional[str] = None
    territory: Optional[str] = "worldwide"
    distributed_platforms: Optional[List[str]] = []
    rights_confirmed: Optional[bool] = True
    cover_art_url: Optional[str] = None
    status: str
    artist_id: str
    artist_name: str
    track_count: int = 0
    created_at: str
    payment_status: str = "pending"

class TrackCreate(BaseModel):
    release_id: str
    title: str
    track_number: int
    duration: Optional[int] = None
    explicit: bool = False
    lyrics: Optional[str] = None
    composers: Optional[List[str]] = []
    producers: Optional[List[str]] = []
    title_version: Optional[str] = ""
    isrc: Optional[str] = ""
    dolby_atmos_isrc: Optional[str] = ""
    iswc: Optional[str] = ""
    audio_language: Optional[str] = "English"
    production: Optional[str] = ""
    publisher: Optional[str] = ""
    preview_start: Optional[str] = "00:30"
    preview_end: Optional[str] = "00:00"
    main_artist: Optional[str] = ""
    artists: Optional[List[Dict[str, Any]]] = []
    main_contributors: Optional[List[Dict[str, Any]]] = []
    contributors: Optional[List[Dict[str, Any]]] = []
    audio_file_name: Optional[str] = ""

class TrackResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    isrc: Optional[str] = ""
    release_id: str
    title: str
    track_number: int
    duration: Optional[int] = None
    explicit: bool = False
    audio_url: Optional[str] = None
    status: str
    created_at: str
    title_version: Optional[str] = ""
    dolby_atmos_isrc: Optional[str] = ""
    iswc: Optional[str] = ""
    audio_language: Optional[str] = "English"
    production: Optional[str] = ""
    publisher: Optional[str] = ""
    preview_start: Optional[str] = "00:30"
    preview_end: Optional[str] = "00:00"
    main_artist: Optional[str] = ""
    artists: Optional[List[Dict[str, Any]]] = []
    main_contributors: Optional[List[Dict[str, Any]]] = []
    contributors: Optional[List[Dict[str, Any]]] = []
    audio_file_name: Optional[str] = ""

class DistributionStore(BaseModel):
    store_id: str
    store_name: str
    enabled: bool = True

class WalletResponse(BaseModel):
    balance: float
    pending_balance: float
    currency: str = "USD"
    total_earnings: float
    total_withdrawn: float

class WithdrawalRequest(BaseModel):
    amount: float
    method: str
    paypal_email: Optional[str] = None

class PaymentCheckout(BaseModel):
    release_id: str
    origin_url: str

class AnalyticsResponse(BaseModel):
    total_streams: int
    total_downloads: int
    total_earnings: float
    streams_by_store: Dict[str, int]
    streams_by_country: Dict[str, int]
    daily_streams: List[Dict[str, Any]]

class AIMetadataRequest(BaseModel):
    title: str
    artist_name: str
    audio_features: Optional[Dict[str, Any]] = None

class AIDescriptionRequest(BaseModel):
    title: str
    artist_name: str
    genre: str
    mood: Optional[str] = None

class Collaborator(BaseModel):
    name: str
    email: EmailStr
    role: str
    percentage: float

class SplitCreate(BaseModel):
    track_id: str
    collaborators: List[Collaborator]

class SplitUpdate(BaseModel):
    collaborators: List[Collaborator]

class AdminReviewAction(BaseModel):
    action: str
    notes: Optional[str] = None

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None

# ============= HELPER FUNCTIONS =============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def generate_upc() -> str:
    return f"8{secrets.randbelow(10**11):011d}"

def generate_isrc() -> str:
    country = "US"
    registrant = "TD" + secrets.token_hex(1).upper()[:1]
    year = str(datetime.now().year)[2:]
    designation = f"{secrets.randbelow(100000):05d}"
    return f"{country}{registrant}{year}{designation}"

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") == "suspended":
            raise HTTPException(status_code=403, detail="Account suspended")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Cloudinary Storage helpers
def init_storage():
    """Legacy stub — Cloudinary needs no init."""
    return True

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload a file to Cloudinary. Returns dict with 'url' key."""
    try:
        # Determine resource type
        if content_type.startswith("audio/") or content_type in ("application/octet-stream",):
            resource_type = "video"  # Cloudinary uses 'video' for audio files
        elif content_type.startswith("image/"):
            resource_type = "image"
        else:
            resource_type = "raw"

        # Use path as public_id (replace slashes with underscores for Cloudinary)
        public_id = path.replace("/", "_").replace(".", "_")

        result = cloudinary.uploader.upload(
            BytesIO(data),
            public_id=f"kalmori/{public_id}",
            resource_type=resource_type,
            overwrite=True,
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

def get_object(path: str) -> tuple:
    """
    For Cloudinary, files are served directly via URL — no need to proxy.
    This stub fetches the file content for legacy callers that stream through the backend.
    """
    try:
        public_id = path.replace("/", "_").replace(".", "_")
        url = cloudinary.utils.cloudinary_url(f"kalmori/{public_id}")[0]
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except Exception as e:
        logger.error(f"Cloudinary fetch failed: {e}")
        raise HTTPException(status_code=500, detail="File not found")


# ============= SUBSCRIPTION PLANS =============
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free", "price": 0, "revenue_share": 20,
        "max_releases": -1,
        "release_types": ["single", "ep", "album"],
        "pay_per_release": False,
        "features": ["Unlimited releases", "150+ streaming platforms", "Free ISRC codes", "Basic analytics", "Standard support", "Kalmori keeps 20% of revenue"],
        "locked": ["ai_strategy", "revenue_export", "content_id", "spotify_canvas", "leaderboard", "goals", "presave", "fan_analytics", "collaborations", "spotify_data", "beat_marketplace", "messaging", "royalty_splits"]
    },
    "rise": {
        "name": "Rise", "price": 24.99, "revenue_share": 5,
        "max_releases": -1,
        "release_types": ["single"],
        "pay_per_release": True,
        "features": ["Single releases (pay per release)", "150+ streaming platforms", "Free ISRC & UPC codes", "Advanced analytics", "Revenue dashboard", "Fan Analytics", "In-App messaging", "Beat marketplace access", "Goal Tracking", "Priority support", "Kalmori keeps only 5% of revenue"],
        "locked": ["ai_strategy", "content_id", "spotify_canvas", "leaderboard", "presave", "royalty_splits", "spotify_data"]
    },
    "pro": {
        "name": "Pro", "price": 49.99, "revenue_share": 0,
        "max_releases": -1,
        "release_types": ["single", "ep", "album"],
        "pay_per_release": False,
        "features": ["Everything in Rise", "Keep 100% of royalties", "Album & Single releases", "AI Release Strategy", "Revenue Export (PDF/CSV)", "YouTube Content ID", "Spotify Canvas", "Spotify Data (Real API)", "Release Leaderboard", "Pre-Save Campaigns", "Collaborations & Splits", "Producer Royalty Splits", "Dedicated account manager"],
        "locked": []
    },
}

FEATURE_CATEGORY_ROUTES = {
    "general": "/dashboard",
    "distribution": "/releases",
    "analytics": "/analytics",
    "ai": "/features",
    "marketplace": "/beat-bank",
    "social": "/collab-hub",
}

def check_feature_access(user_plan: str, feature: str):
    """Check if user's plan allows access to a feature"""
    plan = SUBSCRIPTION_PLANS.get(user_plan, SUBSCRIPTION_PLANS["free"])
    locked = plan.get("locked", [])
    if feature in locked:
        plan_names = {
            "ai_strategy": "Pro", "revenue_export": "Pro", "content_id": "Pro", "spotify_canvas": "Pro",
            "leaderboard": "Pro", "goals": "Pro", "presave": "Pro", "fan_analytics": "Rise",
            "collaborations": "Rise", "spotify_data": "Pro", "beat_marketplace": "Rise",
            "messaging": "Rise", "royalty_splits": "Pro"
        }
        required = plan_names.get(feature, "Pro")
        raise HTTPException(status_code=403, detail=f"This feature requires the {required} plan. Upgrade at /pricing")


def resolve_feature_action_url(category: str = "general", has_access: bool = True) -> str:
    if not has_access:
        return "/pricing"
    return FEATURE_CATEGORY_ROUTES.get(category or "general", "/features")


def get_frontend_base_url(request: Optional[Request] = None) -> str:
    candidates = [
        os.environ.get("PUBLIC_FRONTEND_URL"),
        os.environ.get("SITE_URL"),
        os.environ.get("APP_BASE_URL"),
        os.environ.get("FRONTEND_URL"),
    ]

    vercel_url = os.environ.get("VERCEL_PROJECT_PRODUCTION_URL") or os.environ.get("VERCEL_URL")
    if vercel_url:
        candidates.append(vercel_url if vercel_url.startswith("http") else f"https://{vercel_url}")

    if request is not None:
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        for candidate in (origin, referer, str(request.base_url).rstrip("/")):
            if candidate:
                candidates.append(candidate)

    for candidate in candidates:
        if not candidate:
            continue
        parsed = urlparse(candidate)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    return ""

