"""AI Features - Metadata suggestions, descriptions, analytics insights, release strategy"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import uuid
import logging
import json

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
        except Exception:
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


class ReleaseStrategyRequest(BaseModel):
    release_title: Optional[str] = None
    genre: Optional[str] = None

@ai_router.post("/release-strategy")
async def get_release_strategy(data: ReleaseStrategyRequest, request: Request):
    """Generate AI-powered release strategy based on fan analytics data"""
    user = await _get_user_from_request(request)
    
    from motor.motor_asyncio import AsyncIOMotorClient
    db_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = db_client[os.environ['DB_NAME']]
    
    try:
        # Gather fan analytics data
        # 1. Platform engagement
        platform_pipeline = [
            {"$match": {"artist_id": user["id"]}},
            {"$group": {"_id": "$platform", "streams": {"$sum": 1}, "revenue": {"$sum": "$revenue"}}},
            {"$sort": {"streams": -1}}
        ]
        platform_results = await db.stream_events.aggregate(platform_pipeline).to_list(10)
        total_streams = sum(p["streams"] for p in platform_results) if platform_results else 0
        platforms_data = []
        for p in platform_results:
            pct = round(p["streams"] / max(total_streams, 1) * 100, 1)
            platforms_data.append(f"{p['_id']}: {p['streams']} streams ({pct}%)")
        
        # 2. Top countries
        country_pipeline = [
            {"$match": {"artist_id": user["id"]}},
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 8}
        ]
        country_results = await db.stream_events.aggregate(country_pipeline).to_list(8)
        total_country = sum(c["count"] for c in country_results) if country_results else 1
        countries_data = []
        country_names = {"US": "United States", "UK": "United Kingdom", "NG": "Nigeria", "DE": "Germany", "CA": "Canada", "AU": "Australia", "BR": "Brazil", "JP": "Japan", "FR": "France", "IN": "India", "JM": "Jamaica", "KE": "Kenya", "GH": "Ghana", "ZA": "South Africa"}
        for c in country_results:
            name = country_names.get(c["_id"], c["_id"])
            pct = round(c["count"] / total_country * 100, 1)
            countries_data.append(f"{name} ({c['_id']}): {pct}%")
        
        # 3. Peak listening hours
        hour_pipeline = [
            {"$match": {"artist_id": user["id"]}},
            {"$addFields": {"hour_str": {"$substr": ["$timestamp", 11, 2]}}},
            {"$group": {"_id": "$hour_str", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}, {"$limit": 5}
        ]
        peak_hours_results = await db.stream_events.aggregate(hour_pipeline).to_list(5)
        peak_hours_data = []
        for h in peak_hours_results:
            hr = int(h["_id"]) if h["_id"].isdigit() else 0
            peak_hours_data.append(f"{hr}:00 UTC ({h['count']} streams)")

        # 4. Releases info
        releases = await db.releases.find({"artist_id": user["id"]}, {"_id": 0, "title": 1, "genre": 1, "release_type": 1, "status": 1}).to_list(50)
        release_count = len(releases)
        genres = list(set(r.get("genre", "") for r in releases if r.get("genre")))

        # 5. Pre-save campaigns
        campaigns = await db.presave_campaigns.find({"artist_id": user["id"]}, {"_id": 0, "subscriber_count": 1}).to_list(20)
        total_presave_subs = sum(c.get("subscriber_count", 0) for c in campaigns)

        db_client.close()

        # Build the AI prompt
        prompt = f"""You are a music industry strategist specializing in digital distribution and audience growth. Analyze this artist's data and provide a comprehensive, personalized release strategy.

ARTIST PROFILE:
- Total Streams: {total_streams:,}
- Releases: {release_count}
- Genres: {', '.join(genres) if genres else data.genre or 'Not specified'}
- Plan: {user.get('plan', 'free')}
- Pre-Save Subscribers: {total_presave_subs}
{f'- Upcoming Release: {data.release_title}' if data.release_title else ''}
{f'- Target Genre: {data.genre}' if data.genre else ''}

TOP PLATFORMS (by streams):
{chr(10).join(platforms_data) if platforms_data else 'No streaming data yet'}

TOP LISTENER COUNTRIES:
{chr(10).join(countries_data) if countries_data else 'No geographic data yet'}

PEAK LISTENING HOURS (UTC):
{chr(10).join(peak_hours_data) if peak_hours_data else 'No hourly data yet'}

