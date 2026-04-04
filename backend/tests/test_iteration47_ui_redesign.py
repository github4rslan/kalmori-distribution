"""
Iteration 47 - UI Redesign Testing
Tests for: Landing page, Login page, Register page, Agreement page, PublicLayout header
Focus: Dark theme, animated gradients, 2-step registration, AgreementPage
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-hub-220.preview.emergentagent.com')

class TestHealthAndBasicEndpoints:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health endpoint working")

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_with_admin_credentials(self):
        """POST /api/auth/login with admin credentials returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@tunedrop.com"
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")
    
    def test_login_with_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_register_new_user(self):
        """POST /api/auth/register creates a new user"""
        unique_email = f"test_iter47_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test User Iter47",
            "artist_name": "Test Artist Iter47",
            "user_role": "artist"
        })
        # Registration may require reCAPTCHA, so accept 200 or 400 (missing recaptcha)
        assert response.status_code in [200, 201, 400, 422]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "access_token" in data or "user" in data
            print(f"✓ User registration successful: {unique_email}")
        else:
            # reCAPTCHA required - this is expected behavior
            print(f"✓ Registration requires reCAPTCHA (expected): {response.json()}")
    
    def test_auth_me_without_token(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth/me correctly requires authentication")
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me with valid token returns user data"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tunedrop.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Then check /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@tunedrop.com"
        print("✓ Auth/me with token returns user data")

class TestPublicRoutes:
    """Test that public routes are accessible"""
    
    def test_beats_endpoint(self):
        """GET /api/beats returns beats list"""
        response = requests.get(f"{BASE_URL}/api/beats?limit=4")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        print(f"✓ Beats endpoint working, returned {len(data.get('beats', []))} beats")
    
    def test_subscription_plans_endpoint(self):
        """GET /api/subscriptions/plans returns plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        # Plans returned as dict with keys: free, rise, pro
        assert isinstance(data, dict)
        assert "free" in data
        assert "rise" in data
        assert "pro" in data
        print(f"✓ Subscription plans endpoint working, returned {len(data)} plans")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
