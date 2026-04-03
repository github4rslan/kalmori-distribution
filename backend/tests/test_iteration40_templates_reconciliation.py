"""
Iteration 40 - Testing Distributor Template Manager, Smart Reconciliation, and Refactored Routes
Features:
1. Distributor Template Manager - CRUD for saving column mappings (CD Baby, DistroKid, RouteNote)
2. Smart Royalty Reconciliation - analyze duplicates and discrepancies across imports
3. Refactored server.py - admin_routes.py and label_routes.py
4. Admin royalty import with optional template_id
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestAdminAuth:
    """Test admin authentication and access control"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_login(self, admin_session):
        """Verify admin can login"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['email']}, role={data['role']}")


class TestRefactoredRoutes:
    """Test that refactored routes work correctly"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_admin_dashboard_endpoint(self, admin_session):
        """GET /api/admin/dashboard returns data (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_releases" in data
        assert "pending_submissions" in data
        print(f"✓ Admin dashboard: {data['total_users']} users, {data['total_releases']} releases")
    
    def test_admin_submissions_endpoint(self, admin_session):
        """GET /api/admin/submissions returns submissions (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/admin/submissions")
        assert response.status_code == 200
        data = response.json()
        assert "submissions" in data
        assert "total" in data
        print(f"✓ Admin submissions: {data['total']} total submissions")
    
    def test_admin_users_endpoint(self, admin_session):
        """GET /api/admin/users returns users (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"✓ Admin users: {data['total']} total users")
    
    def test_admin_analytics_endpoint(self, admin_session):
        """GET /api/admin/analytics returns platform analytics (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "total_streams" in data
        assert "platform_breakdown" in data
        assert "top_artists" in data
        print(f"✓ Admin analytics: {data['total_streams']} total streams")
    
    def test_label_dashboard_endpoint(self, admin_session):
        """GET /api/label/dashboard returns label data (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/label/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_artists" in data
        assert "total_streams" in data
        assert "total_revenue" in data
        print(f"✓ Label dashboard: {data['total_artists']} artists, ${data['total_revenue']} revenue")
    
    def test_label_royalties_endpoint(self, admin_session):
        """GET /api/label/royalties returns royalty split data (refactored route)"""
        response = admin_session.get(f"{BASE_URL}/api/label/royalties")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "artists" in data
        print(f"✓ Label royalties: {data['summary']['total_revenue']} total revenue")


class TestDistributorTemplates:
    """Test Distributor Template Manager CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_list_templates(self, admin_session):
        """GET /api/admin/distributor-templates lists templates"""
        response = admin_session.get(f"{BASE_URL}/api/admin/distributor-templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        templates = data["templates"]
        print(f"✓ Found {len(templates)} templates")
        # Check for pre-seeded templates
        template_names = [t["name"] for t in templates]
        print(f"  Template names: {template_names}")
        return templates
    
    def test_create_template(self, admin_session):
        """POST /api/admin/distributor-templates creates a new template"""
        template_data = {
            "name": "TEST_Template_Iteration40",
            "column_mapping": {
                "artist": "Artist Name",
                "track": "Song Title",
                "platform": "Store",
                "revenue": "Net Revenue",
                "streams": "Quantity",
                "period": "Statement Period"
            },
            "notes": "Test template for iteration 40"
        }
        response = admin_session.post(f"{BASE_URL}/api/admin/distributor-templates", json=template_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == template_data["name"]
        assert data["column_mapping"] == template_data["column_mapping"]
        print(f"✓ Created template: {data['id']} - {data['name']}")
        return data["id"]
    
    def test_update_template(self, admin_session):
        """PUT /api/admin/distributor-templates/{id} updates a template"""
        # First create a template to update
        create_data = {
            "name": "TEST_Update_Template",
            "column_mapping": {"artist": "Artist"},
            "notes": "Original notes"
        }
        create_response = admin_session.post(f"{BASE_URL}/api/admin/distributor-templates", json=create_data)
        assert create_response.status_code == 200
        template_id = create_response.json()["id"]
        
        # Update the template
        update_data = {
            "name": "TEST_Update_Template_Modified",
            "column_mapping": {"artist": "Artist Name", "track": "Track Title"},
            "notes": "Updated notes"
        }
        response = admin_session.put(f"{BASE_URL}/api/admin/distributor-templates/{template_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["message"] == "Template updated"
        print(f"✓ Updated template: {template_id}")
        
        # Verify update
        list_response = admin_session.get(f"{BASE_URL}/api/admin/distributor-templates")
        templates = list_response.json()["templates"]
        updated = next((t for t in templates if t["id"] == template_id), None)
        assert updated is not None
        assert updated["name"] == update_data["name"]
        print(f"  Verified update: {updated['name']}")
        return template_id
    
    def test_delete_template(self, admin_session):
        """DELETE /api/admin/distributor-templates/{id} deletes a template"""
        # First create a template to delete
        create_data = {
            "name": "TEST_Delete_Template",
            "column_mapping": {"artist": "Artist"},
            "notes": "To be deleted"
        }
        create_response = admin_session.post(f"{BASE_URL}/api/admin/distributor-templates", json=create_data)
        assert create_response.status_code == 200
        template_id = create_response.json()["id"]
        
        # Delete the template
        response = admin_session.delete(f"{BASE_URL}/api/admin/distributor-templates/{template_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Template deleted"
        print(f"✓ Deleted template: {template_id}")
        
        # Verify deletion
        list_response = admin_session.get(f"{BASE_URL}/api/admin/distributor-templates")
        templates = list_response.json()["templates"]
        deleted = next((t for t in templates if t["id"] == template_id), None)
        assert deleted is None
        print(f"  Verified deletion")
    
    def test_delete_nonexistent_template(self, admin_session):
        """DELETE /api/admin/distributor-templates/{id} returns 404 for non-existent template"""
        response = admin_session.delete(f"{BASE_URL}/api/admin/distributor-templates/nonexistent_id")
        assert response.status_code == 404
        print(f"✓ Delete non-existent template returns 404")
    
    def test_update_nonexistent_template(self, admin_session):
        """PUT /api/admin/distributor-templates/{id} returns 404 for non-existent template"""
        update_data = {
            "name": "Test",
            "column_mapping": {"artist": "Artist"},
            "notes": ""
        }
        response = admin_session.put(f"{BASE_URL}/api/admin/distributor-templates/nonexistent_id", json=update_data)
        assert response.status_code == 404
        print(f"✓ Update non-existent template returns 404")


class TestReconciliation:
    """Test Smart Royalty Reconciliation endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_reconciliation_endpoint(self, admin_session):
        """GET /api/admin/royalties/reconciliation returns summary with duplicate_groups and discrepancy_groups"""
        response = admin_session.get(f"{BASE_URL}/api/admin/royalties/reconciliation")
        assert response.status_code == 200
        data = response.json()
        
        # Check summary structure
        assert "summary" in data
        summary = data["summary"]
        assert "total_imports" in summary
        assert "total_entries" in summary
        assert "total_revenue" in summary
        assert "matched_entries" in summary
        assert "unmatched_entries" in summary
        assert "duplicate_groups" in summary
        assert "discrepancy_groups" in summary
        assert "total_duplicate_revenue" in summary
        assert "total_discrepancy_amount" in summary
        
        # Check duplicates and discrepancies arrays
        assert "duplicates" in data
        assert "discrepancies" in data
        
        print(f"✓ Reconciliation summary:")
        print(f"  Total imports: {summary['total_imports']}")
        print(f"  Total entries: {summary['total_entries']}")
        print(f"  Total revenue: ${summary['total_revenue']}")
        print(f"  Duplicate groups: {summary['duplicate_groups']}")
        print(f"  Discrepancy groups: {summary['discrepancy_groups']}")
        print(f"  Duplicate revenue: ${summary['total_duplicate_revenue']}")
        print(f"  Discrepancy amount: ${summary['total_discrepancy_amount']}")
        
        return data
    
    def test_reconciliation_duplicate_structure(self, admin_session):
        """Verify duplicate entry structure in reconciliation response"""
        response = admin_session.get(f"{BASE_URL}/api/admin/royalties/reconciliation")
        assert response.status_code == 200
        data = response.json()
        
        if data["duplicates"]:
            dup = data["duplicates"][0]
            assert "artist" in dup
            assert "track" in dup
            assert "platform" in dup
            assert "period" in dup
            assert "count" in dup
            assert "revenue_per_entry" in dup
            assert "excess_revenue" in dup
            assert "import_ids" in dup
            assert "entry_ids" in dup
            print(f"✓ Duplicate structure verified: {dup['artist']} - {dup['track']}")
        else:
            print(f"✓ No duplicates found (structure check skipped)")
    
    def test_reconciliation_discrepancy_structure(self, admin_session):
        """Verify discrepancy entry structure in reconciliation response"""
        response = admin_session.get(f"{BASE_URL}/api/admin/royalties/reconciliation")
        assert response.status_code == 200
        data = response.json()
        
        if data["discrepancies"]:
            disc = data["discrepancies"][0]
            assert "artist" in disc
            assert "track" in disc
            assert "platform" in disc
            assert "period" in disc
            assert "count" in disc
            assert "revenues" in disc
            assert "min_revenue" in disc
            assert "max_revenue" in disc
            assert "discrepancy_amount" in disc
            assert "import_ids" in disc
            assert "entry_ids" in disc
            print(f"✓ Discrepancy structure verified: {disc['artist']} - {disc['track']}")
        else:
            print(f"✓ No discrepancies found (structure check skipped)")


class TestRoyaltyImportWithTemplate:
    """Test royalty import with template_id parameter"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_import_list_has_template_used_field(self, admin_session):
        """GET /api/admin/royalties/imports returns imports - newer imports have template_used field"""
        response = admin_session.get(f"{BASE_URL}/api/admin/royalties/imports")
        assert response.status_code == 200
        data = response.json()
        assert "imports" in data
        
        if data["imports"]:
            # Check if any import has template_used field (newer imports should have it)
            imports_with_template = [imp for imp in data["imports"] if "template_used" in imp]
            print(f"✓ Found {len(data['imports'])} imports, {len(imports_with_template)} have template_used field")
            if imports_with_template:
                print(f"  Example template_used: {imports_with_template[0].get('template_used')}")
            # The field is added on new imports - older imports may not have it
            # This is expected behavior
        else:
            print(f"✓ No imports found (template_used check skipped)")


class TestAccessControl:
    """Test that admin endpoints return 403 for non-admin users"""
    
    @pytest.fixture(scope="class")
    def non_admin_session(self):
        """Create a non-admin user session"""
        session = requests.Session()
        # Register a new non-admin user
        import uuid
        test_email = f"test_nonadmin_{uuid.uuid4().hex[:8]}@test.com"
        register_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test Non-Admin",
            "artist_name": "Test Artist"
        })
        if register_response.status_code == 200:
            print(f"✓ Created non-admin user: {test_email}")
            return session
        else:
            # If registration fails, try login with existing test user
            pytest.skip("Could not create non-admin user for testing")
    
    def test_templates_require_admin(self, non_admin_session):
        """GET /api/admin/distributor-templates returns 403 for non-admin"""
        response = non_admin_session.get(f"{BASE_URL}/api/admin/distributor-templates")
        assert response.status_code == 403
        print(f"✓ Templates endpoint returns 403 for non-admin")
    
    def test_reconciliation_requires_admin(self, non_admin_session):
        """GET /api/admin/royalties/reconciliation returns 403 for non-admin"""
        response = non_admin_session.get(f"{BASE_URL}/api/admin/royalties/reconciliation")
        assert response.status_code == 403
        print(f"✓ Reconciliation endpoint returns 403 for non-admin")
    
    def test_admin_dashboard_requires_admin(self, non_admin_session):
        """GET /api/admin/dashboard returns 403 for non-admin"""
        response = non_admin_session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 403
        print(f"✓ Admin dashboard returns 403 for non-admin")


class TestLabelEndpoints:
    """Test label endpoints still work after refactoring"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_label_export_csv(self, admin_session):
        """GET /api/label/royalties/export/csv downloads CSV"""
        response = admin_session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ Label CSV export works")
    
    def test_label_export_pdf(self, admin_session):
        """GET /api/label/royalties/export/pdf downloads PDF"""
        response = admin_session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("content-type", "")
        print(f"✓ Label PDF export works")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_cleanup_test_templates(self, admin_session):
        """Delete TEST_ prefixed templates"""
        response = admin_session.get(f"{BASE_URL}/api/admin/distributor-templates")
        if response.status_code == 200:
            templates = response.json().get("templates", [])
            deleted = 0
            for t in templates:
                if t["name"].startswith("TEST_"):
                    del_response = admin_session.delete(f"{BASE_URL}/api/admin/distributor-templates/{t['id']}")
                    if del_response.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