Based on this data, provide your strategy as a valid JSON object with this exact structure:
{{
  "optimal_release_day": "e.g. Friday",
  "optimal_release_time": "e.g. 00:00 UTC (midnight)",
  "release_day_reasoning": "Why this day/time based on the data",
  "target_platforms": [
    {{"platform": "Spotify", "priority": "high", "tactic": "Submit to editorial playlists 2-3 weeks before release"}}
  ],
  "geographic_strategy": [
    {{"region": "United States", "tactic": "Focus paid promotion during US peak hours (evening EST)"}}
  ],
  "pre_release_timeline": [
    {{"days_before": 28, "action": "Submit to Spotify editorial playlists"}},
    {{"days_before": 14, "action": "Launch pre-save campaign"}}
  ],
  "promotion_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "estimated_first_week_range": "e.g. 500-2,000 streams",
  "confidence_note": "Brief note on data quality and confidence level"
}}

Return ONLY the JSON. No markdown, no explanation outside the JSON."""

        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"strategy_{user['id']}_{uuid.uuid4().hex[:8]}",
                system_message="You are an expert music industry strategist. Always respond with valid JSON only. No markdown formatting."
            ).with_model("openai", "gpt-4o")
            
            msg = UserMessage(text=prompt)
            response = await chat.send_message(msg)
            
            # Parse the JSON response
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
            strategy = json.loads(clean)
            return {
                "strategy": strategy,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_summary": {
                    "total_streams": total_streams,
                    "top_platform": platform_results[0]["_id"] if platform_results else None,
                    "top_country": country_results[0]["_id"] if country_results else None,
                    "peak_hour": int(peak_hours_results[0]["_id"]) if peak_hours_results and peak_hours_results[0]["_id"].isdigit() else None,
                    "release_count": release_count,
                    "presave_subscribers": total_presave_subs,
                }
            }
        except json.JSONDecodeError:
            # Return raw text if JSON parsing fails
            return {
                "strategy": {
                    "optimal_release_day": "Friday",
                    "optimal_release_time": "00:00 UTC",
                    "release_day_reasoning": response if response else "Friday releases align with New Music Friday playlists on major platforms.",
                    "target_platforms": [],
                    "geographic_strategy": [],
                    "pre_release_timeline": [],
                    "promotion_tips": [response] if response else ["Engage fans consistently on social media before release"],
                    "estimated_first_week_range": "Varies",
                    "confidence_note": "AI response was not structured. Raw insights included above."
                },
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_summary": {
                    "total_streams": total_streams,
                    "top_platform": platform_results[0]["_id"] if platform_results else None,
                    "top_country": country_results[0]["_id"] if country_results else None,
                    "peak_hour": int(peak_hours_results[0]["_id"]) if peak_hours_results and peak_hours_results[0]["_id"].isdigit() else None,
                    "release_count": release_count,
                    "presave_subscribers": total_presave_subs,
                }
            }
        except Exception as e:
            logger.error(f"AI release strategy LLM error: {e}")
            raise
    except HTTPException:
        db_client.close()
        raise
    except Exception as e:
        db_client.close()
        logger.error(f"AI release strategy error: {e}")
        # Fallback strategy
        return {
            "strategy": {
                "optimal_release_day": "Friday",
                "optimal_release_time": "00:00 UTC (midnight)",
                "release_day_reasoning": "Friday is the industry standard for new releases, aligning with 'New Music Friday' playlists across all major platforms.",
                "target_platforms": [
                    {"platform": "Spotify", "priority": "high", "tactic": "Submit to editorial playlists via Spotify for Artists 2-3 weeks before release date."},
                    {"platform": "Apple Music", "priority": "high", "tactic": "Ensure pre-add is enabled and submit for Apple Music editorial consideration."},
                    {"platform": "TikTok", "priority": "medium", "tactic": "Create short-form teaser content using catchy hooks from the release."},
                ],
                "geographic_strategy": [
                    {"region": "Primary Markets", "tactic": "Focus initial promotion on your top streaming countries during their prime evening hours."}
                ],
                "pre_release_timeline": [
                    {"days_before": 28, "action": "Submit to Spotify editorial playlists"},
                    {"days_before": 21, "action": "Announce release on social media with teaser content"},
                    {"days_before": 14, "action": "Launch pre-save campaign"},
                    {"days_before": 7, "action": "Release snippet/preview on TikTok and Instagram Reels"},
                    {"days_before": 3, "action": "Send email blast to mailing list subscribers"},
                    {"days_before": 0, "action": "Release day — coordinate social posts across all platforms"},
                ],
                "promotion_tips": [
                    "Engage with fans in comments and DMs during release week.",
                    "Create platform-specific content (Spotify Canvas, Apple Music Animated Art).",
                    "Collaborate with playlist curators and music blogs in your genre.",
                ],
                "estimated_first_week_range": "Varies based on existing audience",
                "confidence_note": "This is a general strategy. Connect streaming analytics for personalized recommendations."
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "data_summary": {
                "total_streams": 0,
                "top_platform": None,
                "top_country": None,
                "peak_hour": None,
                "release_count": 0,
                "presave_subscribers": 0,
            },
            "fallback": True
        }
