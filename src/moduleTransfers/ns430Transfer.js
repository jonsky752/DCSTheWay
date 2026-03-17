// ============================================================
// NS430 TRANSFER CONTROLLER
// Handles sending waypoint data from TheWay to the NS430
// by generating command sequences and transmitting them to DCS
// ============================================================

import ns430 from "../moduleCommands/ns430";


// ============================================================
// BASIC UTILITY HELPERS
// ============================================================

// Simple async sleep helper used to wait for command sequences to finish
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Global flag used to cancel a running transfer
let abortRequested = false;


// ============================================================
// COMMAND TIMING HELPERS
// ============================================================

// Adds the user-configured delay slider value to each command
// This slows down inputs for modules that require slower timing
function applyExtraDelay(commands, buttonExtraDelay) {
  return (commands || []).map((cmd) => ({
    ...cmd,
    delay: (cmd.delay ?? 0) + buttonExtraDelay,
  }));
}

// Estimates how long a command sequence will take to run
// by summing the command delays and adding a safety buffer
function estimateRuntime(commands, buffer = 500) {
  const total = (commands || []).reduce((sum, cmd) => sum + (cmd.delay ?? 0), 0);
  return total + buffer;
}


// ============================================================
// DCS COMMUNICATION
// ============================================================

// Sends a command payload to DCS via Electron IPC
// The payload contains the sequence of cockpit commands
async function sendCommands(ipcRenderer, commands) {
  ipcRenderer.send("messageToDcs", {
    type: "waypoints",
    payload: commands,
  });
}


// ============================================================
// WAYPOINT NAME FORMATTER
// ============================================================

function generateSequentialDefaultName(index) {
  let n = Math.max(0, Number(index) || 0);
  const chars = ["A", "A", "A", "A", "A"];

  for (let pos = 4; pos >= 0; pos -= 1) {
    chars[pos] = String.fromCharCode(65 + (n % 26));
    n = Math.floor(n / 26);
  }

  return chars.join("");
}

function formatNs430WaypointName(rawName, fallbackIndex) {

  const trimmed = String(rawName ?? "").trim();

  // If no name was supplied, generate sequential default name
  if (!trimmed) {
    return generateSequentialDefaultName(fallbackIndex);
  }

  // Convert default "Waypoint X" naming from TheWay
  const standardWaypointMatch = /^Waypoint\s+(\d+)$/i.exec(trimmed);
  if (standardWaypointMatch) {
    return generateSequentialDefaultName(fallbackIndex);
  }

  // Sanitize user-entered name
  let name = trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9+]/g, "")
    .slice(0, 5);

  // Pad remaining characters with waypoint index digits
  if (name.length < 5) {
    const remaining = 5 - name.length;
    const suffix = String(fallbackIndex + 1).padStart(remaining, "0").slice(-remaining);
    name = name + suffix;
  }

  return name;
}


// ============================================================
// AIRCRAFT POSITION REQUEST
// ============================================================
//
// Requests the aircraft's current position from DCS.
// This is required because the NS430 coordinate entry
// screen automatically populates with current aircraft
// position after confirming the waypoint name.
//
async function requestOwnPositionSnapshot(ipcRenderer) {

  const response = await ipcRenderer.invoke("messageToDcsRequest", {
    cmd: "GET_OWN_POSITION",
  });

  if (!response || response.ok !== true) {
    const errorList = Array.isArray(response?.ErrorList) ? response.ErrorList.filter(Boolean) : [];
    const fallbackError = response?.error || response?.raw || "GET_OWN_POSITION failed";
    throw new Error(errorList[0] || fallbackError);
  }

  const ownPosition = response.OwnPosition || {};
  const lat = Number(ownPosition.lat);
  const long = Number(ownPosition.long);
  const alt = Number(ownPosition.alt ?? 0);

  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    throw new Error(`Invalid own-position snapshot received: ${JSON.stringify(response)}`);
  }

  return {
    lat,
    long,
    alt,
    model: ownPosition.model || null,
  };
}


// ============================================================
// TRANSFER ABORT CONTROL
// ============================================================

// Request that a running NS430 transfer be aborted
export function requestAbortNS430Transfer() {
  abortRequested = true;
}

// Clears the abort flag before starting a new transfer
export function clearAbortNS430Transfer() {
  abortRequested = false;
}

// Throws an exception if an abort has been requested
// Used throughout the transfer loop
function throwIfAborted() {
  if (abortRequested) {
    throw new Error("NS430_TRANSFER_ABORTED");
  }
}


