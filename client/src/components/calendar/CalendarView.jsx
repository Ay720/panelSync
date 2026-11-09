import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Video,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const CalendarView = ({
  interviews = [],
  calendarEvents = [],
  onEventClick,
  onSyncAll,
  syncing = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'month' | 'week' | 'day'

  // Navigation helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() - 1);
    else if (view === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() + 1);
    else if (view === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Week calculation
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  // Month calculation
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon start
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const monthDays = getMonthDays(currentDate);

  // Filter events for a given day
  const getInterviewsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return interviews.filter((int) => {
      const intDate = new Date(int.scheduledStartTime).toDateString();
      return intDate === dateStr;
    });
  };

  const getCalendarEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return calendarEvents.filter((ev) => {
      const evDate = new Date(ev.startTime).toDateString();
      return evDate === dateStr && ev.source === 'mock';
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-sm font-bold text-slate-900 ml-2">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(view === 'day' ? { day: 'numeric', weekday: 'short' } : {}),
            })}
          </h2>
        </div>

        {/* View Switcher & Mock Sync */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  view === v
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {onSyncAll && (
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={syncing}
              onClick={onSyncAll}
              title="Sync Google and Outlook mock calendar events"
            >
              Sync Calendars
            </Button>
          )}
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60">
              {weekDates.map((date, idx) => {
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`py-3 px-2 text-center border-r border-slate-100 ${
                      isToday ? 'bg-purple-50/50' : ''
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p
                      className={`text-sm font-bold mt-0.5 inline-flex w-7 h-7 items-center justify-center rounded-full ${
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Week Column Cells */}
            <div className="grid grid-cols-7 min-h-[500px] divide-x divide-slate-100">
              {weekDates.map((date, idx) => {
                const dayInterviews = getInterviewsForDate(date);
                const dayMockEvents = getCalendarEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`p-2 space-y-2 min-h-[480px] ${
                      isToday ? 'bg-purple-50/10' : ''
                    }`}
                  >
                    {/* Scheduled Interviews */}
                    {dayInterviews.map((int) => (
                      <div
                        key={int._id}
                        onClick={() => onEventClick && onEventClick(int)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer shadow-sm transition-all hover:scale-[1.02] ${
                          int.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : int.status === 'rescheduled'
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : int.status === 'cancelled'
                            ? 'bg-rose-50 border-rose-200 text-rose-950 opacity-60'
                            : 'bg-purple-50 border-purple-200 text-purple-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold truncate text-[11px]">
                            {int.candidate?.name || 'Candidate'}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase bg-white/80">
                            {int.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">
                          {int.title}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(int.scheduledStartTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Mock Busy Events (Standups, 1-on-1s) */}
                    {dayMockEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev._id}
                        className="p-1.5 rounded-lg bg-slate-100/90 border border-slate-200/70 text-[10px] text-slate-600 font-medium"
                      >
                        <div className="flex items-center gap-1 text-slate-500 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="truncate">{ev.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                          {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 border-b border-slate-100 auto-rows-fr">
            {monthDays.map((date, idx) => {
              if (!date) {
                return (
                  <div key={idx} className="min-h-[110px] bg-slate-50/40 border-r border-b border-slate-100" />
                );
              }

              const dayInterviews = getInterviewsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 border-r border-b border-slate-100 flex flex-col justify-between ${
                    isToday ? 'bg-purple-50/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full ${
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayInterviews.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 rounded-full">
                        {dayInterviews.length} sessions
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayInterviews.slice(0, 2).map((int) => (
                      <div
                        key={int._id}
                        onClick={() => onEventClick && onEventClick(int)}
                        className="px-1.5 py-1 rounded bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[10px] font-semibold text-brand-900 truncate cursor-pointer transition-colors"
                      >
                        {new Date(int.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        {int.candidate?.name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayInterviews.length > 2 && (
                      <p className="text-[9px] text-slate-400 font-medium text-center">
                        +{dayInterviews.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="p-6">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4">
              Schedule for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>

            {getInterviewsForDate(currentDate).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No interviews scheduled for this day.
              </div>
            ) : (
              getInterviewsForDate(currentDate).map((int) => (
                <div
                  key={int._id}
                  onClick={() => onEventClick && onEventClick(int)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-400 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{int.title}</p>
                      <p className="text-xs text-slate-500">
                        Candidate: <strong>{int.candidate?.name}</strong> • Role: {int.jobRole}
                      </p>
                      <p className="text-xs text-brand-600 font-mono mt-1">
                        {new Date(int.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(int.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={int.status}>{int.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

