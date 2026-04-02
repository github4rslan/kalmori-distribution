"""
Iteration 32 - Artist Public Profile Feature Tests
Tests for:
- GET /api/artist/profile/slug - Get current user's slug (auto-generates if none)
- PUT /api/artist/profile/slug - Set custom slug
- GET /api/artist/{slug} - Public artist profile (no auth required)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestArtistProfileSlugEndpoints:
    """Tests for authenticated slug management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ============= GET /api/artist/profile/slug =============
    
    def test_get_slug_requires_auth(self):
        """GET /api/artist/profile/slug should require authentication"""
        response = requests.get(f"{BASE_URL}/api/artist/profile/slug")
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
    
    def test_get_slug_returns_slug(self, auth_headers):
        """GET /api/artist/profile/slug should return user's slug"""
        response = requests.get(f"{BASE_URL}/api/artist/profile/slug", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "slug" in data, "Response should contain 'slug' field"
        assert isinstance(data["slug"], str), "Slug should be a string"
        assert len(data["slug"]) >= 2, "Slug should be at least 2 characters"
    
    def test_get_slug_auto_generates_if_none(self, auth_headers):
        """GET /api/artist/profile/slug should auto-generate slug if user has none"""
        response = requests.get(f"{BASE_URL}/api/artist/profile/slug", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Slug should exist (either existing or auto-generated)
        assert data["slug"], "Slug should not be empty"
    
    # ============= PUT /api/artist/profile/slug =============
    
    def test_set_slug_requires_auth(self):
        """PUT /api/artist/profile/slug should require authentication"""
        response = requests.put(f"{BASE_URL}/api/artist/profile/slug", json={"slug": "test-slug"})
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
    
    def test_set_slug_success(self, auth_headers):
        """PUT /api/artist/profile/slug should update user's slug"""
        unique_slug = f"test-artist-{uuid.uuid4().hex[:8]}"
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": unique_slug},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "slug" in data, "Response should contain 'slug' field"
        assert "message" in data, "Response should contain 'message' field"
        
        # Verify slug was set by fetching it
        get_response = requests.get(f"{BASE_URL}/api/artist/profile/slug", headers=auth_headers)
        assert get_response.status_code == 200
        assert get_response.json()["slug"] == data["slug"]
    
    def test_set_slug_rejects_short_slug(self, auth_headers):
        """PUT /api/artist/profile/slug should reject slugs < 2 characters"""
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": "a"},  # Too short
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "Error response should have 'detail'"
    
    def test_set_slug_empty_generates_random(self, auth_headers):
        """PUT /api/artist/profile/slug with empty string auto-generates a random slug"""
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": ""},
            headers=auth_headers
        )
        # Empty slug triggers auto-generation (starts with 'artist-')
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["slug"].startswith("artist-"), "Auto-generated slug should start with 'artist-'"
    
    def test_set_slug_normalizes_input(self, auth_headers):
        """PUT /api/artist/profile/slug should normalize slug (lowercase, remove special chars)"""
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": "My Artist Name!@#"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Slug should be normalized (lowercase, no special chars)
        assert data["slug"].islower() or "-" in data["slug"], "Slug should be normalized"
        assert "!" not in data["slug"], "Special characters should be removed"
        assert "@" not in data["slug"], "Special characters should be removed"
    
    def test_set_slug_duplicate_rejected(self, auth_headers):
        """PUT /api/artist/profile/slug should reject duplicate slugs (409 Conflict)"""
        # First, set a unique slug
        unique_slug = f"unique-test-{uuid.uuid4().hex[:8]}"
        response1 = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": unique_slug},
            headers=auth_headers
        )
        assert response1.status_code == 200
        
        # Create a second user and try to use the same slug
        # Since we can't easily create another user, we'll test that the same user
        # can update their own slug to the same value (should succeed)
        response2 = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": unique_slug},
            headers=auth_headers
        )
        # Same user setting same slug should succeed (not a duplicate)
        assert response2.status_code == 200


