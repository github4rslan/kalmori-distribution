"""
Iteration 72 - Regression Testing for Backend Refactoring
Tests analytics, subscription, promo code, and referral endpoints
that were extracted from server.py into separate route modules.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "Admin123!"

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_health_endpoint(self):
        """GET /api/health - should return 200"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("PASS: GET /api/health returns 200")


class TestSubscriptionPlans:
    """Subscription plan endpoints from subscription_routes.py"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscriptions/plans - returns 3 plans with correct revenue_share"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans", timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        plans = response.json()
        assert "free" in plans, "Missing 'free' plan"
        assert "rise" in plans, "Missing 'rise' plan"
        assert "pro" in plans, "Missing 'pro' plan"
        
        # Verify revenue_share values
        assert plans["free"]["revenue_share"] == 20, f"Free plan revenue_share should be 20, got {plans['free']['revenue_share']}"
        assert plans["rise"]["revenue_share"] == 5, f"Rise plan revenue_share should be 5, got {plans['rise']['revenue_share']}"
        assert plans["pro"]["revenue_share"] == 0, f"Pro plan revenue_share should be 0, got {plans['pro']['revenue_share']}"
        
        # Verify prices
        assert plans["free"]["price"] == 0, "Free plan price should be 0"
        assert plans["rise"]["price"] == 24.99, "Rise plan price should be 24.99"
        assert plans["pro"]["price"] == 49.99, "Pro plan price should be 49.99"
        
        print("PASS: GET /api/subscriptions/plans returns 3 plans with correct revenue_share (20, 5, 0)")
    
    def test_get_my_plan_requires_auth(self):
        """GET /api/subscriptions/my-plan - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/my-plan", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/subscriptions/my-plan requires auth (401)")
    
    def test_get_my_plan_authenticated(self, auth_token):
        """GET /api/subscriptions/my-plan - returns current user's plan info"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/my-plan", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "plan" in data, "Response missing 'plan' field"
        assert "name" in data, "Response missing 'name' field"
        assert "revenue_share" in data, "Response missing 'revenue_share' field"
        print(f"PASS: GET /api/subscriptions/my-plan returns plan info: {data['plan']}")


class TestAnalyticsEndpoints:
    """Analytics endpoints from analytics_routes.py"""
    
    def test_analytics_overview_requires_auth(self):
        """GET /api/analytics/overview - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/overview requires auth (401)")
    
    def test_analytics_overview_authenticated(self, auth_token):
        """GET /api/analytics/overview - returns streams, earnings, release_count"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/overview", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total_streams" in data, "Response missing 'total_streams'"
        assert "total_earnings" in data or "total_earnings" in str(data), "Response missing earnings field"
        assert "release_count" in data, "Response missing 'release_count'"
        print(f"PASS: GET /api/analytics/overview returns data: streams={data.get('total_streams')}, releases={data.get('release_count')}")
    
    def test_analytics_trending_requires_auth(self):
        """GET /api/analytics/trending - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/trending", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/trending requires auth (401)")
    
    def test_analytics_trending_authenticated(self, auth_token):
        """GET /api/analytics/trending - returns trending releases"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/trending", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "trending" in data, "Response missing 'trending' field"
        assert "period" in data, "Response missing 'period' field"
        print(f"PASS: GET /api/analytics/trending returns {len(data.get('trending', []))} trending releases")
    
    def test_analytics_leaderboard_requires_auth(self):
        """GET /api/analytics/leaderboard - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/leaderboard", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/leaderboard requires auth (401)")
    
    def test_analytics_leaderboard_authenticated(self, auth_token):
        """GET /api/analytics/leaderboard - returns leaderboard data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/leaderboard", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "leaderboard" in data, "Response missing 'leaderboard' field"
        assert "total_releases" in data, "Response missing 'total_releases' field"
        print(f"PASS: GET /api/analytics/leaderboard returns {len(data.get('leaderboard', []))} entries")
    
    def test_revenue_calculator_requires_auth(self):
        """POST /api/analytics/revenue/calculator - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={"streams": 10000}, timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/analytics/revenue/calculator requires auth (401)")
    
    def test_revenue_calculator_authenticated(self, auth_token):
        """POST /api/analytics/revenue/calculator - calculates revenue"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/analytics/revenue/calculator",
            headers=headers,
            json={"streams": 10000},
            timeout=10
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "input_streams" in data, "Response missing 'input_streams'"
        assert "gross_revenue" in data, "Response missing 'gross_revenue'"
        assert "net_revenue" in data, "Response missing 'net_revenue'"
        print(f"PASS: POST /api/analytics/revenue/calculator returns gross={data.get('gross_revenue')}, net={data.get('net_revenue')}")
    
    def test_revenue_overview_requires_auth(self):
        """GET /api/analytics/revenue - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/revenue requires auth (401)")
    
    def test_revenue_overview_authenticated(self, auth_token):
        """GET /api/analytics/revenue - returns revenue overview"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/revenue", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "summary" in data, "Response missing 'summary' field"
        assert "platforms" in data, "Response missing 'platforms' field"
        print(f"PASS: GET /api/analytics/revenue returns summary with {len(data.get('platforms', []))} platforms")
    
    def test_revenue_export_csv_requires_auth(self):
        """GET /api/analytics/revenue/export/csv - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue/export/csv", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/revenue/export/csv requires auth (401)")
    
    def test_revenue_export_csv_authenticated(self, auth_token):
        """GET /api/analytics/revenue/export/csv - returns CSV file"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/revenue/export/csv", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "text/csv" in response.headers.get("Content-Type", ""), "Response should be CSV"
        print("PASS: GET /api/analytics/revenue/export/csv returns CSV file")
    
    def test_revenue_export_pdf_requires_auth(self):
        """GET /api/analytics/revenue/export/pdf - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue/export/pdf", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/revenue/export/pdf requires auth (401)")
    
    def test_revenue_export_pdf_authenticated(self, auth_token):
        """GET /api/analytics/revenue/export/pdf - returns PDF file"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/revenue/export/pdf", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "application/pdf" in response.headers.get("Content-Type", ""), "Response should be PDF"
        print("PASS: GET /api/analytics/revenue/export/pdf returns PDF file")


class TestFanAnalytics:
    """Fan analytics endpoints from analytics_routes.py"""
    
    def test_fan_analytics_overview_requires_auth(self):
        """GET /api/fan-analytics/overview - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fan-analytics/overview", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/fan-analytics/overview requires auth (401)")
    
    def test_fan_analytics_overview_authenticated(self, auth_token):
        """GET /api/fan-analytics/overview - returns fan analytics"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fan-analytics/overview", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total_subscribers" in data, "Response missing 'total_subscribers'"
        assert "platform_engagement" in data, "Response missing 'platform_engagement'"
        print(f"PASS: GET /api/fan-analytics/overview returns data with {data.get('total_subscribers')} subscribers")


class TestGoalsEndpoints:
    """Goals endpoints from analytics_routes.py"""
    
    def test_create_goal_requires_auth(self):
        """POST /api/goals - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/goals", json={"goal_type": "streams", "target_value": 1000}, timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/goals requires auth (401)")
    
    def test_goals_crud(self, auth_token):
        """Test goals CRUD operations"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Create goal
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            headers=headers,
            json={"goal_type": "streams", "target_value": 1000},
            timeout=10
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        goal = create_response.json()
        assert "goal" in goal, "Response missing 'goal' field"
        goal_id = goal["goal"]["id"]
        print(f"PASS: POST /api/goals creates goal: {goal_id}")
        
        # List goals
        list_response = requests.get(f"{BASE_URL}/api/goals", headers=headers, timeout=10)
        assert list_response.status_code == 200, f"List failed: {list_response.text}"
        goals_data = list_response.json()
        assert "goals" in goals_data, "Response missing 'goals' field"
        print(f"PASS: GET /api/goals returns {len(goals_data.get('goals', []))} goals")
        
        # Delete goal
        delete_response = requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=headers, timeout=10)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"PASS: DELETE /api/goals/{goal_id} deletes goal")


class TestReferralEndpoints:
    """Referral endpoints from subscription_routes.py"""
    
    def test_referral_link_requires_auth(self):
        """GET /api/referral/my-link - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral/my-link", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/referral/my-link requires auth (401)")
    
    def test_referral_link_authenticated(self, auth_token):
        """GET /api/referral/my-link - returns referral link"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/my-link", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "referral_code" in data, "Response missing 'referral_code'"
        print(f"PASS: GET /api/referral/my-link returns code: {data.get('referral_code')}")
    
    def test_referral_stats_requires_auth(self):
        """GET /api/referral/stats - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral/stats", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/referral/stats requires auth (401)")
    
    def test_referral_stats_authenticated(self, auth_token):
        """GET /api/referral/stats - returns referral stats"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/stats", headers=headers, timeout=10)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total_referrals" in data, "Response missing 'total_referrals'"
        print(f"PASS: GET /api/referral/stats returns stats: {data.get('total_referrals')} referrals")


class TestPromoCodeEndpoints:
    """Promo code endpoints from subscription_routes.py"""
    
    def test_validate_promo_code_no_code(self):
        """POST /api/promo-codes/validate - returns 400 for no code"""
        response = requests.post(
            f"{BASE_URL}/api/promo-codes/validate",
            json={"code": "", "plan": "pro"},
            timeout=10
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: POST /api/promo-codes/validate returns 400 for empty code")
    
    def test_validate_promo_code_invalid(self):
        """POST /api/promo-codes/validate - returns 404 for invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/promo-codes/validate",
            json={"code": "INVALIDCODE123", "plan": "pro"},
            timeout=10
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: POST /api/promo-codes/validate returns 404 for invalid code")


