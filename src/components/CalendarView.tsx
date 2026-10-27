import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Post, Event } from '@/types';
import { CATEGORY_CAL, formatDateRange, toDateString } from '@/lib/utils';

interface CalendarViewProps {
  posts: Post[];
  events: Event[];
  onEditPost: (post: Post) => void;
}

function getPostByUUID(posts: Post[], id: string) {
  return posts.find(p => p.id === id);
}

export default function CalendarView({ posts, events, onEditPost }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateString(today));
  const [filterPost, setFilterPost] = useState<string>('all');

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  function goToday() {
    setYear(today.getFullYear()); setMonth(today.getMonth());
    setSelectedDay(toDateString(today));
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const filteredEvents = filterPost === 'all' ? events : events.filter(e => e.post_id === filterPost);

  function eventsForDay(day: number): Event[] {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date_start <= ds && ds <= e.date_end);
  }

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return filteredEvents.filter(e => e.date_start <= selectedDay && selectedDay <= e.date_end);
  }, [selectedDay, filteredEvents]);

  const todayStr = toDateString(today);
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDateObj = selectedDay ? new Date(selectedDay + 'T00:00:00') : null;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cal header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={goToday} className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50 transition-colors">
            Today
          </button>
          <span className="text-base font-semibold text-gray-800">{monthNames[month]} {year}</span>
          <div className="flex-1" />
          <select
            value={filterPost}
            onChange={e => setFilterPost(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          >
            <option value="all">All members</option>
            {posts.map(p => (
              <option key={p.id} value={p.id}>
                {p.post_id}{p.nickname ? ` (${p.nickname})` : ''}
              </option>
            ))}
          </select>
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayHeaders.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 || i === 6 ? 'text-gray-400' : 'text-gray-600'}`}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: '120px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="border-r border-b border-gray-100 bg-gray-50/30" />;
              const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              const dayEvents = eventsForDay(day);
              const isWeekend = i % 7 === 0 || i % 7 === 6;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(ds)}
                  className={`border-r border-b border-gray-100 p-1.5 cursor-pointer transition-colors overflow-hidden
                    ${isWeekend ? 'bg-gray-50/50' : ''}
                    ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex justify-center mb-1">
                    <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium
                      ${isToday ? 'bg-blue-500 text-white' : isWeekend ? 'text-gray-400' : 'text-gray-700'}
                    `}>
                      {day}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const p = getPostByUUID(posts, ev.post_id);
                      const calClass = CATEGORY_CAL[ev.category];
                      return (
                        <div key={ev.id} className={`text-xs px-1 py-0.5 rounded truncate ${calClass}`}>
                          {p ? (p.nickname || p.post_id) : '?'} · {ev.name}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col overflow-hidden bg-white">
        {selectedDateObj && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <span className="font-semibold text-gray-800">
                  {dayNames[selectedDateObj.getDay()]} {selectedDateObj.getDate()} {monthShort[selectedDateObj.getMonth()]}
                </span>
                <span className="text-sm text-gray-500 ml-1">{selectedDateObj.getFullYear()}</span>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <span className="text-gray-400 text-lg leading-none">+</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {selectedEvents.length === 0 ? (
                <div className="text-xs text-gray-400 italic text-center py-6">No events on this day</div>
              ) : (
                (() => {
                  const byPost = new Map<string, Event[]>();
                  selectedEvents.forEach(ev => {
                    const existing = byPost.get(ev.post_id) ?? [];
                    existing.push(ev);
                    byPost.set(ev.post_id, existing);
                  });
                  return Array.from(byPost.entries()).map(([postId, evs]) => {
                    const p = getPostByUUID(posts, postId);
                    return (
                      <div key={postId} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <div>
                            <span className="text-xs font-semibold text-gray-600">{p?.post_id}</span>
                            {p?.nickname && <span className="text-xs text-gray-500 ml-1">{p.nickname}</span>}
                          </div>
                          <button onClick={() => p && onEditPost(p)} className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                            </svg>
                          </button>
                        </div>
                        {evs.map(ev => {
                          const calClass = CATEGORY_CAL[ev.category];
                          return (
                            <div key={ev.id} className={`flex items-center gap-2 px-3 py-2 text-xs ${calClass} border-b border-gray-100 last:border-0`}>
                              <span className="font-medium">{formatDateRange(ev.date_start, ev.date_end)}</span>
                              {ev.time_slot !== 'full_day' && (
                                <span className="text-gray-600">{ev.time_slot === 'am' ? 'AM' : ev.time_slot === 'pm' ? 'PM' : `${ev.time_from}–${ev.time_to}`}</span>
                              )}
                              <span className="truncate">{ev.name}</span>
                              {ev.remarks && <span className="text-gray-500 truncate">{ev.remarks}</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </>
        )}
        {!selectedDateObj && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Select a day</div>
        )}
        <div className="px-4 py-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Calendar view</span>
        </div>
      </div>
    </div>
  );
}
