import { X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

const statusDots = [
  { color: '#22c55e', label: 'Available' },
  { color: '#a855f7', label: 'In Training' },
  { color: '#60a5fa', label: 'On Leave' },
  { color: '#f59e0b', label: 'Meeting' },
  { color: '#ef4444', label: 'Other Engagement' },
  { color: '#d1d5db', label: 'Vacant (card greyed out)' },
];

const autoTagRules: {
  swatch: string;
  category: string;
  description: string;
  keywords: string[];
}[] = [
  {
    swatch: 'bg-blue-200',
    category: 'Leave',
    description: 'Annual / casual / sick leave and holidays',
    keywords: ['AL', 'VL', 'SL', 'leave', 'annual', 'vacation', 'holiday', 'off'],
  },
  {
    swatch: 'bg-purple-200',
    category: 'Training',
    description: 'Training sessions, courses and workshops',
    keywords: ['training', 'train', 'course', 'seminar', 'workshop'],
  },
  {
    swatch: 'bg-amber-200',
    category: 'Meeting',
    description: 'Meetings, briefings and presentations',
    keywords: ['meeting', 'meet', 'briefing', 'presentation', 'conference', 'discussion'],
  },
  {
    swatch: 'bg-gray-200',
    category: 'Other',
    description: 'Anything else — medical, site visits, WFH, etc.',
    keywords: ['(default when no keyword matches)'],
  },
];

export default function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="font-semibold text-gray-800 text-sm">Guide</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5 text-sm overflow-y-auto max-h-[80vh]">
          <p className="text-gray-500 text-xs">
            Each card is one post. Click a card to open and edit its schedule.
          </p>

          {/* Status dot legend */}
          <div>
            <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">Status indicator</div>
            <div className="flex flex-col gap-1.5">
              {statusDots.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-600">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Default is <strong>Available</strong> when there are no active events. Status auto-switches to In Training, On Leave, Meeting, or Other Engagement based on today's event category. You can override it manually inside the schedule.
            </p>
          </div>

          {/* Auto-tag keyword reference */}
          <div>
            <div className="font-semibold text-gray-700 mb-1 text-xs uppercase tracking-wider">
              Auto-tag keywords
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Type any of these words in the event name and the category is set automatically. You can still change it manually.
            </p>
            <div className="flex flex-col gap-3">
              {autoTagRules.map(rule => (
                <div key={rule.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded shrink-0 ${rule.swatch}`} />
                    <span className="text-xs font-semibold text-gray-700">{rule.category}</span>
                    <span className="text-xs text-gray-400">{rule.description}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-5">
                    {rule.keywords.map(kw => (
                      <span
                        key={kw}
                        className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600 border border-gray-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event row style guide */}
          <div>
            <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">Event row styles</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gray-600 shrink-0" /> Highlighted — active right now
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gray-300 shrink-0 opacity-50" /> Dimmed — past event
              </div>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">Repeating events</div>
            <p className="text-xs text-gray-500">
              When adding an event, choose a repeat frequency (Daily / Weekly / 2-week / Monthly) and a
              "Repeat until" date. The app creates individual entries for every occurrence — up to 52 at once.
              Each repeated entry shows a <span className="font-mono bg-gray-100 px-1 rounded">↻</span> icon in the list.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
