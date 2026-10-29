import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { Post, Event, Status, TimeSlot, EventCategory, DateMode } from '@/types';
import { localStore } from '@/lib/localStore'; // 改用本地檔案儲存
import {
  STATUS_CONFIG,
  CATEGORY_COLORS,
  CATEGORY_BAR,
  inferCategory,
  computeStatus,
  expandRepeat,
  formatDateRange,
  formatTimeSlot,
  isPast,
  toDateString,
  RepeatFrequency,
} from '@/lib/utils';

interface PersonModalProps {
  post: Post;
  events: Event[];
  onClose: () => void;
  onRefresh: () => void;
}

const STATUSES: Status[] = ['available', 'in_training', 'on_leave', 'meeting', 'other_engagement', 'vacant'];

const CATEGORY_CFG: Record<EventCategory, { label: string; active: string }> = {
  leave:    { label: 'Leave',    active: 'bg-blue-100 border-blue-400 text-blue-700' },
  training: { label: 'Training', active: 'bg-purple-100 border-purple-400 text-purple-700' },
  meeting:  { label: 'Meeting',  active: 'bg-amber-100 border-amber-400 text-amber-700' },
  other:    { label: 'Other',    active: 'bg-gray-100 border-gray-400 text-gray-700' },
};

const REPEAT_OPTIONS: { id: RepeatFrequency; label: string }[] = [
  { id: 'none',     label: 'None' },
  { id: 'daily',    label: 'Daily' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'biweekly', label: '2-week' },
  { id: 'monthly',  label: 'Monthly' },
];

function getDefaultUntil(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return toDateString(d);
}

