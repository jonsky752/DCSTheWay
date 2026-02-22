const dgram = require("dgram");

class UDPListener {
  /**
   * @param {BrowserWindow} mainWindow
   * @param {() => (import('electron').BrowserWindow | null)} [getUnitImportWindow]
   */
  constructor(mainWindow, getUnitImportWindow) {
    const socket = dgram.createSocket("udp4");

    // snapId -> { origin, units: [], lastSeen, count? }
    const inFlight = new Map();

    // housekeeping to avoid leaks if DONE never arrives
    const GC_INTERVAL_MS = 2000;
    const STALE_MS = 15000; // drop partial snapshots older than this

    const gcTimer = setInterval(() => {
      const now = Date.now();
      for (const [snapId, s] of inFlight.entries()) {
        if (now - (s.lastSeen || 0) > STALE_MS) inFlight.delete(snapId);
      }
    }, GC_INTERVAL_MS);

    // Don't keep Node alive just for GC timer
    if (gcTimer.unref) gcTimer.unref();

    const sendToUnitImport = (payload) => {
      try {
        const unitWin = typeof getUnitImportWindow === "function" ? getUnitImportWindow() : null;
        if (unitWin && !unitWin.isDestroyed()) {
          unitWin.webContents.send("intel:snapshotResult", payload);
        }
      } catch (e) {}
    };

    socket.on("message", (msg) => {
      const str = "" + msg;

      // Always forward raw UDP to the main window for existing features.
      try {
        mainWindow.webContents.send("dataReceived", str);
      } catch (e) {}

      let parsed = null;
      try {
        parsed = JSON.parse(str);
      } catch (e) {
        return;
      }

      if (!parsed || typeof parsed.cmd !== "string") return;

      // Backward-compatible: old single-message format
      if (parsed.cmd === "INTEL_SNAPSHOT_RESULT" && Array.isArray(parsed.units)) {
        sendToUnitImport(parsed);
        return;
      }

      // New chunked format (BEGIN/PART/DONE)
      if (parsed.cmd === "INTEL_SNAPSHOT_BEGIN") {
        const snapId = parsed.snapId;
        if (snapId === undefined || snapId === null) return;

        inFlight.set(String(snapId), {
          origin: parsed.origin ?? null,
          units: [],
          lastSeen: Date.now(),
          count: Number.isFinite(parsed.count) ? parsed.count : null,
        });
        return;
      }

      if (parsed.cmd === "INTEL_SNAPSHOT_PART") {
        const snapId = parsed.snapId;
        if (snapId === undefined || snapId === null) return;

        const key = String(snapId);
        const s = inFlight.get(key);
        if (!s) {
          // If PART arrives before BEGIN, create a bucket anyway.
          inFlight.set(key, { origin: null, units: [], lastSeen: Date.now(), count: null });
        }

        const snap = inFlight.get(key);
        snap.lastSeen = Date.now();

        if (Array.isArray(parsed.units)) {
          snap.units.push(...parsed.units);
        }
        return;
      }

      if (parsed.cmd === "INTEL_SNAPSHOT_DONE") {
        const snapId = parsed.snapId;
        if (snapId === undefined || snapId === null) return;

        const key = String(snapId);
        const snap = inFlight.get(key);
        if (!snap) return;

        inFlight.delete(key);

        // Emit in the SAME SHAPE your renderer already expects: { origin, units }
        sendToUnitImport({
          cmd: "INTEL_SNAPSHOT_RESULT",
          origin: snap.origin,
          units: snap.units,
        });
        return;
      }
    });

    socket.bind(42069);
  }
}

module.exports = UDPListener;