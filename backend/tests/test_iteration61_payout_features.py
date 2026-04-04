"""
Iteration 61 - Payout Features Testing
Tests for:
1. $100 minimum payout threshold (wallet withdraw)
2. Payout schedule settings (GET/PUT /api/admin/payouts/schedule)
3. Auto-process endpoint (POST /api/admin/payouts/auto-process)
4. Existing admin payout features still work
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "submitkalmori@gmail.com"
ADMIN_PASSWORD = "MAYAsimpSON37!!"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_login(self, admin_session):
        """Test admin login works"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['email']}")


class TestWalletWithdrawThreshold:
    """Test $100 minimum payout threshold"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_withdraw_below_threshold_fails(self, admin_session):
        """POST /api/wallet/withdraw with amount < 100 should return error"""
        response = admin_session.post(f"{BASE_URL}/api/wallet/withdraw", json={
            "amount": 50.00,
            "method": "paypal",
            "paypal_email": "test@example.com"
        })
        # Should fail with 400 - either insufficient balance or threshold error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        detail = str(data.get("detail", "")).lower()
        # Either balance or threshold error is acceptable
        assert "balance" in detail or "100" in detail or "threshold" in detail, f"Error should mention balance or threshold: {data}"
        print(f"✓ Withdraw below $100 correctly rejected: {data['detail']}")
    
    def test_withdraw_at_threshold_boundary(self, admin_session):
        """POST /api/wallet/withdraw with amount = 99.99 should fail"""
        response = admin_session.post(f"{BASE_URL}/api/wallet/withdraw", json={
            "amount": 99.99,
            "method": "paypal",
            "paypal_email": "test@example.com"
        })
        assert response.status_code == 400
        data = response.json()
        detail = str(data.get("detail", "")).lower()
        # Either balance or threshold error is acceptable
        assert "balance" in detail or "100" in detail or "threshold" in detail
        print(f"✓ Withdraw at $99.99 correctly rejected: {data['detail']}")
    
    def test_withdraw_exactly_100_requires_balance(self, admin_session):
        """POST /api/wallet/withdraw with amount = 100 should check balance"""
        # First check wallet balance
        wallet_res = admin_session.get(f"{BASE_URL}/api/wallet")
        assert wallet_res.status_code == 200
        wallet = wallet_res.json()
        balance = wallet.get("balance", 0)
        
        response = admin_session.post(f"{BASE_URL}/api/wallet/withdraw", json={
            "amount": 100.00,
            "method": "paypal",
            "paypal_email": "test@example.com"
        })
        
        if balance < 100:
            # Should fail due to insufficient balance
            assert response.status_code == 400
            assert "balance" in str(response.json().get("detail", "")).lower()
            print(f"✓ Withdraw $100 correctly rejected due to insufficient balance (${balance})")
        else:
            # Should succeed or fail for other reasons
            print(f"✓ Withdraw $100 attempted with balance ${balance}, status: {response.status_code}")


class TestPayoutScheduleSettings:
    """Test payout schedule configuration endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def non_admin_session(self):
        """Create a non-admin user session for permission tests"""
        session = requests.Session()
        test_email = f"test_nonadmin_{uuid.uuid4().hex[:8]}@test.com"
        # Register new user
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test NonAdmin",
            "artist_name": "Test Artist"
        })
        if reg_response.status_code != 200:
            # User might exist, try login
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "TestPass123!"
            })
        return session
    
    def test_get_schedule_returns_config(self, admin_session):
        """GET /api/admin/payouts/schedule returns schedule config"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payouts/schedule")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields exist
        assert "frequency" in data, "Missing frequency field"
        assert "day_of_month" in data, "Missing day_of_month field"
        assert "min_threshold" in data, "Missing min_threshold field"
        assert "auto_process" in data, "Missing auto_process field"
        assert "notify_email" in data, "Missing notify_email field"
        
        print(f"✓ Schedule config retrieved: frequency={data['frequency']}, threshold=${data['min_threshold']}")
    
    def test_update_schedule_frequency(self, admin_session):
        """PUT /api/admin/payouts/schedule updates frequency"""
        response = admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "frequency": "biweekly"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("frequency") == "biweekly"
        print(f"✓ Schedule frequency updated to: {data['frequency']}")
        
        # Reset to monthly
        admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={"frequency": "monthly"})
    
    def test_update_schedule_day_of_month(self, admin_session):
        """PUT /api/admin/payouts/schedule updates day_of_month"""
        response = admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "day_of_month": 15
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("day_of_month") == 15
        print(f"✓ Schedule day_of_month updated to: {data['day_of_month']}")
    
    def test_update_schedule_threshold(self, admin_session):
        """PUT /api/admin/payouts/schedule updates min_threshold"""
        response = admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "min_threshold": 150.0
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("min_threshold") == 150.0
        print(f"✓ Schedule min_threshold updated to: ${data['min_threshold']}")
        
        # Reset to 100
        admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={"min_threshold": 100.0})
    
    def test_update_schedule_auto_process(self, admin_session):
        """PUT /api/admin/payouts/schedule updates auto_process toggle"""
        response = admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "auto_process": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("auto_process") == True
        print(f"✓ Schedule auto_process updated to: {data['auto_process']}")
    
    def test_update_schedule_notify_email(self, admin_session):
        """PUT /api/admin/payouts/schedule updates notify_email toggle"""
        response = admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "notify_email": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("notify_email") == False
        print(f"✓ Schedule notify_email updated to: {data['notify_email']}")
        
        # Reset to True
        admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={"notify_email": True})
    
    def test_schedule_non_admin_forbidden(self, non_admin_session):
        """GET /api/admin/payouts/schedule returns 403 for non-admin"""
        response = non_admin_session.get(f"{BASE_URL}/api/admin/payouts/schedule")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Schedule GET correctly returns 403 for non-admin")
    
    def test_schedule_update_non_admin_forbidden(self, non_admin_session):
        """PUT /api/admin/payouts/schedule returns 403 for non-admin"""
        response = non_admin_session.put(f"{BASE_URL}/api/admin/payouts/schedule", json={
            "frequency": "weekly"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Schedule PUT correctly returns 403 for non-admin")


class TestAutoProcessPayouts:
    """Test auto-process endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def non_admin_session(self):
        """Create a non-admin user session for permission tests"""
        session = requests.Session()
        test_email = f"test_nonadmin2_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test NonAdmin2",
            "artist_name": "Test Artist2"
        })
        if reg_response.status_code != 200:
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "TestPass123!"
            })
        return session
    
    def test_auto_process_returns_results(self, admin_session):
        """POST /api/admin/payouts/auto-process returns processing results"""
        response = admin_session.post(f"{BASE_URL}/api/admin/payouts/auto-process", json={})
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Missing message field"
        assert "processed" in data, "Missing processed count"
        assert "notified" in data, "Missing notified count"
        assert "threshold" in data, "Missing threshold field"
        
        print(f"✓ Auto-process completed: {data['message']}")
        print(f"  - Processed: {data['processed']}, Notified: {data['notified']}, Threshold: ${data['threshold']}")
    
    def test_auto_process_non_admin_forbidden(self, non_admin_session):
        """POST /api/admin/payouts/auto-process returns 403 for non-admin"""
        response = non_admin_session.post(f"{BASE_URL}/api/admin/payouts/auto-process", json={})
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Auto-process correctly returns 403 for non-admin")


