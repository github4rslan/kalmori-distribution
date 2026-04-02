"""
Iteration 24 - AI Release Strategy Feature Tests
Tests the new POST /api/ai/release-strategy endpoint and related functionality
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-hub-220.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestAIReleaseStrategyBackend:
    """Tests for POST /api/ai/release-strategy endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, auth_token):
        """Get cookies for auth"""
        return {"access_token": auth_token}
    
    def test_release_strategy_requires_auth(self):
        """Test that /api/ai/release-strategy returns 401/422 without authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/release-strategy", json={})
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("PASS: /api/ai/release-strategy requires authentication")
    
    def test_release_strategy_basic_request(self, auth_cookies):
        """Test basic release strategy request without optional fields"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30  # AI calls can take time
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check top-level structure
        assert "strategy" in data, "Response missing 'strategy' field"
        assert "generated_at" in data, "Response missing 'generated_at' field"
        assert "data_summary" in data, "Response missing 'data_summary' field"
        
        print("PASS: Basic release strategy request returns correct structure")
    
    def test_release_strategy_with_optional_fields(self, auth_cookies):
        """Test release strategy with release_title and genre fields"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={
                "release_title": "Summer Vibes EP",
                "genre": "Hip-Hop"
            },
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "strategy" in data
        print("PASS: Release strategy accepts optional release_title and genre fields")
    
    def test_release_strategy_response_structure(self, auth_cookies):
        """Test that strategy response has all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={"release_title": "Test Track", "genre": "R&B"},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        strategy = data.get("strategy", {})
        
        # Check required strategy fields
        required_fields = [
            "optimal_release_day",
            "optimal_release_time",
            "target_platforms",
            "geographic_strategy",
            "pre_release_timeline",
            "promotion_tips"
        ]
        
        for field in required_fields:
            assert field in strategy, f"Strategy missing required field: {field}"
        
        print(f"PASS: Strategy contains all required fields: {required_fields}")
    
    def test_release_strategy_data_summary(self, auth_cookies):
        """Test that data_summary contains expected fields"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        data_summary = data.get("data_summary", {})
        
        # Check data_summary fields
        expected_fields = ["total_streams", "top_platform", "top_country", "peak_hour"]
        for field in expected_fields:
            assert field in data_summary, f"data_summary missing field: {field}"
        
        print(f"PASS: data_summary contains: total_streams={data_summary.get('total_streams')}, "
              f"top_platform={data_summary.get('top_platform')}, "
              f"top_country={data_summary.get('top_country')}, "
              f"peak_hour={data_summary.get('peak_hour')}")
    
    def test_release_strategy_target_platforms_structure(self, auth_cookies):
        """Test that target_platforms has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        target_platforms = data.get("strategy", {}).get("target_platforms", [])
        
        if len(target_platforms) > 0:
            platform = target_platforms[0]
            assert "platform" in platform, "Platform entry missing 'platform' field"
            assert "priority" in platform, "Platform entry missing 'priority' field"
            assert "tactic" in platform, "Platform entry missing 'tactic' field"
            print(f"PASS: target_platforms has correct structure with {len(target_platforms)} platforms")
        else:
            print("INFO: target_platforms is empty (may be fallback response)")
    
    def test_release_strategy_geographic_strategy_structure(self, auth_cookies):
        """Test that geographic_strategy has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        geo_strategy = data.get("strategy", {}).get("geographic_strategy", [])
        
        if len(geo_strategy) > 0:
            geo = geo_strategy[0]
            assert "region" in geo, "Geographic entry missing 'region' field"
            assert "tactic" in geo, "Geographic entry missing 'tactic' field"
            print(f"PASS: geographic_strategy has correct structure with {len(geo_strategy)} regions")
        else:
            print("INFO: geographic_strategy is empty (may be fallback response)")
    
    def test_release_strategy_pre_release_timeline_structure(self, auth_cookies):
        """Test that pre_release_timeline has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        timeline = data.get("strategy", {}).get("pre_release_timeline", [])
        
        if len(timeline) > 0:
            item = timeline[0]
            assert "days_before" in item, "Timeline entry missing 'days_before' field"
            assert "action" in item, "Timeline entry missing 'action' field"
            print(f"PASS: pre_release_timeline has correct structure with {len(timeline)} items")
        else:
            print("INFO: pre_release_timeline is empty (may be fallback response)")
    
    def test_release_strategy_promotion_tips_structure(self, auth_cookies):
        """Test that promotion_tips is a list of strings"""
        response = requests.post(
            f"{BASE_URL}/api/ai/release-strategy",
            json={},
            cookies=auth_cookies,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        
        tips = data.get("strategy", {}).get("promotion_tips", [])
        
        assert isinstance(tips, list), "promotion_tips should be a list"
        if len(tips) > 0:
            assert isinstance(tips[0], str), "promotion_tips items should be strings"
            print(f"PASS: promotion_tips is a list with {len(tips)} tips")
        else:
            print("INFO: promotion_tips is empty (may be fallback response)")


class TestFanAnalyticsEndpoint:
    """Verify fan analytics endpoint still works (used by AI strategy)"""
    
    @pytest.fixture(scope="class")
    def auth_cookies(self):
        """Get auth cookies"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return {"access_token": response.json().get("access_token")}
    
    def test_fan_analytics_overview(self, auth_cookies):
        """Test that fan analytics overview endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/fan-analytics/overview",
            cookies=auth_cookies
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check required fields
        assert "platform_engagement" in data
        assert "top_countries" in data
        assert "peak_hours" in data
        
        print(f"PASS: Fan analytics overview returns data with "
              f"{len(data.get('platform_engagement', []))} platforms, "
              f"{len(data.get('top_countries', []))} countries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
