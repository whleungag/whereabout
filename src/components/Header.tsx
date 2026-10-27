import { Calendar, Download, Grid2X2, HelpCircle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { Status } from '@/types';
import { STATUS_CONFIG } from '@/lib/utils';

interface HeaderProps {
  view: 'cards' | 'calendar';
  onViewChange: (v: 'cards' | 'calendar') => void;
  search: string;
  onSearch: (s: string) => void;
  onRefresh: () => void;
  onGuide: () => void;
  onExport: () => void;
  statusFilter: Status | 'all';
  onStatusFilter: (status: Status | 'all') => void;
  lastSync: string | null;
  totalRecords: number;
  visibleRecords: number;
  upcomingCount: number;
}

export default function Header({
  view,
  onViewChange,
  search,
  onSearch,
  onRefresh,
  onGuide,
  onExport,
  statusFilter,
  onStatusFilter,
  lastSync,
  totalRecords,
  visibleRecords,
  upcomingCount,
}: HeaderProps) {
  return (
    <header className="border-b border-[#d5e1eb] bg-[#f8fbfd]/95 shadow-[0_1px_0_rgba(255,255,255,.8)] backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-5 py-4 lg:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 pr-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#123b5d] text-[#b5eee0] shadow-[0_8px_18px_rgba(18,59,93,.18)]">
              <span className="text-lg font-black tracking-[-0.15em]">W/</span>
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[#123b5d]">Who's Around?</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#7890a5]">Team presence board</div>
            </div>
          </div>

          <div className="relative min-w-[220px] flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7790a6]" />
            <input
              type="search"
              placeholder="Find a person, post or event"
              value={search}
              onChange={e => onSearch(e.target.value)}
              className="w-full rounded-xl border border-[#cfdeea] bg-white py-2.5 pl-10 pr-4 text-sm text-[#123b5d] outline-none transition focus:border-[#67b7b0] focus:ring-4 focus:ring-[#b5eee0]/40"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-[#eef4f8] px-1.5 py-0.5 text-[10px] font-semibold text-[#7790a6] sm:block">Ctrl F</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={onExport} title="Export visible schedule" className="toolbar-button"><Download className="h-4 w-4" /></button>
            <button onClick={onRefresh} title="Refresh schedule" className="toolbar-button"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={onGuide} title="Open guide" className="toolbar-button"><HelpCircle className="h-4 w-4" /></button>
            <button onClick={() => onViewChange(view === 'cards' ? 'calendar' : 'cards')} title="Switch view" className="toolbar-button">
              {view === 'cards' ? <Calendar className="h-4 w-4" /> : <Grid2X2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#668098]"><SlidersHorizontal className="h-3.5 w-3.5" /> Show</div>
          <select value={statusFilter} onChange={e => onStatusFilter(e.target.value as Status | 'all')} className="filter-select">
            <option value="all">Everyone</option>
            {(Object.keys(STATUS_CONFIG) as Status[]).map(status => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}
          </select>
          <div className="h-5 w-px bg-[#d5e1eb]" />
          <span className="metric-pill"><span className="metric-dot bg-[#67b7b0]" /> {upcomingCount} upcoming</span>
          <span className="metric-pill"><span className="metric-dot bg-[#f0b76b]" /> {visibleRecords} shown</span>
          <span className="text-xs text-[#8aa0b3]">{totalRecords} total posts</span>
          {lastSync && <span className="ml-auto text-xs text-[#8aa0b3]">Updated {lastSync}</span>}
        </div>
      </div>
    </header>
  );
}
