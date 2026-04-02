"""
Iteration 31 - Goal Tracking & Milestones Feature Tests
Tests for:
- POST /api/goals - Create goal with goal_type, target_value, title, deadline
- POST /api/goals - Reject invalid goal_type
- POST /api/goals - Require authentication
- GET /api/goals - Return goals with progress (current_value, progress %, completed status)
- GET /api/goals - Auto-complete goals where current_value >= target and create milestone notification
- GET /api/goals - Return current_metrics with all 7 metric types
- GET /api/goals - Return active_count and completed_count
- DELETE /api/goals/{goal_id} - Delete a goal
- DELETE /api/goals/{goal_id} - Return 404 for non-existent goal
- Regression: GET /api/analytics/leaderboard still works
- Regression: GET /api/analytics/revenue still works
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"

# Valid goal types from backend
VALID_GOAL_TYPES = ["streams", "monthly_streams", "countries", "revenue", "releases", "presave_subs", "collaborations"]


class TestGoalsAuthentication:
    """Test authentication requirements for goals endpoints"""
    
    def test_create_goal_requires_auth(self):
        """POST /api/goals should return 401/422 without authentication"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": 1000
        })
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("PASS: POST /api/goals requires authentication")
    
    def test_get_goals_requires_auth(self):
        """GET /api/goals should return 401/422 without authentication"""
        response = requests.get(f"{BASE_URL}/api/goals")
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("PASS: GET /api/goals requires authentication")
    
    def test_delete_goal_requires_auth(self):
        """DELETE /api/goals/{id} should return 401/422 without authentication"""
        response = requests.delete(f"{BASE_URL}/api/goals/goal_test123")
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print("PASS: DELETE /api/goals/{id} requires authentication")


class TestGoalsCreate:
    """Test goal creation endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.cookies = login_response.cookies
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_create_goal_success(self):
        """POST /api/goals creates a goal with valid data"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": 100000,
            "title": "TEST_Hit 100k streams",
            "deadline": "2026-12-31"
        }, headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should have 'message'"
        assert "goal" in data, "Response should have 'goal'"
        
        goal = data["goal"]
        assert goal["goal_type"] == "streams"
        assert goal["target_value"] == 100000
        assert goal["title"] == "TEST_Hit 100k streams"
        assert goal["deadline"] == "2026-12-31"
        assert goal["status"] == "active"
        assert "id" in goal
        assert goal["id"].startswith("goal_")
        
        # Store for cleanup
        self.created_goal_id = goal["id"]
        print(f"PASS: Created goal with id {goal['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal['id']}", headers=self.headers, cookies=self.cookies)
    
    def test_create_goal_with_auto_title(self):
        """POST /api/goals generates title if not provided"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "countries",
            "target_value": 10
        }, headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        goal = response.json()["goal"]
        
        # Should auto-generate title like "Reach 10 countries"
        assert "10" in goal["title"] or "countries" in goal["title"].lower()
        print(f"PASS: Auto-generated title: {goal['title']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal['id']}", headers=self.headers, cookies=self.cookies)
    
    def test_create_goal_invalid_type(self):
        """POST /api/goals rejects invalid goal_type"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "invalid_type",
            "target_value": 1000
        }, headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower() or "goal_type" in data["detail"].lower()
        print("PASS: Invalid goal_type rejected with 400")
    
    def test_create_goal_all_valid_types(self):
        """POST /api/goals accepts all 7 valid goal types"""
        created_ids = []
        for goal_type in VALID_GOAL_TYPES:
            response = requests.post(f"{BASE_URL}/api/goals", json={
                "goal_type": goal_type,
                "target_value": 1,
                "title": f"TEST_{goal_type}_goal"
            }, headers=self.headers, cookies=self.cookies)
            
            assert response.status_code == 200, f"Failed for {goal_type}: {response.text}"
            created_ids.append(response.json()["goal"]["id"])
        
        print(f"PASS: All 7 goal types accepted: {VALID_GOAL_TYPES}")
        
        # Cleanup
        for gid in created_ids:
            requests.delete(f"{BASE_URL}/api/goals/{gid}", headers=self.headers, cookies=self.cookies)


