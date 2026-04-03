"""
Iteration 38 - Payout Reports Export & Royalty Import System Tests
Tests for:
1. Export CSV (GET /api/label/royalties/export/csv)
2. Export PDF (GET /api/label/royalties/export/pdf)
3. Import CSV (POST /api/label/royalties/import)
4. List imports (GET /api/label/royalties/imports)
5. Import detail (GET /api/label/royalties/imports/{import_id})
6. Assign unmatched entry (PUT /api/label/royalties/entries/{entry_id}/assign)
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestPayoutExportImport:
    """Tests for Payout Export and Royalty Import endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        # Login
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.user = login_res.json().get("user", {})
        yield
        # Cleanup
        self.session.close()
    
    # ============= EXPORT CSV TESTS =============
    def test_export_csv_returns_200(self):
        """GET /api/label/royalties/export/csv returns 200"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print("✓ Export CSV returns 200")
    
    def test_export_csv_content_type(self):
        """GET /api/label/royalties/export/csv returns CSV content type"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert res.status_code == 200
        content_type = res.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        print("✓ Export CSV has correct content type")
    
    def test_export_csv_has_content_disposition(self):
        """GET /api/label/royalties/export/csv has Content-Disposition header"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert res.status_code == 200
        content_disp = res.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment, got {content_disp}"
        assert '.csv' in content_disp, f"Expected .csv in filename, got {content_disp}"
        print("✓ Export CSV has Content-Disposition header with .csv filename")
    
    def test_export_csv_has_headers(self):
        """GET /api/label/royalties/export/csv has expected column headers"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert res.status_code == 200
        content = res.text
        # Check for expected headers
        expected_headers = ["Artist", "Platform", "Country", "Streams", "Gross Revenue", "Artist %", "Artist Earnings", "Label %", "Label Earnings", "Period"]
        first_line = content.split('\n')[0]
        for header in expected_headers:
            assert header in first_line, f"Missing header: {header}"
        print(f"✓ Export CSV has all expected headers: {expected_headers}")
    
    def test_export_csv_requires_auth(self):
        """GET /api/label/royalties/export/csv requires authentication"""
        new_session = requests.Session()
        res = new_session.get(f"{BASE_URL}/api/label/royalties/export/csv")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Export CSV requires authentication")
    
    # ============= EXPORT PDF TESTS =============
    def test_export_pdf_returns_200(self):
        """GET /api/label/royalties/export/pdf returns 200"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print("✓ Export PDF returns 200")
    
    def test_export_pdf_content_type(self):
        """GET /api/label/royalties/export/pdf returns PDF content type"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert res.status_code == 200
        content_type = res.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        print("✓ Export PDF has correct content type")
    
    def test_export_pdf_has_content_disposition(self):
        """GET /api/label/royalties/export/pdf has Content-Disposition header"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert res.status_code == 200
        content_disp = res.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment, got {content_disp}"
        assert '.pdf' in content_disp, f"Expected .pdf in filename, got {content_disp}"
        print("✓ Export PDF has Content-Disposition header with .pdf filename")
    
    def test_export_pdf_has_content(self):
        """GET /api/label/royalties/export/pdf returns non-empty PDF"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert res.status_code == 200
        # PDF files start with %PDF
        assert res.content[:4] == b'%PDF', "Response is not a valid PDF"
        assert len(res.content) > 100, "PDF content is too small"
        print(f"✓ Export PDF returns valid PDF ({len(res.content)} bytes)")
    
    def test_export_pdf_requires_auth(self):
        """GET /api/label/royalties/export/pdf requires authentication"""
        new_session = requests.Session()
        res = new_session.get(f"{BASE_URL}/api/label/royalties/export/pdf")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Export PDF requires authentication")
    
    # ============= IMPORT CSV TESTS =============
    def test_import_csv_returns_200(self):
        """POST /api/label/royalties/import returns 200 with valid CSV"""
        csv_content = "Artist,Track,Platform,Country,Streams,Revenue,Period\nTest Artist,Test Song,Spotify,US,1000,4.50,2024-01"
        files = {'file': ('test_import.csv', csv_content, 'text/csv')}
        res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert 'import_id' in data, "Response missing import_id"
        assert 'total_rows' in data, "Response missing total_rows"
        assert 'matched' in data, "Response missing matched"
        assert 'unmatched' in data, "Response missing unmatched"
        print(f"✓ Import CSV returns 200 with import_id: {data['import_id']}")
        return data['import_id']
    
    def test_import_csv_parses_correctly(self):
        """POST /api/label/royalties/import parses CSV data correctly"""
        csv_content = """Artist,Track,Platform,Country,Streams,Revenue,Period
Artist One,Song A,Spotify,US,5000,12.50,2024-01
Artist Two,Song B,Apple Music,UK,3000,8.25,2024-01
Artist Three,Song C,YouTube,DE,2000,5.00,2024-01"""
        files = {'file': ('multi_row.csv', csv_content, 'text/csv')}
        res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert res.status_code == 200
        data = res.json()
        assert data['total_rows'] == 3, f"Expected 3 rows, got {data['total_rows']}"
        assert data['total_revenue'] == 25.75, f"Expected 25.75 revenue, got {data['total_revenue']}"
        print(f"✓ Import CSV parses 3 rows with total revenue $25.75")
    
    def test_import_csv_detects_columns(self):
        """POST /api/label/royalties/import auto-detects column mapping"""
        csv_content = "Artist Name,Song Title,Store,Territory,Plays,Earnings,Month\nTest,Test,Spotify,US,100,1.00,2024-01"
        files = {'file': ('alt_headers.csv', csv_content, 'text/csv')}
        res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert res.status_code == 200
        data = res.json()
        assert 'column_mapping' in data, "Response missing column_mapping"
        mapping = data['column_mapping']
        assert 'artist' in mapping, "Column mapping missing artist"
        print(f"✓ Import CSV auto-detects columns: {mapping}")
    
    def test_import_csv_requires_artist_column(self):
        """POST /api/label/royalties/import requires Artist column"""
        csv_content = "Track,Platform,Revenue\nSong,Spotify,1.00"
        files = {'file': ('no_artist.csv', csv_content, 'text/csv')}
        res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"
        assert "Artist" in res.json().get('detail', ''), "Error should mention Artist column"
        print("✓ Import CSV returns 400 when Artist column is missing")
    
    def test_import_csv_requires_file(self):
        """POST /api/label/royalties/import requires file upload"""
        res = self.session.post(f"{BASE_URL}/api/label/royalties/import")
        assert res.status_code in [400, 422], f"Expected 400/422, got {res.status_code}"
        print("✓ Import CSV returns error when no file uploaded")
    
    def test_import_csv_requires_auth(self):
        """POST /api/label/royalties/import requires authentication"""
        new_session = requests.Session()
        csv_content = "Artist,Track,Revenue\nTest,Test,1.00"
        files = {'file': ('test.csv', csv_content, 'text/csv')}
        res = new_session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Import CSV requires authentication")
    
    # ============= LIST IMPORTS TESTS =============
    def test_list_imports_returns_200(self):
        """GET /api/label/royalties/imports returns 200"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/imports")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert 'imports' in data, "Response missing imports array"
        assert isinstance(data['imports'], list), "imports should be a list"
        print(f"✓ List imports returns 200 with {len(data['imports'])} imports")
    
    def test_list_imports_has_expected_fields(self):
        """GET /api/label/royalties/imports returns imports with expected fields"""
        # First create an import
        csv_content = "Artist,Track,Platform,Streams,Revenue,Period\nTest,Test,Spotify,100,1.00,2024-01"
        files = {'file': ('test_fields.csv', csv_content, 'text/csv')}
        self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        
        # Then list imports
        res = self.session.get(f"{BASE_URL}/api/label/royalties/imports")
        assert res.status_code == 200
        data = res.json()
        if data['imports']:
            imp = data['imports'][0]
            expected_fields = ['id', 'filename', 'total_rows', 'matched', 'unmatched', 'total_revenue', 'created_at']
            for field in expected_fields:
                assert field in imp, f"Import missing field: {field}"
            print(f"✓ Import has all expected fields: {expected_fields}")
        else:
            print("⚠ No imports found to verify fields")
    
    def test_list_imports_requires_auth(self):
        """GET /api/label/royalties/imports requires authentication"""
        new_session = requests.Session()
        res = new_session.get(f"{BASE_URL}/api/label/royalties/imports")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ List imports requires authentication")
    
    # ============= IMPORT DETAIL TESTS =============
    def test_import_detail_returns_200(self):
        """GET /api/label/royalties/imports/{import_id} returns 200"""
        # First create an import
        csv_content = "Artist,Track,Platform,Streams,Revenue,Period\nDetail Test,Song,Spotify,500,2.50,2024-02"
        files = {'file': ('detail_test.csv', csv_content, 'text/csv')}
        import_res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        assert import_res.status_code == 200
        import_id = import_res.json()['import_id']
        
        # Get detail
        res = self.session.get(f"{BASE_URL}/api/label/royalties/imports/{import_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert 'import' in data, "Response missing import object"
        assert 'entries' in data, "Response missing entries array"
        print(f"✓ Import detail returns 200 with {len(data['entries'])} entries")
    
    def test_import_detail_has_entries(self):
        """GET /api/label/royalties/imports/{import_id} returns entries with expected fields"""
        # Create import with multiple rows
        csv_content = """Artist,Track,Platform,Country,Streams,Revenue,Period
