"""AI Features - Metadata suggestions, descriptions, analytics insights"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import logging

logger = logging.getLogger(__name__)

ai_router = APIRouter(prefix="/api/ai")

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

async def _get_user_from_request(request: Request):
    from server import get_current_user
    return await get_current_user(request)

class MetadataSuggestRequest(BaseModel):
    title: str
    genre: Optional[str] = None
    mood: Optional[str] = None

class DescriptionRequest(BaseModel):
    title: str
    artist_name: str
    genre: Optional[str] = None
    track_count: Optional[int] = 1

@ai_router.get("/analytics-insights")
async def get_analytics_insights(request: Request):
    user = await _get_user_from_request(request)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"insights_{user['id']}_{uuid.uuid4().hex[:8]}",
            system_message="You are a music industry analytics expert. Provide concise, actionable insights for independent artists based on their streaming data. Keep responses under 200 words. Use bullet points."
        ).with_model("openai", "gpt-4o")
        
        from motor.motor_asyncio import AsyncIOMotorClient
        db_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = db_client[os.environ['DB_NAME']]
        
        releases = await db.releases.find({"artist_id": user["id"]}).to_list(50)
        release_count = len(releases)
        genres = list(set(r.get("genre", "Unknown") for r in releases))
        
        prompt = f"""Analyze this artist's profile and provide strategic insights:
- Releases: {release_count}
- Genres: {', '.join(genres) if genres else 'Not specified'}
- Plan: {user.get('plan', 'free')}

Provide insights on:
1. Release strategy recommendations
2. Potential audience growth tactics
3. Revenue optimization tips
4. Platform-specific strategies (Spotify, Apple Music, TikTok)"""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        db_client.close()
        return {"insights": response}
    except Exception as e:
        logger.error(f"AI insights error: {e}")
        return {"insights": "AI insights are temporarily unavailable. Here are general tips:\n\n- Release consistently (every 4-6 weeks)\n- Optimize metadata for discoverability\n- Engage with playlists on Spotify and Apple Music\n- Use TikTok to promote snippets before release\n- Collaborate with other artists in your genre"}

@ai_router.post("/metadata-suggestions")
async def get_metadata_suggestions(data: MetadataSuggestRequest, request: Request):
    await _get_user_from_request(request)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"metadata_{uuid.uuid4().hex[:8]}",
            system_message="You are a music metadata expert. Return JSON only, no markdown. Suggest optimal metadata for music releases to maximize discoverability on streaming platforms."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Suggest metadata for a music release:
Title: {data.title}
Genre: {data.genre or 'Not specified'}
Mood: {data.mood or 'Not specified'}

Return a JSON object with these fields:
{{"suggested_genres": ["primary genre", "sub-genre"], "suggested_moods": ["mood1", "mood2", "mood3"], "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"], "suggested_description": "A 1-2 sentence description", "suggested_language": "language code", "suggested_bpm_range": "e.g. 120-130"}}"""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        import json
        try:
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            suggestions = json.loads(clean)
        except:
            suggestions = {
                "suggested_genres": [data.genre or "Pop"], "suggested_moods": [data.mood or "Energetic"],
                "suggested_tags": [data.title.lower()], "suggested_description": f"A {data.genre or 'new'} release: {data.title}",
                "suggested_language": "en", "suggested_bpm_range": "100-140", "raw_response": response
            }
        return suggestions
    except Exception as e:
        logger.error(f"AI metadata error: {e}")
        return {"suggested_genres": [data.genre or "Pop"], "suggested_moods": [data.mood or "Energetic"],
                "suggested_tags": [data.title.lower(), "new release", "indie"], "suggested_description": f"{data.title} - a fresh release",
                "suggested_language": "en", "suggested_bpm_range": "100-140"}

@ai_router.post("/generate-description")
async def generate_description(data: DescriptionRequest, request: Request):
    await _get_user_from_request(request)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"desc_{uuid.uuid4().hex[:8]}",
            system_message="You are a music marketing copywriter. Write compelling, concise descriptions for music releases. Keep it under 100 words."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Write a compelling release description for:\nTitle: {data.title}\nArtist: {data.artist_name}\nGenre: {data.genre or 'Various'}\nTracks: {data.track_count}"
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        return {"description": response}
    except Exception as e:
        logger.error(f"AI description error: {e}")
        return {"description": f"{data.title} by {data.artist_name} - an exciting new {data.genre or ''} release."}
