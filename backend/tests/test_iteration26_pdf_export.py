"""
Iteration 26 - Test Strategy Export to PDF Feature
Tests the new POST /api/ai/strategies/export-pdf endpoint and regression tests for existing endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"

# Mock strategy data for PDF export testing
MOCK_STRATEGY = {
    "optimal_release_day": "Friday",
    "optimal_release_time": "00:00 UTC (midnight)",
    "release_day_reasoning": "Friday releases align with New Music Friday playlists on major platforms.",
    "target_platforms": [
        {"platform": "Spotify", "priority": "high", "tactic": "Submit to editorial playlists 2-3 weeks before release"},
        {"platform": "Apple Music", "priority": "high", "tactic": "Enable pre-add and submit for editorial consideration"},
        {"platform": "TikTok", "priority": "medium", "tactic": "Create short-form teaser content using catchy hooks"}
    ],
    "geographic_strategy": [
        {"region": "United States", "tactic": "Focus paid promotion during US peak hours (evening EST)"},
        {"region": "United Kingdom", "tactic": "Target UK listeners during morning commute hours"}
    ],
    "pre_release_timeline": [
        {"days_before": 28, "action": "Submit to Spotify editorial playlists"},
        {"days_before": 21, "action": "Announce release on social media with teaser content"},
        {"days_before": 14, "action": "Launch pre-save campaign"},
        {"days_before": 7, "action": "Release snippet/preview on TikTok and Instagram Reels"},
        {"days_before": 0, "action": "Release day — coordinate social posts across all platforms"}
    ],
    "promotion_tips": [
        "Engage with fans in comments and DMs during release week",
        "Create platform-specific content (Spotify Canvas, Apple Music Animated Art)",
        "Collaborate with playlist curators and music blogs in your genre"
    ],
    "estimated_first_week_range": "500-2,000 streams",
    "confidence_note": "Based on your streaming data and audience patterns."
}

MOCK_DATA_SUMMARY = {
    "total_streams": 15000,
    "top_platform": "Spotify",
    "top_country": "US",
    "peak_hour": 20,
    "release_count": 5,
    "presave_subscribers": 250
}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token by logging in"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestPDFExportAuthentication:
    """Test that PDF export endpoint requires authentication"""
    
    def test_export_pdf_requires_auth(self, api_client):
        """POST /api/ai/strategies/export-pdf should require authentication"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        
        response = api_client.post(f"{BASE_URL}/api/ai/strategies/export-pdf", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY
        })
        
        # Should return 401 or 422 without auth
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print(f"✓ PDF export requires authentication (status: {response.status_code})")


class TestPDFExportEndpoint:
    """Test the PDF export functionality"""
    
    def test_export_pdf_returns_valid_pdf(self, authenticated_client):
        """POST /api/ai/strategies/export-pdf should return a valid PDF file"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/export-pdf", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY,
            "release_title": "Test Release",
            "genre": "Hip-Hop",
            "label": "Q1 Strategy"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check Content-Type header
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
        print(f"✓ Content-Type is application/pdf")
        
        # Check Content-Disposition header
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, f"Expected attachment in Content-Disposition, got {content_disposition}"
        assert "Kalmori_Strategy_" in content_disposition, f"Expected Kalmori_Strategy_ in filename, got {content_disposition}"
        assert ".pdf" in content_disposition, f"Expected .pdf extension in filename, got {content_disposition}"
        print(f"✓ Content-Disposition header correct: {content_disposition}")
        
        # Check PDF content starts with %PDF
        pdf_content = response.content
        assert pdf_content[:4] == b'%PDF', f"PDF should start with %PDF, got {pdf_content[:10]}"
        print(f"✓ PDF content starts with %PDF signature")
        
        # Check PDF has reasonable size (at least 1KB)
        assert len(pdf_content) > 1000, f"PDF too small: {len(pdf_content)} bytes"
        print(f"✓ PDF size: {len(pdf_content)} bytes")
    
    def test_export_pdf_with_minimal_data(self, authenticated_client):
        """PDF export should work with minimal required data"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/export-pdf", json={
            "strategy": {
                "optimal_release_day": "Friday",
                "optimal_release_time": "00:00 UTC"
            },
            "data_summary": {}
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.content[:4] == b'%PDF', "PDF should start with %PDF"
        print(f"✓ PDF export works with minimal data")
    
    def test_export_pdf_filename_format(self, authenticated_client):
        """PDF filename should follow pattern: Kalmori_Strategy_{label}_{date}.pdf"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/export-pdf", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY,
            "label": "My Test Label"
        })
        
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        
        # Check filename contains label (sanitized)
        assert "My_Test_Label" in content_disposition or "My Test Label" in content_disposition, \
            f"Expected label in filename, got {content_disposition}"
        print(f"✓ Filename includes label: {content_disposition}")
    
    def test_export_pdf_with_release_title_as_label(self, authenticated_client):
        """When no label provided, release_title should be used in filename"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/export-pdf", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY,
            "release_title": "Summer Vibes EP",
            "label": None
        })
        
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        
        # Should use release_title when label is None
        assert "Summer" in content_disposition or "strategy" in content_disposition.lower(), \
            f"Expected release_title or 'strategy' in filename, got {content_disposition}"
        print(f"✓ Filename uses release_title when no label: {content_disposition}")


