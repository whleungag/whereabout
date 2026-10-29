const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

const getFilePath = () => {
  if (!path) return 'data.json';
  return path.join(process.cwd(), 'data.json');
};

export const localStore = {
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

  writePost: (newPost: any) => {
    const data = localStore.readData();
    data.posts.unshift(newPost);
    localStore.writeData(data);
  },

  addPost: (newPost: any) => {
    localStore.writePost(newPost);
  },

  updatePostFields: (postId: string, fields: any) => {
    const data = localStore.readData();
    data.posts = data.posts.map((p: any) => 
      p.id === postId ? { ...p, ...fields, updated_at: new Date().toISOString() } : p
    );
    localStore.writeData(data);
  },

  // 刪除成員及其關聯的所有行程
  deletePost: (postId: string) => {
    const data = localStore.readData();
    data.posts = data.posts.filter((p: any) => p.id !== postId);
    data.events = data.events.filter((e: any) => e.post_id !== postId);
    localStore.writeData(data);
  },

  addEvents: (newEvents: any[]) => {
    const data = localStore.readData();
    const formattedEvents = newEvents.map(ev => ({
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      ...ev
    }));
    data.events.push(...formattedEvents);
    localStore.writeData(data);
  },

  saveEvent: (event: any) => {
    const data = localStore.readData();
    const index = data.events.findIndex((e: any) => e.id === event.id);
    if (index >= 0) {
      data.events[index] = event;
    } else {
      data.events.push(event);
    }
    localStore.writeData(data);
  },

  deleteEvent: (eventId: string) => {
    const data = localStore.readData();
    data.events = data.events.filter((e: any) => e.id !== eventId);
    localStore.writeData(data);
  }
};
