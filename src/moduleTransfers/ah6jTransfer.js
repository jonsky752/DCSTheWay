import ah6j from "../moduleCommands/ah6j";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let abortRequested = false;

function applyExtraDelay(commands, buttonExtraDelay) {
  return (commands || []).map((cmd) => ({
    ...cmd,
    delay: (cmd.delay ?? 0) + buttonExtraDelay,
  }));
}

function estimateRuntime(commands, buffer = 500) {
  const total = (commands || []).reduce((sum, cmd) => sum + (cmd.delay ?? 0), 0);
  return total + buffer;
}

function isReplaceModule(module) {
  return /(?:_|-)REPLACE$/i.test(module || "");
}

function isNewFlightPlanModule(module) {
  return /(?:_|-)NEWFPLN$/i.test(module || "");
}

function row1IsWP0(row1) {
  return /\bWP0\b/i.test(String(row1 || "").trim());
}

async function readRow1(ipcRenderer) {
  const response = await ipcRenderer.invoke("messageToDcsRequest", {
    cmd: "GET_PARAM_HANDLES",
    handles: ["TNL3100_ROW1"],
  });

  return response?.HandleData?.TNL3100_ROW1 || "";
}

async function readRow2(ipcRenderer) {
  const response = await ipcRenderer.invoke("messageToDcsRequest", {
    cmd: "GET_PARAM_HANDLES",
    handles: ["TNL3100_ROW2"],
  });

  return response?.HandleData?.TNL3100_ROW2 || "";
}

async function sendCommands(ipcRenderer, commands) {
  ipcRenderer.send("messageToDcs", {
    type: "waypoints",
    payload: commands,
  });
}

export function requestAbortAH6JTransfer() {
  abortRequested = true;
}

export function clearAbortAH6JTransfer() {
  abortRequested = false;
}

function throwIfAborted() {
  if (abortRequested) {
    throw new Error("AH6J_TRANSFER_ABORTED");
  }
}

async function prepareReplaceMode({ buttonExtraDelay, ipcRenderer }) {
  let wp0SeenInARow = 0;

  while (wp0SeenInARow < 3) {
    throwIfAborted();

    const row1 = await readRow1(ipcRenderer);

    if (row1IsWP0(row1)) {
      wp0SeenInARow += 1;
    } else {
      wp0SeenInARow = 0;

      const deleteCurrent = applyExtraDelay(
        ah6j.buildDeleteCurrentWaypointCommands(),
        buttonExtraDelay,
      );

      await sendCommands(ipcRenderer, deleteCurrent);
      await sleep(estimateRuntime(deleteCurrent));
      throwIfAborted();
    }

    const stepPrevious = applyExtraDelay(
      ah6j.buildStepToPreviousWaypointCommands(),
      buttonExtraDelay,
    );

    await sendCommands(ipcRenderer, stepPrevious);
    await sleep(estimateRuntime(stepPrevious, 300));
  }
}

export default async function ah6jTransfer({
  module,
  moduleWaypoints,
  buttonExtraDelay,
  ipcRenderer,
  setRunning,
}) {
  clearAbortAH6JTransfer();
  setRunning(true);

  try {
    if (module) {
      ah6j.slotVariant = module;
    }

    throwIfAborted();

    const initial = applyExtraDelay(
      ah6j.buildInitialModeCommands(),
      buttonExtraDelay,
    );

    await sendCommands(ipcRenderer, initial);
    await sleep(estimateRuntime(initial));
    throwIfAborted();

    const newFlightPlanMode = isNewFlightPlanModule(module);

    if (isReplaceModule(module) || newFlightPlanMode) {
      await prepareReplaceMode({ buttonExtraDelay, ipcRenderer });
      throwIfAborted();
    }

    for (let i = 0; i < moduleWaypoints.length; i++) {
      throwIfAborted();

      const openCreate = applyExtraDelay(
        ah6j.buildWaypointEntryPageCommands(),
        buttonExtraDelay,
      );

      await sendCommands(ipcRenderer, openCreate);
      await sleep(estimateRuntime(openCreate));
      throwIfAborted();

            const display = {
        row2: await readRow2(ipcRenderer),
      };

      console.log("[AH6J] DISPLAY ROW2:", display.row2);
      console.log("[AH6J] TARGET WP:", moduleWaypoints[i]);

      // allow TNL3100 page to settle before sending first command
      await sleep(300 + buttonExtraDelay);

      const commands = applyExtraDelay(
        ah6j.createWaypointCommandsFromDisplay(
          moduleWaypoints[i],
          i + 1,
          display,
        ),
        buttonExtraDelay,
      );

      await sendCommands(ipcRenderer, commands);
      await sleep(estimateRuntime(commands));
      throwIfAborted();
    }

    if (newFlightPlanMode) {
      throwIfAborted();

      const buildFlightPlan = applyExtraDelay(
        ah6j.buildNewFlightPlanFromListCommands(moduleWaypoints.length),
        buttonExtraDelay,
      );

      await sendCommands(ipcRenderer, buildFlightPlan);
      await sleep(estimateRuntime(buildFlightPlan, 1000));
      throwIfAborted();
    }
  } catch (err) {
    if (err?.message !== "AH6J_TRANSFER_ABORTED") {
      throw err;
    }
  } finally {
    clearAbortAH6JTransfer();
    setRunning(false);
  }
}
