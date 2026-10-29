// 透過 Electron 的 nodeIntegration 存取 Node.js fs 與 path 模組
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

// 將共用資料檔存在 .exe 同級目錄下的 data.json (共用網路磁碟機)
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
      
      // 如果檔案不存在，自動初始化並建立空白的資料結構
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

  // 3. 新增貼文 (對應 AddPostModal)
  writePost: (newPost: any) => {
    const data = localStore.readData();
    data.posts.unshift(newPost); // 將新貼文插在最前面
    localStore.writeData(data);
  },

  // 相容舊的呼叫名稱
  addPost: (newPost: any) => {
    localStore.writePost(newPost);
  },

  // 4. 更新特定貼文的欄位 (如狀態、暱稱、工作時間等)
  updatePostFields: (postId: string, fields: any) => {
    const data = localStore.readData();
    data.posts = data.posts.map((p: any) => 
      p.id === postId ? { ...p, ...fields, updated_at: new Date().toISOString() } : p
    );
    localStore.writeData(data);
  },

  // 5. 刪除貼文及其關聯的所有行程事件
  deletePost: (postId: string) => {
    const data = localStore.readData();
    data.posts = data.posts.filter((p: any) => p.id !== postId);
    data.events = data.events.filter((e: any) => e.post_id !== postId);
    localStore.writeData(data);
  },

  // 6. 批次新增行程事件 (對應 PersonModal 的單筆或重複新增)
  addEvents: (newEvents: any[]) => {
    const data = localStore.readData();
    const formattedEvents = newEvents.map(ev => ({
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      ...ev
    }));
    data.events.push(...formattedEvents);
    localStore.writeData(data);
  },

  // 7. 刪除單一行程事件
  deleteEvent: (eventId: string) => {
    const data = localStore.readData();
    data.events = data.events.filter((e: any) => e.id !== eventId);
    localStore.writeData(data);
  }
};
