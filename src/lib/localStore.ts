const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

// 資料存放在 .exe 同級目錄下的 data.json (共用磁碟機)
const getFilePath = () => {
  if (!path) return 'data.json';
  return path.join(process.cwd(), 'data.json');
};

export const localStore = {
  // 1. 讀取所有資料 (posts 與 events)
  readData: () => {
    try {
      if (!fs) return { posts: [], events: [] };
      const filePath = getFilePath();
      if (!fs.existsSync(filePath)) {
        const initialData = { posts: [], events: [] };
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
        return initialData;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data || '{}');
      return {
        posts: parsed.posts || [],
        events: parsed.events || []
      };
    } catch (err) {
      console.error("Failed to read local store:", err);
      return { posts: [], events: [] };
    }
  },

  // 2. 寫入完整資料
  writeData: (data: { posts: any[]; events: any[] }) => {
    try {
      if (!fs) return;
      const filePath = getFilePath();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write local store:", err);
      throw err;
    }
  },

  // 3. 新增貼文 (Add Post)
  addPost: (newPost: any) => {
    const data = localStore.readData();
    data.posts.unshift(newPost);
    localStore.writeData(data);
  },

  // 4. 更新貼文 (Update Post)
  updatePost: (updatedPost: any) => {
    const data = localStore.readData();
    data.posts = data.posts.map((p: any) => p.id === updatedPost.id ? updatedPost : p);
    localStore.writeData(data);
  },

  // 5. 刪除貼文與其關聯事件 (Delete Post)
  deletePost: (postId: string) => {
    const data = localStore.readData();
    data.posts = data.posts.filter((p: any) => p.id !== postId);
    data.events = data.events.filter((e: any) => e.post_id !== postId);
    localStore.writeData(data);
  },

  // 6. 儲存/新增行程事件 (Save Event)
  saveEvent: (newEvent: any) => {
    const data = localStore.readData();
    const index = data.events.findIndex((e: any) => e.id === newEvent.id);
    if (index >= 0) {
      data.events[index] = newEvent;
    } else {
      data.events.push(newEvent);
    }
    localStore.writeData(data);
  },

  // 7. 刪除行程事件 (Delete Event)
  deleteEvent: (eventId: string) => {
    const data = localStore.readData();
    data.events = data.events.filter((e: any) => e.id !== eventId);
    localStore.writeData(data);
  }
};
