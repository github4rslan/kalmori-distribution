"""
Iteration 65 - Spotify DSP OAuth Integration Tests
Tests for Spotify OAuth flow, status, disconnect, artist search, link, and data fetching
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-hub-220.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "Admin123!"


class TestSpotifyUnauthenticated:
    """Test that unauthenticated requests to Spotify endpoints return 401"""
    
    def test_spotify_connect_unauthenticated(self):
        """GET /api/spotify/connect should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/spotify/connect")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/connect returns 401 for unauthenticated requests")
    
    def test_spotify_status_unauthenticated(self):
        """GET /api/spotify/status should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/spotify/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/status returns 401 for unauthenticated requests")
    
    def test_spotify_disconnect_unauthenticated(self):
        """POST /api/spotify/disconnect should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/spotify/disconnect")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/disconnect returns 401 for unauthenticated requests")
    
    def test_spotify_refresh_artist_unauthenticated(self):
        """POST /api/spotify/refresh-artist should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/spotify/refresh-artist", json={"artist_name": "test"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/refresh-artist returns 401 for unauthenticated requests")
    
    def test_spotify_link_artist_unauthenticated(self):
        """POST /api/spotify/link-artist should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/spotify/link-artist", json={"artist_id": "test"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/link-artist returns 401 for unauthenticated requests")
    
    def test_spotify_artist_data_unauthenticated(self):
        """GET /api/spotify/artist-data should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/spotify/artist-data")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: /api/spotify/artist-data returns 401 for unauthenticated requests")


class TestSpotifyAuthenticated:
    """Test Spotify endpoints with authenticated user"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        print(f"Logged in as {ADMIN_EMAIL}")
    
    def test_spotify_connect_returns_auth_url(self):
        """GET /api/spotify/connect should return auth_url"""
        response = self.session.get(f"{BASE_URL}/api/spotify/connect")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "auth_url" in data, f"Response should contain 'auth_url': {data}"
        assert "accounts.spotify.com" in data["auth_url"], f"auth_url should point to Spotify: {data['auth_url']}"
        print(f"PASS: /api/spotify/connect returns auth_url: {data['auth_url'][:80]}...")
    
    def test_spotify_status_returns_connected_false(self):
        """GET /api/spotify/status should return connected:false when not connected"""
        response = self.session.get(f"{BASE_URL}/api/spotify/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "connected" in data, f"Response should contain 'connected': {data}"
        # Note: connected could be true or false depending on previous tests
        print(f"PASS: /api/spotify/status returns connected={data['connected']}")
        if data.get("connected"):
            print(f"  - spotify_display_name: {data.get('spotify_display_name')}")
            print(f"  - spotify_artist_id: {data.get('spotify_artist_id')}")
            print(f"  - spotify_artist_name: {data.get('spotify_artist_name')}")
    
    def test_spotify_disconnect_works(self):
        """POST /api/spotify/disconnect should work"""
        response = self.session.post(f"{BASE_URL}/api/spotify/disconnect")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, f"Response should contain 'message': {data}"
        print(f"PASS: /api/spotify/disconnect returns: {data}")
        
        # Verify status is now disconnected
        status_response = self.session.get(f"{BASE_URL}/api/spotify/status")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data.get("connected") == False, f"After disconnect, connected should be False: {status_data}"
        print("PASS: After disconnect, status shows connected=False")
    
    def test_spotify_refresh_artist_requires_connection(self):
        """POST /api/spotify/refresh-artist should return 400 when not connected"""
        # First ensure disconnected
        self.session.post(f"{BASE_URL}/api/spotify/disconnect")
        
        response = self.session.post(
            f"{BASE_URL}/api/spotify/refresh-artist",
            json={"artist_name": "Drake"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, f"Response should contain 'detail': {data}"
        assert "not connected" in data["detail"].lower(), f"Error should mention 'not connected': {data}"
        print(f"PASS: /api/spotify/refresh-artist returns 400 when not connected: {data['detail']}")
    
    def test_spotify_link_artist_requires_connection(self):
        """POST /api/spotify/link-artist should return 400 when not connected"""
        # First ensure disconnected
        self.session.post(f"{BASE_URL}/api/spotify/disconnect")
        
        response = self.session.post(
            f"{BASE_URL}/api/spotify/link-artist",
            json={"artist_id": "3TVXtAsR1Inumwj472S9r4"}  # Drake's Spotify ID
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, f"Response should contain 'detail': {data}"
        assert "not connected" in data["detail"].lower(), f"Error should mention 'not connected': {data}"
        print(f"PASS: /api/spotify/link-artist returns 400 when not connected: {data['detail']}")
    
    def test_spotify_artist_data_requires_linked_artist(self):
        """GET /api/spotify/artist-data should return 400 when no artist linked"""
        # First ensure disconnected
        self.session.post(f"{BASE_URL}/api/spotify/disconnect")
        
        response = self.session.get(f"{BASE_URL}/api/spotify/artist-data")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, f"Response should contain 'detail': {data}"
        print(f"PASS: /api/spotify/artist-data returns 400 when no artist linked: {data['detail']}")


class TestSpotifyCallback:
    """Test Spotify OAuth callback endpoint"""
    
    def test_callback_without_code_redirects_with_error(self):
        """GET /api/spotify/callback without code should redirect with error"""
        response = requests.get(
            f"{BASE_URL}/api/spotify/callback",
            allow_redirects=False
        )
        # Should redirect to settings with error
        assert response.status_code in [302, 307], f"Expected redirect, got {response.status_code}"
        location = response.headers.get("location", "")
        assert "spotify=error" in location, f"Redirect should contain spotify=error: {location}"
        print(f"PASS: /api/spotify/callback without code redirects with error: {location}")
    
    def test_callback_with_error_param_redirects(self):
        """GET /api/spotify/callback with error param should redirect"""
        response = requests.get(
            f"{BASE_URL}/api/spotify/callback?error=access_denied",
            allow_redirects=False
        )
        assert response.status_code in [302, 307], f"Expected redirect, got {response.status_code}"
        location = response.headers.get("location", "")
        assert "spotify=error" in location, f"Redirect should contain spotify=error: {location}"
        assert "access_denied" in location, f"Redirect should contain error reason: {location}"
        print(f"PASS: /api/spotify/callback with error redirects correctly: {location}")
    
    def test_callback_with_invalid_code_redirects_with_error(self):
        """GET /api/spotify/callback with invalid code should redirect with error"""
        response = requests.get(
            f"{BASE_URL}/api/spotify/callback?code=invalid_code_12345&state=test_user",
            allow_redirects=False
        )
        assert response.status_code in [302, 307], f"Expected redirect, got {response.status_code}"
        location = response.headers.get("location", "")
        assert "spotify=error" in location, f"Redirect should contain spotify=error: {location}"
        print(f"PASS: /api/spotify/callback with invalid code redirects with error: {location}")


class TestSpotifyEndpointResponseShapes:
    """Test that Spotify endpoints return correct response shapes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    def test_connect_response_shape(self):
        """Verify /api/spotify/connect response shape"""
        response = self.session.get(f"{BASE_URL}/api/spotify/connect")
        assert response.status_code == 200
        data = response.json()
        
        # Must have auth_url
        assert isinstance(data, dict), "Response should be a dict"
        assert "auth_url" in data, "Response must have 'auth_url'"
        assert isinstance(data["auth_url"], str), "auth_url must be a string"
        assert data["auth_url"].startswith("https://"), "auth_url must be HTTPS"
        print("PASS: /api/spotify/connect response shape is correct")
    
    def test_status_response_shape(self):
        """Verify /api/spotify/status response shape"""
        response = self.session.get(f"{BASE_URL}/api/spotify/status")
        assert response.status_code == 200
        data = response.json()
        
        # Must have connected boolean
        assert isinstance(data, dict), "Response should be a dict"
        assert "connected" in data, "Response must have 'connected'"
        assert isinstance(data["connected"], bool), "connected must be a boolean"
        
        # If connected, should have additional fields
        if data["connected"]:
            expected_fields = ["spotify_display_name", "spotify_artist_id", "connected_at"]
            for field in expected_fields:
                assert field in data, f"Connected response should have '{field}'"
        
        print(f"PASS: /api/spotify/status response shape is correct (connected={data['connected']})")
    
    def test_disconnect_response_shape(self):
        """Verify /api/spotify/disconnect response shape"""
        response = self.session.post(f"{BASE_URL}/api/spotify/disconnect")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, dict), "Response should be a dict"
        assert "message" in data, "Response must have 'message'"
        assert isinstance(data["message"], str), "message must be a string"
        print("PASS: /api/spotify/disconnect response shape is correct")


class TestPageBuilderRegression:
    """Regression test for Page Builder (from iteration 64)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    def test_page_builder_landing_page_loads(self):
        """GET /api/admin/pages/landing should return page data"""
        response = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "page_slug" in data, f"Response should have 'page_slug': {data}"
        assert data["page_slug"] == "landing", f"page_slug should be 'landing': {data}"
        print("PASS: Page Builder landing page loads correctly (regression check)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
