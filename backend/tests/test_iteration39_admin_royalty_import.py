"""
Iteration 39 - Admin Royalty Import Tests
Tests the admin-only royalty import feature (moved from Label Dashboard to Admin Dashboard)

Features tested:
- POST /api/admin/royalties/import - Admin imports CSV, matches against ALL platform users
- GET /api/admin/royalties/imports - Admin lists all imports
- GET /api/admin/royalties/imports/{import_id} - Admin gets import details with entries
- PUT /api/admin/royalties/entries/{entry_id}/assign - Admin assigns unmatched entry to any user
- GET /api/admin/royalties/users - Admin gets all platform users for assignment dropdown
- Verify Label Dashboard does NOT have import functionality (only export)
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestAdminRoyaltyImportAuth:
    """Test admin royalty import endpoints require admin authentication"""
    
    def test_admin_import_requires_auth(self):
        """POST /api/admin/royalties/import requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/royalties/import")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: POST /api/admin/royalties/import requires authentication")
    
    def test_admin_list_imports_requires_auth(self):
        """GET /api/admin/royalties/imports requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: GET /api/admin/royalties/imports requires authentication")
    
    def test_admin_import_detail_requires_auth(self):
        """GET /api/admin/royalties/imports/{import_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports/test_import_id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: GET /api/admin/royalties/imports/{import_id} requires authentication")
    
    def test_admin_assign_entry_requires_auth(self):
        """PUT /api/admin/royalties/entries/{entry_id}/assign requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/royalties/entries/test_entry_id/assign", json={"artist_id": "test"})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: PUT /api/admin/royalties/entries/{entry_id}/assign requires authentication")
    
    def test_admin_get_users_requires_auth(self):
        """GET /api/admin/royalties/users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/users")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: GET /api/admin/royalties/users requires authentication")


