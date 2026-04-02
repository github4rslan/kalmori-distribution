"""
Iteration 13: Admin Beat Manager API Tests
Tests for Admin Beat Manager CRUD operations:
- GET /api/beats (public, list all beats)
- GET /api/beats/{id} (public, get single beat)
- POST /api/beats (admin only, create beat)
- PUT /api/beats/{id} (admin only, update beat)
- DELETE /api/beats/{id} (admin only, delete beat)
- POST /api/beats/{id}/audio (admin only, upload audio)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBeatsPublicEndpoints:
    """Public beats endpoints - no auth required"""
    
    def test_list_beats_returns_200(self):
        """GET /api/beats returns list of beats"""
        response = requests.get(f"{BASE_URL}/api/beats")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        assert "total" in data
        assert isinstance(data["beats"], list)
        print(f"✓ GET /api/beats returned {data['total']} beats")
    
    def test_list_beats_with_genre_filter(self):
        """GET /api/beats?genre=Trap filters by genre"""
        response = requests.get(f"{BASE_URL}/api/beats?genre=Trap")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        # All returned beats should match genre filter
        for beat in data["beats"]:
            assert "trap" in beat["genre"].lower()
        print(f"✓ Genre filter returned {len(data['beats'])} Trap beats")
    
    def test_list_beats_with_mood_filter(self):
        """GET /api/beats?mood=Dark filters by mood"""
        response = requests.get(f"{BASE_URL}/api/beats?mood=Dark")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        print(f"✓ Mood filter returned {len(data['beats'])} Dark mood beats")
    
    def test_get_single_beat_returns_beat_details(self):
        """GET /api/beats/{id} returns single beat"""
        # First get list to find a beat ID
        list_response = requests.get(f"{BASE_URL}/api/beats")
        beats = list_response.json()["beats"]
        if not beats:
            pytest.skip("No beats in database to test")
        
        beat_id = beats[0]["id"]
        response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert response.status_code == 200
        beat = response.json()
        assert beat["id"] == beat_id
        assert "title" in beat
        assert "genre" in beat
        assert "bpm" in beat
        assert "prices" in beat
        print(f"✓ GET /api/beats/{beat_id} returned beat: {beat['title']}")
    
    def test_get_nonexistent_beat_returns_404(self):
        """GET /api/beats/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/beats/beat_nonexistent123")
        assert response.status_code == 404
        print("✓ GET /api/beats/invalid_id returns 404")


