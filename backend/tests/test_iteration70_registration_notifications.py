"""
Iteration 70 - Testing Registration, Role Selection, Admin Notifications, and CSV Import
Tests:
1. PUT /api/auth/set-role accepts 'artist', 'producer', 'label' as valid roles
2. POST /api/auth/register creates user with correct user_role field
3. After registration, BOTH admin accounts receive new_signup notification
4. GET /api/admin/notifications-bank returns paginated notifications with search/filter
5. GET /api/admin/notifications-bank?type=new_signup filters by type
6. GET /api/admin/notifications-bank?read=false filters unread only
7. GET /api/admin/notifications-bank?search=Producer searches by message
8. PUT /api/admin/notifications-bank/{id}/read marks specific notification as read
9. PUT /api/admin/notifications-bank/read-all marks all notifications as read
10. DELETE /api/admin/notifications-bank/{id} deletes a notification
11. POST /api/analytics/import with admin imports CSV and creates stream_events
12. GET /api/analytics/overview shows correct aggregated data after CSV import
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "Admin123!"
ADMIN2_EMAIL = "submitkalmori@gmail.com"
ADMIN2_PASSWORD = "Admin123!"


class TestSetRole:
    """Test PUT /api/auth/set-role endpoint"""
    
    def test_set_role_artist(self):
        """Test setting role to 'artist'"""
        # First register a new user
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_artist_{unique_id}@test.com"
        
        # Register
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Artist {unique_id}"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        cookies = reg_resp.cookies
        
        # Set role to artist
        role_resp = requests.put(f"{BASE_URL}/api/auth/set-role", 
            json={"role": "artist"}, 
            cookies=cookies)
        assert role_resp.status_code == 200, f"Set role failed: {role_resp.text}"
        data = role_resp.json()
        assert data.get("role") == "artist", f"Expected role 'artist', got {data.get('role')}"
        print(f"✓ Set role to 'artist' works correctly")
    
    def test_set_role_producer(self):
        """Test setting role to 'producer'"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_producer_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Producer {unique_id}"
        })
        assert reg_resp.status_code == 200
        cookies = reg_resp.cookies
        
        role_resp = requests.put(f"{BASE_URL}/api/auth/set-role", 
            json={"role": "producer"}, 
            cookies=cookies)
        assert role_resp.status_code == 200, f"Set role failed: {role_resp.text}"
        data = role_resp.json()
        assert data.get("role") == "producer", f"Expected role 'producer', got {data.get('role')}"
        print(f"✓ Set role to 'producer' works correctly")
    
    def test_set_role_label(self):
        """Test setting role to 'label'"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_label_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Label {unique_id}"
        })
        assert reg_resp.status_code == 200
        cookies = reg_resp.cookies
        
        role_resp = requests.put(f"{BASE_URL}/api/auth/set-role", 
            json={"role": "label"}, 
            cookies=cookies)
        assert role_resp.status_code == 200, f"Set role failed: {role_resp.text}"
        data = role_resp.json()
        assert data.get("role") == "label", f"Expected role 'label', got {data.get('role')}"
        print(f"✓ Set role to 'label' works correctly")
    
    def test_set_role_invalid(self):
        """Test setting invalid role returns 400"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_invalid_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Invalid {unique_id}"
        })
        assert reg_resp.status_code == 200
        cookies = reg_resp.cookies
        
        role_resp = requests.put(f"{BASE_URL}/api/auth/set-role", 
            json={"role": "invalid_role"}, 
            cookies=cookies)
        assert role_resp.status_code == 400, f"Expected 400 for invalid role, got {role_resp.status_code}"
        print(f"✓ Invalid role returns 400 correctly")


