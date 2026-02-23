const path = require("path");
const { app, ipcMain, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");
const Store = require("electron-store");

const UDPListener = require("./UDPListener.js");
const UDPSender = require("./TCPSender");
const UserPreferenceHandler = require("./userPreferenceHandler");
const MainWindow = require("./MainWindow.js");
const {
  default: installExtension,
  REDUX_DEVTOOLS,
} = require("electron-devtools-installer");
const CrosshairWindow = require("./CrosshairWindow");
const FileHandler = require("./fileHandler");
const setupKeybinds = require("./keybindListener");

let mainWindow;
let crosshairWindow;
let unitImportWindow;
let udpListener;
let fileHandler;
let udpSender;
let userPreferenceHandler;

let isQuitting = false;

const winStore = new Store({ name: "window-state" });

function buildAppUrl(windowName) {
  const suffix = windowName ? `?window=${windowName}` : "";
  return isDev
    ? `http://localhost:3000${suffix}`
    : `file://${path.join(__dirname, "../build/index.html")}${suffix}`;
}

async function createWindow() {
  mainWindow = new MainWindow();

  // Force taskbar identity (helps Windows show/recall your app properly)
  if (process.platform === "win32") {
    try {
      app.setAppUserModelId("com.theway.app");
    } catch {}
  }

  if (isDev) {
    const options = { loadExtensionOptions: { allowFileAccess: true } };
    await installExtension(REDUX_DEVTOOLS, options);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.loadURL(buildAppUrl(null));
  mainWindow.setSkipTaskbar(false);

  mainWindow.on("closed", () => app.quit());
}

function sendCrosshairToDcs(enabled) {
  // Fire-and-forget. Uses same TCP port as your existing crosshair logic.
  try {
    const net = require("net");
    const client = new net.Socket();
    client.connect(42070, "127.0.0.1", function () {
      client.write(JSON.stringify({ type: "crosshair", payload: enabled ? "true" : "false" }) + "\n");
      client.end();
    });
    client.on("error", () => {});
  } catch {}
}

function createOrShowUnitImport() {
  // If it already exists, bring it up cleanly.
  if (unitImportWindow && !unitImportWindow.isDestroyed()) {
    if (unitImportWindow.isMinimized()) unitImportWindow.restore();
    unitImportWindow.show();
    unitImportWindow.moveTop();
    unitImportWindow.focus();
    sendCrosshairToDcs(true);
    return;
  }

  const saved = winStore.get("unitImportBounds");

  unitImportWindow = new BrowserWindow({
    title: "TheWay - Unit Import",
    width: saved?.width ?? 1400,
    height: saved?.height ?? 900,
    x: saved?.x,
    y: saved?.y,
    minWidth: 250,
    minHeight: 225,
    alwaysOnTop: true,
    focusable: true,
    skipTaskbar: false,

    // IMPORTANT: do NOT parent this to mainWindow (causes taskbar/alt-tab weirdness)
    // parent: mainWindow,
    // modal: false,

    show: false,
    autoHideMenuBar: true,

    // Make sure it has a taskbar presence
    skipTaskbar: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  // Keep Unit Import above everything (including DCS windowed)
unitImportWindow.setAlwaysOnTop(true, "screen-saver");
unitImportWindow.setVisibleOnAllWorkspaces(true);

unitImportWindow.on("show", () => {
  unitImportWindow.moveTop();
  unitImportWindow.focus();
  sendCrosshairToDcs(true);
});

  unitImportWindow.setSkipTaskbar(false);

  unitImportWindow.on("hide", () => {
    sendCrosshairToDcs(false);
  });

  // Do NOT force always-on-top here; it causes “snaps behind DCS / can’t alt-tab back” loops.
  // If you still want it slightly above your own app only, you can uncomment this:
  // unitImportWindow.setAlwaysOnTop(true, "normal");

  unitImportWindow.loadURL(buildAppUrl("unitImport"));

  // Don’t auto-open devtools for this window (it’s been causing renderer/sandbox noise & crashes)
  // if (isDev) unitImportWindow.webContents.openDevTools({ mode: "detach" });

  unitImportWindow.webContents.on("render-process-gone", (_e, details) => {
    console.error("[UnitImport] render-process-gone:", details);
  });

  unitImportWindow.once("ready-to-show", () => {
  unitImportWindow.show();
  unitImportWindow.moveTop();
  unitImportWindow.focus();
});

  // Persist bounds
  unitImportWindow.on("close", (e) => {
    // Persist bounds
    try {
      winStore.set("unitImportBounds", unitImportWindow.getBounds());
    } catch {}

    // Hide instead of destroying so the last snapshot/state is preserved.
    // Allow real close when the app is quitting.
    if (!isQuitting) {
      e.preventDefault();
      unitImportWindow.hide();
      sendCrosshairToDcs(false);
    }
  });

  unitImportWindow.on("closed", () => {
  // Always force crosshair off when Unit Import window goes away
  try {
    udpSender && ipcMain && mainWindow; // keep linter quiet
    mainWindow?.webContents?.send("noop"); // no-op
  } catch {}

  // Send to DCS: hide DCS crosshair
  sendCrosshairToDcs(false);

  unitImportWindow = null;
});
}

const isTheOnlyInstance = app.requestSingleInstanceLock();
if (!isTheOnlyInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.whenReady().then(() => {
    createWindow();

    // ✅ CRITICAL FIX: pass the unitImportWindow getter so UDP can forward snapshots to it
    udpListener = new UDPListener(mainWindow, () => unitImportWindow);

    fileHandler = new FileHandler(mainWindow);
    udpSender = new UDPSender();
    userPreferenceHandler = new UserPreferenceHandler(
      mainWindow,
      applyElectronPreferences,
    );

    ipcMain.on("f10Start", () => {
      crosshairWindow = new CrosshairWindow();
    });

    ipcMain.on("f10Stop", () => {
      if (crosshairWindow) crosshairWindow.close();
      crosshairWindow = null;
    });

    // ================= Unit Import IPC (register once) =================
    ipcMain.removeAllListeners("unitImport:addWaypoints");
    ipcMain.removeAllListeners("unitImport:close");

    ipcMain.on("unitImport:addWaypoints", (_event, waypoints) => {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send("unitImport:addWaypoints", waypoints);
      }
    });

    ipcMain.on("unitImport:close", () => {
      if (unitImportWindow && !unitImportWindow.isDestroyed()) {
        unitImportWindow.hide();
        sendCrosshairToDcs(false);
      }
    });

    ipcMain.on("openUnitImport", () => {
      createOrShowUnitImport();
    });

    ipcMain.on("closeUnitImport", () => {
      if (unitImportWindow && !unitImportWindow.isDestroyed()) {
        unitImportWindow.hide();
        sendCrosshairToDcs(false);
      }
    });

    function applyElectronPreferences(preferences) {
      const alwaysOnTop = preferences["alwaysOnTop"];
      const crosshairColor = preferences["crosshairColor"];
      setupKeybinds(mainWindow, preferences);

      if (alwaysOnTop === false) {
        mainWindow.setAlwaysOnTop(false, "screen-saver");
      }

      if (crosshairColor && crosshairWindow) {
        crosshairWindow.webContents.send("crosshairColor", crosshairColor);
      }
    }
  });

  app.on("window-all-closed", () => app.quit());
}