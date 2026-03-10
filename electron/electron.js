const path = require("path");
const {
  app,
  ipcMain,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  screen,
} = require("electron");
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

let restoreWindow; // Alt-Tab/taskbar restore stub
let pillWindow; // 28x28 icon-only restore overlay
let tray;

let suppressRestoreFocus = false;

let isQuitting = false;

const winStore = new Store({ name: "window-state" });

const ICON_ICO = path.join(__dirname, "../public/TheWayIcon.ico");

function buildAppUrl(windowName) {
  const suffix = windowName ? `?window=${windowName}` : "";
  return isDev
    ? `http://localhost:3000${suffix}`
    : `file://${path.join(__dirname, "../build/index.html")}${suffix}`;
}

function getPrimaryWorkArea() {
  // Use workArea (excludes taskbar) so our "bottom-left" sits just above it.
  const wa = screen.getPrimaryDisplay().workArea;
  return { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
}

function getMainDefaultBounds() {
  const wa = getPrimaryWorkArea();
  return { x: wa.x, y: wa.y + wa.height - 500, width: 300, height: 500 };
}

function getPillBounds() {
  const wa = getPrimaryWorkArea();
  return { x: wa.x, y: wa.y + wa.height - 28, width: 28, height: 28 };
}

function showOverlayInactive() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // Always keep overlay non-focus stealing.
  try {
    mainWindow.setFocusable(false);
  } catch {}

  // Ensure it's not minimized (we don't use minimize for the overlay, but just in case)
  try {
    if (mainWindow.isMinimized()) mainWindow.restore();
  } catch {}

  try {
    mainWindow.showInactive();
  } catch {
    // Fallback
    mainWindow.show();
  }

  // Keep it above DCS
  try {
    mainWindow.setAlwaysOnTop(true, "screen-saver");
  } catch {}

  // Hide helper windows
  try {
    if (restoreWindow && !restoreWindow.isDestroyed()) restoreWindow.hide();
  } catch {}
  try {
    if (pillWindow && !pillWindow.isDestroyed()) pillWindow.hide();
  } catch {}
}

function hideOverlayCompletely() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    mainWindow.hide();
  } catch {}

  ensureRestoreWindow();
  // Make the app recoverable via Alt-Tab even in borderless fullscreen scenarios.
  try {
    suppressRestoreFocus = true;

    try {
      // Show without stealing focus (prevents immediate restore flash)
      if (typeof restoreWindow.showInactive === "function") restoreWindow.showInactive();
      else restoreWindow.show();
      restoreWindow.minimize();
    } catch {}

    setTimeout(() => {
      suppressRestoreFocus = false;
    }, 200);
  } catch {}
}

function collapseToPill() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    mainWindow.hide();
  } catch {}

  ensurePillWindow();
  const b = getPillBounds();
  try {
    pillWindow.setBounds(b, false);
    pillWindow.showInactive();
    pillWindow.setAlwaysOnTop(true, "screen-saver");
  } catch {}

  // When pill is present, we don't *need* Alt-Tab restore, but tray still exists.
  try {
    if (restoreWindow && !restoreWindow.isDestroyed()) restoreWindow.hide();
  } catch {}
}

function ensureTray() {
  if (tray) return;

  try {
    tray = new Tray(ICON_ICO);
  } catch {
    // Fallback: create a blank image if icon fails (rare)
    tray = new Tray(nativeImage.createEmpty());
  }

  tray.setToolTip("TheWay");

  const menu = Menu.buildFromTemplate([
    { label: "Show TheWay", click: () => showOverlayInactive() },
    { label: "Hide TheWay", click: () => hideOverlayCompletely() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);

  tray.on("click", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) hideOverlayCompletely();
    else showOverlayInactive();
  });
}