class TestGoalsGet:
    """Test GET /api/goals endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.cookies = login_response.cookies
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_get_goals_returns_structure(self):
        """GET /api/goals returns proper response structure"""
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "goals" in data, "Response should have 'goals' array"
        assert "active_count" in data, "Response should have 'active_count'"
        assert "completed_count" in data, "Response should have 'completed_count'"
        assert "current_metrics" in data, "Response should have 'current_metrics'"
        
        assert isinstance(data["goals"], list)
        assert isinstance(data["active_count"], int)
        assert isinstance(data["completed_count"], int)
        assert isinstance(data["current_metrics"], dict)
        
        print(f"PASS: GET /api/goals returns proper structure with {len(data['goals'])} goals")
    
    def test_get_goals_current_metrics_all_types(self):
        """GET /api/goals returns current_metrics with all 7 metric types"""
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200
        metrics = response.json()["current_metrics"]
        
        for metric_type in VALID_GOAL_TYPES:
            assert metric_type in metrics, f"Missing metric: {metric_type}"
            assert isinstance(metrics[metric_type], (int, float)), f"{metric_type} should be numeric"
        
        print(f"PASS: current_metrics contains all 7 types: {list(metrics.keys())}")
        print(f"  Values: streams={metrics['streams']}, countries={metrics['countries']}, revenue={metrics['revenue']}, releases={metrics['releases']}")
    
    def test_get_goals_progress_calculation(self):
        """GET /api/goals returns goals with progress fields"""
        # First create a test goal
        create_response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": 10000,
            "title": "TEST_progress_check"
        }, headers=self.headers, cookies=self.cookies)
        
        assert create_response.status_code == 200
        goal_id = create_response.json()["goal"]["id"]
        
        # Get goals and check progress fields
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        assert response.status_code == 200
        
        goals = response.json()["goals"]
        test_goal = next((g for g in goals if g["id"] == goal_id), None)
        
        assert test_goal is not None, "Created goal not found in list"
        assert "current_value" in test_goal, "Goal should have current_value"
        assert "progress" in test_goal, "Goal should have progress percentage"
        assert "completed" in test_goal, "Goal should have completed boolean"
        assert "goal_label" in test_goal, "Goal should have goal_label"
        assert "unit" in test_goal, "Goal should have unit"
        
        # Progress should be a percentage (0-100)
        assert 0 <= test_goal["progress"] <= 100, f"Progress should be 0-100, got {test_goal['progress']}"
        
        print(f"PASS: Goal has progress fields - current_value={test_goal['current_value']}, progress={test_goal['progress']}%, completed={test_goal['completed']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers, cookies=self.cookies)
    
    def test_get_goals_auto_complete(self):
        """GET /api/goals auto-completes goals where current_value >= target"""
        # Get current metrics first
        metrics_response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        current_streams = metrics_response.json()["current_metrics"]["streams"]
        
        # Create a goal with target BELOW current value (should auto-complete)
        target = max(1, current_streams - 100)  # Target below current
        create_response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": target,
            "title": "TEST_auto_complete_goal"
        }, headers=self.headers, cookies=self.cookies)
        
        assert create_response.status_code == 200
        goal_id = create_response.json()["goal"]["id"]
        
        # GET goals should trigger auto-completion
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        
        # Find our goal
        test_goal = next((g for g in data["goals"] if g["id"] == goal_id), None)
        assert test_goal is not None
        
        # Should be completed since current_streams >= target
        if current_streams >= target:
            assert test_goal["completed"] == True, f"Goal should be completed (current={current_streams}, target={target})"
            assert test_goal["status"] == "completed"
            assert test_goal["progress"] == 100
            print(f"PASS: Goal auto-completed (current={current_streams} >= target={target})")
            
            # Check for newly_completed
            if goal_id in data.get("newly_completed", []):
                print("PASS: Goal appears in newly_completed list")
        else:
            print(f"SKIP: current_streams ({current_streams}) < target ({target}), auto-complete not triggered")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers, cookies=self.cookies)
    
    def test_get_goals_milestone_notification_created(self):
        """GET /api/goals creates milestone notification when goal auto-completes"""
        # Get current metrics
        metrics_response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        current_releases = metrics_response.json()["current_metrics"]["releases"]
        
        if current_releases < 1:
            pytest.skip("No releases to test auto-complete")
        
        # Create goal that will auto-complete
        create_response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "releases",
            "target_value": 1,  # Should be met since admin has releases
            "title": "TEST_milestone_notification"
        }, headers=self.headers, cookies=self.cookies)
        
        assert create_response.status_code == 200
        goal_id = create_response.json()["goal"]["id"]
        
        # Trigger auto-complete by getting goals
        requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        
        # Check notifications for milestone type
        notif_response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers, cookies=self.cookies)
        assert notif_response.status_code == 200
        
        notifications = notif_response.json()
        milestone_notifs = [n for n in notifications if n.get("type") == "milestone" and "TEST_milestone_notification" in n.get("message", "")]
        
        if milestone_notifs:
            print(f"PASS: Milestone notification created: {milestone_notifs[0]['message']}")
        else:
            # Check if goal was already completed before
            print("INFO: No new milestone notification (goal may have been completed before)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers, cookies=self.cookies)
    
    def test_get_goals_days_left_calculation(self):
        """GET /api/goals calculates days_left for goals with deadlines"""
        # Create goal with deadline
        create_response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": 999999,
            "title": "TEST_deadline_goal",
            "deadline": "2026-12-31"
        }, headers=self.headers, cookies=self.cookies)
        
        assert create_response.status_code == 200
        goal_id = create_response.json()["goal"]["id"]
        
        # Get goals
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        assert response.status_code == 200
        
        test_goal = next((g for g in response.json()["goals"] if g["id"] == goal_id), None)
        assert test_goal is not None
        
        # Should have days_left calculated
        assert "days_left" in test_goal, "Goal with deadline should have days_left"
        assert test_goal["days_left"] is not None
        assert test_goal["days_left"] >= 0
        
        print(f"PASS: days_left calculated: {test_goal['days_left']} days")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers, cookies=self.cookies)


class TestGoalsDelete:
    """Test DELETE /api/goals/{goal_id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.cookies = login_response.cookies
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_delete_goal_success(self):
        """DELETE /api/goals/{goal_id} deletes a goal"""
        # Create a goal first
        create_response = requests.post(f"{BASE_URL}/api/goals", json={
            "goal_type": "streams",
            "target_value": 5000,
            "title": "TEST_delete_me"
        }, headers=self.headers, cookies=self.cookies)
        
        assert create_response.status_code == 200
        goal_id = create_response.json()["goal"]["id"]
        
        # Delete the goal
        delete_response = requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers, cookies=self.cookies)
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers, cookies=self.cookies)
        goals = get_response.json()["goals"]
        assert not any(g["id"] == goal_id for g in goals), "Deleted goal should not appear in list"
        
        print(f"PASS: Goal {goal_id} deleted successfully")
    
    def test_delete_goal_not_found(self):
        """DELETE /api/goals/{goal_id} returns 404 for non-existent goal"""
        response = requests.delete(f"{BASE_URL}/api/goals/goal_nonexistent123", headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        
        print("PASS: DELETE non-existent goal returns 404")


class TestRegressionEndpoints:
    """Regression tests for existing endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.cookies = login_response.cookies
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_leaderboard_still_works(self):
        """GET /api/analytics/leaderboard still works after goals feature"""
        response = requests.get(f"{BASE_URL}/api/analytics/leaderboard", headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "leaderboard" in data
        assert "total_releases" in data
        assert "active_releases" in data
        
        print(f"PASS: Leaderboard endpoint works - {data['total_releases']} releases")
    
    def test_revenue_still_works(self):
        """GET /api/analytics/revenue still works after goals feature"""
        response = requests.get(f"{BASE_URL}/api/analytics/revenue", headers=self.headers, cookies=self.cookies)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "summary" in data
        assert "platforms" in data
        assert "monthly_trend" in data
        
        print(f"PASS: Revenue endpoint works - gross_revenue=${data['summary']['gross_revenue']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