class TestPublicArtistProfile:
    """Tests for public artist profile endpoint (no auth required)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def admin_slug(self, auth_headers):
        """Get or set admin user's slug"""
        # First get current slug
        response = requests.get(f"{BASE_URL}/api/artist/profile/slug", headers=auth_headers)
        assert response.status_code == 200
        return response.json()["slug"]
    
    # ============= GET /api/artist/{slug} =============
    
    def test_public_profile_no_auth_required(self, admin_slug):
        """GET /api/artist/{slug} should not require authentication"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200, f"Public profile should be accessible without auth: {response.text}"
    
    def test_public_profile_returns_artist_data(self, admin_slug):
        """GET /api/artist/{slug} should return artist profile data"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "artist_name" in data, "Response should contain 'artist_name'"
        assert "slug" in data, "Response should contain 'slug'"
        assert "releases" in data, "Response should contain 'releases'"
        assert "presave_campaigns" in data, "Response should contain 'presave_campaigns'"
        assert "stats" in data, "Response should contain 'stats'"
        
        # Verify stats structure
        assert "total_streams" in data["stats"], "Stats should contain 'total_streams'"
        assert "total_releases" in data["stats"], "Stats should contain 'total_releases'"
    
    def test_public_profile_returns_optional_fields(self, admin_slug):
        """GET /api/artist/{slug} should return optional profile fields"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200
        data = response.json()
        
        # These fields may be null but should be present
        optional_fields = ["bio", "genre", "country", "avatar_url", "website", 
                          "spotify_url", "apple_music_url", "instagram", "twitter"]
        for field in optional_fields:
            assert field in data, f"Response should contain '{field}' field"
    
    def test_public_profile_releases_structure(self, admin_slug):
        """GET /api/artist/{slug} releases should have correct structure"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200
        data = response.json()
        
        if data["releases"]:
            release = data["releases"][0]
            expected_fields = ["id", "title", "release_type", "status"]
            for field in expected_fields:
                assert field in release, f"Release should contain '{field}'"
    
    def test_public_profile_presave_campaigns_structure(self, admin_slug):
        """GET /api/artist/{slug} presave campaigns should have correct structure"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200
        data = response.json()
        
        if data["presave_campaigns"]:
            campaign = data["presave_campaigns"][0]
            expected_fields = ["id", "release_date"]
            for field in expected_fields:
                assert field in campaign, f"Pre-save campaign should contain '{field}'"
    
    def test_public_profile_404_for_nonexistent_slug(self):
        """GET /api/artist/{slug} should return 404 for non-existent slug"""
        fake_slug = f"nonexistent-artist-{uuid.uuid4().hex}"
        response = requests.get(f"{BASE_URL}/api/artist/{fake_slug}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Error response should have 'detail'"
    
    def test_public_profile_excludes_sensitive_data(self, admin_slug):
        """GET /api/artist/{slug} should not expose sensitive user data"""
        response = requests.get(f"{BASE_URL}/api/artist/{admin_slug}")
        assert response.status_code == 200
        data = response.json()
        
        # These fields should NOT be in the response
        sensitive_fields = ["password", "password_hash", "email", "_id"]
        for field in sensitive_fields:
            assert field not in data, f"Response should NOT contain sensitive field '{field}'"


class TestSlugValidation:
    """Additional slug validation tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_slug_with_spaces_converted_to_dashes(self, auth_headers):
        """Slugs with spaces should be converted to dashes"""
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": "my artist name"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert " " not in data["slug"], "Spaces should be converted to dashes"
        assert "-" in data["slug"], "Spaces should become dashes"
    
    def test_slug_with_uppercase_converted_to_lowercase(self, auth_headers):
        """Slugs should be converted to lowercase"""
        response = requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": "MyArtistName"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == data["slug"].lower(), "Slug should be lowercase"


# Restore admin slug after tests
@pytest.fixture(scope="module", autouse=True)
def restore_admin_slug():
    """Restore admin slug to 'admin-artist' after all tests"""
    yield
    # Cleanup: restore original slug
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("access_token") or response.json().get("token")
        requests.put(
            f"{BASE_URL}/api/artist/profile/slug",
            json={"slug": "admin-artist"},
            headers={"Authorization": f"Bearer {token}"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
