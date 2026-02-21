const dgram = require("dgram");

class UDPListener {
  /**
   * @param {BrowserWindow} mainWindow
   * @param {() => (import('electron').BrowserWindow | null)} [getUnitImportWindow]
   */
  constructor(mainWindow, getUnitImportWindow) {
    const socket = dgram.createSocket("udp4");

    socket.on("message", (msg) => {
      const str = "" + msg;

      // Always forward raw UDP to the main window for existing features.
      try {
        mainWindow.webContents.send("dataReceived", str);
      } catch (e) {}

      // Try to parse JSON messages; if it matches our Intelligence snapshot reply, forward to Unit Import.
      let parsed = null;
      try {
        parsed = JSON.parse(str);
      } catch (e) {
        return;
      }

      if (parsed && parsed.cmd === "INTEL_SNAPSHOT_RESULT" && Array.isArray(parsed.units)) {
        try {
          const unitWin = typeof getUnitImportWindow === "function" ? getUnitImportWindow() : null;
          if (unitWin && !unitWin.isDestroyed()) {
            unitWin.webContents.send("intel:snapshotResult", parsed);
          }
        } catch (e) {}
      }
    });

    socket.bind(42069);
  }
}

module.exports = UDPListener;
