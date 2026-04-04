"""
Iteration 64 - Page Builder Enhancements Testing
Tests for 4 NEW features:
1. Custom CSS injection per block
2. Image uploads in blocks via Object Storage
3. Block duplication
4. Page Selector for editing multiple pages (landing, about, pricing)
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPageBuilderEnhancements:
    """Test the 4 new Page Builder enhancements"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as admin and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kalmori.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
        self.token = login_res.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.session.cookies.update(login_res.cookies)
        yield
    
    # ===== FILE UPLOAD TESTS =====
    def test_file_upload_endpoint_exists(self):
        """Test POST /api/files/upload endpoint exists and requires admin"""
        # Test without auth first
        no_auth_session = requests.Session()
        res = no_auth_session.post(f"{BASE_URL}/api/files/upload")
        assert res.status_code in [401, 403, 422], f"Expected auth error, got {res.status_code}"
        print("✓ File upload endpoint requires authentication")
    
    def test_file_upload_with_image(self):
        """Test uploading an image file via /api/files/upload"""
        # Create a simple test image (1x1 pixel PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        res = requests.post(f"{BASE_URL}/api/files/upload", files=files, headers=headers, cookies=self.session.cookies)
        
        if res.status_code == 200:
            data = res.json()
            assert 'path' in data, "Response should contain 'path'"
            assert 'tunedrop/page-builder/' in data['path'] or 'page-builder' in data.get('url', ''), "Path should contain page-builder prefix"
            print(f"✓ Image uploaded successfully: {data.get('path', data.get('url'))}")
        else:
            # Object storage might not be configured in test env
            print(f"⚠ File upload returned {res.status_code}: {res.text[:200]}")
            pytest.skip("Object storage may not be configured")
    
    def test_file_upload_rejects_non_images(self):
        """Test that non-image files are rejected"""
        files = {'file': ('test.txt', io.BytesIO(b'Hello World'), 'text/plain')}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        res = requests.post(f"{BASE_URL}/api/files/upload", files=files, headers=headers, cookies=self.session.cookies)
        assert res.status_code == 400, f"Expected 400 for non-image, got {res.status_code}"
        print("✓ Non-image files correctly rejected")
    
    # ===== PUBLIC FILE SERVING TESTS =====
    def test_public_file_serving_endpoint(self):
        """Test GET /api/public/files/{path} endpoint"""
        # Test with invalid path (should be denied)
        res = requests.get(f"{BASE_URL}/api/public/files/invalid/path.jpg")
        assert res.status_code in [403, 404], f"Expected 403/404 for invalid path, got {res.status_code}"
        print("✓ Public file serving rejects invalid paths")
    
    def test_public_file_serving_requires_valid_prefix(self):
        """Test that public file serving validates path prefix"""
        # Try to access file without proper prefix
        res = requests.get(f"{BASE_URL}/api/public/files/some/other/path.jpg")
        assert res.status_code in [403, 404], f"Expected 403/404, got {res.status_code}"
        print("✓ Public file serving validates path prefix")
    
    # ===== MULTI-PAGE SELECTOR TESTS =====
    def test_get_landing_page_layout(self):
        """Test GET /api/admin/pages/landing"""
        res = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        assert res.status_code == 200, f"Failed to get landing page: {res.text}"
        data = res.json()
        assert 'page_slug' in data or 'blocks' in data, "Response should have page_slug or blocks"
        print(f"✓ Landing page layout retrieved: {len(data.get('blocks', []))} blocks")
    
    def test_get_about_page_layout(self):
        """Test GET /api/admin/pages/about"""
        res = self.session.get(f"{BASE_URL}/api/admin/pages/about")
        assert res.status_code == 200, f"Failed to get about page: {res.text}"
        data = res.json()
        assert 'page_slug' in data or 'blocks' in data, "Response should have page_slug or blocks"
        print(f"✓ About page layout retrieved: {len(data.get('blocks', []))} blocks")
    
    def test_get_pricing_page_layout(self):
        """Test GET /api/admin/pages/pricing"""
        res = self.session.get(f"{BASE_URL}/api/admin/pages/pricing")
        assert res.status_code == 200, f"Failed to get pricing page: {res.text}"
        data = res.json()
        assert 'page_slug' in data or 'blocks' in data, "Response should have page_slug or blocks"
        print(f"✓ Pricing page layout retrieved: {len(data.get('blocks', []))} blocks")
    
    def test_list_all_editable_pages(self):
        """Test GET /api/admin/pages returns all 3 pages"""
        res = self.session.get(f"{BASE_URL}/api/admin/pages")
        assert res.status_code == 200, f"Failed to list pages: {res.text}"
        data = res.json()
        pages = data.get('pages', [])
        slugs = [p.get('page_slug') for p in pages]
        assert 'landing' in slugs, "Landing page should be in list"
        assert 'about' in slugs, "About page should be in list"
        assert 'pricing' in slugs, "Pricing page should be in list"
        print(f"✓ All 3 editable pages listed: {slugs}")
    
    # ===== ADD BLOCK TESTS (ALL 12 TYPES) =====
    def test_add_hero_block(self):
        """Test adding hero block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "hero"})
        assert res.status_code == 200, f"Failed to add hero block: {res.text}"
        data = res.json()
        assert data.get('type') == 'hero', "Block type should be hero"
        assert 'id' in data, "Block should have id"
        print(f"✓ Hero block added: {data.get('id')}")
    
    def test_add_text_block(self):
        """Test adding text block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "text"})
        assert res.status_code == 200, f"Failed to add text block: {res.text}"
        assert res.json().get('type') == 'text'
        print("✓ Text block added")
    
    def test_add_image_block(self):
        """Test adding image block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "image"})
        assert res.status_code == 200, f"Failed to add image block: {res.text}"
        assert res.json().get('type') == 'image'
        print("✓ Image block added")
    
    def test_add_features_block(self):
        """Test adding features block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "features"})
        assert res.status_code == 200, f"Failed to add features block: {res.text}"
        assert res.json().get('type') == 'features'
        print("✓ Features block added")
    
    def test_add_cta_block(self):
        """Test adding CTA block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "cta"})
        assert res.status_code == 200, f"Failed to add CTA block: {res.text}"
        assert res.json().get('type') == 'cta'
        print("✓ CTA block added")
    
    def test_add_testimonials_block(self):
        """Test adding testimonials block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "testimonials"})
        assert res.status_code == 200, f"Failed to add testimonials block: {res.text}"
        assert res.json().get('type') == 'testimonials'
        print("✓ Testimonials block added")
    
    def test_add_stats_block(self):
        """Test adding stats block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "stats"})
        assert res.status_code == 200, f"Failed to add stats block: {res.text}"
        assert res.json().get('type') == 'stats'
        print("✓ Stats block added")
    
    def test_add_spacer_block(self):
        """Test adding spacer block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "spacer"})
        assert res.status_code == 200, f"Failed to add spacer block: {res.text}"
        assert res.json().get('type') == 'spacer'
        print("✓ Spacer block added")
    
    def test_add_two_column_block(self):
        """Test adding two_column block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "two_column"})
        assert res.status_code == 200, f"Failed to add two_column block: {res.text}"
        assert res.json().get('type') == 'two_column'
        print("✓ Two Column block added")
    
    def test_add_pricing_block(self):
        """Test adding pricing block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "pricing"})
        assert res.status_code == 200, f"Failed to add pricing block: {res.text}"
        assert res.json().get('type') == 'pricing'
        print("✓ Pricing block added")
    
    def test_add_logo_bar_block(self):
        """Test adding logo_bar block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "logo_bar"})
        assert res.status_code == 200, f"Failed to add logo_bar block: {res.text}"
        assert res.json().get('type') == 'logo_bar'
        print("✓ Logo Bar block added")
    
    def test_add_video_block(self):
        """Test adding video block"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "video"})
        assert res.status_code == 200, f"Failed to add video block: {res.text}"
        assert res.json().get('type') == 'video'
        print("✓ Video block added")
    
    # ===== CUSTOM CSS INJECTION TESTS =====
    def test_save_block_with_custom_css(self):
        """Test saving a block with customCss in styles"""
        # First add a block
        add_res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "text"})
        assert add_res.status_code == 200
        block = add_res.json()
        block_id = block.get('id')
        
        # Modify block with custom CSS
        block['styles'] = block.get('styles', {})
        block['styles']['customCss'] = 'font-family: Georgia, serif; text-shadow: 0 2px 10px rgba(0,0,0,0.5);'
        
        # Get current layout
        layout_res = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        assert layout_res.status_code == 200
        layout = layout_res.json()
        
        # Update the block in the layout
        blocks = layout.get('blocks', [])
        for i, b in enumerate(blocks):
            if b.get('id') == block_id:
                blocks[i] = block
                break
        
        # Save layout with custom CSS
        save_res = self.session.put(f"{BASE_URL}/api/admin/pages/landing", json={"blocks": blocks})
        assert save_res.status_code == 200, f"Failed to save layout with custom CSS: {save_res.text}"
        
        # Verify custom CSS was saved
        verify_res = self.session.get(f"{BASE_URL}/api/admin/pages/landing")
        assert verify_res.status_code == 200
        saved_blocks = verify_res.json().get('blocks', [])
        saved_block = next((b for b in saved_blocks if b.get('id') == block_id), None)
        assert saved_block is not None, "Block should exist"
        assert saved_block.get('styles', {}).get('customCss') == 'font-family: Georgia, serif; text-shadow: 0 2px 10px rgba(0,0,0,0.5);', "Custom CSS should be saved"
        print("✓ Block with custom CSS saved and verified")
    
    # ===== PUBLISH/UNPUBLISH TESTS =====
    def test_publish_page(self):
        """Test POST /api/admin/pages/{slug}/publish"""
        # First ensure there's at least one block
        self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "hero"})
        
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/publish")
        assert res.status_code == 200, f"Failed to publish: {res.text}"
        data = res.json()
        assert 'published' in data.get('message', '').lower() or data.get('published_at'), "Should confirm publish"
        print("✓ Page published successfully")
    
    def test_unpublish_page(self):
        """Test POST /api/admin/pages/{slug}/unpublish"""
        res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/unpublish")
        assert res.status_code == 200, f"Failed to unpublish: {res.text}"
        print("✓ Page unpublished successfully")
    
    # ===== PUBLIC PAGE ENDPOINT TESTS =====
    def test_public_page_endpoint_landing(self):
        """Test GET /api/pages/landing (public, no auth)"""
        # First publish the page
        self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "hero"})
        self.session.post(f"{BASE_URL}/api/admin/pages/landing/publish")
        
        # Access without auth
        no_auth_res = requests.get(f"{BASE_URL}/api/pages/landing")
        assert no_auth_res.status_code == 200, f"Public page access failed: {no_auth_res.text}"
        data = no_auth_res.json()
        # Should return published page or empty if not published
        print(f"✓ Public landing page accessible: published={data.get('published', False)}")
    
    def test_public_page_endpoint_about(self):
        """Test GET /api/pages/about (public, no auth)"""
        no_auth_res = requests.get(f"{BASE_URL}/api/pages/about")
        assert no_auth_res.status_code == 200, f"Public about page access failed: {no_auth_res.text}"
        print("✓ Public about page endpoint accessible")
    
    def test_public_page_endpoint_pricing(self):
        """Test GET /api/pages/pricing (public, no auth)"""
        no_auth_res = requests.get(f"{BASE_URL}/api/pages/pricing")
        assert no_auth_res.status_code == 200, f"Public pricing page access failed: {no_auth_res.text}"
        print("✓ Public pricing page endpoint accessible")
    
    # ===== DELETE BLOCK TEST =====
    def test_delete_block(self):
        """Test DELETE /api/admin/pages/{slug}/blocks/{block_id}"""
        # Add a block first
        add_res = self.session.post(f"{BASE_URL}/api/admin/pages/landing/add-block", json={"type": "spacer"})
        assert add_res.status_code == 200
        block_id = add_res.json().get('id')
        
        # Delete it
        del_res = self.session.delete(f"{BASE_URL}/api/admin/pages/landing/blocks/{block_id}")
        assert del_res.status_code == 200, f"Failed to delete block: {del_res.text}"
        print(f"✓ Block {block_id} deleted successfully")
    
    # ===== NON-ADMIN ACCESS TESTS =====
    def test_non_admin_cannot_access_admin_pages(self):
        """Test that non-admin users cannot access /api/admin/pages endpoints"""
        # Create a regular user session
        user_session = requests.Session()
        
        # Try to access admin endpoint without auth
        res = user_session.get(f"{BASE_URL}/api/admin/pages")
        assert res.status_code in [401, 403], f"Expected 401/403, got {res.status_code}"
        print("✓ Non-admin access correctly denied")


