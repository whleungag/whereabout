import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    title: "Who's Around",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const indexPath = path.join(__dirname, 'build', 'index.html');
  mainWindow.loadFile(indexPath).catch(err => {
    console.error("Failed to load index.html:", err);
  });

  // 確保網頁載入完成後自動彈出開發者主控台，方便查看錯誤
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.openDevTools();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
