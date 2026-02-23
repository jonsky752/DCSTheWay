const { BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

class MainWindow extends BrowserWindow {
  constructor() {
    super({
      icon: path.join(__dirname, "../public/TheWayIcon.ico"),
      show: false,
      width: 300,
      height: 500,
      x: 3800, //0, //3800,
      y: 0, //screen.getPrimaryDisplay().workAreaSize.height - 500, //0,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      maximizable: false,
      resizable: false,
      transparent: true,
      frame: false,

      // Keep focusable true; we’ll manage focus *only* when needed
      focusable: false, //// changed by user

      // Ensure taskbar presence
      skipTaskbar: false,
    });

    this.setMenu(null);
    this.setSkipTaskbar(false);

    // Keep it above most windows, but avoid blur/restore spam that fights games
    const reassertOnTop = () => this.setAlwaysOnTop(true, "screen-saver");
    reassertOnTop();

    this.on("ready-to-show", () => {
      this.show();
      reassertOnTop();
    });

    this.on("show", reassertOnTop);

    // IPC
    ipcMain.on("minimize", () => {
      this.minimize();
    });

    ipcMain.on("close", () => {
      this.close();
    });

    // These are used when hovering inputs; keep them but don’t hard-flip always-on-top repeatedly
    ipcMain.on("focus", () => {
      this.setFocusable(true);
      this.show();
      this.focus();
      reassertOnTop();
    });

    ipcMain.on("defocus", () => {
      // Don’t set focusable false; it’s what causes “can’t alt-tab back” headaches
      // Just blur the active element in the renderer side (which you already do)
      reassertOnTop();
    });
  }
}

module.exports = MainWindow;