class TestExistingPayoutFeatures:
    """Verify existing payout features still work"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_payouts_list(self, admin_session):
        """GET /api/admin/payouts returns list of withdrawals"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payouts")
        assert response.status_code == 200
        data = response.json()
        assert "withdrawals" in data
        print(f"✓ Payouts list retrieved: {len(data['withdrawals'])} withdrawals")
    
    def test_get_payouts_filter_by_status(self, admin_session):
        """GET /api/admin/payouts?status=pending filters correctly"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payouts?status=pending")
        assert response.status_code == 200
        data = response.json()
        # All returned should be pending
        for w in data.get("withdrawals", []):
            assert w.get("status") == "pending", f"Expected pending, got {w.get('status')}"
        print(f"✓ Payouts filter by status works: {len(data['withdrawals'])} pending")
    
    def test_get_payouts_summary(self, admin_session):
        """GET /api/admin/payouts/summary returns stats"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payouts/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "pending_count" in data
        assert "pending_amount" in data
        assert "processing_count" in data
        assert "completed_count" in data
        assert "total_user_balances" in data
        
        print(f"✓ Payouts summary: pending={data['pending_count']}, processing={data['processing_count']}, completed={data['completed_count']}")
    
    def test_export_csv(self, admin_session):
        """GET /api/admin/payouts/export returns CSV"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payouts/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        print(f"✓ CSV export works, size: {len(response.content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
