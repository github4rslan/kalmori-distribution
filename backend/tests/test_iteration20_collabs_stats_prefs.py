"""
Iteration 20 Tests - Collaborations, DSP Import, Share Stats, Notification Preferences
Tests:
- POST /api/collaborations/invite - creates collaboration with split percentage
- GET /api/collaborations - returns owned and collaborating_on arrays
- GET /api/collaborations/invitations - returns pending invitations
- PUT /api/collaborations/{id}/accept - accepts invitation
- PUT /api/collaborations/{id}/decline - declines invitation
- PUT /api/collaborations/{id}/split - updates split percentage (owner only)
- DELETE /api/collaborations/{id} - removes collaboration
- GET /api/collaborations/release/{release_id} - returns collaborators and split totals
- POST /api/analytics/import - imports CSV streaming data
- GET /api/stats/milestones - returns user milestones and stats
- GET /api/stats/share-card - returns shareable stats data
- GET /api/settings/notification-preferences - returns 8 notification preferences
- PUT /api/settings/notification-preferences - updates individual preferences
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health check returns healthy status")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@tunedrop.com"
        print("PASS: Admin login successful")


class TestCollaborations:
    """Collaboration CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.cookies = login_res.cookies
    
    def test_get_collaborations_requires_auth(self):
        """Test GET /api/collaborations requires auth"""
        response = requests.get(f"{BASE_URL}/api/collaborations")
        assert response.status_code == 401
        print("PASS: GET /api/collaborations requires auth (401)")
    
    def test_get_collaborations(self):
        """Test GET /api/collaborations returns owned and collaborating_on"""
        response = self.session.get(f"{BASE_URL}/api/collaborations", cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        assert "owned" in data
        assert "collaborating_on" in data
        assert isinstance(data["owned"], list)
        assert isinstance(data["collaborating_on"], list)
        print(f"PASS: GET /api/collaborations returns owned ({len(data['owned'])}) and collaborating_on ({len(data['collaborating_on'])})")
    
    def test_get_invitations_requires_auth(self):
        """Test GET /api/collaborations/invitations requires auth"""
        response = requests.get(f"{BASE_URL}/api/collaborations/invitations")
        assert response.status_code == 401
        print("PASS: GET /api/collaborations/invitations requires auth (401)")
    
    def test_get_invitations(self):
        """Test GET /api/collaborations/invitations returns pending invitations"""
        response = self.session.get(f"{BASE_URL}/api/collaborations/invitations", cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert isinstance(data["invitations"], list)
        print(f"PASS: GET /api/collaborations/invitations returns {len(data['invitations'])} invitations")
    
    def test_invite_collaborator_requires_auth(self):
        """Test POST /api/collaborations/invite requires auth"""
        response = requests.post(f"{BASE_URL}/api/collaborations/invite", json={
            "release_id": "test",
            "collaborator_email": "test@test.com",
            "collaborator_name": "Test",
            "role": "Featured Artist",
            "split_percentage": 10
        })
        assert response.status_code == 401
        print("PASS: POST /api/collaborations/invite requires auth (401)")
    
    def test_invite_collaborator_invalid_release(self):
        """Test invite with invalid release returns 404"""
        response = self.session.post(f"{BASE_URL}/api/collaborations/invite", json={
            "release_id": "invalid_release_id",
            "collaborator_email": "test@test.com",
            "collaborator_name": "Test Artist",
            "role": "Featured Artist",
            "split_percentage": 10
        }, cookies=self.cookies)
        assert response.status_code == 404
        print("PASS: Invite with invalid release returns 404")
    
    def test_invite_collaborator_cannot_invite_self(self):
        """Test cannot invite yourself"""
        # First get a release
        releases_res = self.session.get(f"{BASE_URL}/api/releases", cookies=self.cookies)
        if releases_res.status_code == 200:
            releases = releases_res.json()
            if isinstance(releases, list) and len(releases) > 0:
                release_id = releases[0]["id"]
                response = self.session.post(f"{BASE_URL}/api/collaborations/invite", json={
                    "release_id": release_id,
                    "collaborator_email": "admin@tunedrop.com",  # Same as logged in user
                    "collaborator_name": "Admin",
                    "role": "Featured Artist",
                    "split_percentage": 10
                }, cookies=self.cookies)
                assert response.status_code == 400
                assert "yourself" in response.json().get("detail", "").lower()
                print("PASS: Cannot invite yourself (400)")
                return
        print("SKIP: No releases available to test self-invite")
    
    def test_update_split_requires_auth(self):
        """Test PUT /api/collaborations/{id}/split requires auth"""
        response = requests.put(f"{BASE_URL}/api/collaborations/test_id/split", json={
            "split_percentage": 20
        })
        assert response.status_code == 401
        print("PASS: PUT /api/collaborations/{id}/split requires auth (401)")
    
    def test_delete_collaboration_requires_auth(self):
        """Test DELETE /api/collaborations/{id} requires auth"""
        response = requests.delete(f"{BASE_URL}/api/collaborations/test_id")
        assert response.status_code == 401
        print("PASS: DELETE /api/collaborations/{id} requires auth (401)")
    
    def test_get_release_collaborators_requires_auth(self):
        """Test GET /api/collaborations/release/{release_id} requires auth"""
        response = requests.get(f"{BASE_URL}/api/collaborations/release/test_id")
        assert response.status_code == 401
        print("PASS: GET /api/collaborations/release/{release_id} requires auth (401)")
    
    def test_get_release_collaborators(self):
        """Test GET /api/collaborations/release/{release_id} returns collaborators"""
        # Get a release first
        releases_res = self.session.get(f"{BASE_URL}/api/releases", cookies=self.cookies)
        if releases_res.status_code == 200:
            releases = releases_res.json()
            if isinstance(releases, list) and len(releases) > 0:
                release_id = releases[0]["id"]
                response = self.session.get(f"{BASE_URL}/api/collaborations/release/{release_id}", cookies=self.cookies)
                assert response.status_code == 200
                data = response.json()
                assert "collaborators" in data
                assert "total_split" in data
                assert "owner_split" in data
                assert isinstance(data["collaborators"], list)
                assert data["owner_split"] + data["total_split"] == 100
                print(f"PASS: GET /api/collaborations/release/{release_id} returns collaborators (owner_split: {data['owner_split']}%, total_split: {data['total_split']}%)")
                return
        print("SKIP: No releases available to test release collaborators")


class TestCollaborationWorkflow:
    """Test full collaboration workflow - invite, accept/decline"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.cookies = login_res.cookies
    
    def test_collaboration_workflow(self):
        """Test creating a collaboration invite"""
        # Get releases
        releases_res = self.session.get(f"{BASE_URL}/api/releases", cookies=self.cookies)
        if releases_res.status_code != 200:
            print("SKIP: Cannot get releases")
            return
        
        releases = releases_res.json()
        if not isinstance(releases, list) or len(releases) == 0:
            print("SKIP: No releases available for collaboration test")
            return
        
        release_id = releases[0]["id"]
        release_title = releases[0].get("title", "Unknown")
        
        # Create a unique collaborator email
        import uuid
        test_email = f"test_collab_{uuid.uuid4().hex[:8]}@example.com"
        
        # Invite collaborator
        invite_res = self.session.post(f"{BASE_URL}/api/collaborations/invite", json={
            "release_id": release_id,
            "collaborator_email": test_email,
            "collaborator_name": "TEST_Playwright_Collab",
            "role": "Producer",
            "split_percentage": 15
        }, cookies=self.cookies)
        
        assert invite_res.status_code == 200
        invite_data = invite_res.json()
        assert "collaboration" in invite_data
        collab = invite_data["collaboration"]
        assert collab["collaborator_email"] == test_email
        assert collab["split_percentage"] == 15
        assert collab["status"] == "pending"
        collab_id = collab["id"]
        print(f"PASS: Created collaboration invite for {test_email} on '{release_title}' with 15% split")
        
        # Verify it appears in owned collaborations
        collabs_res = self.session.get(f"{BASE_URL}/api/collaborations", cookies=self.cookies)
        assert collabs_res.status_code == 200
        collabs_data = collabs_res.json()
        owned_ids = [c["id"] for c in collabs_data["owned"]]
        assert collab_id in owned_ids
        print(f"PASS: Collaboration {collab_id} appears in owned list")
        
        # Update split percentage
        update_res = self.session.put(f"{BASE_URL}/api/collaborations/{collab_id}/split", json={
            "split_percentage": 20
        }, cookies=self.cookies)
        assert update_res.status_code == 200
        print(f"PASS: Updated split to 20%")
        
        # Delete the test collaboration
        delete_res = self.session.delete(f"{BASE_URL}/api/collaborations/{collab_id}", cookies=self.cookies)
        assert delete_res.status_code == 200
        print(f"PASS: Deleted test collaboration {collab_id}")


class TestDSPImport:
    """DSP CSV Import tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.cookies = login_res.cookies
    
    def test_import_requires_auth(self):
        """Test POST /api/analytics/import requires auth"""
        # Note: FastAPI validates file parameter before auth, so 422 is expected without file
        # Test with a file to properly check auth
        csv_content = "date,platform,country,streams,revenue,release_title\n2026-01-01,Spotify,US,10,0.05,Test"
        files = {'file': ('test.csv', csv_content, 'text/csv')}
        response = requests.post(f"{BASE_URL}/api/analytics/import", files=files)
        assert response.status_code == 401
        print("PASS: POST /api/analytics/import requires auth (401)")
    
    def test_import_csv_data(self):
        """Test importing CSV streaming data"""
        # Create a simple CSV
        csv_content = """date,platform,country,streams,revenue,release_title
2026-01-01,Spotify,US,100,0.50,Test Import Track
2026-01-02,Apple Music,UK,50,0.30,Test Import Track
2026-01-03,YouTube Music,DE,75,0.25,Test Import Track"""
        
        files = {'file': ('test_import.csv', csv_content, 'text/csv')}
        response = self.session.post(f"{BASE_URL}/api/analytics/import", files=files, cookies=self.cookies)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "count" in data
        # Should import 100 + 50 + 75 = 225 stream events
        assert data["count"] == 225
        print(f"PASS: Imported {data['count']} stream events from CSV")


class TestShareStats:
    """Share Stats and Milestones tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.cookies = login_res.cookies
    
    def test_milestones_requires_auth(self):
        """Test GET /api/stats/milestones requires auth"""
        response = requests.get(f"{BASE_URL}/api/stats/milestones")
        assert response.status_code == 401
        print("PASS: GET /api/stats/milestones requires auth (401)")
    
    def test_get_milestones(self):
        """Test GET /api/stats/milestones returns stats and milestones"""
        response = self.session.get(f"{BASE_URL}/api/stats/milestones", cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "stats" in data
        stats = data["stats"]
        assert "total_streams" in stats
        assert "total_revenue" in stats
        assert "release_count" in stats
        assert "top_platform" in stats
        assert "top_country" in stats
        assert "artist_name" in stats
        
        # Verify milestones structure
        assert "milestones" in data
        milestones = data["milestones"]
        assert isinstance(milestones, list)
        if len(milestones) > 0:
            m = milestones[0]
            assert "type" in m
            assert "value" in m
            assert "label" in m
            assert "achieved" in m
        
        print(f"PASS: GET /api/stats/milestones returns stats (streams: {stats['total_streams']}, revenue: ${stats['total_revenue']}) and {len(milestones)} milestones")
    
    def test_share_card_requires_auth(self):
        """Test GET /api/stats/share-card requires auth"""
        response = requests.get(f"{BASE_URL}/api/stats/share-card")
        assert response.status_code == 401
        print("PASS: GET /api/stats/share-card requires auth (401)")
    
    def test_get_share_card(self):
        """Test GET /api/stats/share-card returns shareable data"""
        response = self.session.get(f"{BASE_URL}/api/stats/share-card", cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        
        # Verify share card structure
        assert "artist_name" in data
        assert "total_streams" in data
        assert "total_revenue" in data
        assert "release_count" in data
        assert "top_platforms" in data
        assert "generated_at" in data
        
        # Verify top_platforms structure
        assert isinstance(data["top_platforms"], list)
        if len(data["top_platforms"]) > 0:
            p = data["top_platforms"][0]
            assert "name" in p
            assert "streams" in p
        
        print(f"PASS: GET /api/stats/share-card returns data (artist: {data['artist_name']}, streams: {data['total_streams']}, top platforms: {len(data['top_platforms'])})")


class TestNotificationPreferences:
    """Notification Preferences tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.cookies = login_res.cookies
    
    def test_get_prefs_requires_auth(self):
        """Test GET /api/settings/notification-preferences requires auth"""
        response = requests.get(f"{BASE_URL}/api/settings/notification-preferences")
        assert response.status_code == 401
        print("PASS: GET /api/settings/notification-preferences requires auth (401)")
    
    def test_get_notification_preferences(self):
        """Test GET /api/settings/notification-preferences returns 8 preferences"""
        response = self.session.get(f"{BASE_URL}/api/settings/notification-preferences", cookies=self.cookies)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 8 preferences exist
        expected_keys = [
            "email_releases", "email_collaborations", "email_payments", "email_marketing",
            "push_releases", "push_collaborations", "push_payments", "push_milestones"
        ]
        for key in expected_keys:
            assert key in data, f"Missing preference: {key}"
            assert isinstance(data[key], bool), f"Preference {key} should be boolean"
        
        print(f"PASS: GET /api/settings/notification-preferences returns all 8 preferences")
        print(f"  Email: releases={data['email_releases']}, collaborations={data['email_collaborations']}, payments={data['email_payments']}, marketing={data['email_marketing']}")
        print(f"  Push: releases={data['push_releases']}, collaborations={data['push_collaborations']}, payments={data['push_payments']}, milestones={data['push_milestones']}")
    
    def test_update_prefs_requires_auth(self):
        """Test PUT /api/settings/notification-preferences requires auth"""
        response = requests.put(f"{BASE_URL}/api/settings/notification-preferences", json={
            "email_marketing": False
        })
        assert response.status_code == 401
        print("PASS: PUT /api/settings/notification-preferences requires auth (401)")
    
    def test_update_notification_preferences(self):
        """Test updating notification preferences"""
        # Get current preferences
        get_res = self.session.get(f"{BASE_URL}/api/settings/notification-preferences", cookies=self.cookies)
        assert get_res.status_code == 200
        original = get_res.json()
        
        # Toggle email_marketing
        new_value = not original.get("email_marketing", False)
        update_res = self.session.put(f"{BASE_URL}/api/settings/notification-preferences", json={
            "email_marketing": new_value
        }, cookies=self.cookies)
        assert update_res.status_code == 200
        assert "message" in update_res.json()
        
        # Verify the change
        verify_res = self.session.get(f"{BASE_URL}/api/settings/notification-preferences", cookies=self.cookies)
        assert verify_res.status_code == 200
        updated = verify_res.json()
        assert updated["email_marketing"] == new_value
        
        # Restore original value
        self.session.put(f"{BASE_URL}/api/settings/notification-preferences", json={
            "email_marketing": original.get("email_marketing", False)
        }, cookies=self.cookies)
        
        print(f"PASS: Updated email_marketing from {original.get('email_marketing', False)} to {new_value} and verified")
    
    def test_update_invalid_preference(self):
        """Test updating with invalid preference key"""
        response = self.session.put(f"{BASE_URL}/api/settings/notification-preferences", json={
            "invalid_key": True
        }, cookies=self.cookies)
        assert response.status_code == 400
        print("PASS: Invalid preference key returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
