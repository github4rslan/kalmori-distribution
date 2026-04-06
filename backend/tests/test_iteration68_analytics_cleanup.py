"""
Iteration 68 - Analytics Cleanup Tests
Testing:
1. Analytics endpoints return real data only (zeros when empty)
2. CSV import is admin-only
3. No hardcoded fake change percentages
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "Admin123!"
SECONDARY_ADMIN_EMAIL = "submitkalmori@gmail.com"
SECONDARY_ADMIN_PASSWORD = "Admin123!"


class TestAnalyticsEndpointsReturnRealData:
    """Test that analytics endpoints return real data only (zeros when no stream data)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a fresh test user with no stream data"""
        self.session = requests.Session()
        self.test_email = f"test_analytics_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "TestPass123!"
        
        # Register a new user (no stream data)
        register_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Analytics Test User",
            "artist_name": "Analytics Test Artist"
        })
        if register_resp.status_code == 200:
            self.user_token = register_resp.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
        yield
        # Cleanup not needed - user will be cleaned up by admin cleanup endpoint if needed
    
    def test_analytics_overview_returns_zeros_when_no_data(self):
        """GET /api/analytics/overview should return all zeros when no real stream data exists"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/overview", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        # Verify all values are zeros or empty
        assert data.get("total_streams") == 0, f"Expected total_streams=0, got {data.get('total_streams')}"
        assert data.get("total_earnings") == 0 or data.get("total_earnings") == 0.0, f"Expected total_earnings=0, got {data.get('total_earnings')}"
        assert data.get("streams_by_store") == {} or data.get("streams_by_store") == [], f"Expected empty streams_by_store, got {data.get('streams_by_store')}"
        assert data.get("streams_by_country") == {} or data.get("streams_by_country") == [], f"Expected empty streams_by_country, got {data.get('streams_by_country')}"
        assert data.get("daily_streams") == [] or data.get("daily_streams") is None or len(data.get("daily_streams", [])) == 0, f"Expected empty daily_streams, got {data.get('daily_streams')}"
        print(f"PASS: analytics/overview returns zeros - total_streams={data.get('total_streams')}, total_earnings={data.get('total_earnings')}")
    
    def test_analytics_trending_returns_empty_when_no_data(self):
        """GET /api/analytics/trending should return empty trending array when no real stream data exists"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/trending", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        trending = data.get("trending", [])
        # For a new user with no releases/streams, trending should be empty
        # If there are releases but no streams, they may appear with 0 streams
        for item in trending:
            assert item.get("total_streams", 0) == 0 or item.get("streams_this_week", 0) == 0, f"Expected 0 streams for trending item, got {item}"
        print(f"PASS: analytics/trending returns empty or zero-stream items - {len(trending)} items")
    
    def test_analytics_leaderboard_returns_zero_active_releases(self):
        """GET /api/analytics/leaderboard should return 0 active_releases when no stream data"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/leaderboard", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        active_releases = data.get("active_releases", 0)
        assert active_releases == 0, f"Expected active_releases=0, got {active_releases}"
        print(f"PASS: analytics/leaderboard returns active_releases=0")
    
    def test_analytics_revenue_returns_zeros(self):
        """GET /api/analytics/revenue should return 0 streams and 0 gross/net revenue"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        total_streams = data.get("total_streams", 0)
        total_gross = data.get("total_gross_revenue", 0)
        total_net = data.get("total_net_revenue", 0)
        
        assert total_streams == 0, f"Expected total_streams=0, got {total_streams}"
        assert total_gross == 0 or total_gross == 0.0, f"Expected total_gross_revenue=0, got {total_gross}"
        assert total_net == 0 or total_net == 0.0, f"Expected total_net_revenue=0, got {total_net}"
        print(f"PASS: analytics/revenue returns zeros - streams={total_streams}, gross={total_gross}, net={total_net}")


class TestCSVImportAdminOnly:
    """Test that CSV import endpoint is admin-only"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup sessions for admin and non-admin users"""
        self.admin_session = requests.Session()
        self.artist_session = requests.Session()
        
        # Login as admin
        admin_resp = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if admin_resp.status_code == 200:
            self.admin_token = admin_resp.json().get("access_token")
            self.admin_session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
        
        # Create a non-admin artist user
        self.artist_email = f"test_artist_{uuid.uuid4().hex[:8]}@test.com"
        self.artist_password = "ArtistPass123!"
        
        register_resp = self.artist_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.artist_email,
            "password": self.artist_password,
            "name": "Test Artist",
            "artist_name": "Test Artist"
        })
        if register_resp.status_code == 200:
            self.artist_token = register_resp.json().get("access_token")
            self.artist_session.headers.update({"Authorization": f"Bearer {self.artist_token}"})
        yield
    
    def test_csv_import_returns_403_for_non_admin(self):
        """POST /api/analytics/import with non-admin user should return 403"""
        # Create a simple CSV file
        csv_content = "date,platform,country,streams,revenue,release_title\n2025-01-01,Spotify,US,100,0.40,Test Track"
        files = {"file": ("test.csv", csv_content, "text/csv")}
        
        resp = self.artist_session.post(
            f"{BASE_URL}/api/analytics/import",
            files=files,
            cookies=self.artist_session.cookies
        )
        
        assert resp.status_code == 403, f"Expected 403 for non-admin, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "admin" in data.get("detail", "").lower(), f"Expected 'admin' in error message, got: {data.get('detail')}"
        print(f"PASS: CSV import returns 403 for non-admin user - {data.get('detail')}")
    
    def test_csv_import_succeeds_for_admin(self):
        """POST /api/analytics/import with admin user should succeed"""
        # Create a simple CSV file
        csv_content = "date,platform,country,streams,revenue,release_title\n2025-01-15,Spotify,US,5,0.02,Admin Test Track"
        files = {"file": ("admin_test.csv", csv_content, "text/csv")}
        
        resp = self.admin_session.post(
            f"{BASE_URL}/api/analytics/import",
            files=files,
            cookies=self.admin_session.cookies
        )
        
        assert resp.status_code == 200, f"Expected 200 for admin, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "count" in data, f"Expected 'count' in response, got: {data}"
        assert data.get("count", 0) > 0, f"Expected count > 0, got: {data.get('count')}"
        print(f"PASS: CSV import succeeds for admin - imported {data.get('count')} events")


