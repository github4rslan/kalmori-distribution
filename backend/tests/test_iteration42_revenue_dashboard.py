"""
Iteration 42 - Client Revenue Dashboard Tests
Tests the Revenue Analytics page with Kalmori Distribution integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRevenueAnalytics:
    """Revenue Analytics endpoint tests with Kalmori integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin user before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user = login_resp.json().get("user", {})
        yield
        self.session.close()
    
    def test_revenue_analytics_endpoint_returns_200(self):
        """Test that /api/analytics/revenue returns 200"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("PASS: Revenue analytics endpoint returns 200")
    
    def test_revenue_analytics_has_summary_section(self):
        """Test that response has summary section with required fields"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "summary" in data, "Missing 'summary' section"
        summary = data["summary"]
        
        required_fields = ["total_streams", "gross_revenue", "platform_fee", "net_revenue", 
                          "artist_take", "collab_payouts", "plan", "plan_cut_percent"]
        for field in required_fields:
            assert field in summary, f"Missing field '{field}' in summary"
        
        print(f"PASS: Summary section has all required fields: {list(summary.keys())}")
    
    def test_revenue_analytics_has_platforms_section(self):
        """Test that response has platforms array with correct structure"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "platforms" in data, "Missing 'platforms' section"
        assert isinstance(data["platforms"], list), "platforms should be a list"
        
        if len(data["platforms"]) > 0:
            platform = data["platforms"][0]
            required_fields = ["platform", "streams", "rate_per_stream", "gross_revenue", "net_revenue"]
            for field in required_fields:
                assert field in platform, f"Missing field '{field}' in platform entry"
        
        print(f"PASS: Platforms section has {len(data['platforms'])} platforms")
    
    def test_revenue_analytics_has_monthly_trend(self):
        """Test that response has monthly_trend array"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "monthly_trend" in data, "Missing 'monthly_trend' section"
        assert isinstance(data["monthly_trend"], list), "monthly_trend should be a list"
        assert len(data["monthly_trend"]) == 6, f"Expected 6 months, got {len(data['monthly_trend'])}"
        
        if len(data["monthly_trend"]) > 0:
            month = data["monthly_trend"][0]
            required_fields = ["month", "streams", "gross", "net"]
            for field in required_fields:
                assert field in month, f"Missing field '{field}' in monthly_trend entry"
        
        print(f"PASS: Monthly trend has {len(data['monthly_trend'])} months")
    
    def test_revenue_analytics_has_collaborator_splits(self):
        """Test that response has collaborator_splits array"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "collaborator_splits" in data, "Missing 'collaborator_splits' section"
        assert isinstance(data["collaborator_splits"], list), "collaborator_splits should be a list"
        
        print(f"PASS: Collaborator splits section present with {len(data['collaborator_splits'])} entries")
    
    def test_revenue_analytics_has_kalmori_section(self):
        """Test that response has kalmori section with required fields"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "kalmori" in data, "Missing 'kalmori' section"
        kalmori = data["kalmori"]
        
        required_fields = ["total_streams", "total_revenue", "your_take", "artist_split_pct",
                          "platforms", "monthly_trend", "entries_count"]
        for field in required_fields:
            assert field in kalmori, f"Missing field '{field}' in kalmori section"
        
        print(f"PASS: Kalmori section has all required fields")
        print(f"  - entries_count: {kalmori['entries_count']}")
        print(f"  - total_revenue: ${kalmori['total_revenue']}")
        print(f"  - your_take: ${kalmori['your_take']}")
    
    def test_revenue_analytics_kalmori_has_data(self):
        """Test that kalmori section has actual data (44 entries expected)"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        kalmori = data["kalmori"]
        
        assert kalmori["entries_count"] == 44, f"Expected 44 entries, got {kalmori['entries_count']}"
        assert kalmori["total_revenue"] > 300, f"Expected revenue > $300, got ${kalmori['total_revenue']}"
        assert kalmori["total_streams"] > 80000, f"Expected streams > 80000, got {kalmori['total_streams']}"
        
        print(f"PASS: Kalmori has expected data (44 entries, ${kalmori['total_revenue']} revenue)")
    
    def test_revenue_analytics_kalmori_platforms(self):
        """Test that kalmori platforms array has correct structure"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        kalmori = data["kalmori"]
        
        assert isinstance(kalmori["platforms"], list), "kalmori.platforms should be a list"
        assert len(kalmori["platforms"]) > 0, "kalmori.platforms should not be empty"
        
        platform = kalmori["platforms"][0]
        required_fields = ["platform", "streams", "revenue"]
        for field in required_fields:
            assert field in platform, f"Missing field '{field}' in kalmori platform entry"
        
        print(f"PASS: Kalmori platforms has {len(kalmori['platforms'])} platforms")
    
    def test_revenue_analytics_kalmori_monthly_trend(self):
        """Test that kalmori monthly_trend array has correct structure"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        kalmori = data["kalmori"]
        
        assert isinstance(kalmori["monthly_trend"], list), "kalmori.monthly_trend should be a list"
        assert len(kalmori["monthly_trend"]) == 6, f"Expected 6 months, got {len(kalmori['monthly_trend'])}"
        
        if len(kalmori["monthly_trend"]) > 0:
            month = kalmori["monthly_trend"][0]
            required_fields = ["month", "streams", "revenue"]
            for field in required_fields:
                assert field in month, f"Missing field '{field}' in kalmori monthly_trend entry"
        
        print(f"PASS: Kalmori monthly trend has {len(kalmori['monthly_trend'])} months")
    
    def test_revenue_analytics_has_combined_section(self):
        """Test that response has combined section with totals"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        
        assert "combined" in data, "Missing 'combined' section"
        combined = data["combined"]
        
        required_fields = ["total_streams", "total_gross", "total_net"]
        for field in required_fields:
            assert field in combined, f"Missing field '{field}' in combined section"
        
        # Verify combined totals are correct
        summary = data["summary"]
        kalmori = data["kalmori"]
        
        expected_streams = summary["total_streams"] + kalmori["total_streams"]
        assert combined["total_streams"] == expected_streams, \
            f"Combined streams mismatch: {combined['total_streams']} != {expected_streams}"
        
        print(f"PASS: Combined section has correct totals")
        print(f"  - total_streams: {combined['total_streams']}")
        print(f"  - total_gross: ${combined['total_gross']}")
    
    def test_revenue_analytics_combined_values(self):
        """Test that combined values match expected (~$342.95)"""
        resp = self.session.get(f"{BASE_URL}/api/analytics/revenue")
        data = resp.json()
        combined = data["combined"]
        
        assert combined["total_gross"] > 340, f"Expected combined gross > $340, got ${combined['total_gross']}"
        assert combined["total_gross"] < 350, f"Expected combined gross < $350, got ${combined['total_gross']}"
        
        print(f"PASS: Combined gross revenue is ${combined['total_gross']} (expected ~$342.95)")


