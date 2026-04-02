"""
Iteration 12 Tests - Beats API CRUD Operations
Tests the new beats catalog API endpoints:
- GET /api/beats - list beats (public)
- GET /api/beats/{beat_id} - get single beat (public)
- POST /api/beats - create beat (admin only)
- PUT /api/beats/{beat_id} - update beat (admin only)
- DELETE /api/beats/{beat_id} - delete beat (admin only)
- POST /api/beats/{beat_id}/audio - upload audio (admin only)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


class TestBeatsPublicEndpoints:
    """Test public beats endpoints (no auth required)"""
    
    def test_list_beats_returns_seeded_data(self):
        """GET /api/beats should return list of seeded demo beats"""
        response = requests.get(f"{BASE_URL}/api/beats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "beats" in data
        assert "total" in data
        assert isinstance(data["beats"], list)
        
        # Should have seeded demo beats
        beats = data["beats"]
        assert len(beats) >= 1, "Expected at least 1 beat from seeded data"
        
        # Verify beat structure
        beat = beats[0]
        assert "id" in beat
        assert "title" in beat
        assert "genre" in beat
        assert "bpm" in beat
        assert "key" in beat
        assert "prices" in beat
        print(f"✓ List beats returned {len(beats)} beats")
    
    def test_list_beats_filter_by_genre(self):
        """GET /api/beats?genre=Trap should filter by genre"""
        response = requests.get(f"{BASE_URL}/api/beats?genre=Trap")
        assert response.status_code == 200
        data = response.json()
        
        # All returned beats should match genre filter (case-insensitive)
        for beat in data["beats"]:
            assert "trap" in beat["genre"].lower(), f"Beat {beat['title']} doesn't match genre filter"
        print(f"✓ Genre filter working - returned {len(data['beats'])} Trap beats")
    
    def test_get_single_beat(self):
        """GET /api/beats/{beat_id} should return single beat"""
        # First get list to find a beat ID
        list_response = requests.get(f"{BASE_URL}/api/beats")
        assert list_response.status_code == 200
        beats = list_response.json()["beats"]
        assert len(beats) > 0, "No beats available to test"
        
        beat_id = beats[0]["id"]
        
        # Get single beat
        response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert response.status_code == 200
        beat = response.json()
        
        # Verify beat data
        assert beat["id"] == beat_id
        assert "title" in beat
        assert "genre" in beat
        assert "bpm" in beat
        assert "prices" in beat
        print(f"✓ Get single beat: {beat['title']}")
    
    def test_get_nonexistent_beat_returns_404(self):
        """GET /api/beats/{invalid_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/beats/nonexistent_beat_id")
        assert response.status_code == 404
        print("✓ Nonexistent beat returns 404")


class TestBeatsAdminEndpoints:
    """Test admin-only beats endpoints (auth required)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        token = response.json().get("access_token")
        assert token, "No access_token in login response"
        return token
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Headers with admin auth"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_beat_requires_auth(self):
        """POST /api/beats without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": "Test Beat",
            "genre": "Hip-Hop",
            "bpm": 90
        })
        assert response.status_code == 401
        print("✓ Create beat requires authentication")
    
    def test_create_beat_as_admin(self, auth_headers):
        """POST /api/beats as admin should create beat"""
        unique_title = f"TEST_Beat_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": unique_title,
            "genre": "Hip-Hop",
            "bpm": 95,
            "key": "Am",
            "mood": "Energetic",
            "tags": ["test", "hiphop"],
            "price_basic": 29.99,
            "price_premium": 79.99,
            "price_unlimited": 149.99,
            "price_exclusive": 499.99
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Create beat failed: {response.text}"
        beat = response.json()
        
        # Verify created beat
        assert beat["title"] == unique_title
        assert beat["genre"] == "Hip-Hop"
        assert beat["bpm"] == 95
        assert beat["key"] == "Am"
        assert "id" in beat
        assert beat["id"].startswith("beat_")
        assert beat["prices"]["basic_lease"] == 29.99
        
        # Verify persistence - GET the created beat
        get_response = requests.get(f"{BASE_URL}/api/beats/{beat['id']}")
        assert get_response.status_code == 200
        fetched_beat = get_response.json()
        assert fetched_beat["title"] == unique_title
        
        print(f"✓ Created beat: {beat['id']}")
        return beat["id"]
    
    def test_update_beat_requires_auth(self):
        """PUT /api/beats/{id} without auth should return 401"""
        # Get a beat ID first
        list_response = requests.get(f"{BASE_URL}/api/beats")
        beats = list_response.json()["beats"]
        if not beats:
            pytest.skip("No beats to test update")
        
        beat_id = beats[0]["id"]
        response = requests.put(f"{BASE_URL}/api/beats/{beat_id}", json={
            "title": "Updated Title"
        })
        assert response.status_code == 401
        print("✓ Update beat requires authentication")
    
    def test_update_beat_as_admin(self, auth_headers):
        """PUT /api/beats/{id} as admin should update beat"""
        # First create a test beat
        unique_title = f"TEST_Update_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": unique_title,
            "genre": "Trap",
            "bpm": 140
        }, headers=auth_headers)
        assert create_response.status_code == 200
        beat_id = create_response.json()["id"]
        
        # Update the beat
        new_title = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        update_response = requests.put(f"{BASE_URL}/api/beats/{beat_id}", json={
            "title": new_title,
            "bpm": 145,
            "mood": "Dark"
        }, headers=auth_headers)
        
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated_beat = update_response.json()
        assert updated_beat["title"] == new_title
        assert updated_beat["bpm"] == 145
        assert updated_beat["mood"] == "Dark"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert get_response.status_code == 200
        fetched_beat = get_response.json()
        assert fetched_beat["title"] == new_title
        assert fetched_beat["bpm"] == 145
        
        print(f"✓ Updated beat: {beat_id}")
    
    def test_delete_beat_requires_auth(self):
        """DELETE /api/beats/{id} without auth should return 401"""
        list_response = requests.get(f"{BASE_URL}/api/beats")
        beats = list_response.json()["beats"]
        if not beats:
            pytest.skip("No beats to test delete")
        
        beat_id = beats[0]["id"]
        response = requests.delete(f"{BASE_URL}/api/beats/{beat_id}")
        assert response.status_code == 401
        print("✓ Delete beat requires authentication")
    
    def test_delete_beat_as_admin(self, auth_headers):
        """DELETE /api/beats/{id} as admin should delete beat"""
        # First create a test beat to delete
        unique_title = f"TEST_Delete_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/beats", json={
            "title": unique_title,
            "genre": "Pop",
            "bpm": 120
        }, headers=auth_headers)
        assert create_response.status_code == 200
        beat_id = create_response.json()["id"]
        
        # Delete the beat
        delete_response = requests.delete(f"{BASE_URL}/api/beats/{beat_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json().get("message", "").lower()
        
        # Verify deletion - should return 404
        get_response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert get_response.status_code == 404
        
        print(f"✓ Deleted beat: {beat_id}")
    
    def test_delete_nonexistent_beat_returns_404(self, auth_headers):
        """DELETE /api/beats/{invalid_id} should return 404"""
        response = requests.delete(f"{BASE_URL}/api/beats/nonexistent_beat_id", headers=auth_headers)
        assert response.status_code == 404
        print("✓ Delete nonexistent beat returns 404")


class TestAuthEndpoints:
    """Test authentication endpoints for registration flow"""
    
    def test_login_with_admin_credentials(self):
        """POST /api/auth/login with admin credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")
    
    def test_login_with_invalid_credentials(self):
        """POST /api/auth/login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")
    
    def test_register_new_user(self):
        """POST /api/auth/register should create new user with all fields"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "artist_name": "Test Artist",
            "email": unique_email,
            "password": "TestPass123!",
            "user_role": "artist",
            "legal_name": "Test Legal Name",
            "country": "United States",
            "state": "California",
            "town": "Los Angeles",
            "post_code": "90001"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print(f"✓ Registered new user: {unique_email}")
    
    def test_register_duplicate_email_fails(self):
        """POST /api/auth/register with existing email should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate User",
            "email": ADMIN_EMAIL,  # Already exists
            "password": "TestPass123!"
        })
        assert response.status_code in [400, 409], f"Expected 400/409, got {response.status_code}"
        print("✓ Duplicate email registration rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