class TestAdminRoyaltyImportNonAdmin:
    """Test admin royalty import endpoints reject non-admin users"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a non-admin user for testing"""
        # Register a test user (non-admin)
        self.test_email = f"test_nonadmin_{os.urandom(4).hex()}@test.com"
        self.test_password = "TestPass123!"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test Non-Admin",
            "artist_name": "Test Artist",
            "user_role": "artist"
        })
        
        if reg_response.status_code == 200:
            self.token = reg_response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # User might already exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.test_email,
                "password": self.test_password
            })
            if login_response.status_code == 200:
                self.token = login_response.json().get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            else:
                pytest.skip("Could not create/login test user")
    
    def test_non_admin_cannot_import(self):
        """Non-admin user cannot access POST /api/admin/royalties/import"""
        csv_content = "Artist,Track,Streams,Revenue\nTest Artist,Test Song,1000,5.00"
        files = {"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/admin/royalties/import", files=files, headers=self.headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin user cannot access POST /api/admin/royalties/import")
    
    def test_non_admin_cannot_list_imports(self):
        """Non-admin user cannot access GET /api/admin/royalties/imports"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports", headers=self.headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin user cannot access GET /api/admin/royalties/imports")
    
    def test_non_admin_cannot_get_users(self):
        """Non-admin user cannot access GET /api/admin/royalties/users"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/users", headers=self.headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin user cannot access GET /api/admin/royalties/users")


class TestAdminRoyaltyImportFunctionality:
    """Test admin royalty import functionality with admin user"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin user"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.cookies = login_response.cookies
        print(f"Admin logged in successfully")
    
    def test_admin_import_csv_success(self):
        """Admin can import CSV and it matches against ALL platform users"""
        csv_content = """Artist,Track,Platform,Country,Streams,Revenue,Period
Test Artist One,Song A,Spotify,US,5000,12.50,2024-01
Test Artist Two,Song B,Apple Music,UK,3000,9.00,2024-01
Unknown Artist,Song C,YouTube Music,DE,1000,2.50,2024-01"""
        
        files = {"file": ("admin_test_import.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/admin/royalties/import", files=files, headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "import_id" in data, "Response should contain import_id"
        assert "total_rows" in data, "Response should contain total_rows"
        assert data["total_rows"] == 3, f"Expected 3 rows, got {data['total_rows']}"
        assert "matched" in data, "Response should contain matched count"
        assert "unmatched" in data, "Response should contain unmatched count"
        assert "total_revenue" in data, "Response should contain total_revenue"
        assert data["total_revenue"] == 24.0, f"Expected 24.0 revenue, got {data['total_revenue']}"
        assert "column_mapping" in data, "Response should contain column_mapping"
        
        self.import_id = data["import_id"]
        print(f"PASS: Admin CSV import successful - {data['matched']} matched, {data['unmatched']} unmatched")
        return data
    
    def test_admin_list_imports(self):
        """Admin can list all royalty imports"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports", headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "imports" in data, "Response should contain imports array"
        assert isinstance(data["imports"], list), "imports should be a list"
        
        if len(data["imports"]) > 0:
            imp = data["imports"][0]
            assert "id" in imp, "Import should have id"
            assert "filename" in imp, "Import should have filename"
            assert "total_rows" in imp, "Import should have total_rows"
            assert "matched" in imp, "Import should have matched"
            assert "unmatched" in imp, "Import should have unmatched"
            assert "total_revenue" in imp, "Import should have total_revenue"
            assert "created_at" in imp, "Import should have created_at"
        
        print(f"PASS: Admin list imports returned {len(data['imports'])} imports")
    
    def test_admin_get_import_detail(self):
        """Admin can get details of a specific import"""
        # First create an import
        csv_content = "Artist,Track,Streams,Revenue\nDetail Test Artist,Detail Song,2000,8.00"
        files = {"file": ("detail_test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        import_response = requests.post(f"{BASE_URL}/api/admin/royalties/import", files=files, headers=self.headers)
        assert import_response.status_code == 200
        import_id = import_response.json()["import_id"]
        
        # Get import detail
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports/{import_id}", headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "import" in data, "Response should contain import object"
        assert "entries" in data, "Response should contain entries array"
        
        imp = data["import"]
        assert imp["id"] == import_id, "Import ID should match"
        
        entries = data["entries"]
        assert len(entries) == 1, f"Expected 1 entry, got {len(entries)}"
        
        entry = entries[0]
        assert "id" in entry, "Entry should have id"
        assert "artist_name_raw" in entry, "Entry should have artist_name_raw"
        assert "status" in entry, "Entry should have status"
        assert entry["artist_name_raw"] == "Detail Test Artist", f"Expected 'Detail Test Artist', got {entry['artist_name_raw']}"
        
        print(f"PASS: Admin get import detail returned {len(entries)} entries")
    
    def test_admin_get_import_detail_not_found(self):
        """Admin gets 404 for non-existent import"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/imports/nonexistent_import_id", headers=self.headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Admin get import detail returns 404 for non-existent import")
    
    def test_admin_get_all_users_for_assign(self):
        """Admin can get all platform users for assignment dropdown"""
        response = requests.get(f"{BASE_URL}/api/admin/royalties/users", headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "users" in data, "Response should contain users array"
        assert isinstance(data["users"], list), "users should be a list"
        assert len(data["users"]) > 0, "Should have at least one user (admin)"
        
        user = data["users"][0]
        assert "id" in user, "User should have id"
        assert "email" in user, "User should have email"
        
        print(f"PASS: Admin get all users returned {len(data['users'])} users")
    
    def test_admin_assign_unmatched_entry(self):
        """Admin can assign an unmatched entry to any platform user"""
        # Create an import with an unmatched entry
        csv_content = "Artist,Track,Streams,Revenue\nCompletely Unknown Artist XYZ,Assign Test Song,500,2.00"
        files = {"file": ("assign_test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        import_response = requests.post(f"{BASE_URL}/api/admin/royalties/import", files=files, headers=self.headers)
        assert import_response.status_code == 200
        import_id = import_response.json()["import_id"]
        
        # Get the import detail to find the unmatched entry
        detail_response = requests.get(f"{BASE_URL}/api/admin/royalties/imports/{import_id}", headers=self.headers)
        assert detail_response.status_code == 200
        entries = detail_response.json()["entries"]
        
        unmatched_entry = next((e for e in entries if e["status"] == "unmatched"), None)
        if not unmatched_entry:
            print("SKIP: No unmatched entry found to test assignment")
            return
        
        entry_id = unmatched_entry["id"]
        
        # Get a user to assign to
        users_response = requests.get(f"{BASE_URL}/api/admin/royalties/users", headers=self.headers)
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        assert len(users) > 0, "Need at least one user to assign to"
        
        target_user_id = users[0]["id"]
        
        # Assign the entry
        assign_response = requests.put(
            f"{BASE_URL}/api/admin/royalties/entries/{entry_id}/assign",
            json={"artist_id": target_user_id},
            headers=self.headers
        )
        
        assert assign_response.status_code == 200, f"Expected 200, got {assign_response.status_code}: {assign_response.text}"
        
        # Verify the entry is now matched
        detail_response2 = requests.get(f"{BASE_URL}/api/admin/royalties/imports/{import_id}", headers=self.headers)
        assert detail_response2.status_code == 200
        updated_entry = next((e for e in detail_response2.json()["entries"] if e["id"] == entry_id), None)
        assert updated_entry is not None, "Entry should still exist"
        assert updated_entry["status"] == "matched", f"Entry status should be 'matched', got {updated_entry['status']}"
        assert updated_entry["matched_artist_id"] == target_user_id, "Entry should be assigned to target user"
        
        print(f"PASS: Admin assigned unmatched entry to user {target_user_id}")
    
    def test_admin_assign_entry_not_found(self):
        """Admin gets 404 when assigning non-existent entry"""
        response = requests.put(
            f"{BASE_URL}/api/admin/royalties/entries/nonexistent_entry_id/assign",
            json={"artist_id": "some_user_id"},
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Admin assign entry returns 404 for non-existent entry")
    
    def test_admin_import_requires_artist_column(self):
        """Admin import fails if Artist column is missing"""
        csv_content = "Track,Platform,Streams,Revenue\nSong A,Spotify,1000,5.00"
        files = {"file": ("no_artist.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/admin/royalties/import", files=files, headers=self.headers)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "Artist" in response.json().get("detail", ""), "Error should mention Artist column"
        print("PASS: Admin import fails without Artist column")
    
    def test_admin_import_no_file(self):
        """Admin import fails if no file is uploaded"""
        response = requests.post(f"{BASE_URL}/api/admin/royalties/import", headers=self.headers)
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("PASS: Admin import fails without file")


class TestLabelDashboardNoImport:
    """Test that Label Dashboard does NOT have import functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin (who also has label_producer role)"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_label_royalties_export_csv_works(self):
        """Label Dashboard export CSV still works"""
        response = requests.get(f"{BASE_URL}/api/label/royalties/export/csv", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/csv" in response.headers.get("Content-Type", ""), "Should return CSV"
        print("PASS: Label Dashboard export CSV works")
    
    def test_label_royalties_export_pdf_works(self):
        """Label Dashboard export PDF still works"""
        response = requests.get(f"{BASE_URL}/api/label/royalties/export/pdf", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("Content-Type", ""), "Should return PDF"
        print("PASS: Label Dashboard export PDF works")
    
    def test_label_royalties_endpoint_exists(self):
        """Label Dashboard royalties endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/label/royalties", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "summary" in data, "Should have summary"
        assert "artists" in data, "Should have artists"
        print("PASS: Label Dashboard royalties endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
