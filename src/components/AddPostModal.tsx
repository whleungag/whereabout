import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddPostModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddPostModal({ onClose, onRefresh }: AddPostModalProps) {
  const [postId, setPostId] = useState('');
  const [nickname, setNickname] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!postId.trim()) { setError('Post ID is required'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('posts').insert({
      post_id: postId.trim(),
      nickname: nickname.trim() || null,
      work_hours: workHours.trim() || null,
      status: 'available',
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onRefresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="font-semibold text-gray-800 text-sm">Add New Post</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Post ID *</label>
            <input
              value={postId} onChange={e => { setPostId(e.target.value); setError(''); }}
              placeholder="e.g. E/TSG/1"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nickname (optional)</label>
            <input
              value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="e.g. David"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Work hours (optional)</label>
            <input
              value={workHours} onChange={e => setWorkHours(e.target.value)}
              placeholder="e.g. 0830-1730 Mon-Thu"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Add Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
