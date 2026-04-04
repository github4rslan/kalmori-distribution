"""
Iteration 67 - Testing NEW Features:
1. Reset to Default button in Page Builder (POST /api/admin/pages/{slug}/seed-defaults)
2. Template library with 10 feature templates (Frontend TEMPLATE_BLOCKS)
3. Subscription tier gating for new features (spotify_data, beat_marketplace, messaging, royalty_splits)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "submitkalmori@gmail.com"
ADMIN_PASSWORD = "Admin123!"
SECONDARY_ADMIN_EMAIL = "admin@kalmori.com"


class TestSubscriptionPlansGating:
    """Test subscription plans with new locked features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_subscription_plans_returns_all_plans(self):
        """GET /api/subscriptions/plans returns all 3 plans"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        plans = response.json()
        assert "free" in plans, "Free plan missing"
        assert "rise" in plans, "Rise plan missing"
        assert "pro" in plans, "Pro plan missing"
        print("✓ All 3 subscription plans returned (free, rise, pro)")
    
    def test_free_plan_locks_new_features(self):
        """Free plan should lock spotify_data, beat_marketplace, messaging, royalty_splits"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        free_locked = plans["free"]["locked"]
        
        # Check new locked features
        assert "spotify_data" in free_locked, "spotify_data should be locked in Free plan"
        assert "beat_marketplace" in free_locked, "beat_marketplace should be locked in Free plan"
        assert "messaging" in free_locked, "messaging should be locked in Free plan"
        assert "royalty_splits" in free_locked, "royalty_splits should be locked in Free plan"
        print("✓ Free plan correctly locks: spotify_data, beat_marketplace, messaging, royalty_splits")
    
    def test_rise_plan_locks_specific_features(self):
        """Rise plan should lock ai_strategy, content_id, spotify_canvas, spotify_data, royalty_splits"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        rise_locked = plans["rise"]["locked"]
        
        # Rise should lock these
        assert "ai_strategy" in rise_locked, "ai_strategy should be locked in Rise plan"
        assert "content_id" in rise_locked, "content_id should be locked in Rise plan"
        assert "spotify_canvas" in rise_locked, "spotify_canvas should be locked in Rise plan"
        assert "spotify_data" in rise_locked, "spotify_data should be locked in Rise plan"
        assert "royalty_splits" in rise_locked, "royalty_splits should be locked in Rise plan"
        
        # Rise should NOT lock these (they should be available)
        assert "beat_marketplace" not in rise_locked, "beat_marketplace should be available in Rise plan"
        assert "messaging" not in rise_locked, "messaging should be available in Rise plan"
        print("✓ Rise plan correctly locks: ai_strategy, content_id, spotify_canvas, spotify_data, royalty_splits")
        print("✓ Rise plan correctly unlocks: beat_marketplace, messaging")
    
    def test_pro_plan_has_no_locked_features(self):
        """Pro plan should have empty locked array"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        pro_locked = plans["pro"]["locked"]
        
        assert pro_locked == [], f"Pro plan should have no locked features, got: {pro_locked}"
        print("✓ Pro plan has no locked features (empty locked array)")
    
    def test_free_plan_features_list(self):
        """Free plan should have correct features list"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        free_features = plans["free"]["features"]
        
        assert "1 release per year" in free_features
        assert "150+ streaming platforms" in free_features
        assert "Free ISRC codes" in free_features
        print(f"✓ Free plan features: {free_features}")
    
    def test_rise_plan_features_list(self):
        """Rise plan should have correct features list including messaging and beat marketplace"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        rise_features = plans["rise"]["features"]
        
        assert "Unlimited releases" in rise_features
        assert "In-App messaging" in rise_features
        assert "Beat marketplace access" in rise_features
        print(f"✓ Rise plan features include messaging and beat marketplace: {rise_features}")
    
    def test_pro_plan_features_list(self):
        """Pro plan should have all features including spotify_data and royalty_splits"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        pro_features = plans["pro"]["features"]
        
        assert "Spotify Data (Real API)" in pro_features
        assert "Producer Royalty Splits" in pro_features
        assert "Keep 100% royalties" in pro_features
        print(f"✓ Pro plan features include Spotify Data and Royalty Splits: {pro_features}")


class TestResetToDefaultEndpoint:
    """Test Reset to Default functionality (POST /api/admin/pages/{slug}/seed-defaults)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session for admin tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        print(f"✓ Logged in as admin: {ADMIN_EMAIL}")
    
    def test_reset_landing_page_to_defaults(self):
        """POST /api/admin/pages/landing/seed-defaults resets page to original content"""
        response = self.session.post(f"{BASE_URL}/api/admin/pages/landing/seed-defaults")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "block_count" in data, "Response should include block_count"
        assert data["block_count"] == 14, f"Landing page should have 14 blocks, got {data['block_count']}"
        assert data["page_slug"] == "landing"
        print(f"✓ Reset landing page to defaults: {data['block_count']} blocks")
    
    def test_reset_about_page_to_defaults(self):
        """POST /api/admin/pages/about/seed-defaults resets page to original content"""
        response = self.session.post(f"{BASE_URL}/api/admin/pages/about/seed-defaults")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["block_count"] == 5, f"About page should have 5 blocks, got {data['block_count']}"
        print(f"✓ Reset about page to defaults: {data['block_count']} blocks")
    
    def test_reset_pricing_page_to_defaults(self):
        """POST /api/admin/pages/pricing/seed-defaults resets page to original content"""
        response = self.session.post(f"{BASE_URL}/api/admin/pages/pricing/seed-defaults")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["block_count"] == 4, f"Pricing page should have 4 blocks, got {data['block_count']}"
        print(f"✓ Reset pricing page to defaults: {data['block_count']} blocks")
    
    def test_reset_requires_admin_auth(self):
        """POST /api/admin/pages/{slug}/seed-defaults requires admin authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        response = unauth_session.post(f"{BASE_URL}/api/admin/pages/landing/seed-defaults")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Reset endpoint requires admin authentication (401 without auth)")
    
    def test_reset_invalid_page_returns_400(self):
        """POST /api/admin/pages/invalid/seed-defaults returns 400"""
        response = self.session.post(f"{BASE_URL}/api/admin/pages/invalid-page/seed-defaults")
        assert response.status_code == 400, f"Expected 400 for invalid page, got {response.status_code}"
        print("✓ Reset invalid page returns 400")
    
    def test_verify_reset_content_is_correct(self):
        """After reset, verify landing page has correct G.O.A.T hero content"""
        # First reset
        self.session.post(f"{BASE_URL}/api/admin/pages/landing/seed-defaults")
        
        # Then get the page
        response = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        assert response.status_code == 200
        
        data = response.json()
        blocks = data.get("blocks", [])
        
        # Find hero block
        hero_block = next((b for b in blocks if b.get("type") == "hero"), None)
        assert hero_block is not None, "Hero block should exist"
        assert "G.O.A.T" in hero_block.get("content", {}).get("title", ""), "Hero should have G.O.A.T title"
        print("✓ Reset content verified: Landing page has G.O.A.T hero")


class TestPageBuilderBlockOperations:
    """Test page builder block operations (add, delete, save)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session for admin tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
    
    def test_add_block_to_page(self):
        """POST /api/admin/pages/{slug}/add-block adds a new block"""
        response = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={
            "type": "hero",
            "order": 999
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should include block id"
        assert data["type"] == "hero"
        print(f"✓ Added hero block: {data['id']}")
        
        # Cleanup - delete the block
        self.session.delete(f"{BASE_URL}/api/admin/pages/landing/blocks/{data['id']}")
    
    def test_delete_block_from_page(self):
        """DELETE /api/admin/pages/{slug}/blocks/{block_id} deletes a block"""
        # First add a block
        add_response = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={
            "type": "spacer",
            "order": 999
        })
        block_id = add_response.json()["id"]
        
        # Then delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/pages/landing/blocks/{block_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        print(f"✓ Deleted block: {block_id}")
    
    def test_save_page_layout(self):
        """PUT /api/admin/pages/{slug} saves page layout"""
        # Get current layout
        get_response = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        current_blocks = get_response.json().get("blocks", [])
        
        # Save with same blocks
        save_response = self.session.put(f"{BASE_URL}/api/admin/pages/landing", json={
            "blocks": current_blocks,
            "title": "Landing Page"
        })
        assert save_response.status_code == 200, f"Expected 200, got {save_response.status_code}"
        
        data = save_response.json()
        assert "updated_at" in data
        print(f"✓ Saved page layout at {data['updated_at']}")


class TestBlockTemplates:
    """Test block templates endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session for admin tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
    
    def test_get_block_templates(self):
        """GET /api/admin/pages/block-templates/all returns all block templates"""
        response = self.session.get(f"{BASE_URL}/api/admin/pages/block-templates/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Should have 12 basic block types
        assert len(templates) >= 12, f"Expected at least 12 templates, got {len(templates)}"
        
        template_keys = [t["key"] for t in templates]
        expected_keys = ["hero", "text", "image", "features", "cta", "testimonials", "stats", "spacer", "two_column", "pricing", "logo_bar", "video"]
        
        for key in expected_keys:
            assert key in template_keys, f"Template '{key}' should exist"
        
        print(f"✓ Block templates returned: {len(templates)} templates")
        print(f"✓ Template keys: {template_keys}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