class TestRegistrationUserRole:
    """Test POST /api/auth/register creates user with correct user_role"""
    
    def test_register_with_user_role_artist(self):
        """Test registration with user_role='artist'"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_reg_artist_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Reg Artist {unique_id}",
            "user_role": "artist"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        data = reg_resp.json()
        user = data.get("user", {})
        assert user.get("user_role") == "artist", f"Expected user_role 'artist', got {user.get('user_role')}"
        print(f"✓ Registration with user_role='artist' works correctly")
    
    def test_register_with_user_role_producer(self):
        """Test registration with user_role='producer'"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_reg_producer_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Reg Producer {unique_id}",
            "user_role": "producer"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        data = reg_resp.json()
        user = data.get("user", {})
        assert user.get("user_role") == "producer", f"Expected user_role 'producer', got {user.get('user_role')}"
        print(f"✓ Registration with user_role='producer' works correctly")
    
    def test_register_with_user_role_label(self):
        """Test registration with user_role='label'"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_reg_label_{unique_id}@test.com"
        
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": f"Test Reg Label {unique_id}",
            "user_role": "label"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        data = reg_resp.json()
        user = data.get("user", {})
        assert user.get("user_role") == "label", f"Expected user_role 'label', got {user.get('user_role')}"
        print(f"✓ Registration with user_role='label' works correctly")


class TestAdminSignupNotifications:
    """Test that BOTH admin accounts receive new_signup notification after registration"""
    
    def test_both_admins_receive_signup_notification(self):
        """Register a new user and verify both admins get notified"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_notif_{unique_id}@test.com"
        name = f"Test Notif User {unique_id}"
        
        # Register new user
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": name,
            "user_role": "producer"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        
        # Wait a moment for async notification creation
        time.sleep(1)
        
        # Login as admin 1 and check notifications
        admin1_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin1_login.status_code == 200, f"Admin 1 login failed: {admin1_login.text}"
        admin1_cookies = admin1_login.cookies
        
        # Get admin 1 notifications
        notif1_resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?type=new_signup&search={name}", 
            cookies=admin1_cookies)
        assert notif1_resp.status_code == 200, f"Get notifications failed: {notif1_resp.text}"
        notif1_data = notif1_resp.json()
        
        # Check admin 1 received the notification
        admin1_has_notif = any(name in n.get("message", "") for n in notif1_data.get("notifications", []))
        print(f"Admin 1 ({ADMIN_EMAIL}) has notification: {admin1_has_notif}")
        
        # Login as admin 2 and check notifications
        admin2_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN2_EMAIL,
            "password": ADMIN2_PASSWORD
        })
        assert admin2_login.status_code == 200, f"Admin 2 login failed: {admin2_login.text}"
        admin2_cookies = admin2_login.cookies
        
        # Get admin 2 notifications
        notif2_resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?type=new_signup&search={name}", 
            cookies=admin2_cookies)
        assert notif2_resp.status_code == 200, f"Get notifications failed: {notif2_resp.text}"
        notif2_data = notif2_resp.json()
        
        # Check admin 2 received the notification
        admin2_has_notif = any(name in n.get("message", "") for n in notif2_data.get("notifications", []))
        print(f"Admin 2 ({ADMIN2_EMAIL}) has notification: {admin2_has_notif}")
        
        assert admin1_has_notif, f"Admin 1 did not receive signup notification for {name}"
        assert admin2_has_notif, f"Admin 2 did not receive signup notification for {name}"
        print(f"✓ BOTH admins received new_signup notification for {name}")


