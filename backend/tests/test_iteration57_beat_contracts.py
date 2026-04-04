"""
Iteration 57 - Beat Purchase Flow with License Contracts
Tests the new contract signing flow: Select License -> Review Contract & Sign -> Stripe Checkout
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-hub-220.preview.emergentagent.com')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "submitkalmori@gmail.com"
ADMIN_PASSWORD = "MAYAsimpSON37!!"

class TestBeatContractFlow:
    """Test the beat purchase contract signing flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_res.status_code == 200:
            data = login_res.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
            self.user = data.get("user", {})
        yield
        
    def test_01_login_with_admin_credentials(self):
        """Test login with submitkalmori@gmail.com / MAYAsimpSON37!!"""
        res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == ADMIN_EMAIL.lower()
        print(f"✓ Login successful for {ADMIN_EMAIL}")
        
    def test_02_get_beats_list(self):
        """Verify beats are available for purchase"""
        res = self.session.get(f"{BASE_URL}/api/beats")
        assert res.status_code == 200, f"Failed to get beats: {res.text}"
        data = res.json()
        assert "beats" in data, "No beats key in response"
        assert len(data["beats"]) > 0, "No beats available"
        beat = data["beats"][0]
        assert "id" in beat
        assert "title" in beat
        assert "prices" in beat
        print(f"✓ Found {len(data['beats'])} beats, first: {beat['title']}")
        
    def test_03_sign_contract_success(self):
        """POST /api/beats/contract/sign - creates a signed contract"""
        # Get a beat first
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "basic_lease",
            "signer_name": "Test Signer Name"
        })
        assert res.status_code == 200, f"Contract sign failed: {res.text}"
        data = res.json()
        
        # Verify response contains required fields
        assert "id" in data, "No contract_id in response"
        assert data["id"].startswith("contract_"), f"Invalid contract ID format: {data['id']}"
        assert "license_terms" in data, "No license_terms in response"
        assert "amount" in data, "No amount in response"
        assert "signer_name" in data, "No signer_name in response"
        assert data["signer_name"] == "Test Signer Name"
        assert data["license_type"] == "basic_lease"
        assert data["amount"] == 29.99
        assert data["payment_status"] == "pending"
        
        # Store for later tests
        self.contract_id = data["id"]
        print(f"✓ Contract signed: {data['id']}, amount: ${data['amount']}")
        
    def test_04_sign_contract_nonexistent_beat(self):
        """POST /api/beats/contract/sign - returns 404 for non-existent beat"""
        res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": "nonexistent_beat_12345",
            "license_type": "basic_lease",
            "signer_name": "Test Signer"
        })
        assert res.status_code == 404, f"Expected 404, got {res.status_code}: {res.text}"
        data = res.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        print("✓ Returns 404 for non-existent beat")
        
    def test_05_sign_contract_invalid_license_type(self):
        """POST /api/beats/contract/sign - returns 400 for invalid license_type"""
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "invalid_license_type",
            "signer_name": "Test Signer"
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        data = res.json()
        assert "detail" in data
        print("✓ Returns 400 for invalid license_type")
        
    def test_06_get_contract_details(self):
        """GET /api/beats/contract/{contract_id} - returns contract details"""
        # First create a contract
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        sign_res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "premium_lease",
            "signer_name": "Contract Viewer Test"
        })
        contract_id = sign_res.json()["id"]
        
        # Get contract details
        res = self.session.get(f"{BASE_URL}/api/beats/contract/{contract_id}")
        assert res.status_code == 200, f"Failed to get contract: {res.text}"
        data = res.json()
        
        assert data["id"] == contract_id
        assert data["signer_name"] == "Contract Viewer Test"
        assert data["license_type"] == "premium_lease"
        assert "license_terms" in data
        assert "beat_title" in data
        print(f"✓ Contract details retrieved: {contract_id}")
        
    def test_07_get_contract_pdf(self):
        """GET /api/beats/contract/{contract_id}/pdf - returns a PDF file"""
        # First create a contract
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        sign_res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "unlimited_lease",
            "signer_name": "PDF Test Signer"
        })
        contract_id = sign_res.json()["id"]
        
        # Get PDF
        res = self.session.get(f"{BASE_URL}/api/beats/contract/{contract_id}/pdf")
        assert res.status_code == 200, f"Failed to get PDF: {res.text}"
        
        # Verify Content-Type is PDF
        content_type = res.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got: {content_type}"
        
        # Verify it's actual PDF content (starts with %PDF)
        assert res.content[:4] == b'%PDF', "Response is not a valid PDF"
        
        # Verify Content-Disposition header
        content_disp = res.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Missing attachment disposition"
        assert contract_id in content_disp, "Contract ID not in filename"
        
        print(f"✓ PDF downloaded successfully, size: {len(res.content)} bytes")
        
    def test_08_checkout_requires_contract(self):
        """POST /api/beats/purchase/checkout - returns 400 without valid contract_id"""
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        res = self.session.post(f"{BASE_URL}/api/beats/purchase/checkout", json={
            "beat_id": beat["id"],
            "license_type": "basic_lease",
            "contract_id": "invalid_contract_id",
            "origin_url": "https://artist-hub-220.preview.emergentagent.com"
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        data = res.json()
        assert "detail" in data
        assert "contract" in data["detail"].lower()
        print("✓ Checkout requires valid contract_id")
        
    def test_09_checkout_with_valid_contract(self):
        """POST /api/beats/purchase/checkout - creates Stripe checkout session with contract"""
        # First create a contract
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        sign_res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "basic_lease",
            "signer_name": "Checkout Test Signer"
        })
        assert sign_res.status_code == 200
        contract = sign_res.json()
        
        # Create checkout session
        res = self.session.post(f"{BASE_URL}/api/beats/purchase/checkout", json={
            "beat_id": beat["id"],
            "license_type": "basic_lease",
            "contract_id": contract["id"],
            "origin_url": "https://artist-hub-220.preview.emergentagent.com"
        })
        assert res.status_code == 200, f"Checkout failed: {res.text}"
        data = res.json()
        
        assert "checkout_url" in data, "No checkout_url in response"
        assert "session_id" in data, "No session_id in response"
        assert data["checkout_url"].startswith("https://"), "Invalid checkout URL"
        assert "stripe" in data["checkout_url"].lower(), "Not a Stripe checkout URL"
        
        print(f"✓ Stripe checkout session created: {data['session_id'][:20]}...")
        
    def test_10_admin_list_contracts(self):
        """GET /api/admin/contracts - returns list of all contracts (admin only)"""
        res = self.session.get(f"{BASE_URL}/api/admin/contracts")
        assert res.status_code == 200, f"Admin contracts failed: {res.text}"
        data = res.json()
        
        assert "contracts" in data, "No contracts key in response"
        assert isinstance(data["contracts"], list), "Contracts is not a list"
        
        # Verify contract structure if any exist
        if len(data["contracts"]) > 0:
            contract = data["contracts"][0]
            assert "id" in contract
            assert "signer_name" in contract
            assert "license_type" in contract
            assert "amount" in contract
            assert "payment_status" in contract
            
        print(f"✓ Admin can view {len(data['contracts'])} contracts")
        
    def test_11_admin_contracts_forbidden_for_non_admin(self):
        """GET /api/admin/contracts - returns 403 for non-admin"""
        # Create a new session without admin privileges
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        # Register a new non-admin user
        import uuid
        test_email = f"test_nonadmin_{uuid.uuid4().hex[:8]}@test.com"
        reg_res = new_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test Non-Admin",
            "artist_name": "Test Artist"
        })
        
        if reg_res.status_code == 200:
            data = reg_res.json()
            if "access_token" in data:
                new_session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
            
            # Try to access admin contracts
            res = new_session.get(f"{BASE_URL}/api/admin/contracts")
            assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
            print("✓ Non-admin gets 403 for admin contracts endpoint")
        else:
            # If registration fails (email exists), skip this test
            pytest.skip("Could not create non-admin user for test")
            
    def test_12_all_license_types_work(self):
        """Test contract signing works for all 4 license types"""
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        license_types = [
            ("basic_lease", 29.99),
            ("premium_lease", 79.99),
            ("unlimited_lease", 149.99),
            ("exclusive", 499.99)
        ]
        
        for license_type, expected_price in license_types:
            res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
                "beat_id": beat["id"],
                "license_type": license_type,
                "signer_name": f"Test {license_type}"
            })
            assert res.status_code == 200, f"Failed for {license_type}: {res.text}"
            data = res.json()
            assert data["license_type"] == license_type
            assert data["amount"] == expected_price, f"Expected ${expected_price}, got ${data['amount']}"
            print(f"  ✓ {license_type}: ${data['amount']}")
            
        print("✓ All 4 license types work correctly")
        
    def test_13_contract_contains_license_terms(self):
        """Verify contract contains complete license terms"""
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "premium_lease",
            "signer_name": "Terms Test"
        })
        assert res.status_code == 200
        data = res.json()
        
        terms = data.get("license_terms", {})
        required_term_keys = ["name", "rights", "file_types", "streams", "sales", "music_video", "credit", "ownership", "duration"]
        
        for key in required_term_keys:
            assert key in terms, f"Missing term key: {key}"
            assert terms[key], f"Empty value for term: {key}"
            
        print(f"✓ Contract contains all {len(required_term_keys)} required license term fields")


class TestContractAccessControl:
    """Test contract access control - only owner or admin can view"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_res.status_code == 200:
            data = login_res.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        yield
        
    def test_contract_access_denied_for_other_user(self):
        """Contract access denied for users who didn't sign it"""
        # Create a contract as admin
        beats_res = self.session.get(f"{BASE_URL}/api/beats")
        beat = beats_res.json()["beats"][0]
        
        sign_res = self.session.post(f"{BASE_URL}/api/beats/contract/sign", json={
            "beat_id": beat["id"],
            "license_type": "basic_lease",
            "signer_name": "Admin Signer"
        })
        contract_id = sign_res.json()["id"]
        
        # Create a new user session
        import uuid
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        test_email = f"test_other_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_res = new_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Other User",
            "artist_name": "Other Artist"
        })
        
        if reg_res.status_code == 200:
            data = reg_res.json()
            if "access_token" in data:
                new_session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
            
            # Try to access the contract
            res = new_session.get(f"{BASE_URL}/api/beats/contract/{contract_id}")
            assert res.status_code == 403, f"Expected 403, got {res.status_code}"
            print("✓ Other users cannot access contracts they didn't sign")
        else:
            pytest.skip("Could not create test user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