Entry Test A,Song 1,Spotify,US,1000,5.00,2024-03
Entry Test B,Song 2,Apple,UK,2000,8.00,2024-03"""
        files = {'file': ('entries_test.csv', csv_content, 'text/csv')}
        import_res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        import_id = import_res.json()['import_id']
        
        # Get detail
        res = self.session.get(f"{BASE_URL}/api/label/royalties/imports/{import_id}")
        data = res.json()
        assert len(data['entries']) == 2, f"Expected 2 entries, got {len(data['entries'])}"
        
        entry = data['entries'][0]
        expected_fields = ['id', 'artist_name_raw', 'track', 'platform', 'streams', 'revenue', 'status']
        for field in expected_fields:
            assert field in entry, f"Entry missing field: {field}"
        print(f"✓ Import detail entries have all expected fields")
    
    def test_import_detail_returns_404_for_invalid_id(self):
        """GET /api/label/royalties/imports/{import_id} returns 404 for invalid ID"""
        res = self.session.get(f"{BASE_URL}/api/label/royalties/imports/invalid_import_id_12345")
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("✓ Import detail returns 404 for invalid import ID")
    
    def test_import_detail_requires_auth(self):
        """GET /api/label/royalties/imports/{import_id} requires authentication"""
        new_session = requests.Session()
        res = new_session.get(f"{BASE_URL}/api/label/royalties/imports/any_id")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Import detail requires authentication")
    
    # ============= ASSIGN ENTRY TESTS =============
    def test_assign_entry_returns_200(self):
        """PUT /api/label/royalties/entries/{entry_id}/assign returns 200"""
        # First get roster to find an artist ID
        roster_res = self.session.get(f"{BASE_URL}/api/label/artists")
        roster = roster_res.json().get('artists', [])
        
        if not roster:
            pytest.skip("No artists in roster to assign to")
        
        artist_id = roster[0]['id']
        
        # Create import with unmatched entry
        csv_content = "Artist,Track,Platform,Streams,Revenue,Period\nUnknown Artist XYZ,Song,Spotify,100,1.00,2024-04"
        files = {'file': ('assign_test.csv', csv_content, 'text/csv')}
        import_res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        import_id = import_res.json()['import_id']
        
        # Get entries
        detail_res = self.session.get(f"{BASE_URL}/api/label/royalties/imports/{import_id}")
        entries = detail_res.json()['entries']
        unmatched = [e for e in entries if e['status'] == 'unmatched']
        
        if not unmatched:
            pytest.skip("No unmatched entries to assign")
        
        entry_id = unmatched[0]['id']
        
        # Assign entry
        res = self.session.put(f"{BASE_URL}/api/label/royalties/entries/{entry_id}/assign", json={
            "artist_id": artist_id
        })
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print(f"✓ Assign entry returns 200")
    
    def test_assign_entry_updates_status(self):
        """PUT /api/label/royalties/entries/{entry_id}/assign updates entry status to matched"""
        # Get roster
        roster_res = self.session.get(f"{BASE_URL}/api/label/artists")
        roster = roster_res.json().get('artists', [])
        
        if not roster:
            pytest.skip("No artists in roster")
        
        artist_id = roster[0]['id']
        
        # Create import
        csv_content = "Artist,Track,Platform,Streams,Revenue,Period\nAnother Unknown ABC,Song,Spotify,200,2.00,2024-05"
        files = {'file': ('status_test.csv', csv_content, 'text/csv')}
        import_res = self.session.post(f"{BASE_URL}/api/label/royalties/import", files=files)
        import_id = import_res.json()['import_id']
        
        # Get unmatched entry
        detail_res = self.session.get(f"{BASE_URL}/api/label/royalties/imports/{import_id}")
        entries = detail_res.json()['entries']
        unmatched = [e for e in entries if e['status'] == 'unmatched']
        
        if not unmatched:
            pytest.skip("No unmatched entries")
        
        entry_id = unmatched[0]['id']
        
        # Assign
        self.session.put(f"{BASE_URL}/api/label/royalties/entries/{entry_id}/assign", json={
            "artist_id": artist_id
        })
        
        # Verify status changed
        detail_res2 = self.session.get(f"{BASE_URL}/api/label/royalties/imports/{import_id}")
        updated_entry = next((e for e in detail_res2.json()['entries'] if e['id'] == entry_id), None)
        assert updated_entry is not None, "Entry not found after assignment"
        assert updated_entry['status'] == 'matched', f"Expected status 'matched', got '{updated_entry['status']}'"
        print("✓ Assign entry updates status to 'matched'")
    
    def test_assign_entry_returns_404_for_invalid_entry(self):
        """PUT /api/label/royalties/entries/{entry_id}/assign returns 404 for invalid entry"""
        res = self.session.put(f"{BASE_URL}/api/label/royalties/entries/invalid_entry_id/assign", json={
            "artist_id": "some_artist_id"
        })
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("✓ Assign entry returns 404 for invalid entry ID")
    
    def test_assign_entry_requires_auth(self):
        """PUT /api/label/royalties/entries/{entry_id}/assign requires authentication"""
        new_session = requests.Session()
        res = new_session.put(f"{BASE_URL}/api/label/royalties/entries/any_id/assign", json={
            "artist_id": "some_id"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Assign entry requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