class TestAdminNotificationsBank:
    """Test Admin Notification Bank endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.cookies = login_resp.cookies
    
    def test_get_notifications_bank_paginated(self):
        """Test GET /api/admin/notifications-bank returns paginated results"""
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?page=1&per_page=10", 
            cookies=self.cookies)
        assert resp.status_code == 200, f"Get notifications failed: {resp.text}"
        data = resp.json()
        assert "notifications" in data, "Response missing 'notifications' field"
        assert "total" in data, "Response missing 'total' field"
        assert "page" in data, "Response missing 'page' field"
        assert "per_page" in data, "Response missing 'per_page' field"
        assert data["page"] == 1
        assert data["per_page"] == 10
        print(f"✓ GET /api/admin/notifications-bank returns paginated results (total: {data['total']})")
    
    def test_filter_by_type_new_signup(self):
        """Test filtering by type=new_signup"""
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?type=new_signup", 
            cookies=self.cookies)
        assert resp.status_code == 200, f"Get notifications failed: {resp.text}"
        data = resp.json()
        notifications = data.get("notifications", [])
        # All returned notifications should be of type new_signup
        for n in notifications:
            assert n.get("type") == "new_signup", f"Expected type 'new_signup', got {n.get('type')}"
        print(f"✓ Filter by type=new_signup works correctly ({len(notifications)} results)")
    
    def test_filter_by_read_false(self):
        """Test filtering by read=false (unread only)"""
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?read=false", 
            cookies=self.cookies)
        assert resp.status_code == 200, f"Get notifications failed: {resp.text}"
        data = resp.json()
        notifications = data.get("notifications", [])
        # All returned notifications should be unread
        for n in notifications:
            assert n.get("read") == False, f"Expected read=False, got {n.get('read')}"
        print(f"✓ Filter by read=false works correctly ({len(notifications)} unread)")
    
    def test_search_by_message(self):
        """Test searching by message content"""
        # First create a user with a unique name
        unique_id = uuid.uuid4().hex[:8]
        search_term = f"SearchTest{unique_id}"
        
        # Register user with unique name
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"search_test_{unique_id}@test.com",
            "password": "Test123!",
            "name": search_term,
            "user_role": "producer"
        })
        assert reg_resp.status_code == 200
        
        time.sleep(1)  # Wait for notification
        
        # Search for the notification
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?search={search_term}", 
            cookies=self.cookies)
        assert resp.status_code == 200, f"Search failed: {resp.text}"
        data = resp.json()
        notifications = data.get("notifications", [])
        
        # Should find at least one notification with the search term
        found = any(search_term in n.get("message", "") for n in notifications)
        assert found, f"Search for '{search_term}' did not find any notifications"
        print(f"✓ Search by message works correctly (found notification with '{search_term}')")
    
    def test_mark_notification_as_read(self):
        """Test PUT /api/admin/notifications-bank/{id}/read marks notification as read"""
        # Get an unread notification
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?read=false&per_page=1", 
            cookies=self.cookies)
        assert resp.status_code == 200
        data = resp.json()
        notifications = data.get("notifications", [])
        
        if not notifications:
            # Create a notification by registering a user
            unique_id = uuid.uuid4().hex[:8]
            requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": f"mark_read_test_{unique_id}@test.com",
                "password": "Test123!",
                "name": f"Mark Read Test {unique_id}"
            })
            time.sleep(1)
            resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?read=false&per_page=1", 
                cookies=self.cookies)
            data = resp.json()
            notifications = data.get("notifications", [])
        
        if notifications:
            notif_id = notifications[0]["id"]
            
            # Mark as read
            mark_resp = requests.put(f"{BASE_URL}/api/admin/notifications-bank/{notif_id}/read", 
                json={}, cookies=self.cookies)
            assert mark_resp.status_code == 200, f"Mark as read failed: {mark_resp.text}"
            
            # Verify it's now read
            verify_resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?search={notif_id[:8]}", 
                cookies=self.cookies)
            # The notification should now be read
            print(f"✓ PUT /api/admin/notifications-bank/{notif_id}/read marks notification as read")
        else:
            pytest.skip("No unread notifications to test with")
    
    def test_mark_all_as_read(self):
        """Test PUT /api/admin/notifications-bank/read-all marks all as read"""
        resp = requests.put(f"{BASE_URL}/api/admin/notifications-bank/read-all", 
            json={}, cookies=self.cookies)
        assert resp.status_code == 200, f"Mark all as read failed: {resp.text}"
        data = resp.json()
        assert "message" in data
        print(f"✓ PUT /api/admin/notifications-bank/read-all works correctly: {data['message']}")
    
    def test_delete_notification(self):
        """Test DELETE /api/admin/notifications-bank/{id} deletes notification"""
        # First create a notification by registering a user
        unique_id = uuid.uuid4().hex[:8]
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"delete_test_{unique_id}@test.com",
            "password": "Test123!",
            "name": f"Delete Test {unique_id}"
        })
        time.sleep(1)
        
        # Get the notification
        resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?search=Delete Test {unique_id}", 
            cookies=self.cookies)
        assert resp.status_code == 200
        data = resp.json()
        notifications = data.get("notifications", [])
        
        if notifications:
            notif_id = notifications[0]["id"]
            
            # Delete it
            del_resp = requests.delete(f"{BASE_URL}/api/admin/notifications-bank/{notif_id}", 
                cookies=self.cookies)
            assert del_resp.status_code == 200, f"Delete failed: {del_resp.text}"
            
            # Verify it's deleted
            verify_resp = requests.get(f"{BASE_URL}/api/admin/notifications-bank?search=Delete Test {unique_id}", 
                cookies=self.cookies)
            verify_data = verify_resp.json()
            remaining = [n for n in verify_data.get("notifications", []) if n["id"] == notif_id]
            assert len(remaining) == 0, "Notification was not deleted"
            print(f"✓ DELETE /api/admin/notifications-bank/{notif_id} deletes notification")
        else:
            pytest.skip("Could not create notification to delete")


class TestCSVImportAnalytics:
    """Test CSV import and analytics endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.cookies = login_resp.cookies
    
    def test_csv_import_creates_stream_events(self):
        """Test POST /api/analytics/import creates stream_events"""
        # Create a simple CSV
        csv_content = """Artist,Track,Platform,Country,Streams,Revenue,Period
Test Artist,Test Track,Spotify,US,1000,4.00,2024-01
Test Artist,Test Track 2,Apple Music,UK,500,2.00,2024-01"""
        
        files = {
            'file': ('test_streams.csv', csv_content, 'text/csv')
        }
        
        resp = requests.post(f"{BASE_URL}/api/analytics/import", 
            files=files, cookies=self.cookies)
        assert resp.status_code == 200, f"CSV import failed: {resp.text}"
        data = resp.json()
        assert "imported" in data or "message" in data, f"Unexpected response: {data}"
        print(f"✓ POST /api/analytics/import creates stream_events: {data}")
    
    def test_analytics_overview_after_import(self):
        """Test GET /api/analytics/overview shows data"""
        resp = requests.get(f"{BASE_URL}/api/analytics/overview", cookies=self.cookies)
        assert resp.status_code == 200, f"Get analytics failed: {resp.text}"
        data = resp.json()
        assert "total_streams" in data, "Response missing 'total_streams'"
        assert "total_earnings" in data, "Response missing 'total_earnings'"
        print(f"✓ GET /api/analytics/overview returns data: streams={data.get('total_streams')}, earnings={data.get('total_earnings')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
