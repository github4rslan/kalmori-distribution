"""
Iteration 33 - Testing 5 new enhancements:
1. Welcome email on sign-up (energetic music-industry vibe)
2. Email templates system (email_base function)
3. Landing page improvements with feature showcases
4. 150 streaming platforms in distribution
5. Sign-up form wider with side-by-side fields and styled Terms/reCAPTCHA
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDistributionStores:
    """Test the 150 streaming platforms requirement"""
    
    def test_stores_endpoint_returns_exactly_150_platforms(self):
        """GET /api/distributions/stores should return exactly 150 platforms"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        assert len(stores) == 150, f"Expected 150 stores, got {len(stores)}"
    
    def test_each_store_has_required_fields(self):
        """Each store should have store_id, store_name, icon, and region fields"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        for store in stores:
            assert "store_id" in store, f"Missing store_id in {store}"
            assert "store_name" in store, f"Missing store_name in {store}"
            assert "icon" in store, f"Missing icon in {store}"
            assert "region" in store, f"Missing region in {store}"
    
    def test_stores_include_major_global_platforms(self):
        """Stores should include major global platforms like Spotify, Apple Music, etc."""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        store_ids = [s["store_id"] for s in stores]
        
        major_platforms = ["spotify", "apple_music", "amazon_music", "youtube_music", "tidal", "deezer"]
        for platform in major_platforms:
            assert platform in store_ids, f"Missing major platform: {platform}"
    
    def test_stores_include_african_platforms(self):
        """Stores should include African platforms like Boomplay, Mdundo"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        african_stores = [s for s in stores if s.get("region") == "Africa"]
        assert len(african_stores) >= 5, f"Expected at least 5 African stores, got {len(african_stores)}"
        
        african_ids = [s["store_id"] for s in african_stores]
        assert "boomplay" in african_ids, "Missing Boomplay (Africa)"
        assert "mdundo" in african_ids, "Missing Mdundo (Africa)"
    
    def test_stores_include_indian_platforms(self):
        """Stores should include Indian platforms like JioSaavn, Gaana, Wynk"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        indian_stores = [s for s in stores if s.get("region") == "India"]
        assert len(indian_stores) >= 4, f"Expected at least 4 Indian stores, got {len(indian_stores)}"
        
        indian_ids = [s["store_id"] for s in indian_stores]
        assert "jiosaavn" in indian_ids, "Missing JioSaavn (India)"
        assert "gaana" in indian_ids, "Missing Gaana (India)"
    
    def test_stores_include_asian_platforms(self):
        """Stores should include Asian platforms like KKBOX, LINE MUSIC, Melon"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        asian_regions = ["Asia", "Japan", "South Korea", "China", "Southeast Asia"]
        asian_stores = [s for s in stores if s.get("region") in asian_regions]
        assert len(asian_stores) >= 10, f"Expected at least 10 Asian stores, got {len(asian_stores)}"
    
    def test_stores_include_latin_american_platforms(self):
        """Stores should include Latin American platforms"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        latam_stores = [s for s in stores if s.get("region") in ["Latin America", "Brazil"]]
        assert len(latam_stores) >= 5, f"Expected at least 5 Latin American stores, got {len(latam_stores)}"
    
    def test_stores_include_russian_platforms(self):
        """Stores should include Russian platforms like Yandex Music, VK Music"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        russian_stores = [s for s in stores if s.get("region") == "Russia"]
        assert len(russian_stores) >= 3, f"Expected at least 3 Russian stores, got {len(russian_stores)}"
        
        russian_ids = [s["store_id"] for s in russian_stores]
        assert "yandex" in russian_ids, "Missing Yandex Music (Russia)"
    
    def test_stores_include_middle_east_platforms(self):
        """Stores should include Middle East platforms like Anghami"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        mena_stores = [s for s in stores if s.get("region") == "Middle East"]
        assert len(mena_stores) >= 2, f"Expected at least 2 Middle East stores, got {len(mena_stores)}"
        
        mena_ids = [s["store_id"] for s in mena_stores]
        assert "anghami" in mena_ids, "Missing Anghami (Middle East)"
    
    def test_all_regions_represented(self):
        """Verify all major regions are represented"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        stores = response.json()
        
        regions = set(s.get("region") for s in stores)
        expected_regions = ["Global", "Africa", "India", "Asia", "Latin America", "Russia", "Middle East"]
        
        for region in expected_regions:
            assert region in regions, f"Missing region: {region}"


class TestEmailFunctions:
    """Test email routes and functions exist"""
    
    def test_forgot_password_endpoint_exists(self):
        """POST /api/auth/forgot-password should exist"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "test@example.com"})
        # Should return 200 even for non-existent email (security best practice)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_reset_password_endpoint_exists(self):
        """POST /api/auth/reset-password should exist"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token",
            "new_password": "NewPass123!"
        })
        # Should return 400 for invalid token
        assert response.status_code == 400
    
    def test_verify_reset_token_endpoint_exists(self):
        """GET /api/auth/verify-reset-token should exist"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token?token=invalid_token")
        # Should return 400 for invalid token
        assert response.status_code == 400


class TestRegistrationWithWelcomeEmail:
    """Test registration triggers welcome email (check logs)"""
    
    def test_registration_endpoint_works(self):
        """POST /api/auth/register should work and trigger welcome email"""
        unique_email = f"test_welcome_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test Welcome User",
            "artist_name": "Test Artist",
            "user_role": "artist"
        })
        
        # Registration should succeed
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
    
    def test_registration_returns_user_data(self):
        """Registration should return user data without password_hash"""
        unique_email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test User",
            "artist_name": "Test Artist",
            "user_role": "producer"
        })
        
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        
        # Should not contain sensitive data
        assert "password_hash" not in user
        assert "_id" not in user
        
        # Should contain expected fields
        assert user["email"] == unique_email
        assert user["user_role"] == "producer"


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_with_admin_credentials(self):
        """Login with admin credentials should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
    
    def test_login_with_invalid_credentials(self):
        """Login with invalid credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
    
    def test_me_endpoint_requires_auth(self):
        """GET /api/auth/me should require authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 422]


class TestHealthAndBasicEndpoints:
    """Test basic health and API endpoints"""
    
    def test_api_root_or_health(self):
        """API should be accessible"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
    
    def test_stores_endpoint_performance(self):
        """Stores endpoint should respond quickly"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 2.0, f"Stores endpoint took {elapsed:.2f}s, expected < 2s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
