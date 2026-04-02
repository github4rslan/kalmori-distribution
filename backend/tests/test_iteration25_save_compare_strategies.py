"""
Iteration 25 - Save & Compare Strategies Feature Tests
Tests the new endpoints:
- POST /api/ai/strategies/save - Save a strategy
- GET /api/ai/strategies - Get saved strategies
- DELETE /api/ai/strategies/{strategy_id} - Delete a strategy
Also verifies POST /api/ai/release-strategy still works (from iteration 24)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSaveCompareStrategies:
    """Test Save & Compare Strategies feature"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ==================== AUTH TESTS ====================
    
    def test_save_strategy_requires_auth(self):
        """POST /api/ai/strategies/save requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/strategies/save", json={
            "strategy": {"optimal_release_day": "Friday"},
            "data_summary": {"total_streams": 1000},
            "label": "Test Strategy"
        })
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("✓ POST /api/ai/strategies/save requires auth (returns 401/422)")
    
    def test_get_strategies_requires_auth(self):
        """GET /api/ai/strategies requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ai/strategies")
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("✓ GET /api/ai/strategies requires auth (returns 401/422)")
    
    def test_delete_strategy_requires_auth(self):
        """DELETE /api/ai/strategies/{id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/ai/strategies/fake_id")
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("✓ DELETE /api/ai/strategies/{id} requires auth (returns 401/422)")
    
    # ==================== SAVE STRATEGY TESTS ====================
    
    def test_save_strategy_success(self, auth_headers):
        """POST /api/ai/strategies/save saves a strategy successfully"""
        payload = {
            "strategy": {
                "optimal_release_day": "Friday",
                "optimal_release_time": "00:00 UTC",
                "release_day_reasoning": "Test reasoning",
                "target_platforms": [{"platform": "Spotify", "priority": "high", "tactic": "Submit to playlists"}],
                "geographic_strategy": [{"region": "United States", "tactic": "Focus on US market"}],
                "pre_release_timeline": [{"days_before": 14, "action": "Launch pre-save"}],
                "promotion_tips": ["Engage fans on social media"],
                "estimated_first_week_range": "1,000-5,000 streams",
                "confidence_note": "Based on test data"
            },
            "data_summary": {
                "total_streams": 5000,
                "top_platform": "Spotify",
                "top_country": "US",
                "peak_hour": 20,
                "release_count": 5,
                "presave_subscribers": 100
            },
            "release_title": "TEST_My New Single",
            "genre": "Hip-Hop",
            "label": "TEST_Strategy A"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/strategies/save", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Save failed: {response.text}"
        
        data = response.json()
        assert "saved_strategy" in data, "Response should contain saved_strategy"
        saved = data["saved_strategy"]
        
        # Verify all fields are saved
        assert "id" in saved, "Saved strategy should have an id"
        assert saved["label"] == "TEST_Strategy A", f"Label mismatch: {saved.get('label')}"
        assert saved["release_title"] == "TEST_My New Single", f"Release title mismatch"
        assert saved["genre"] == "Hip-Hop", f"Genre mismatch"
        assert "strategy" in saved, "Should contain strategy object"
        assert "data_summary" in saved, "Should contain data_summary object"
        assert "created_at" in saved, "Should have created_at timestamp"
        
        print(f"✓ POST /api/ai/strategies/save works - saved with id: {saved['id']}")
        return saved["id"]
    
    def test_save_strategy_with_default_label(self, auth_headers):
        """POST /api/ai/strategies/save creates default label if not provided"""
        payload = {
            "strategy": {"optimal_release_day": "Saturday"},
            "data_summary": {"total_streams": 2000}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/strategies/save", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Save failed: {response.text}"
        
        data = response.json()
        saved = data["saved_strategy"]
        assert saved["label"].startswith("Strategy - "), f"Default label should start with 'Strategy - ', got: {saved['label']}"
        
        print(f"✓ Default label created: {saved['label']}")
        return saved["id"]
    
    # ==================== GET STRATEGIES TESTS ====================
    
    def test_get_strategies_returns_list(self, auth_headers):
        """GET /api/ai/strategies returns list of saved strategies"""
        response = requests.get(f"{BASE_URL}/api/ai/strategies", headers=auth_headers)
        assert response.status_code == 200, f"Get failed: {response.text}"
        
        data = response.json()
        assert "strategies" in data, "Response should contain strategies list"
        assert "total" in data, "Response should contain total count"
        assert isinstance(data["strategies"], list), "strategies should be a list"
        
        print(f"✓ GET /api/ai/strategies returns {data['total']} strategies")
        return data["strategies"]
    
    def test_get_strategies_structure(self, auth_headers):
        """GET /api/ai/strategies returns strategies with correct structure"""
        response = requests.get(f"{BASE_URL}/api/ai/strategies", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        if data["total"] > 0:
            strat = data["strategies"][0]
            required_fields = ["id", "user_id", "strategy", "data_summary", "label", "created_at"]
            for field in required_fields:
                assert field in strat, f"Strategy missing field: {field}"
            
            # Verify no MongoDB _id leak
            assert "_id" not in strat, "MongoDB _id should not be in response"
            
            print(f"✓ Strategy structure verified with all required fields")
        else:
            print("⚠ No strategies to verify structure")
    
    # ==================== DELETE STRATEGY TESTS ====================
    
    def test_delete_nonexistent_strategy_returns_404(self, auth_headers):
        """DELETE /api/ai/strategies/{id} returns 404 for non-existent strategy"""
        response = requests.delete(f"{BASE_URL}/api/ai/strategies/nonexistent_id_12345", headers=auth_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ DELETE non-existent strategy returns 404")
    
    def test_delete_strategy_success(self, auth_headers):
        """DELETE /api/ai/strategies/{id} deletes a strategy successfully"""
        # First create a strategy to delete
        payload = {
            "strategy": {"optimal_release_day": "Monday"},
            "data_summary": {"total_streams": 100},
            "label": "TEST_To Be Deleted"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/ai/strategies/save", json=payload, headers=auth_headers)
        assert create_response.status_code == 200
        strategy_id = create_response.json()["saved_strategy"]["id"]
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/ai/strategies/{strategy_id}", headers=auth_headers)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get("message") == "Strategy deleted", f"Unexpected message: {data}"
        
        # Verify it's actually deleted by trying to delete again
        verify_response = requests.delete(f"{BASE_URL}/api/ai/strategies/{strategy_id}", headers=auth_headers)
        assert verify_response.status_code == 404, "Deleted strategy should return 404"
        
        print(f"✓ DELETE /api/ai/strategies/{strategy_id} works")
    
    # ==================== RELEASE STRATEGY STILL WORKS (from iteration 24) ====================
    
    def test_release_strategy_still_works(self, auth_headers):
        """POST /api/ai/release-strategy still works (regression test from iteration 24)"""
        response = requests.post(f"{BASE_URL}/api/ai/release-strategy", json={
            "release_title": "TEST_Regression Check",
            "genre": "Pop"
        }, headers=auth_headers, timeout=30)
        
        assert response.status_code == 200, f"Release strategy failed: {response.text}"
        
        data = response.json()
        assert "strategy" in data, "Response should contain strategy"
        assert "data_summary" in data, "Response should contain data_summary"
        assert "generated_at" in data, "Response should contain generated_at"
        
        strategy = data["strategy"]
        assert "optimal_release_day" in strategy, "Strategy should have optimal_release_day"
        assert "optimal_release_time" in strategy, "Strategy should have optimal_release_time"
        
        print(f"✓ POST /api/ai/release-strategy still works - Day: {strategy['optimal_release_day']}, Time: {strategy['optimal_release_time']}")
    
    # ==================== CLEANUP ====================
    
    def test_cleanup_test_strategies(self, auth_headers):
        """Cleanup: Delete all TEST_ prefixed strategies"""
        response = requests.get(f"{BASE_URL}/api/ai/strategies", headers=auth_headers)
        if response.status_code == 200:
            strategies = response.json().get("strategies", [])
            deleted_count = 0
            for strat in strategies:
                if strat.get("label", "").startswith("TEST_") or strat.get("release_title", "").startswith("TEST_"):
                    del_response = requests.delete(f"{BASE_URL}/api/ai/strategies/{strat['id']}", headers=auth_headers)
                    if del_response.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleanup: Deleted {deleted_count} test strategies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
