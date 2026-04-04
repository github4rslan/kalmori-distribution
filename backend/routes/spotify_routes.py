"""Spotify DSP Integration Routes — OAuth + Artist Data Fetching"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timezone
import os
import logging
import spotipy
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials

from core import db, get_current_user

logger = logging.getLogger(__name__)
spotify_router = APIRouter(prefix="/api/spotify")

SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
REDIRECT_URI = f"{FRONTEND_URL}/api/spotify/callback"

SCOPES = "user-read-private user-read-email"


def get_spotify_oauth(state=None):
    return SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SCOPES,
        state=state,
        show_dialog=True,
    )


def get_client_credentials_sp():
    """For public artist data lookups (no user auth needed)"""
    auth_manager = SpotifyClientCredentials(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(auth_manager=auth_manager)


# ===== OAuth Flow =====
@spotify_router.get("/connect")
async def spotify_connect(request: Request):
    """Start Spotify OAuth flow — returns auth URL for the user to visit"""
    user = await get_current_user(request)
    sp_oauth = get_spotify_oauth(state=user["id"])
    auth_url = sp_oauth.get_authorize_url()
    return {"auth_url": auth_url}


@spotify_router.get("/callback")
async def spotify_callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle Spotify OAuth callback — exchanges code for tokens"""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/settings?spotify=error&reason={error}")

    if not code:
        return RedirectResponse(f"{FRONTEND_URL}/settings?spotify=error&reason=no_code")

    try:
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code, as_dict=True)

        # Get the user's Spotify profile
        sp = spotipy.Spotify(auth=token_info["access_token"])
        spotify_profile = sp.me()

        # Search for matching artist profile on Spotify
        artist_data = None
        spotify_artist_id = None

        # Try to find the user's artist profile
        if state:
            user = await db.users.find_one({"id": state}, {"_id": 0})
            if user:
                artist_name = user.get("artist_name", user.get("name", ""))
                if artist_name:
                    results = sp.search(q=f'artist:"{artist_name}"', type="artist", limit=5)
                    artists = results.get("artists", {}).get("items", [])
                    if artists:
                        # Pick the best match
                        for a in artists:
                            if a["name"].lower() == artist_name.lower():
                                artist_data = a
                                spotify_artist_id = a["id"]
                                break
                        if not artist_data and artists:
                            artist_data = artists[0]
                            spotify_artist_id = artists[0]["id"]

        # Store connection in DB
        now = datetime.now(timezone.utc).isoformat()
        connection_doc = {
            "user_id": state,
            "spotify_user_id": spotify_profile.get("id"),
            "spotify_display_name": spotify_profile.get("display_name"),
            "spotify_email": spotify_profile.get("email"),
            "spotify_product": spotify_profile.get("product"),
            "spotify_artist_id": spotify_artist_id,
            "spotify_artist_name": artist_data.get("name") if artist_data else None,
            "spotify_artist_followers": artist_data.get("followers", {}).get("total") if artist_data else None,
            "spotify_artist_image": artist_data["images"][0]["url"] if artist_data and artist_data.get("images") else None,
            "access_token": token_info["access_token"],
            "refresh_token": token_info.get("refresh_token"),
            "token_expires_at": token_info.get("expires_at"),
            "connected_at": now,
            "updated_at": now,
        }

        await db.spotify_connections.update_one(
            {"user_id": state},
            {"$set": connection_doc},
            upsert=True,
        )

        return RedirectResponse(f"{FRONTEND_URL}/settings?spotify=success")

    except Exception as e:
        logger.error(f"Spotify callback error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?spotify=error&reason=token_exchange_failed")


@spotify_router.get("/status")
async def spotify_status(request: Request):
    """Check if current user has connected Spotify"""
    user = await get_current_user(request)
    conn = await db.spotify_connections.find_one(
        {"user_id": user["id"]},
        {"_id": 0, "access_token": 0, "refresh_token": 0, "token_expires_at": 0},
    )
    if not conn:
        return {"connected": False}
    return {
        "connected": True,
        "spotify_display_name": conn.get("spotify_display_name"),
        "spotify_artist_id": conn.get("spotify_artist_id"),
        "spotify_artist_name": conn.get("spotify_artist_name"),
        "spotify_artist_followers": conn.get("spotify_artist_followers"),
        "spotify_artist_image": conn.get("spotify_artist_image"),
        "connected_at": conn.get("connected_at"),
    }


@spotify_router.post("/disconnect")
async def spotify_disconnect(request: Request):
    """Disconnect Spotify account"""
    user = await get_current_user(request)
    await db.spotify_connections.delete_one({"user_id": user["id"]})
    return {"message": "Spotify disconnected"}