function MiniCalendar({
  year, month, selected, rangeStart, rangeEnd, multi, mode,
  onSelect, onNavigate,
}: {
  year: number; month: number;
  selected: string[]; rangeStart: string | null; rangeEnd: string | null;
  multi: string[]; mode: DateMode;
  onSelect: (d: string) => void;
  onNavigate: (dir: -1 | 1) => void;
}) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayHeaders = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  const todayStr = toDateString(new Date());

  function getClass(day: number | null): string {
    if (!day) return '';
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const base = 'w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-blue-100 transition-colors ';
    const isSel = selected.includes(ds) || multi.includes(ds);
    const isToday = ds === todayStr;
    const isInRange = mode === 'range' && rangeStart && rangeEnd && ds >= rangeStart && ds <= rangeEnd;
    if (isSel)      return base + 'bg-blue-500 text-white font-semibold hover:bg-blue-600';
    if (isInRange)  return base + 'bg-blue-100 text-blue-800';
    if (isToday)    return base + 'ring-2 ring-blue-400 text-blue-600 font-semibold';
    if (new Date(ds) < new Date(todayStr)) return base + 'text-gray-400';
    return base + 'text-gray-700';
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onNavigate(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700">{monthNames[month]} {year}</span>
        <button onClick={() => onNavigate(1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {dayHeaders.map(h => (
          <div key={h} className="text-center text-xs text-gray-400 font-medium py-0.5">{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => (
          <div key={i} className="flex justify-center py-0.5">
            {day ? (
              <button
                className={getClass(day)}
                onClick={() => {
                  const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  onSelect(ds);
                }}
              >
                {day}
              </button>
            ) : <div className="w-7 h-7" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PersonModal({ post, events, onClose, onRefresh }: PersonModalProps) {
  const [editing, setEditing] = useState(false);
  const [editPostId, setEditPostId] = useState(post.post_id);
  const [editNickname, setEditNickname] = useState(post.nickname ?? '');
  const [editWorkHours, setEditWorkHours] = useState(post.work_hours ?? '');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState<EventCategory>('other');
  const [autoDetected, setAutoDetected] = useState(true);
  const [mode, setMode] = useState<DateMode>('single');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('full_day');
  const [timeFrom, setTimeFrom] = useState('09:00');
  const [timeTo, setTimeTo] = useState('10:00');
  const [repeatFreq, setRepeatFreq] = useState<RepeatFrequency>('none');
  const [repeatUntil, setRepeatUntil] = useState(getDefaultUntil);
  const [adding, setAdding] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([toDateString(today)]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [multiDates, setMultiDates] = useState<string[]>([]);
  const [rangeStep, setRangeStep] = useState<0 | 1>(0);

  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (!name.trim()) {
      setAutoDetected(true);
      setCategory('other');
      return;
    }
    if (autoDetected) {
      setCategory(inferCategory(name));
    }
  }, [name]);

  const derivedStatus = computeStatus(events, post.status);
  const isAutoStatus = derivedStatus !== post.status;
  const cfg = STATUS_CONFIG[derivedStatus];

  const totalOccurrences = useMemo(() => {
    let baseCount = 0;
    if (mode === 'single')  baseCount = selectedDates.length > 0 ? 1 : 0;
    else if (mode === 'range') baseCount = rangeStart && rangeEnd ? 1 : 0;
    else baseCount = multiDates.length;

    if (repeatFreq === 'none' || !repeatUntil || baseCount === 0) return baseCount;

    const firstBase    = mode === 'single' ? (selectedDates[0] ?? '') : mode === 'range' ? (rangeStart ?? '') : (multiDates[0] ?? '');
    const firstBaseEnd = mode === 'range'  ? (rangeEnd ?? firstBase) : firstBase;
    if (!firstBase) return baseCount;

    const expanded = expandRepeat(firstBase, firstBaseEnd, repeatFreq as Exclude<RepeatFrequency,'none'>, repeatUntil);
    return expanded.length * baseCount;
  }, [mode, selectedDates, rangeStart, rangeEnd, multiDates, repeatFreq, repeatUntil]);

  function handleNavigate(dir: -1 | 1) {
    let m = calMonth + dir, y = calYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setCalMonth(m); setCalYear(y);
  }

  function handleDateSelect(ds: string) {
    if (mode === 'single') {
      setSelectedDates([ds]);
    } else if (mode === 'range') {
      if (rangeStep === 0) {
        setRangeStart(ds); setRangeEnd(null); setRangeStep(1); setSelectedDates([ds]);
      } else {
        const [s, e] = ds < (rangeStart ?? ds) ? [ds, rangeStart!] : [rangeStart!, ds];
        setRangeStart(s); setRangeEnd(e); setRangeStep(0); setSelectedDates([s, e]);
      }
    } else {
      setMultiDates(prev => prev.includes(ds) ? prev.filter(d => d !== ds) : [...prev, ds]);
    }
  }

  function resetForm() {
    setName(''); setRemarks('');
    setCategory('other'); setAutoDetected(true);
    setMode('single'); setTimeSlot('full_day'); setTimeFrom('09:00'); setTimeTo('10:00');
    setRepeatFreq('none'); setRepeatUntil(getDefaultUntil());
    setSelectedDates([toDateString(new Date())]);
    setRangeStart(null); setRangeEnd(null); setMultiDates([]); setRangeStep(0);
  }

  // --- 改用 localStore 新增事件 ---
  async function handleAddEvent() {
    if (!name.trim()) return;

    let basePairs: { start: string; end: string }[] = [];
    if (mode === 'single') {
      const d = selectedDates[0];
      if (d) basePairs = [{ start: d, end: d }];
    } else if (mode === 'range') {
      if (rangeStart && rangeEnd) basePairs = [{ start: rangeStart, end: rangeEnd }];
    } else {
      basePairs = multiDates.map(d => ({ start: d, end: d }));
    }

    if (!basePairs.length) return;
    setAdding(true);

    const ruleLabel = repeatFreq !== 'none' && repeatUntil
      ? `${repeatFreq} until ${repeatUntil}` : null;

    const allPairs = (repeatFreq !== 'none' && repeatUntil)
      ? basePairs.flatMap(p => expandRepeat(p.start, p.end, repeatFreq as Exclude<RepeatFrequency,'none'>, repeatUntil))
      : basePairs;

    const rows = allPairs.map(p => ({
      post_id: post.id,
      name: name.trim(),
      event_type: 'available' as const,
      category,
      date_start: p.start,
      date_end: p.end,
      time_slot: timeSlot,
      time_from: timeSlot === 'time' ? timeFrom : null,
      time_to:   timeSlot === 'time' ? timeTo   : null,
      remarks: remarks.trim() || null,
      repeat_rule: ruleLabel,
    }));

    localStore.addEvents(rows);
    setAdding(false);
    resetForm();
    onRefresh();
  }

  // --- 改用 localStore 刪除事件 ---
  async function handleDeleteEvent(id: string) {
    localStore.deleteEvent(id);
    onRefresh();
  }

  // --- 改用 localStore 更新狀態 ---
  async function handleStatusChange(s: Status) {
    localStore.updatePostFields(post.id, { status: s });
    onRefresh();
  }

  // --- 改用 localStore 儲存貼文資訊 ---
  async function handleSavePost() {
    if (!editPostId.trim()) return;
    setSaving(true);
    localStore.updatePostFields(post.id, {
      post_id: editPostId.trim(),
      nickname: editNickname.trim() || null,
      work_hours: editWorkHours.trim() || null,
    });
    setSaving(false); setEditing(false); onRefresh();
  }

  const sortedEvents  = [...events].sort((a, b) => a.date_start.localeCompare(b.date_start));
  const pastEvents    = sortedEvents.filter(e => isPast(e.date_end));
  const futureEvents  = sortedEvents.filter(e => !isPast(e.date_end));
  const displayEvents = showPast ? sortedEvents : futureEvents;

  const addBtnLabel = adding ? 'Adding…'
    : totalOccurrences > 1 ? `Add ${totalOccurrences} events`
    : 'Add event';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input value={editPostId} onChange={e => setEditPostId(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold w-28 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="Nickname"
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input value={editWorkHours} onChange={e => setEditWorkHours(e.target.value)} placeholder="Work hours (optional)"
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <button onClick={handleSavePost} disabled={saving}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-700 text-base">{post.post_id}</span>
                {post.nickname && <span className="text-base text-gray-800">({post.nickname})</span>}
                <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:underline ml-1">edit</button>
              </div>
            )}
            {post.work_hours && !editing && (
              <span className="text-xs text-gray-500">{post.work_hours}</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors"
                style={{ borderColor: cfg.color, color: cfg.color }}
                title={isAutoStatus ? 'Auto-set from active event. Hover to override.' : 'Click to change'}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
                {isAutoStatus && <span className="ml-0.5 text-[9px] opacity-60 font-normal">auto</span>}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block w-40">
                <div className="px-3 py-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100 mb-1">
                  Override status
                </div>
                {STATUSES.map(s => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-4 flex flex-col gap-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New event</div>

              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Event name"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-500">Category</span>
                  {autoDetected && name.trim() && (
                    <span className="text-[10px] bg-blue-50 text-blue-500 border border-blue-200 rounded px-1.5 py-0.5 font-semibold leading-tight">auto</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {(Object.keys(CATEGORY_CFG) as EventCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setAutoDetected(false); }}
                      className={`flex-1 py-1 text-xs rounded-md border font-medium transition-colors ${
                        category === cat
                          ? CATEGORY_CFG[cat].active
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {CATEGORY_CFG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Remarks (location, optional)"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />

              <div className="flex gap-1">
                {(['single', 'range', 'multi'] as DateMode[]).map(m => (
                  <button key={m}
                    onClick={() => { setMode(m); setSelectedDates([]); setRangeStart(null); setRangeEnd(null); setMultiDates([]); setRangeStep(0); }}
                    className={`flex-1 py-1 text-xs rounded-md border capitalize transition-colors ${mode === m ? 'bg-blue-500 border-blue-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {m === 'single' ? 'Single' : m === 'range' ? 'Range' : 'Multi'}
                  </button>
                ))}
              </div>

              <MiniCalendar
                year={calYear} month={calMonth}
                selected={selectedDates} rangeStart={rangeStart} rangeEnd={rangeEnd}
                multi={multiDates} mode={mode}
                onSelect={handleDateSelect} onNavigate={handleNavigate}
              />

              <button
                onClick={() => {
                  const td = toDateString(new Date());
                  if (mode === 'single') setSelectedDates([td]);
                  else if (mode === 'range') { setRangeStart(td); setRangeEnd(null); setRangeStep(1); }
                  else setMultiDates(prev => prev.includes(td) ? prev.filter(d => d !== td) : [...prev, td]);
                  setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth());
                }}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
              >
                <span>📅</span> Today
              </button>

              <div className="flex gap-1">
                {(['full_day', 'am', 'pm', 'time'] as TimeSlot[]).map(ts => (
                  <button key={ts} onClick={() => setTimeSlot(ts)}
                    className={`flex-1 py-1 text-xs rounded-md border capitalize transition-colors ${timeSlot === ts ? 'bg-blue-500 border-blue-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {ts === 'full_day' ? 'Full day' : ts === 'am' ? 'AM' : ts === 'pm' ? 'PM' : 'Time'}
                  </button>
                ))}
              </div>
              {timeSlot === 'time' && (
                <div className="flex gap-2 items-center">
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <span className="text-gray-400 text-xs">–</span>
                  <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500 mb-1.5">Repeat</div>
                <div className="flex gap-1">
                  {REPEAT_OPTIONS.map(f => (
                    <button key={f.id} onClick={() => setRepeatFreq(f.id)}
                      className={`flex-1 py-1 text-[11px] rounded-md border transition-colors ${repeatFreq === f.id ? 'bg-blue-500 border-blue-500 text-white font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {repeatFreq !== 'none' && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">Repeat until</label>
                    <input
                      type="date"
                      value={repeatUntil}
                      onChange={e => setRepeatUntil(e.target.value)}
                      min={toDateString(new Date())}
                      className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    {totalOccurrences > 1 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold">
                        <RefreshCw className="w-3 h-3" />
                        Creates {totalOccurrences} occurrences
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={handleAddEvent}
                disabled={adding || !name.trim()}
                className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {addBtnLabel}
              </button>
              <button onClick={resetForm}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Events ({futureEvents.length})
              </span>
              {pastEvents.length > 0 && (
                <button
                  onClick={() => setShowPast(p => !p)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
                >
                  {showPast ? 'Hide past' : `${pastEvents.length} past`}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {displayEvents.length === 0 && (
                <div className="text-xs text-gray-400 italic py-4 text-center">No events. Add one on the left.</div>
              )}
              {displayEvents.map(ev => {
                const past = isPast(ev.date_end);
                return (
                  <div key={ev.id}
                    className={`flex items-center text-sm rounded border overflow-hidden ${CATEGORY_COLORS[ev.category]} ${past ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-1 self-stretch shrink-0 ${CATEGORY_BAR[ev.category]}`} />
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0">
                      <span className="font-semibold shrink-0 text-xs text-gray-600 w-12">
                        {formatDateRange(ev.date_start, ev.date_end)}
                      </span>
                      <span className="font-medium truncate">
                        {ev.name}
                        {ev.remarks && <span className="font-normal text-gray-500 ml-1">({ev.remarks})</span>}
                      </span>
                      {ev.time_slot !== 'full_day' && (
                        <span className="text-xs shrink-0 text-gray-500">
                          {formatTimeSlot(ev.time_slot, ev.time_from, ev.time_to)}
                        </span>
                      )}
                      {ev.repeat_rule && (
                        <RefreshCw className="w-3 h-3 shrink-0 text-gray-400" title={ev.repeat_rule} />
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="px-3 text-gray-400 hover:text-red-500 shrink-0 transition-colors text-base font-light"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
