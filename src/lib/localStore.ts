// 透過 Electron 的 nodeIntegration 存取 Node.js fs 模組
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

// 將資料檔存在 .exe 同級目錄下的 data.json
const getFilePath = () => {
  if (!path) return 'data.json';
  return path.join(process.cwd(), 'data.json');
};

export const localStore = {
  // 讀取所有貼文 / 成員資料
  readPosts: () => {
    try {
      if (!fs) return [];
      const filePath = getFilePath();
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error("Failed to read local store:", err);
      return [];
    }
  },

  // 寫入/新增貼文
  writePost: (newPost: any) => {
    try {
      if (!fs) return false;
      const filePath = getFilePath();
      const currentPosts = localStore.readPosts();
      const updatedPosts = [newPost, ...currentPosts];
      fs.writeFileSync(filePath, JSON.stringify(updatedPosts, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error("Failed to write to local store:", err);
      throw err;
    }
  }
};
