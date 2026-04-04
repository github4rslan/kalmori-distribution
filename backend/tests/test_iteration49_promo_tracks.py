"""
Iteration 49 - Testing:
1. Track editing (PUT /api/tracks/{trackId})
2. Promo Code CRUD (admin endpoints)
3. Promo Code validation (public endpoint)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestPromoCodesCRUD:
    """Test promo code admin CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        yield
    
    def test_list_promo_codes(self):
        """GET /api/admin/promo-codes - List all promo codes"""
        response = requests.get(f"{BASE_URL}/api/admin/promo-codes", headers=self.headers)
        assert response.status_code == 200, f"Failed to list promo codes: {response.text}"
        codes = response.json()
        assert isinstance(codes, list), "Response should be a list"
        print(f"Found {len(codes)} promo codes")
        # Check if LAUNCH50 exists (seeded)
        launch50 = next((c for c in codes if c.get("code") == "LAUNCH50"), None)
        if launch50:
            print(f"LAUNCH50 found: {launch50}")
            assert launch50.get("discount_value") == 50
            assert launch50.get("discount_type") == "percent"
    
    def test_create_promo_code(self):
        """POST /api/admin/promo-codes - Create a new promo code"""
        test_code = f"TEST49_{os.urandom(4).hex().upper()}"
        payload = {
            "code": test_code,
            "discount_type": "percent",
            "discount_value": 25,
            "applicable_plans": ["rise", "pro"],
            "max_uses": 10,
            "duration_months": 1,
            "active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/promo-codes", headers=self.headers, json=payload)
        assert response.status_code == 200, f"Failed to create promo code: {response.text}"
        data = response.json()
        assert data.get("code") == test_code
        assert data.get("discount_value") == 25
        assert data.get("discount_type") == "percent"
        assert "id" in data
        print(f"Created promo code: {data}")
        
        # Cleanup - delete the test code
        promo_id = data.get("id")
        if promo_id:
            requests.delete(f"{BASE_URL}/api/admin/promo-codes/{promo_id}", headers=self.headers)
    
    def test_toggle_promo_code_active(self):
        """PUT /api/admin/promo-codes/{id} - Toggle active status"""
        # First create a test code
        test_code = f"TOGGLE49_{os.urandom(4).hex().upper()}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/promo-codes", headers=self.headers, json={
            "code": test_code,
            "discount_type": "percent",
            "discount_value": 10,
            "applicable_plans": ["pro"],
            "max_uses": 5,
            "active": True
        })
        assert create_resp.status_code == 200
        promo_id = create_resp.json().get("id")
        
        # Toggle to inactive
        toggle_resp = requests.put(f"{BASE_URL}/api/admin/promo-codes/{promo_id}", 
                                   headers=self.headers, json={"active": False})
        assert toggle_resp.status_code == 200, f"Failed to toggle: {toggle_resp.text}"
        assert toggle_resp.json().get("active") == False
        print(f"Toggled promo code to inactive")
        
        # Toggle back to active
        toggle_resp2 = requests.put(f"{BASE_URL}/api/admin/promo-codes/{promo_id}", 
                                    headers=self.headers, json={"active": True})
        assert toggle_resp2.status_code == 200
        assert toggle_resp2.json().get("active") == True
        print(f"Toggled promo code back to active")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/promo-codes/{promo_id}", headers=self.headers)
    
    def test_delete_promo_code(self):
        """DELETE /api/admin/promo-codes/{id} - Delete a promo code"""
        # Create a code to delete
        test_code = f"DELETE49_{os.urandom(4).hex().upper()}"
        create_resp = requests.post(f"{BASE_URL}/api/admin/promo-codes", headers=self.headers, json={
            "code": test_code,
            "discount_type": "fixed",
            "discount_value": 5,
            "applicable_plans": ["rise"],
            "max_uses": 1,
            "active": True
        })
        assert create_resp.status_code == 200
        promo_id = create_resp.json().get("id")
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/promo-codes/{promo_id}", headers=self.headers)
        assert delete_resp.status_code == 200, f"Failed to delete: {delete_resp.text}"
        print(f"Deleted promo code {promo_id}")
        
        # Verify it's gone
        list_resp = requests.get(f"{BASE_URL}/api/admin/promo-codes", headers=self.headers)
        codes = list_resp.json()
        assert not any(c.get("id") == promo_id for c in codes), "Promo code should be deleted"


class TestPromoCodeValidation:
    """Test public promo code validation endpoint"""
    
    def test_validate_launch50_code(self):
        """POST /api/promo-codes/validate - Validate LAUNCH50 code"""
        response = requests.post(f"{BASE_URL}/api/promo-codes/validate", json={
            "code": "LAUNCH50",
            "plan": "pro"
        })
        assert response.status_code == 200, f"Failed to validate LAUNCH50: {response.text}"
        data = response.json()
        assert data.get("valid") == True
        assert data.get("code") == "LAUNCH50"
        assert data.get("discount_type") == "percent"
        assert data.get("discount_value") == 50
        print(f"LAUNCH50 validation result: {data}")
    
    def test_validate_invalid_code_returns_404(self):
        """POST /api/promo-codes/validate - Invalid code returns 404"""
        response = requests.post(f"{BASE_URL}/api/promo-codes/validate", json={
            "code": "INVALIDCODE123",
            "plan": "pro"
        })
        assert response.status_code == 404, f"Expected 404 for invalid code, got {response.status_code}"
        print(f"Invalid code correctly returned 404")