class TestRevenueCalculator:
    """Revenue Calculator endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin user before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        yield
        self.session.close()
    
    def test_calculator_endpoint_returns_200(self):
        """Test that /api/analytics/revenue/calculator returns 200"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000,
            "platform_mix": {"Spotify": 45, "Apple Music": 25, "YouTube Music": 15, "Amazon Music": 10, "Other": 5}
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("PASS: Calculator endpoint returns 200")
    
    def test_calculator_returns_correct_structure(self):
        """Test that calculator returns all required fields"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000,
            "platform_mix": {"Spotify": 45, "Apple Music": 25, "YouTube Music": 15, "Amazon Music": 10, "Other": 5}
        })
        data = resp.json()
        
        required_fields = ["input_streams", "platform_breakdown", "gross_revenue", "platform_fee",
                          "net_revenue", "collab_payouts", "artist_take", "plan", "plan_cut_percent"]
        for field in required_fields:
            assert field in data, f"Missing field '{field}' in calculator response"
        
        print(f"PASS: Calculator returns all required fields")
    
    def test_calculator_platform_breakdown(self):
        """Test that calculator returns correct platform breakdown"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000,
            "platform_mix": {"Spotify": 45, "Apple Music": 25, "YouTube Music": 15, "Amazon Music": 10, "Other": 5}
        })
        data = resp.json()
        
        assert isinstance(data["platform_breakdown"], list), "platform_breakdown should be a list"
        assert len(data["platform_breakdown"]) == 5, f"Expected 5 platforms, got {len(data['platform_breakdown'])}"
        
        platform = data["platform_breakdown"][0]
        required_fields = ["platform", "streams", "rate", "gross"]
        for field in required_fields:
            assert field in platform, f"Missing field '{field}' in platform breakdown entry"
        
        print(f"PASS: Calculator platform breakdown has correct structure")
    
    def test_calculator_revenue_calculation(self):
        """Test that calculator calculates revenue correctly"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000,
            "platform_mix": {"Spotify": 45, "Apple Music": 25, "YouTube Music": 15, "Amazon Music": 10, "Other": 5}
        })
        data = resp.json()
        
        # Expected: Spotify 4500*0.004=18, Apple 2500*0.008=20, YouTube 1500*0.002=3, Amazon 1000*0.004=4, Other 500*0.004=2 = $47
        assert data["gross_revenue"] == 47, f"Expected gross $47, got ${data['gross_revenue']}"
        
        print(f"PASS: Calculator calculates revenue correctly (${data['gross_revenue']})")
    
    def test_calculator_with_default_mix(self):
        """Test that calculator works with default platform mix"""
        resp = self.session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data["input_streams"] == 10000
        assert data["gross_revenue"] > 0
        
        print(f"PASS: Calculator works with default mix (gross: ${data['gross_revenue']})")


class TestRevenueAnalyticsAuth:
    """Test authentication requirements for revenue analytics"""
    
    def test_revenue_analytics_requires_auth(self):
        """Test that /api/analytics/revenue requires authentication"""
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/api/analytics/revenue")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Revenue analytics requires authentication")
    
    def test_calculator_requires_auth(self):
        """Test that /api/analytics/revenue/calculator requires authentication"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/analytics/revenue/calculator", json={
            "streams": 10000
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Calculator requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