@spotify_router.post("/refresh-artist")
async def refresh_artist_link(request: Request):
    """Manually search and link a Spotify artist to the user's account"""
    user = await get_current_user(request)
    body = await request.json()
    artist_query = body.get("artist_name", "")

    conn = await db.spotify_connections.find_one({"user_id": user["id"]})
    if not conn:
        raise HTTPException(status_code=400, detail="Spotify not connected")

    try:
        sp = get_client_credentials_sp()
        results = sp.search(q=f'artist:"{artist_query}"', type="artist", limit=5)
        artists = results.get("artists", {}).get("items", [])
        suggestions = []
        for a in artists:
            suggestions.append({
                "id": a["id"],
                "name": a["name"],
                "followers": a.get("followers", {}).get("total", 0),
                "image": a["images"][0]["url"] if a.get("images") else None,
                "genres": a.get("genres", [])[:3],
                "popularity": a.get("popularity", 0),
            })
        return {"artists": suggestions}
    except Exception as e:
        logger.error(f"Spotify artist search error: {e}")
        raise HTTPException(status_code=500, detail="Spotify search failed")


@spotify_router.post("/link-artist")
async def link_spotify_artist(request: Request):
    """Link a specific Spotify artist ID to the user's account"""
    user = await get_current_user(request)
    body = await request.json()
    artist_id = body.get("artist_id")

    if not artist_id:
        raise HTTPException(status_code=400, detail="artist_id required")

    conn = await db.spotify_connections.find_one({"user_id": user["id"]})
    if not conn:
        raise HTTPException(status_code=400, detail="Spotify not connected")

    try:
        sp = get_client_credentials_sp()
        artist = sp.artist(artist_id)

        await db.spotify_connections.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "spotify_artist_id": artist["id"],
                "spotify_artist_name": artist["name"],
                "spotify_artist_followers": artist.get("followers", {}).get("total", 0),
                "spotify_artist_image": artist["images"][0]["url"] if artist.get("images") else None,
                "spotify_artist_genres": artist.get("genres", []),
                "spotify_artist_popularity": artist.get("popularity", 0),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return {
            "message": "Artist linked",
            "artist_name": artist["name"],
            "artist_id": artist["id"],
            "followers": artist.get("followers", {}).get("total", 0),
        }
    except Exception as e:
        logger.error(f"Spotify link artist error: {e}")
        raise HTTPException(status_code=500, detail="Failed to link artist")


# ===== Artist Analytics (Real Data) =====
@spotify_router.get("/artist-data")
async def get_spotify_artist_data(request: Request):
    """Fetch real Spotify data for the connected artist"""
    user = await get_current_user(request)
    conn = await db.spotify_connections.find_one({"user_id": user["id"]})
    if not conn or not conn.get("spotify_artist_id"):
        raise HTTPException(status_code=400, detail="No Spotify artist linked")

    artist_id = conn["spotify_artist_id"]
    try:
        sp = get_client_credentials_sp()

        # Fetch artist profile
        artist = sp.artist(artist_id)

        # Fetch top tracks
        top_tracks_data = sp.artist_top_tracks(artist_id, country="US")
        top_tracks = []
        for t in top_tracks_data.get("tracks", [])[:10]:
            top_tracks.append({
                "name": t["name"],
                "album": t["album"]["name"],
                "album_image": t["album"]["images"][0]["url"] if t["album"].get("images") else None,
                "popularity": t.get("popularity", 0),
                "duration_ms": t.get("duration_ms", 0),
                "preview_url": t.get("preview_url"),
                "external_url": t.get("external_urls", {}).get("spotify"),
                "track_number": t.get("track_number"),
                "explicit": t.get("explicit", False),
            })

        # Fetch albums
        albums_data = sp.artist_albums(artist_id, album_type="album,single", limit=20, country="US")
        albums = []
        for a in albums_data.get("items", []):
            albums.append({
                "id": a["id"],
                "name": a["name"],
                "type": a.get("album_type", "album"),
                "release_date": a.get("release_date"),
                "total_tracks": a.get("total_tracks", 0),
                "image": a["images"][0]["url"] if a.get("images") else None,
                "external_url": a.get("external_urls", {}).get("spotify"),
            })

        # Fetch related artists
        related_data = sp.artist_related_artists(artist_id)
        related = []
        for r in related_data.get("artists", [])[:6]:
            related.append({
                "id": r["id"],
                "name": r["name"],
                "followers": r.get("followers", {}).get("total", 0),
                "image": r["images"][0]["url"] if r.get("images") else None,
                "genres": r.get("genres", [])[:3],
                "popularity": r.get("popularity", 0),
            })

        # Update cached data
        now = datetime.now(timezone.utc).isoformat()
        await db.spotify_connections.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "spotify_artist_followers": artist.get("followers", {}).get("total", 0),
                "spotify_artist_popularity": artist.get("popularity", 0),
                "spotify_artist_genres": artist.get("genres", []),
                "last_data_fetch": now,
                "updated_at": now,
            }},
        )

        return {
            "artist": {
                "name": artist["name"],
                "id": artist["id"],
                "followers": artist.get("followers", {}).get("total", 0),
                "popularity": artist.get("popularity", 0),
                "genres": artist.get("genres", []),
                "image": artist["images"][0]["url"] if artist.get("images") else None,
                "external_url": artist.get("external_urls", {}).get("spotify"),
            },
            "top_tracks": top_tracks,
            "albums": albums,
            "related_artists": related,
            "fetched_at": now,
        }

    except Exception as e:
        logger.error(f"Spotify artist data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Spotify data")
