"""
Iteration 17 Tests - Beat Purchase Checkout, Email Receipts, Release Wizard, Instrumentals Page
Tests for:
- POST /api/beats/purchase/checkout - creates Stripe checkout for beat purchase
- GET /api/beats/purchases - lists user's beat purchases
- POST /api/receipts/send - sends/stores email receipt
- POST /api/releases - creates release (Release Wizard Step 1)
- GET /api/distributions/stores - returns DSP store list
- GET /api/beats - public beats list
- POST /api/auth/login - admin login
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@tunedrop.com"
ADMIN_PASSWORD = "Admin123!"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """GET /api/health - returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health check returns healthy status")
    
    def test_admin_login(self):
        """POST /api/auth/login - admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"PASS: Admin login successful, role: {data['user'].get('role')}")
        return data["access_token"]


class TestBeatsPublicEndpoints:
    """Tests for public beats endpoints"""
    
    def test_get_beats_public(self):
        """GET /api/beats - returns beats list (public, no auth required)"""
        response = requests.get(f"{BASE_URL}/api/beats")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        assert isinstance(data["beats"], list)
        print(f"PASS: GET /api/beats returns {len(data['beats'])} beats")
        return data["beats"]
    
    def test_get_beats_with_limit(self):
        """GET /api/beats?limit=4 - returns limited beats"""
        response = requests.get(f"{BASE_URL}/api/beats?limit=4")
        assert response.status_code == 200
        data = response.json()
        assert "beats" in data
        assert len(data["beats"]) <= 4
        print(f"PASS: GET /api/beats?limit=4 returns {len(data['beats'])} beats")
    
    def test_get_single_beat(self):
        """GET /api/beats/{beat_id} - returns single beat details"""
        # First get a beat ID
        beats_response = requests.get(f"{BASE_URL}/api/beats?limit=1")
        beats = beats_response.json().get("beats", [])
        if not beats:
            pytest.skip("No beats available to test")
        
        beat_id = beats[0]["id"]
        response = requests.get(f"{BASE_URL}/api/beats/{beat_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == beat_id
        assert "title" in data
        assert "prices" in data
        print(f"PASS: GET /api/beats/{beat_id} returns beat: {data['title']}")
        return data


class TestBeatPurchaseCheckout:
    """Tests for beat purchase checkout endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def beat_id(self):
        """Get a valid beat ID for testing"""
        response = requests.get(f"{BASE_URL}/api/beats?limit=1")
        beats = response.json().get("beats", [])
        if not beats:
            pytest.skip("No beats available")
        return beats[0]["id"]
    
    def test_beat_purchase_checkout_requires_auth(self, beat_id):
        """POST /api/beats/purchase/checkout - returns 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/beats/purchase/checkout", json={
            "beat_id": beat_id,
            "license_type": "basic_lease",
            "origin_url": "https://example.com"
        })
        assert response.status_code == 401
        print("PASS: Beat purchase checkout requires authentication")
    
    def test_beat_purchase_checkout_creates_session(self, auth_token, beat_id):
        """POST /api/beats/purchase/checkout - creates Stripe checkout session"""
        response = requests.post(
            f"{BASE_URL}/api/beats/purchase/checkout",
            json={
                "beat_id": beat_id,
                "license_type": "basic_lease",
                "origin_url": "https://example.com"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert "amount" in data
        assert data["amount"] == 29.99  # basic_lease price
        print(f"PASS: Beat purchase checkout created, amount: ${data['amount']}")
        return data
    
    def test_beat_purchase_checkout_premium_lease(self, auth_token, beat_id):
        """POST /api/beats/purchase/checkout - premium lease price"""
        response = requests.post(
            f"{BASE_URL}/api/beats/purchase/checkout",
            json={
                "beat_id": beat_id,
                "license_type": "premium_lease",
                "origin_url": "https://example.com"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 79.99  # premium_lease price
        print(f"PASS: Premium lease checkout, amount: ${data['amount']}")
    
    def test_beat_purchase_checkout_invalid_license(self, auth_token, beat_id):
        """POST /api/beats/purchase/checkout - invalid license type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/beats/purchase/checkout",
            json={
                "beat_id": beat_id,
                "license_type": "invalid_license",
                "origin_url": "https://example.com"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("PASS: Invalid license type returns 400")
    
    def test_beat_purchase_checkout_invalid_beat(self, auth_token):
        """POST /api/beats/purchase/checkout - invalid beat_id returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/beats/purchase/checkout",
            json={
                "beat_id": "nonexistent_beat_id",
                "license_type": "basic_lease",
                "origin_url": "https://example.com"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("PASS: Invalid beat_id returns 404")


class TestBeatPurchases:
    """Tests for beat purchases list endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_beat_purchases_requires_auth(self):
        """GET /api/beats/purchases - returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/beats/purchases")
        assert response.status_code == 401
        print("PASS: Beat purchases list requires authentication")
    
    def test_get_beat_purchases(self, auth_token):
        """GET /api/beats/purchases - returns user's purchases"""
        response = requests.get(
            f"{BASE_URL}/api/beats/purchases",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "purchases" in data
        assert isinstance(data["purchases"], list)
        print(f"PASS: GET /api/beats/purchases returns {len(data['purchases'])} purchases")


class TestEmailReceipts:
    """Tests for email receipt endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_send_receipt_requires_auth(self):
        """POST /api/receipts/send - returns 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/receipts/send", json={
            "transaction_id": "test_txn_123"
        })
        assert response.status_code == 401
        print("PASS: Send receipt requires authentication")
    
    def test_send_receipt_requires_transaction_id(self, auth_token):
        """POST /api/receipts/send - returns 400 without transaction_id"""
        response = requests.post(
            f"{BASE_URL}/api/receipts/send",
            json={},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("PASS: Send receipt requires transaction_id")
    
    def test_send_receipt_invalid_transaction(self, auth_token):
        """POST /api/receipts/send - returns 404 for invalid transaction"""
        response = requests.post(
            f"{BASE_URL}/api/receipts/send",
            json={"transaction_id": "nonexistent_txn_123"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("PASS: Send receipt returns 404 for invalid transaction")


class TestReleaseWizard:
    """Tests for Release Wizard endpoints (Step 1: Create Release)"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_create_release_requires_auth(self):
        """POST /api/releases - returns 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/releases", json={
            "title": "Test Release",
            "release_type": "single",
            "genre": "Hip-Hop/Rap",
            "release_date": "2026-02-01"
        })
        assert response.status_code == 401
        print("PASS: Create release requires authentication")
    
    def test_create_release_success(self, auth_token):
        """POST /api/releases - creates release (Release Wizard Step 1)"""
        response = requests.post(
            f"{BASE_URL}/api/releases",
            json={
                "title": "TEST_Wizard_Release",
                "release_type": "single",
                "genre": "Hip-Hop/Rap",
                "release_date": "2026-02-01",
                "description": "Test release from wizard",
                "explicit": False,
                "language": "en"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Wizard_Release"
        assert data["release_type"] == "single"
        assert data["status"] == "draft"
        assert "upc" in data
        print(f"PASS: Release created with ID: {data['id']}, UPC: {data['upc']}")
        return data
    
    def test_get_releases(self, auth_token):
        """GET /api/releases - returns user's releases"""
        response = requests.get(
            f"{BASE_URL}/api/releases",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/releases returns {len(data)} releases")


class TestDistributionStores:
    """Tests for distribution stores endpoint"""
    
    def test_get_distribution_stores(self):
        """GET /api/distributions/stores - returns DSP store list"""
        response = requests.get(f"{BASE_URL}/api/distributions/stores")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify store structure
        store = data[0]
        assert "store_id" in store
        assert "store_name" in store
        
        # Check for expected stores
        store_ids = [s["store_id"] for s in data]
        assert "spotify" in store_ids
        assert "apple_music" in store_ids
        print(f"PASS: GET /api/distributions/stores returns {len(data)} stores: {store_ids}")


class TestSubscriptionPlans:
    """Tests for subscription plans (used in Pricing page)"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscriptions/plans - returns plan details"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "free" in data
        assert "rise" in data
        assert "pro" in data
        assert data["rise"]["price"] == 9.99
        assert data["pro"]["price"] == 19.99
        print("PASS: GET /api/subscriptions/plans returns correct plan details")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after tests"""
    yield
    # Cleanup: Delete test releases
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            releases = requests.get(
                f"{BASE_URL}/api/releases",
                headers={"Authorization": f"Bearer {token}"}
            ).json()
            for release in releases:
                if release.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/releases/{release['id']}",
                        headers={"Authorization": f"Bearer {token}"}
                    )
    except Exception as e:
        print(f"Cleanup error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
