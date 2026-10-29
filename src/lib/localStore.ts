const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

// 資料存放在 .exe 同級目錄下的 data.json (共用磁碟機)
const getFilePath = () => {
  if (!path) return 'data.json';
  return path.join(process.cwd(), 'data.json');
};

export const localStore = {
  // 讀取所有資料 (posts 與 events)
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

  // 儲存完整資料
  writeData: (data: { posts: any[]; events: any[] }) => {
    try {
      if (!fs) return;
      const filePath = getFilePath();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write local store:", err);
      throw err;
    }
  }
};
