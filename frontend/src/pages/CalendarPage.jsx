import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CaretLeft, CaretRight, Plus, Disc, MusicNote, SpotifyLogo, AppleLogo, CalendarBlank, Clock, Trash, X, FloppyDisk } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EVENT_COLORS = ['#7C4DFF', '#E040FB', '#FF4081', '#22C55E', '#FFD700', '#00BCD4', '#FF5722'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', event_type: 'custom', color: '#7C4DFF', notes: '', reminder: false });
  const [loading, setLoading] = useState(true);
  useBodyScrollLock(showForm);

  const fetchEvents = useCallback(async () => {
    try {
      const [eventsResponse, upcomingResponse] = await Promise.all([
        axios.get(`${API}/api/calendar/events?month=${month + 1}&year=${year}`, { withCredentials: true }),
        axios.get(`${API}/api/calendar/upcoming`, { withCredentials: true }),
      ]);
      setEvents(eventsResponse.data?.events || []);
      setUpcoming(upcomingResponse.data?.upcoming || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setMonth(now.getMonth()); setYear(now.getFullYear()); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedDateStr = selectedDate ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}` : null;
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleAddEvent = async () => {
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    const dateStr = form.date || selectedDateStr;
    if (!dateStr) { toast.error('Select a date'); return; }
    try {
      await axios.post(`${API}/api/calendar/events`, { ...form, date: dateStr }, { withCredentials: true });
      toast.success('Event added!');
      setShowForm(false);
      setForm({ title: '', date: '', event_type: 'custom', color: '#7C4DFF', notes: '', reminder: false });
      fetchEvents();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error adding event'); }
  };

  const handleDelete = async (eventId) => {
    try {
      await axios.delete(`${API}/api/calendar/events/${eventId}`, { withCredentials: true });
      toast.success('Deleted');
      fetchEvents();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const getTypeIcon = (type) => {
    if (type === 'release') return <Disc className="w-3.5 h-3.5" weight="fill" />;
    if (type === 'industry') return <MusicNote className="w-3.5 h-3.5" />;
    return <CalendarBlank className="w-3.5 h-3.5" />;
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Loading calendar...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="calendar-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="calendar-title">Release Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">Plan releases, track industry dates, and set reminders</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setForm({ ...form, date: selectedDateStr || todayStr }); }}
            className="px-4 py-2.5 rounded-lg bg-[#7C4DFF] text-white text-sm font-medium hover:brightness-110 flex items-center gap-2"
            data-testid="add-event-btn"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" data-testid="prev-month">
                <CaretLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white" data-testid="current-month">{MONTHS[month]} {year}</h2>
                <button onClick={goToday} className="text-xs text-[#7C4DFF] hover:underline mt-0.5" data-testid="go-today">Today</button>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" data-testid="next-month">
                <CaretRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#222]">
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[90px] p-2" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = day === selectedDate;
                const dayEvents = getEventsForDate(day);

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                    className={`bg-[#0a0a0a] min-h-[90px] p-2 cursor-pointer transition hover:bg-white/5 ${
                      isSelected ? 'ring-1 ring-[#7C4DFF] bg-[#7C4DFF]/5' : ''
                    }`}
                    data-testid={`day-${day}`}
                  >
                    <span className={`text-xs font-medium ${
                      isToday ? 'bg-[#7C4DFF] text-white w-6 h-6 rounded-full inline-flex items-center justify-center' : 'text-gray-400'
                    }`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map(e => (
                        <div
                          key={e.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate"
                          style={{ backgroundColor: `${e.color}20`, color: e.color }}
                        >
                          {getTypeIcon(e.type)}
                          <span className="truncate">{e.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              {[
                { color: '#E040FB', label: 'Your Releases' },
                { color: '#7C4DFF', label: 'Custom Events' },
                { color: '#1DB954', label: 'Spotify Deadlines' },
                { color: '#FC3C44', label: 'Apple Music' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Selected Date Events */}
            {selectedDate && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-4" data-testid="selected-date-events">
                <h3 className="text-white font-semibold text-sm mb-3">
                  {MONTHS[month]} {selectedDate}, {year}
                </h3>
                {selectedEvents.length === 0 ? (
                  <p className="text-gray-500 text-xs">No events this day</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map(e => (
                      <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg bg-black/50">
                        <div className="w-1 h-full rounded-full shrink-0 mt-1" style={{ backgroundColor: e.color, minHeight: '24px' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{e.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{e.type}</p>
                        </div>
                        {e.type !== 'industry' && (
                          <button onClick={() => handleDelete(e.id)} className="text-gray-600 hover:text-red-400 shrink-0">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Countdowns */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4" data-testid="upcoming-releases">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E040FB]" /> Upcoming
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-xs">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(u => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#7C4DFF]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#7C4DFF] font-bold text-sm">{u.days_until}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.title}</p>
                        <p className="text-[10px] text-gray-500">{u.date} &middot; {u.days_until === 0 ? 'Today!' : `${u.days_until} day${u.days_until !== 1 ? 's' : ''}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Industry Dates Info */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4" data-testid="industry-info">
              <h3 className="text-white font-semibold text-sm mb-3">Industry Dates</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7C4DFF]" />
                  <span><strong className="text-white">New Music Friday</strong> — Every Friday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                  <span><strong className="text-white">Spotify Deadline</strong> — Every Tuesday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FC3C44]" />
                  <span><strong className="text-white">Apple Music</strong> — Every Tuesday</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">Submit releases at least 7 days before your target New Music Friday.</p>
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showForm && (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="add-event-modal">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Add Event</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Title</label>
                <input
                  className="w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]"
                  placeholder="e.g. Album Release, Mixing Deadline"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="event-title-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Date</label>
                <input
                  type="date"
                  className="w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]"
                  value={form.date || selectedDateStr || ''}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-testid="event-date-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Type</label>
                <select
                  className="w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF]"
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  data-testid="event-type-select"
                >
                  <option value="custom" className="bg-black">Custom Event</option>
                  <option value="reminder" className="bg-black">Reminder</option>
                  <option value="deadline" className="bg-black">Deadline</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                      data-testid={`color-${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C4DFF] mb-1 block">Notes (optional)</label>
                <textarea
                  className="w-full bg-black border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF] resize-none"
                  rows={2}
                  placeholder="Any notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  data-testid="event-notes-input"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reminder}
                  onChange={(e) => setForm({ ...form, reminder: e.target.checked })}
                  className="rounded border-white/20 bg-transparent"
                  data-testid="event-reminder-check"
                />
                Send me a reminder before this date
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button
                  onClick={handleAddEvent}
                  className="px-6 py-2.5 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:brightness-110 flex items-center gap-2"
                  data-testid="save-event-btn"
                >
                  <FloppyDisk className="w-4 h-4" /> Save Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
