import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post, Event, Status } from '@/types';
import Header from '@/components/Header';
import PersonCard from '@/components/PersonCard';
import PersonModal from '@/components/PersonModal';
import CalendarView from '@/components/CalendarView';
import GuideModal from '@/components/GuideModal';
import AddPostModal from '@/components/AddPostModal';

function formatSyncTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [view, setView] = useState<'cards' | 'calendar'>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: postsData }, { data: eventsData }] = await Promise.all([
      supabase.from('posts').select('*').order('display_order').order('created_at'),
      supabase.from('events').select('*').order('date_start'),
    ]);
    if (postsData) setPosts(postsData as Post[]);
    if (eventsData) setEvents(eventsData as Event[]);
    setLastSync(formatSyncTime(new Date()));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // keyboard shortcuts
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); fetchData(); }
      if (e.key === 'Escape') { setSearch(''); setSelectedPost(null); setShowGuide(false); setShowAddPost(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(); }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'c' && document.activeElement === document.body) {
        setView(v => v === 'cards' ? 'calendar' : 'cards');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fetchData]);

  // If selectedPost changed (after refresh), sync it
  useEffect(() => {
    if (selectedPost) {
      const updated = posts.find(p => p.id === selectedPost.id);
      if (updated) setSelectedPost(updated);
    }
  }, [posts]);

  const filteredPosts = posts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.post_id.toLowerCase().includes(q) ||
      (p.nickname?.toLowerCase().includes(q) ?? false) ||
      p.status.toLowerCase().includes(q) ||
      events.filter(e => e.post_id === p.id).some(e => e.name.toLowerCase().includes(q) || (e.remarks?.toLowerCase().includes(q) ?? false))
    );
  });

  const eventsForPost = (id: string) => events.filter(e => e.post_id === id);
  const upcomingCount = events.filter(event => event.date_end >= new Date().toISOString().slice(0, 10)).length;

  function exportSchedule() {
    const rows = filteredPosts.flatMap(post => eventsForPost(post.id).map(event => [
      post.post_id,
      post.nickname ?? '',
      event.date_start,
      event.date_end,
      event.name,
      event.category,
      event.time_slot,
      event.remarks ?? '',
    ]));
    const csv = [['Post', 'Nickname', 'Start', 'End', 'Event', 'Category', 'Time', 'Remarks'], ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `whereabouts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-[#d8e4ed] bg-white px-6 py-5 text-sm font-medium text-[#56718a] shadow-sm">Preparing your team board...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell h-screen flex flex-col overflow-hidden">
      <Header
        view={view}
        onViewChange={setView}
        search={search}
        onSearch={setSearch}
        onRefresh={fetchData}
        onGuide={() => setShowGuide(true)}
        onExport={exportSchedule}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        lastSync={lastSync}
        totalRecords={posts.length}
        visibleRecords={filteredPosts.length}
        upcomingCount={upcomingCount}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'cards' ? (
          <div className="dashboard-scrollbar flex-1 overflow-y-auto px-5 py-6 lg:px-7">
            <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPosts.map(post => (
                <PersonCard
                  key={post.id}
                  post={post}
                  events={eventsForPost(post.id)}
                  onClick={() => setSelectedPost(post)}
                />
              ))}
              {/* Add new post card */}
              <button
                onClick={() => setShowAddPost(true)}
                className="min-h-[180px] cursor-pointer rounded-[22px] border border-dashed border-[#b9cddd] bg-white/60 p-4 text-[#7890a5] transition hover:border-[#67b7b0] hover:bg-[#f5fffc] hover:text-[#267b75]"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-semibold">Add a teammate</span>
              </button>
            </div>
          </div>
        ) : (
          <CalendarView
            posts={posts}
            events={events}
            onEditPost={p => setSelectedPost(p)}
          />
        )}
      </div>

      {selectedPost && (
        <PersonModal
          post={selectedPost}
          events={eventsForPost(selectedPost.id)}
          onClose={() => setSelectedPost(null)}
          onRefresh={fetchData}
        />
      )}

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showAddPost && <AddPostModal onClose={() => setShowAddPost(false)} onRefresh={fetchData} />}
    </div>
  );
}