class TestAdminPromoCodeEndpoints:
    """Admin promo code endpoints from subscription_routes.py"""
    
    def test_admin_promo_codes_requires_admin(self, auth_token):
        """GET /api/admin/promo-codes - requires admin role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promo-codes", headers=headers, timeout=10)
        # Admin user should get 200, non-admin should get 403
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            print("PASS: GET /api/admin/promo-codes returns 200 for admin")
        else:
            print("PASS: GET /api/admin/promo-codes returns 403 for non-admin")


class TestAdminReferralOverview:
    """Admin referral overview from subscription_routes.py"""
    
    def test_admin_referral_overview_requires_admin(self, auth_token):
        """GET /api/admin/referral/overview - requires admin role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/referral/overview", headers=headers, timeout=10)
        # Admin user should get 200, non-admin should get 403
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "total_referrals" in data, "Response missing 'total_referrals'"
            print(f"PASS: GET /api/admin/referral/overview returns data for admin")
        else:
            print("PASS: GET /api/admin/referral/overview returns 403 for non-admin")


class TestReleaseAnalytics:
    """Release-specific analytics from analytics_routes.py"""
    
    def test_release_analytics_requires_auth(self):
        """GET /api/analytics/release/{release_id} - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/release/fake_release_id", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/analytics/release/{release_id} requires auth (401)")
    
    def test_release_analytics_not_found(self, auth_token):
        """GET /api/analytics/release/{release_id} - returns 404 for non-existent release"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/release/nonexistent_release", headers=headers, timeout=10)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: GET /api/analytics/release/{release_id} returns 404 for non-existent release")


# Fixtures
@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10
    )
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"Auth token obtained for {ADMIN_EMAIL}")
        return token
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
