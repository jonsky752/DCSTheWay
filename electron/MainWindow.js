const { BrowserWindow, screen } = require("electron");
const path = require("path");

class MainWindow extends BrowserWindow {
  constructor() {
    const workArea = screen.getPrimaryDisplay().workAreaSize;

    super({
      icon: path.join(__dirname, "../public/TheWayIcon.ico"),
      show: false,
      width: 300,
      height: 500,
      x: 3800,//0,
      y: 0,//workArea.height - 500,

      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },

      maximizable: false,
      resizable: false,
      transparent: true,
      frame: false,

      // Overlay behaviour: do not steal focus from DCS
      focusable: false,

      // We'll manage taskbar/alt-tab via a restore window when hidden
      skipTaskbar: true,
    });

    this.setMenu(null);

    const reassertOnTop = () => this.setAlwaysOnTop(true, "screen-saver");
    reassertOnTop();

    // Show without activating so we don't steal focus from DCS.
    this.on("ready-to-show", () => {
      this.showInactive();
      reassertOnTop();
    });

    this.on("show", reassertOnTop);
  }
}

module.exports = MainWindow;