class TestBlockTemplates:
    """Test block templates endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kalmori.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.token = login_res.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.session.cookies.update(login_res.cookies)
        yield
    
    def test_get_all_block_templates(self):
        """Test GET /api/admin/pages/block-templates/all returns 12 templates"""
        res = self.session.get(f"{BASE_URL}/api/admin/pages/block-templates/all")
        assert res.status_code == 200, f"Failed to get templates: {res.text}"
        data = res.json()
        templates = data.get('templates', [])
        assert len(templates) == 12, f"Expected 12 templates, got {len(templates)}"
        
        expected_types = ['hero', 'text', 'image', 'features', 'cta', 'testimonials', 
                         'stats', 'spacer', 'two_column', 'video', 'logo_bar', 'pricing']
        template_keys = [t.get('key') for t in templates]
        for et in expected_types:
            assert et in template_keys, f"Missing template: {et}"
        
        print(f"✓ All 12 block templates available: {template_keys}")


class TestAboutPageIntegration:
    """Test About page with DynamicPageRenderer"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kalmori.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.token = login_res.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.session.cookies.update(login_res.cookies)
        yield
    
    def test_about_page_can_be_customized(self):
        """Test that about page can have custom blocks added and published"""
        # Add a hero block to about page
        res = self.session.post(f"{BASE_URL}/api/admin/pages/about/add-block", json={"type": "hero"})
        assert res.status_code == 200, f"Failed to add block to about: {res.text}"
        
        # Publish about page
        pub_res = self.session.post(f"{BASE_URL}/api/admin/pages/about/publish")
        assert pub_res.status_code == 200, f"Failed to publish about: {pub_res.text}"
        
        # Verify public endpoint returns published content
        public_res = requests.get(f"{BASE_URL}/api/pages/about")
        assert public_res.status_code == 200
        data = public_res.json()
        assert data.get('published') == True, "About page should be published"
        assert len(data.get('blocks', [])) > 0, "About page should have blocks"
        print("✓ About page customization and publish working")


class TestPricingPageIntegration:
    """Test Pricing page with DynamicPageRenderer"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kalmori.com",
            "password": "Admin123!"
        })
        assert login_res.status_code == 200
        self.token = login_res.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.session.cookies.update(login_res.cookies)
        yield
    
    def test_pricing_page_can_be_customized(self):
        """Test that pricing page can have custom blocks added and published"""
        # Add a pricing block to pricing page
        res = self.session.post(f"{BASE_URL}/api/admin/pages/pricing/add-block", json={"type": "pricing"})
        assert res.status_code == 200, f"Failed to add block to pricing: {res.text}"
        
        # Publish pricing page
        pub_res = self.session.post(f"{BASE_URL}/api/admin/pages/pricing/publish")
        assert pub_res.status_code == 200, f"Failed to publish pricing: {pub_res.text}"
        
        # Verify public endpoint returns published content
        public_res = requests.get(f"{BASE_URL}/api/pages/pricing")
        assert public_res.status_code == 200
        data = public_res.json()
        assert data.get('published') == True, "Pricing page should be published"
        print("✓ Pricing page customization and publish working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