// ============================================================
// MAIN NS430 WAYPOINT TRANSFER FUNCTION
// ============================================================
//
// This is the core routine that performs the waypoint transfer.
//
// Steps:
// 1. Reset the NS430 to a known state
// 2. Loop through each waypoint
// 3. Enter the waypoint name
// 4. Capture aircraft position
// 5. Confirm name entry
// 6. Move to coordinate entry screen
// 7. Adjust coordinates to match target waypoint
// 8. After all waypoints are entered, save them
//
export default async function ns430Transfer({
  module,
  moduleWaypoints,
  buttonExtraDelay,
  ipcRenderer,
  setRunning,
}) {

  clearAbortNS430Transfer();
  setRunning(true);

  try {

    // Set which aircraft module is using the NS430
    if (module) {
      ns430.slotVariant = module;
    }

    throwIfAborted();


    // ========================================================
// INITIAL SETUP
// Reset NS430 state and delete existing user waypoints
// ========================================================

const setup = applyExtraDelay(ns430.buildSetupCommands(), buttonExtraDelay);
await sendCommands(ipcRenderer, setup);
await sleep(estimateRuntime(setup, 1000));
throwIfAborted();


// ========================================================
// FINAL SETUP PUSH
// Rotary push to exit delete menu cleanly
// ========================================================

const setupPush = applyExtraDelay(ns430.buildFinalSetupPushCommands(), buttonExtraDelay);
await sendCommands(ipcRenderer, setupPush);
await sleep(estimateRuntime(setupPush, 1000));
throwIfAborted();


// ========================================================
// MAIN WAYPOINT ENTRY LOOP
// Each iteration creates one waypoint
// ========================================================

    for (let i = 0; i < moduleWaypoints.length; i += 1) {

      throwIfAborted();

      const wp = moduleWaypoints[i];

      // Generate a valid 5-character NS430 name
      const waypointName = formatNs430WaypointName(wp?.name, i);


      // ----------------------------------------------------
      // Enter waypoint name characters
      // ----------------------------------------------------

      const nameChars = applyExtraDelay(ns430.buildNameCharactersCommands(waypointName), buttonExtraDelay);
      await sendCommands(ipcRenderer, nameChars);
      await sleep(estimateRuntime(nameChars, 1000));
      throwIfAborted();


      // ----------------------------------------------------
      // Capture aircraft position
      // Needed because NS430 fills coordinate fields
      // with current aircraft position after name entry
      // ----------------------------------------------------

      const currentPosition = await requestOwnPositionSnapshot(ipcRenderer);
      throwIfAborted();


      // ----------------------------------------------------
      // Confirm waypoint name
      // ----------------------------------------------------

      const confirmName = applyExtraDelay(ns430.buildConfirmNameCommands(), buttonExtraDelay);
      await sendCommands(ipcRenderer, confirmName);
      await sleep(estimateRuntime(confirmName, 150));
      throwIfAborted();


      // ----------------------------------------------------
      // Move cursor to coordinate entry field
      // ----------------------------------------------------

      const moveToPos = applyExtraDelay(ns430.buildMoveToPositionFieldCommands(), buttonExtraDelay);
      await sendCommands(ipcRenderer, moveToPos);
      await sleep(estimateRuntime(moveToPos, 300));
      throwIfAborted();


      // ----------------------------------------------------
      // Adjust coordinates from current aircraft position
      // to the target waypoint coordinates
      // ----------------------------------------------------

      const coordinateEntry = applyExtraDelay(
        ns430.buildCoordinateEntryCommands(currentPosition, wp),
        buttonExtraDelay,
      );

      await sendCommands(ipcRenderer, coordinateEntry);
      await sleep(estimateRuntime(coordinateEntry, 500));
      throwIfAborted();
    }


    // ========================================================
    // FINAL SAVE
    // Saves the newly entered waypoints to the NS430 database
    // ========================================================

    const saveWaypoint = applyExtraDelay(ns430.buildSaveWaypointCommands(), buttonExtraDelay);
    await sendCommands(ipcRenderer, saveWaypoint);
    await sleep(estimateRuntime(saveWaypoint, 800));
    throwIfAborted();

  } catch (err) {

    // Ignore abort errors, rethrow others
    if (err?.message !== "NS430_TRANSFER_ABORTED") {
      throw err;
    }

  } finally {

    // Ensure transfer state is reset
    clearAbortNS430Transfer();
    setRunning(false);
  }
}