class TestBeatsAdminEndpoints:
    """Admin-only beats endpoints - require authentication"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        return response.json()["access_token"]
    
    @pytest.fixture
    def admin_headers(self, admin_token):
        """Headers with admin auth token"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_beat_requires_auth(self):
        """POST /api/beats without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": "Unauthorized Beat",
            "genre": "Hip-Hop/Rap",
            "bpm": 90
        })
        assert response.status_code == 401
        print("✓ POST /api/beats without auth returns 401")
    
    def test_create_beat_as_admin(self, admin_headers):
        """POST /api/beats as admin creates beat successfully"""
        unique_id = uuid.uuid4().hex[:8]
        beat_data = {
            "title": f"TEST_AdminBeat_{unique_id}",
            "genre": "Hip-Hop/Rap",
            "bpm": 95,
            "key": "Am",
            "mood": "Chill",
            "price_basic": 29.99,
            "price_premium": 79.99,
            "price_unlimited": 149.99,
            "price_exclusive": 499.99
        }
        response = requests.post(f"{BASE_URL}/api/beats", json=beat_data, headers=admin_headers)
        assert response.status_code == 200
        created = response.json()
        assert created["title"] == beat_data["title"]
        assert created["genre"] == beat_data["genre"]
        assert created["bpm"] == beat_data["bpm"]
        assert created["key"] == beat_data["key"]
        assert created["mood"] == beat_data["mood"]
        assert "id" in created
        assert created["prices"]["basic_lease"] == beat_data["price_basic"]
        print(f"✓ POST /api/beats created beat: {created['id']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/beats/{created['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == beat_data["title"]
        print(f"✓ Beat persisted and verified via GET")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/beats/{created['id']}", headers=admin_headers)
    
    def test_update_beat_requires_auth(self, admin_headers):
        """PUT /api/beats/{id} without auth returns 401"""
        # First create a beat to update
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": f"TEST_UpdateAuth_{unique_id}",
            "genre": "Trap",
            "bpm": 140
        }, headers=admin_headers)
        beat_id = create_response.json()["id"]
        
        # Try to update without auth
        response = requests.put(f"{BASE_URL}/api/beats/{beat_id}", json={
            "title": "Unauthorized Update"
        })
        assert response.status_code == 401
        print("✓ PUT /api/beats/{id} without auth returns 401")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=admin_headers)
    
    def test_update_beat_as_admin(self, admin_headers):
        """PUT /api/beats/{id} as admin updates beat successfully"""
        unique_id = uuid.uuid4().hex[:8]
        # Create beat
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": f"TEST_ToUpdate_{unique_id}",
            "genre": "R&B/Soul",
            "bpm": 80,
            "key": "Dm",
            "mood": "Romantic"
        }, headers=admin_headers)
        beat_id = create_response.json()["id"]
        
        # Update beat
        update_data = {
            "title": f"TEST_Updated_{unique_id}",
            "genre": "Pop",
            "bpm": 120,
            "key": "Gm",
            "mood": "Happy",
            "prices": {
                "basic_lease": 39.99,
                "premium_lease": 89.99,
                "unlimited_lease": 159.99,
                "exclusive": 599.99
            }
        }
        response = requests.put(f"{BASE_URL}/api/beats/{beat_id}", json=update_data, headers=admin_headers)
        assert response.status_code == 200
        updated = response.json()
        assert updated["title"] == update_data["title"]
        assert updated["genre"] == update_data["genre"]
        assert updated["bpm"] == update_data["bpm"]
        assert updated["key"] == update_data["key"]
        assert updated["mood"] == update_data["mood"]
        assert updated["prices"]["basic_lease"] == update_data["prices"]["basic_lease"]
        print(f"✓ PUT /api/beats/{beat_id} updated successfully")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        fetched = get_response.json()
        assert fetched["title"] == update_data["title"]
        assert fetched["prices"]["basic_lease"] == 39.99
        print("✓ Update persisted and verified via GET")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=admin_headers)
    
    def test_delete_beat_requires_auth(self, admin_headers):
        """DELETE /api/beats/{id} without auth returns 401"""
        # Create a beat to delete
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": f"TEST_DeleteAuth_{unique_id}",
            "genre": "Drill",
            "bpm": 145
        }, headers=admin_headers)
        beat_id = create_response.json()["id"]
        
        # Try to delete without auth
        response = requests.delete(f"{BASE_URL}/api/beats/{beat_id}")
        assert response.status_code == 401
        print("✓ DELETE /api/beats/{id} without auth returns 401")
        
        # Cleanup with auth
        requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=admin_headers)
    
    def test_delete_beat_as_admin(self, admin_headers):
        """DELETE /api/beats/{id} as admin deletes beat successfully"""
        unique_id = uuid.uuid4().hex[:8]
        # Create beat
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": f"TEST_ToDelete_{unique_id}",
            "genre": "Electronic/EDM",
            "bpm": 128
        }, headers=admin_headers)
        beat_id = create_response.json()["id"]
        
        # Delete beat
        response = requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Beat deleted"
        print(f"✓ DELETE /api/beats/{beat_id} deleted successfully")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert get_response.status_code == 404
        print("✓ Beat no longer exists (404)")
    
    def test_delete_nonexistent_beat_returns_404(self, admin_headers):
        """DELETE /api/beats/{invalid_id} returns 404"""
        response = requests.delete(f"{BASE_URL}/api/beats/beat_nonexistent123", headers=admin_headers)
        assert response.status_code == 404
        print("✓ DELETE /api/beats/invalid_id returns 404")


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture
    def regular_user_token(self):
        """Create and login as regular user"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_regular_{unique_id}@example.com"
        
        # Register regular user
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "name": "Test User",
            "artist_name": "Test Artist"
        })
        if register_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        return register_response.json()["access_token"]
    
    @pytest.fixture
    def regular_headers(self, regular_user_token):
        return {"Authorization": f"Bearer {regular_user_token}"}
    
    def test_regular_user_cannot_create_beat(self, regular_headers):
        """POST /api/beats as regular user returns 403"""
        response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": "Unauthorized Beat",
            "genre": "Hip-Hop/Rap",
            "bpm": 90
        }, headers=regular_headers)
        assert response.status_code == 403
        print("✓ Regular user cannot create beat (403)")
    
    def test_regular_user_cannot_update_beat(self, regular_headers):
        """PUT /api/beats/{id} as regular user returns 403"""
        # Get an existing beat
        list_response = requests.get(f"{BASE_URL}/api/beats")
        beats = list_response.json()["beats"]
        if not beats:
            pytest.skip("No beats to test")
        
        beat_id = beats[0]["id"]
        response = requests.put(f"{BASE_URL}/api/beats/{beat_id}", json={
            "title": "Unauthorized Update"
        }, headers=regular_headers)
        assert response.status_code == 403
        print("✓ Regular user cannot update beat (403)")
    
    def test_regular_user_cannot_delete_beat(self, regular_headers):
        """DELETE /api/beats/{id} as regular user returns 403"""
        # Get an existing beat
        list_response = requests.get(f"{BASE_URL}/api/beats")
        beats = list_response.json()["beats"]
        if not beats:
            pytest.skip("No beats to test")
        
        beat_id = beats[0]["id"]
        response = requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=regular_headers)
        assert response.status_code == 403
        print("✓ Regular user cannot delete beat (403)")


class TestBeatAudioUpload:
    """Test audio upload endpoint"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_audio_upload_requires_auth(self, admin_headers):
        """POST /api/beats/{id}/audio without auth returns 401"""
        # Create a beat first
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": f"TEST_AudioAuth_{unique_id}",
            "genre": "Trap",
            "bpm": 140
        }, headers=admin_headers)
        beat_id = create_response.json()["id"]
        
        # Try to upload without auth
        files = {"file": ("test.mp3", b"fake audio content", "audio/mpeg")}
        response = requests.post(f"{BASE_URL}/api/beats/{beat_id}/audio", files=files)
        assert response.status_code == 401
        print("✓ POST /api/beats/{id}/audio without auth returns 401")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=admin_headers)
    
    def test_audio_upload_to_nonexistent_beat_returns_404(self, admin_headers):
        """POST /api/beats/{invalid_id}/audio returns 404"""
        files = {"file": ("test.mp3", b"fake audio content", "audio/mpeg")}
        response = requests.post(f"{BASE_URL}/api/beats/beat_nonexistent123/audio", 
                                files=files, headers=admin_headers)
        assert response.status_code == 404
        print("✓ POST /api/beats/invalid_id/audio returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
