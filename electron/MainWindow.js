const { BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

class MainWindow extends BrowserWindow {
  constructor() {
    super({
      icon: path.join(__dirname, "../public/TheWayIcon.ico"),
      show: false,
      width: 300,
      height: 500,
      x: 0, //3800,
      y: screen.getPrimaryDisplay().workAreaSize.height - 500, //0,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      maximizable: false,
      resizable: false,
      transparent: true,
      frame: false,
      focusable: false,
    });

    this.setMenu(null);

    if (process.platform === "win32") {
      const WM_INITMENU = 0x0116;
      this.hookWindowMessage(WM_INITMENU, () => {
        this.setEnabled(false);
        this.setEnabled(true);
      });
    }

    this.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Keep this initial call (helps in many cases)
    this.setAlwaysOnTop(true, "screen-saver");

    // Re-assert always-on-top AFTER the window is actually visible
    const reassertOnTop = () => {
      this.setAlwaysOnTop(true, "screen-saver");
    };

    this.on("show", reassertOnTop);
    this.on("restore", () => {
      this.setFocusable(false);
      reassertOnTop();
    });
    this.on("blur", reassertOnTop); // optional, but helps with fullscreen games

    ipcMain.on("minimize", () => {
      this.setFocusable(true);
      this.minimize();
    });

    ipcMain.on("close", () => {
      this.close();
    });

    ipcMain.on("focus", () => {
      this.setFocusable(true);
      reassertOnTop();
    });

    ipcMain.on("defocus", () => {
      this.setFocusable(false);
      reassertOnTop();
    });

    this.on("ready-to-show", () => {
      this.show();
      reassertOnTop(); // extra nudge right after showing
    });
  }
}

module.exports = MainWindow;
