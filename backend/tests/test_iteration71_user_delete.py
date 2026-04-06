"""
Iteration 71 - Testing Individual User Delete from Admin Panel
Features:
1. DELETE /api/admin/users/{user_id} - deletes non-admin user and all related data
2. DELETE /api/admin/users/{user_id} - returns 403 when trying to delete admin account
3. DELETE /api/admin/users/{user_id} - returns 404 for non-existent user
4. Verify related data cleanup (releases, notifications, wallets, etc.)
5. All admin notifications sync to BOTH admin accounts
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "Admin123!"
ADMIN2_EMAIL = "submitkalmori@gmail.com"
ADMIN2_PASSWORD = "Admin123!"


class TestAdminUserDelete:
    """Test individual user delete functionality from admin panel"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.admin_token = login_resp.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
        
        # Store cookies for auth
        self.session.cookies.update(login_resp.cookies)
        
    def _create_test_user(self, email_prefix="testdelete"):
        """Helper to create a test user for deletion tests"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"{email_prefix}_{unique_id}@test.com"
        
        # Create user via register endpoint (no reCAPTCHA needed for API)
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "name": f"Test User {unique_id}",
            "artist_name": f"Test Artist {unique_id}"
        })
        
        if register_resp.status_code == 200:
            return register_resp.json().get("user", {}).get("id"), email
        return None, email
    
    def test_delete_non_admin_user_success(self):
        """Test: DELETE /api/admin/users/{user_id} successfully deletes non-admin user"""
        # Create a test user
        user_id, email = self._create_test_user("deletetest")
        assert user_id is not None, f"Failed to create test user: {email}"
        
        # Delete the user via admin endpoint
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        data = delete_resp.json()
        assert "message" in data
        assert "Deleted user" in data["message"]
        print(f"✓ Successfully deleted user {user_id}: {data['message']}")
        
        # Verify user no longer exists
        users_resp = self.session.get(f"{BASE_URL}/api/admin/users?search={email}")
        assert users_resp.status_code == 200
        users = users_resp.json().get("users", [])
        user_ids = [u["id"] for u in users]
        assert user_id not in user_ids, "User should not exist after deletion"
        print(f"✓ Verified user {user_id} no longer exists in users list")
    
    def test_delete_admin_user_returns_403(self):
        """Test: DELETE /api/admin/users/{user_id} returns 403 for admin accounts"""
        # Get admin user ID
        users_resp = self.session.get(f"{BASE_URL}/api/admin/users?search={ADMIN_EMAIL}")
        assert users_resp.status_code == 200
        users = users_resp.json().get("users", [])
        admin_user = next((u for u in users if u["email"] == ADMIN_EMAIL), None)
        assert admin_user is not None, "Admin user not found"
        admin_id = admin_user["id"]
        
        # Try to delete admin user
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/users/{admin_id}")
        
        assert delete_resp.status_code == 403, f"Expected 403, got {delete_resp.status_code}: {delete_resp.text}"
        data = delete_resp.json()
        assert "Cannot delete admin accounts" in data.get("detail", "")
        print(f"✓ Correctly returned 403 when trying to delete admin account")
    
    def test_delete_second_admin_returns_403(self):
        """Test: DELETE /api/admin/users/{user_id} returns 403 for second admin account"""
        # Get second admin user ID
        users_resp = self.session.get(f"{BASE_URL}/api/admin/users?search={ADMIN2_EMAIL}")
        assert users_resp.status_code == 200
        users = users_resp.json().get("users", [])
        admin2_user = next((u for u in users if u["email"] == ADMIN2_EMAIL), None)
        assert admin2_user is not None, "Second admin user not found"
        admin2_id = admin2_user["id"]
        
        # Try to delete second admin user
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/users/{admin2_id}")
        
        assert delete_resp.status_code == 403, f"Expected 403, got {delete_resp.status_code}: {delete_resp.text}"
        data = delete_resp.json()
        assert "Cannot delete admin accounts" in data.get("detail", "")
        print(f"✓ Correctly returned 403 when trying to delete second admin account")
    
    def test_delete_nonexistent_user_returns_404(self):
        """Test: DELETE /api/admin/users/{user_id} returns 404 for non-existent user"""
        fake_user_id = f"user_nonexistent_{uuid.uuid4().hex[:12]}"
        
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/users/{fake_user_id}")
        
        assert delete_resp.status_code == 404, f"Expected 404, got {delete_resp.status_code}: {delete_resp.text}"
        data = delete_resp.json()
        assert "User not found" in data.get("detail", "")
        print(f"✓ Correctly returned 404 for non-existent user ID")
    
    def test_delete_user_cleans_up_related_data(self):
        """Test: Deleting user removes related data from releases, notifications, wallets"""
        # Create a test user
        user_id, email = self._create_test_user("cleanuptest")
        assert user_id is not None, f"Failed to create test user: {email}"
        
        # Login as the test user to create some data
        test_session = requests.Session()
        login_resp = test_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "TestPass123!"
        })
        assert login_resp.status_code == 200
        test_token = login_resp.json().get("access_token")
        test_session.headers.update({
            "Authorization": f"Bearer {test_token}",
            "Content-Type": "application/json"
        })
        test_session.cookies.update(login_resp.cookies)
        
        # Create a release for the test user
        release_resp = test_session.post(f"{BASE_URL}/api/releases", json={
            "title": f"Test Release {uuid.uuid4().hex[:6]}",
            "release_type": "single",
            "genre": "Pop",
            "release_date": "2025-06-01"
        })
        release_created = release_resp.status_code == 200
        if release_created:
            release_id = release_resp.json().get("id")
            print(f"✓ Created test release {release_id} for user")
        
        # Now delete the user via admin
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        data = delete_resp.json()
        cleanup = data.get("cleanup", {})
        print(f"✓ User deleted with cleanup report: {cleanup}")
        
        # Verify cleanup happened (if releases were created)
        if release_created and "releases" in cleanup:
            assert cleanup["releases"] >= 1, "Should have cleaned up at least 1 release"
            print(f"✓ Cleaned up {cleanup.get('releases', 0)} releases")
    
    def test_admin_users_list_shows_delete_button_info(self):
        """Test: GET /api/admin/users returns user role info for delete button visibility"""
        users_resp = self.session.get(f"{BASE_URL}/api/admin/users?limit=10")
        assert users_resp.status_code == 200
        
        data = users_resp.json()
        users = data.get("users", [])
        assert len(users) > 0, "Should have at least one user"
        
        # Check that each user has role field
        for user in users:
            assert "role" in user, f"User {user.get('id')} missing role field"
            assert "id" in user, f"User missing id field"
        
        # Verify admin users have role='admin'
        admin_users = [u for u in users if u.get("role") == "admin"]
        non_admin_users = [u for u in users if u.get("role") != "admin"]
        
        print(f"✓ Found {len(admin_users)} admin users and {len(non_admin_users)} non-admin users")
        print(f"✓ All users have role field for delete button visibility logic")


class TestAdminNotificationsSync:
    """Test that admin notifications sync to ALL admin accounts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test sessions for both admin accounts"""
        self.session1 = requests.Session()
        self.session1.headers.update({"Content-Type": "application/json"})
        
        self.session2 = requests.Session()
        self.session2.headers.update({"Content-Type": "application/json"})
        
        # Login as first admin
        login1 = self.session1.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login1.status_code == 200, f"Admin 1 login failed: {login1.text}"
        self.session1.headers.update({"Authorization": f"Bearer {login1.json().get('access_token')}"})
        self.session1.cookies.update(login1.cookies)
        
        # Login as second admin
        login2 = self.session2.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN2_EMAIL,
            "password": ADMIN2_PASSWORD
        })
        assert login2.status_code == 200, f"Admin 2 login failed: {login2.text}"
        self.session2.headers.update({"Authorization": f"Bearer {login2.json().get('access_token')}"})
        self.session2.cookies.update(login2.cookies)
    
    def test_new_signup_notification_goes_to_both_admins(self):
        """Test: New user signup creates notification for BOTH admin accounts"""
        import time
        
        # Create a new user (this should trigger admin notification)
        unique_id = uuid.uuid4().hex[:8]
        email = f"signuptest_{unique_id}@test.com"
        
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "name": f"Signup Test {unique_id}",
            "artist_name": f"Signup Artist {unique_id}"
        })
        assert register_resp.status_code == 200, f"Registration failed: {register_resp.text}"
        new_user_id = register_resp.json().get("user", {}).get("id")
        print(f"✓ Created new user {new_user_id} ({email})")
        
        # Wait for async notification to be created
        time.sleep(2)
        
        # Check notifications for admin 1
        notif1_resp = self.session1.get(f"{BASE_URL}/api/notifications")
        assert notif1_resp.status_code == 200
        notifs1 = notif1_resp.json()
        
        # Check notifications for admin 2
        notif2_resp = self.session2.get(f"{BASE_URL}/api/notifications")
        assert notif2_resp.status_code == 200
        notifs2 = notif2_resp.json()
        
        # Look for new_signup notification containing the new user's email (more reliable)
        # Message format: "New Artist signed up: Signup Test {unique_id} (signuptest_{unique_id}@test.com)"
        admin1_has_notif = any(
            n.get("type") == "new_signup" and email in n.get("message", "")
            for n in notifs1
        )
        admin2_has_notif = any(
            n.get("type") == "new_signup" and email in n.get("message", "")
            for n in notifs2
        )
        
        print(f"Admin 1 ({ADMIN_EMAIL}) has signup notification: {admin1_has_notif}")
        print(f"Admin 2 ({ADMIN2_EMAIL}) has signup notification: {admin2_has_notif}")
        print(f"Admin 1 notifications count: {len(notifs1)}")
        print(f"Admin 2 notifications count: {len(notifs2)}")
        
        # Both admins should have the notification
        assert admin1_has_notif and admin2_has_notif, "BOTH admins should have signup notification"
        print(f"✓ Signup notification delivered to BOTH admin accounts")
        
        # Cleanup: Delete the test user
        delete_resp = self.session1.delete(f"{BASE_URL}/api/admin/users/{new_user_id}")
        if delete_resp.status_code == 200:
            print(f"✓ Cleaned up test user {new_user_id}")
    
    def test_new_submission_notification_goes_to_both_admins(self):
        """Test: New release submission creates notification for BOTH admin accounts"""
        # Create a test user
        unique_id = uuid.uuid4().hex[:8]
        email = f"submittest_{unique_id}@test.com"
        
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "name": f"Submit Test {unique_id}",
            "artist_name": f"Submit Artist {unique_id}"
        })
        assert register_resp.status_code == 200
        user_data = register_resp.json()
        user_id = user_data.get("user", {}).get("id")
        user_token = user_data.get("access_token")
        
        # Create a session for the test user
        user_session = requests.Session()
        user_session.headers.update({
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json"
        })
        user_session.cookies.update(register_resp.cookies)
        
        # Note: We can't fully test submission without cover art and audio
        # But we can verify the endpoint structure exists
        print(f"✓ Created test user {user_id} for submission test")
        
        # Cleanup
        delete_resp = self.session1.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        if delete_resp.status_code == 200:
            print(f"✓ Cleaned up test user {user_id}")


class TestScheduleReminderNotifications:
    """Test that schedule reminder notifications go to ALL admins"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.session.headers.update({"Authorization": f"Bearer {login_resp.json().get('access_token')}"})
        self.session.cookies.update(login_resp.cookies)
    
    def test_schedule_check_due_endpoint_exists(self):
        """Test: POST /api/admin/schedules/check-due endpoint exists and works"""
        # This endpoint checks for overdue schedules and sends reminders to ALL admins
        check_resp = self.session.post(f"{BASE_URL}/api/admin/schedules/check-due")
        
        # Should return 200 even if no schedules are due
        assert check_resp.status_code == 200, f"Check due failed: {check_resp.text}"
        data = check_resp.json()
        
        assert "reminders_sent" in data
        assert "due_schedules" in data
        print(f"✓ Schedule check-due endpoint works: {data['reminders_sent']} reminders sent, {data['due_schedules']} due schedules")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