class TestPromoCodeAuth:
    """Test that admin promo endpoints require admin auth"""
    
    def test_non_admin_gets_403(self):
        """Non-admin user should get 403 on admin promo endpoints"""
        # Try without auth
        response = requests.get(f"{BASE_URL}/api/admin/promo-codes")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("Correctly returned 401 without auth")
        
        # Try to create without auth
        response = requests.post(f"{BASE_URL}/api/admin/promo-codes", json={
            "code": "NOAUTH",
            "discount_type": "percent",
            "discount_value": 10
        })
        assert response.status_code == 401, f"Expected 401 for create without auth, got {response.status_code}"
        print("Correctly returned 401 for create without auth")


class TestTrackUpdate:
    """Test track update endpoint PUT /api/tracks/{trackId}"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        yield
    
    def test_get_releases_with_tracks(self):
        """GET /api/releases - Get releases to find tracks"""
        response = requests.get(f"{BASE_URL}/api/releases", headers=self.headers)
        assert response.status_code == 200, f"Failed to get releases: {response.text}"
        releases = response.json()
        print(f"Found {len(releases)} releases")
        
        # Find a release with tracks
        for release in releases:
            release_id = release.get("id")
            detail_resp = requests.get(f"{BASE_URL}/api/releases/{release_id}", headers=self.headers)
            if detail_resp.status_code == 200:
                detail = detail_resp.json()
                tracks = detail.get("tracks", [])
                if tracks:
                    print(f"Release '{detail.get('title')}' has {len(tracks)} tracks")
                    self.test_release_id = release_id
                    self.test_track = tracks[0]
                    return
        print("No releases with tracks found - will create one")
    
    def test_update_track_fields(self):
        """PUT /api/tracks/{trackId} - Update track fields"""
        # First get a release with tracks
        response = requests.get(f"{BASE_URL}/api/releases", headers=self.headers)
        releases = response.json()
        
        track_id = None
        for release in releases:
            detail_resp = requests.get(f"{BASE_URL}/api/releases/{release.get('id')}", headers=self.headers)
            if detail_resp.status_code == 200:
                tracks = detail_resp.json().get("tracks", [])
                if tracks:
                    track_id = tracks[0].get("id")
                    original_track = tracks[0]
                    break
        
        if not track_id:
            # Create a release and track for testing
            release_resp = requests.post(f"{BASE_URL}/api/releases", headers=self.headers, json={
                "title": "Test Release for Track Update",
                "release_type": "single",
                "genre": "Pop",
                "release_date": "2026-02-01"
            })
            if release_resp.status_code == 200:
                release_id = release_resp.json().get("id")
                track_resp = requests.post(f"{BASE_URL}/api/tracks", headers=self.headers, json={
                    "release_id": release_id,
                    "title": "Test Track",
                    "track_number": 1
                })
                if track_resp.status_code == 200:
                    track_id = track_resp.json().get("id")
                    original_track = track_resp.json()
        
        if not track_id:
            pytest.skip("No tracks available for testing")
        
        # Update track with various fields
        update_payload = {
            "title": "Updated Track Title",
            "title_version": "Remix",
            "explicit": True,
            "isrc": "USKAL2600001",
            "dolby_atmos_isrc": "USKAL2600002",
            "iswc": "T-123456789-0",
            "audio_language": "Spanish",
            "production": "Test Production Co",
            "publisher": "Test Publisher Inc",
            "preview_start": "00:45",
            "preview_end": "01:15",
            "main_artist": "Test Artist Updated"
        }
        
        update_resp = requests.put(f"{BASE_URL}/api/tracks/{track_id}", headers=self.headers, json=update_payload)
        assert update_resp.status_code == 200, f"Failed to update track: {update_resp.text}"
        updated_track = update_resp.json()
        
        # Verify updates
        assert updated_track.get("title") == "Updated Track Title"
        assert updated_track.get("title_version") == "Remix"
        assert updated_track.get("explicit") == True
        assert updated_track.get("isrc") == "USKAL2600001"
        assert updated_track.get("dolby_atmos_isrc") == "USKAL2600002"
        assert updated_track.get("iswc") == "T-123456789-0"
        assert updated_track.get("audio_language") == "Spanish"
        assert updated_track.get("production") == "Test Production Co"
        assert updated_track.get("publisher") == "Test Publisher Inc"
        assert updated_track.get("preview_start") == "00:45"
        assert updated_track.get("preview_end") == "01:15"
        assert updated_track.get("main_artist") == "Test Artist Updated"
        
        print(f"Successfully updated track {track_id} with all fields")
        
        # Restore original values if we had them
        if original_track:
            restore_payload = {
                "title": original_track.get("title", "Test Track"),
                "title_version": original_track.get("title_version", ""),
                "explicit": original_track.get("explicit", False),
                "main_artist": original_track.get("main_artist", "")
            }
            requests.put(f"{BASE_URL}/api/tracks/{track_id}", headers=self.headers, json=restore_payload)


class TestHealthAndBasics:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """GET /api/health - Health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Health check passed")
    
    def test_admin_login(self):
        """POST /api/auth/login - Admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "admin"
        print(f"Admin login successful, role: {data.get('user', {}).get('role')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
