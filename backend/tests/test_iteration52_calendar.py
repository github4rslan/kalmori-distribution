"""
Iteration 52 - Release Calendar Feature Tests
Tests for calendar CRUD endpoints and industry dates generation
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kalmori.com"
ADMIN_PASSWORD = "MAYAsimpSON37!!"


class TestCalendarEndpoints:
    """Calendar API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_event_ids = []
        yield
        # Cleanup created events
        for event_id in self.created_event_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
            except:
                pass
    
    def test_get_calendar_events_returns_events_array(self):
        """GET /api/calendar/events?month=4&year=2026 returns events array with industry dates"""
        response = self.session.get(f"{BASE_URL}/api/calendar/events?month=4&year=2026")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "events" in data, "Response should contain 'events' key"
        assert isinstance(data["events"], list), "Events should be a list"
        assert "month" in data, "Response should contain 'month' key"
        assert "year" in data, "Response should contain 'year' key"
        assert data["month"] == 4, "Month should be 4"
        assert data["year"] == 2026, "Year should be 2026"
        
        # Check for industry dates (Fridays for New Music Friday, Tuesdays for Spotify/Apple)
        industry_events = [e for e in data["events"] if e.get("type") == "industry"]
        assert len(industry_events) > 0, "Should have industry dates generated"
        
        # Verify industry date structure
        for event in industry_events:
            assert "id" in event, "Industry event should have id"
            assert "title" in event, "Industry event should have title"
            assert "date" in event, "Industry event should have date"
            assert "type" in event, "Industry event should have type"
            assert "color" in event, "Industry event should have color"
        
        print(f"Found {len(industry_events)} industry events for April 2026")
    
    def test_get_calendar_events_without_params_uses_current_month(self):
        """GET /api/calendar/events without params uses current month"""
        response = self.session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        now = datetime.now()
        assert data["month"] == now.month, "Should default to current month"
        assert data["year"] == now.year, "Should default to current year"
    
    def test_create_calendar_event_success(self):
        """POST /api/calendar/events creates a custom event with title, date, type, color"""
        event_data = {
            "title": "TEST_Album Release Party",
            "date": "2026-04-15",
            "event_type": "custom",
            "color": "#E040FB",
            "notes": "Big launch event",
            "reminder": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain event id"
        assert data["title"] == event_data["title"], "Title should match"
        assert data["date"] == event_data["date"], "Date should match"
        assert data["type"] == event_data["event_type"], "Type should match"
        assert data["color"] == event_data["color"], "Color should match"
        assert data["notes"] == event_data["notes"], "Notes should match"
        assert data["reminder"] == event_data["reminder"], "Reminder should match"
        
        self.created_event_ids.append(data["id"])
        print(f"Created event: {data['id']}")
    
    def test_create_calendar_event_minimal(self):
        """POST /api/calendar/events with minimal data (title and date only)"""
        event_data = {
            "title": "TEST_Minimal Event",
            "date": "2026-04-20"
        }
        
        response = self.session.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["title"] == event_data["title"]
        assert data["date"] == event_data["date"]
        assert data["type"] == "custom", "Default type should be 'custom'"
        assert data["color"] == "#7C4DFF", "Default color should be #7C4DFF"
        
        self.created_event_ids.append(data["id"])
    
    def test_create_and_verify_event_in_calendar(self):
        """Create event and verify it appears in calendar events list"""
        # Create event
        event_data = {
            "title": "TEST_Verify Event",
            "date": "2026-04-10",
            "event_type": "deadline",
            "color": "#FF4081"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_event_ids.append(created["id"])
        
        # Verify in calendar
        get_response = self.session.get(f"{BASE_URL}/api/calendar/events?month=4&year=2026")
        assert get_response.status_code == 200
        
        events = get_response.json()["events"]
        found = next((e for e in events if e.get("id") == created["id"]), None)
        assert found is not None, "Created event should appear in calendar"
        assert found["title"] == event_data["title"]
        assert found["date"] == event_data["date"]
    
    def test_delete_calendar_event_success(self):
        """DELETE /api/calendar/events/{event_id} removes a custom event"""
        # First create an event
        event_data = {
            "title": "TEST_To Be Deleted",
            "date": "2026-04-25"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # Delete the event
        delete_response = self.session.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        data = delete_response.json()
        assert "message" in data, "Should return success message"
        
        # Verify event is gone
        get_response = self.session.get(f"{BASE_URL}/api/calendar/events?month=4&year=2026")
        events = get_response.json()["events"]
        found = next((e for e in events if e.get("id") == event_id), None)
        assert found is None, "Deleted event should not appear in calendar"
    
    def test_delete_nonexistent_event_returns_404(self):
        """DELETE /api/calendar/events/{event_id} returns 404 for nonexistent event"""
        response = self.session.delete(f"{BASE_URL}/api/calendar/events/nonexistent_event_id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_get_upcoming_events(self):
        """GET /api/calendar/upcoming returns upcoming array sorted by date"""
        response = self.session.get(f"{BASE_URL}/api/calendar/upcoming")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "upcoming" in data, "Response should contain 'upcoming' key"
        assert isinstance(data["upcoming"], list), "Upcoming should be a list"
        
        # Verify structure if there are events
        for event in data["upcoming"]:
            assert "id" in event, "Event should have id"
            assert "title" in event, "Event should have title"
            assert "date" in event, "Event should have date"
            assert "days_until" in event, "Event should have days_until"
            assert "type" in event, "Event should have type"
        
        # Verify sorted by date
        if len(data["upcoming"]) > 1:
            dates = [e["date"] for e in data["upcoming"]]
            assert dates == sorted(dates), "Events should be sorted by date"
    
    def test_create_future_event_appears_in_upcoming(self):
        """Create a future event and verify it appears in upcoming"""
        # Create event 30 days from now
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        event_data = {
            "title": "TEST_Future Event",
            "date": future_date,
            "event_type": "reminder"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_event_ids.append(created["id"])
        
        # Check upcoming
        upcoming_response = self.session.get(f"{BASE_URL}/api/calendar/upcoming")
        assert upcoming_response.status_code == 200
        
        upcoming = upcoming_response.json()["upcoming"]
        found = next((e for e in upcoming if e.get("id") == created["id"]), None)
        assert found is not None, "Future event should appear in upcoming"
        assert found["days_until"] >= 29, "Days until should be approximately 30"
    
    def test_industry_dates_on_correct_days(self):
        """Verify industry dates appear on correct days of week"""
        response = self.session.get(f"{BASE_URL}/api/calendar/events?month=4&year=2026")
        assert response.status_code == 200
        
        events = response.json()["events"]
        industry_events = [e for e in events if e.get("type") == "industry"]
        
        for event in industry_events:
            date_str = event["date"]
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            weekday = date_obj.weekday()  # 0=Monday, 4=Friday
            
            if "New Music Friday" in event["title"]:
                assert weekday == 4, f"New Music Friday should be on Friday, got {weekday}"
            elif "Spotify" in event["title"] or "Apple" in event["title"]:
                assert weekday == 1, f"Spotify/Apple deadline should be on Tuesday, got {weekday}"
    
    def test_calendar_events_without_auth_returns_401(self):
        """GET /api/calendar/events without auth returns 401"""
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_create_event_without_auth_returns_401(self):
        """POST /api/calendar/events without auth returns 401"""
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        response = no_auth_session.post(f"{BASE_URL}/api/calendar/events", json={
            "title": "Test",
            "date": "2026-04-15"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