class TestRegressionExistingEndpoints:
    """Regression tests for existing AI strategy endpoints"""
    
    def test_release_strategy_still_works(self, authenticated_client):
        """POST /api/ai/release-strategy should still work"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/release-strategy", json={
            "release_title": "Regression Test",
            "genre": "Pop"
        }, timeout=30)  # AI call can take time
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "strategy" in data, "Response should contain 'strategy'"
        assert "data_summary" in data, "Response should contain 'data_summary'"
        print(f"✓ POST /api/ai/release-strategy works (regression)")
    
    def test_save_strategy_still_works(self, authenticated_client):
        """POST /api/ai/strategies/save should still work"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/save", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY,
            "release_title": "TEST_Regression Save",
            "genre": "Electronic",
            "label": "TEST_Regression Label"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "saved_strategy" in data, "Response should contain 'saved_strategy'"
        assert data["saved_strategy"]["label"] == "TEST_Regression Label"
        print(f"✓ POST /api/ai/strategies/save works (regression)")
        
        # Return the ID for cleanup
        return data["saved_strategy"]["id"]
    
    def test_get_strategies_still_works(self, authenticated_client):
        """GET /api/ai/strategies should still work"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai/strategies")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "strategies" in data, "Response should contain 'strategies'"
        assert "total" in data, "Response should contain 'total'"
        assert isinstance(data["strategies"], list), "strategies should be a list"
        print(f"✓ GET /api/ai/strategies works (regression) - {data['total']} strategies")
    
    def test_delete_strategy_still_works(self, authenticated_client):
        """DELETE /api/ai/strategies/{id} should still work"""
        # First create a strategy to delete
        save_response = authenticated_client.post(f"{BASE_URL}/api/ai/strategies/save", json={
            "strategy": MOCK_STRATEGY,
            "data_summary": MOCK_DATA_SUMMARY,
            "label": "TEST_To Delete"
        })
        
        assert save_response.status_code == 200
        strategy_id = save_response.json()["saved_strategy"]["id"]
        
        # Now delete it
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/ai/strategies/{strategy_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        print(f"✓ DELETE /api/ai/strategies/{strategy_id} works (regression)")
    
    def test_delete_nonexistent_returns_404(self, authenticated_client):
        """DELETE /api/ai/strategies/{id} should return 404 for non-existent strategy"""
        response = authenticated_client.delete(f"{BASE_URL}/api/ai/strategies/nonexistent_id_12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE non-existent strategy returns 404 (regression)")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_strategies(self, authenticated_client):
        """Clean up any TEST_ prefixed strategies"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai/strategies")
        
        if response.status_code == 200:
            strategies = response.json().get("strategies", [])
            deleted_count = 0
            for strat in strategies:
                if strat.get("label", "").startswith("TEST_") or strat.get("release_title", "").startswith("TEST_"):
                    del_response = authenticated_client.delete(f"{BASE_URL}/api/ai/strategies/{strat['id']}")
                    if del_response.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleaned up {deleted_count} test strategies")