class TestNoHardcodedFakePercentages:
    """Test that analytics endpoints don't return hardcoded fake change percentages"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a fresh test user"""
        self.session = requests.Session()
        self.test_email = f"test_pct_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "TestPass123!"
        
        register_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Percentage Test User",
            "artist_name": "Percentage Test Artist"
        })
        if register_resp.status_code == 200:
            self.user_token = register_resp.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
        yield
    
    def test_trending_no_hardcoded_percentages(self):
        """GET /api/analytics/trending should not have hardcoded +12.5% or +8.2% percentages"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/trending", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        trending = data.get("trending", [])
        
        # Check that no items have the specific hardcoded percentages
        hardcoded_values = [12.5, 8.2, -12.5, -8.2]
        for item in trending:
            change_pct = item.get("change_percent", 0)
            assert change_pct not in hardcoded_values, f"Found hardcoded percentage {change_pct} in trending item: {item}"
        
        print(f"PASS: No hardcoded percentages found in trending data")
    
    def test_leaderboard_no_hardcoded_percentages(self):
        """GET /api/analytics/leaderboard should not have hardcoded growth percentages"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/leaderboard", cookies=self.session.cookies)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        data = resp.json()
        leaderboard = data.get("leaderboard", [])
        
        hardcoded_values = [12.5, 8.2, -12.5, -8.2]
        for item in leaderboard:
            growth_pct = item.get("growth_percent", 0)
            assert growth_pct not in hardcoded_values, f"Found hardcoded percentage {growth_pct} in leaderboard item: {item}"
        
        print(f"PASS: No hardcoded percentages found in leaderboard data")


class TestAdminLoginAndVerification:
    """Verify admin credentials work correctly"""
    
    def test_admin_login_primary(self):
        """Test primary admin login"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert data.get("user", {}).get("role") == "admin", f"Expected admin role, got: {data.get('user', {}).get('role')}"
        print(f"PASS: Primary admin login successful - {ADMIN_EMAIL}")
    
    def test_admin_login_secondary(self):
        """Test secondary admin login"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SECONDARY_ADMIN_EMAIL,
            "password": SECONDARY_ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Secondary admin login failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert data.get("user", {}).get("role") == "admin", f"Expected admin role, got: {data.get('user', {}).get('role')}"
        print(f"PASS: Secondary admin login successful - {SECONDARY_ADMIN_EMAIL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