function ensureRestoreWindow() {
  if (restoreWindow && !restoreWindow.isDestroyed()) return;

  restoreWindow = new BrowserWindow({
    title: "TheWay",
    width: 260,
    height: 100,
    show: false,
    frame: true,
    resizable: false,
    minimizable: true,
    maximizable: false,
    alwaysOnTop: false,
    focusable: true,
    skipTaskbar: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  // Keep content lightweight; the window is only a restore target.
  const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>TheWay</title></head>
  <body style="font-family: Segoe UI, sans-serif; margin: 12px;">
    <div style="font-size: 14px; margin-bottom: 6px;">TheWay is hidden.</div>
    <div style="opacity: 0.75; font-size: 12px;">Alt-Tab here to restore the overlay.</div>
  </body>
</html>`;
  restoreWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  // When the user Alt-Tabs to it (or clicks it), restore the overlay and get out of the way.
  const restore = () => {
    if (suppressRestoreFocus) return;
    showOverlayInactive();
    // Let Windows settle focus changes, then hide this helper.
    setTimeout(() => {
      try {
        restoreWindow && !restoreWindow.isDestroyed() && restoreWindow.hide();
      } catch {}
    }, 50);
  };

  restoreWindow.on("focus", restore);
  restoreWindow.on("show", () => {
    // Don't steal focus unnecessarily; if shown from our code we immediately minimize anyway.
  });

  restoreWindow.on("closed", () => {
    restoreWindow = null;
  });
}

function ensurePillWindow() {
  if (pillWindow && !pillWindow.isDestroyed()) return;

  // Convert ICO -> 28x28 PNG data URL for reliable transparency in renderer.
  let iconDataUrl = "";
  try {
    const img = nativeImage.createFromPath(ICON_ICO).resize({ width: 28, height: 28 });
    iconDataUrl = img.toDataURL();
  } catch {
    iconDataUrl = "";
  }

  pillWindow = new BrowserWindow({
    width: 28,
    height: 28,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="margin:0; background: transparent; overflow:hidden;">
    <img id="icon" src="${iconDataUrl}" draggable="false"
      style="width:28px;height:28px; cursor:pointer; user-select:none; -webkit-user-drag:none;" />
    <script>
      const { ipcRenderer } = require("electron");
      document.getElementById("icon").addEventListener("click", () => ipcRenderer.send("pill:restore"));
    </script>
  </body>
</html>`;
  pillWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  // Keep it above everything; do not take focus.
  pillWindow.on("show", () => {
    try {
      pillWindow.setAlwaysOnTop(true, "screen-saver");
      pillWindow.showInactive();
    } catch {}
  });

  pillWindow.on("closed", () => {
    pillWindow = null;
  });
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

  // Overlay should not be a normal taskbar window; restore window handles Alt-Tab when hidden.
  try {
    mainWindow.setSkipTaskbar(true);
  } catch {}

  mainWindow.on("closed", () => app.quit());
}

function sendCrosshairToDcs(enabled) {
  // Fire-and-forget. Uses same TCP port as your existing crosshair logic.
  try {
    const net = require("net");
    const client = new net.Socket();
    client.connect(42070, "127.0.0.1", function () {
      client.write(
        JSON.stringify({ type: "crosshair", payload: enabled ? "true" : "false" }) +
          "\n",
      );
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

    show: false,
    autoHideMenuBar: true,

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

  unitImportWindow.loadURL(buildAppUrl("unitImport"));

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
    try {
      winStore.set("unitImportBounds", unitImportWindow.getBounds());
    } catch {}

    // Hide instead of destroying so the last snapshot/state is preserved.
    if (!isQuitting) {
      e.preventDefault();
      unitImportWindow.hide();
      sendCrosshairToDcs(false);
    }
  });

  unitImportWindow.on("closed", () => {
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
      showOverlayInactive();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.whenReady().then(() => {
    createWindow();

    ensureTray();

    // ✅ CRITICAL FIX: pass the unitImportWindow getter so UDP can forward snapshots to it
    udpListener = new UDPListener(mainWindow, () => unitImportWindow);

    fileHandler = new FileHandler(mainWindow);
    udpSender = new UDPSender();
    userPreferenceHandler = new UserPreferenceHandler(
      mainWindow,
      applyElectronPreferences,
    );

    // -------- Overlay visibility IPC --------
    ipcMain.removeAllListeners("minimize");
    ipcMain.on("minimize", (_event, opts) => {
      // Default: hide completely. If renderer passes { shift: true } or { mode: 'pill' }, collapse instead.
      const mode = opts?.mode;
      const shift = opts?.shift === true || opts?.shiftKey === true;

      if (mode === "pill" || shift) collapseToPill();
      else hideOverlayCompletely();
    });

    ipcMain.removeAllListeners("minimizeToPill");
    ipcMain.on("minimizeToPill", () => collapseToPill());

    ipcMain.removeAllListeners("restoreMain");
    ipcMain.on("restoreMain", () => showOverlayInactive());

    ipcMain.removeAllListeners("pill:restore");
    ipcMain.on("pill:restore", () => showOverlayInactive());

    ipcMain.removeAllListeners("close");
    ipcMain.on("close", () => {
      try {
        app.quit();
      } catch {}
    });

    // Keep these IPC names for compatibility, but make them non-destructive:
    ipcMain.removeAllListeners("focus");
    ipcMain.on("focus", () => {
      // Temporarily allow focusing so text inputs (waypoint name/elevation) can be edited.
      if (!mainWindow || mainWindow.isDestroyed()) return;

      try {
        mainWindow.setFocusable(true);
      } catch {}

      try {
        if (mainWindow.isMinimized()) mainWindow.restore();
      } catch {}

      try {
        mainWindow.show(); // activate
      } catch {}

      try {
        mainWindow.focus();
      } catch {}

      // Ensure renderer receives keyboard input.
      try {
        mainWindow.webContents && mainWindow.webContents.focus();
      } catch {}

      try {
        mainWindow.setAlwaysOnTop(true, "screen-saver");
      } catch {}
    });

    ipcMain.removeAllListeners("defocus");
    ipcMain.on("defocus", () => {
      // Return to overlay mode: visible but non-focus stealing.
      showOverlayInactive();
    });

    // -------- Crosshair window --------
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
