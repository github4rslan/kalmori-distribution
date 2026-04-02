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
from io import BytesIO

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_ALGORITHM = "HS256"
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "tunedrop"
storage_key = None

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

class TrackResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    isrc: str
    release_id: str
    title: str
    track_number: int
    duration: Optional[int] = None
    explicit: bool
    audio_url: Optional[str] = None
    status: str
    created_at: str

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

# Object Storage helpers
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
