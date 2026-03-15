import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalContainer from "react-modal-promise";

// ============================================================
// Component imports
// ============================================================
import SourceSelector from "./components/SourceSelector";
import WaypointList from "./components/waypoints/WaypointList";
import TransferControls from "./components/TransferControls";
import TitleBar from "./components/TitleBar";
import SettingsDialog from "./components/settings/SettingsDialog";

// ============================================================
// Utility / module imports
// ============================================================
import theWayTheme from "./theme/TheWayTheme";
import ConvertModuleWaypoints from "./utils/ConvertModuleWaypoints";
import GetModuleCommands from "./moduleCommands/GetModuleCommands";
import askUserAboutSeat from "./moduleCommands/askUserAboutSeat";
import useElectronIpcListeners from "./hooks/useElectronIpcListeners";
import ah6jTransfer, {
  requestAbortAH6JTransfer,
} from "./moduleTransfers/ah6jTransfer";
import { uiActions } from "./store/ui";

// ============================================================
// Electron bridge
// ============================================================
const { ipcRenderer } = window.require("electron");

// ============================================================
// Theme setup
// ============================================================
const theme = createTheme(theWayTheme);

function App() {
  // ============================================================
  // Redux state
  // ============================================================
  const { module } = useSelector((state) => state.dcsPoint);
  const dcsWaypoints = useSelector((state) => state.waypoints.dcsWaypoints);
  const userPreferences = useSelector((state) => state.ui.userPreferences);

  // ============================================================
  // Local UI state
  // ============================================================
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState("F10 Map");
  const [isSelecting, setIsSelecting] = useState(false);

  // Keeps Abort button active during staged AH-6J transfers
  const [transferRunning, setTransferRunning] = useState(false);

  // ============================================================
  // Derived values
  // ============================================================
  const buttonExtraDelay = userPreferences["buttonDelay"] ?? 0;
  const oldCrosshair = userPreferences["oldCrosshair"];

  // ============================================================
  // Hooks
  // ============================================================
  const dispatch = useDispatch();
  useElectronIpcListeners();

  // ============================================================
  // Transfer handler
  // ============================================================
  const handleTransfer = useCallback(async () => {
    if (!module || !dcsWaypoints.length) return;

    const moduleWaypoints = ConvertModuleWaypoints(dcsWaypoints, module);
    const chosenSeat = await askUserAboutSeat(module, userPreferences);

    // AH-6J / MH-6J staged transfer
    if (
      chosenSeat === "AH-6J_ADD" ||
      chosenSeat === "AH-6J_REPLACE" ||
      chosenSeat === "MH-6J_ADD" ||
      chosenSeat === "MH-6J_REPLACE"
    ) {
      if (!Array.isArray(moduleWaypoints) || moduleWaypoints.length < 1) return;

      await ah6jTransfer({
        module: chosenSeat,
        moduleWaypoints,
        buttonExtraDelay,
        ipcRenderer,
        setRunning: setTransferRunning,
      });

      return;
    }

    // Normal module transfer
    const commands = {
      type: "waypoints",
      payload: GetModuleCommands(chosenSeat, moduleWaypoints, buttonExtraDelay),
    };

    ipcRenderer.send("messageToDcs", commands);
  }, [dcsWaypoints, module, userPreferences, buttonExtraDelay]);

  // ============================================================
  // Abort handler
  // ============================================================
  const handleAbort = useCallback(() => {
    requestAbortAH6JTransfer();
    ipcRenderer.send("messageToDcs", { type: "abort" });
  }, []);

  // ============================================================
  // Save handler
  // ============================================================
  const handleFileSave = useCallback(() => {
    ipcRenderer.send("saveFile", JSON.stringify(dcsWaypoints));
  }, [dcsWaypoints]);

  // ============================================================
  // Waypoint selection / crosshair handler
  // ============================================================
  const handleSelectionToggle = useCallback(() => {
    if (!isSelecting) {
      if (inputMethod === "F10 Map") {
        if (oldCrosshair) {
          ipcRenderer.send("f10Start");
        } else {
          ipcRenderer.send("messageToDcs", {
            type: "crosshair",
            payload: "true",
          });
        }

        dispatch(uiActions.changePendingWaypoint(true));
        setIsSelecting(true);
      } else if (inputMethod === "From a file") {
        ipcRenderer.send("openFile");
      }
    } else {
      if (inputMethod === "F10 Map") {
        if (oldCrosshair) {
          ipcRenderer.send("f10Stop");
        } else {
          ipcRenderer.send("messageToDcs", {
            type: "crosshair",
            payload: "false",
          });
        }

        dispatch(uiActions.changePendingWaypoint(false));
        setIsSelecting(false);
      }
    }
  }, [isSelecting, inputMethod, oldCrosshair, dispatch]);

  // ============================================================
  // Electron IPC event bindings
  // ============================================================
  useEffect(() => {
    ipcRenderer.on("transferWaypoints", handleTransfer);
    ipcRenderer.on("toggleCrosshair", handleSelectionToggle);

    return () => {
      ipcRenderer.removeAllListeners("transferWaypoints");
      ipcRenderer.removeAllListeners("toggleCrosshair");
    };
  }, [handleTransfer, handleSelectionToggle]);

  // ============================================================
  // Render
  // ============================================================
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <TitleBar openSettingsHandler={() => setSettingsModalOpen(true)} />
      <ModalContainer />

      <Box sx={{ height: "100vh" }}>
        <SettingsDialog
          open={settingsModalOpen}
          closeHandler={() => setSettingsModalOpen(false)}
        />

        <Box sx={{ height: "25%" }}>
          <SourceSelector
            handleSelectionToggle={handleSelectionToggle}
            module={module}
            inputMethod={inputMethod}
            setInputMethod={setInputMethod}
            isSelecting={isSelecting}
          />
        </Box>

        <Box sx={{ height: "60%", paddingX: 2 }}>
          <WaypointList />
        </Box>

        <Box sx={{ height: "15%" }}>
          <TransferControls
            onTransfer={handleTransfer}
            onAbort={handleAbort}
            onSaveFile={handleFileSave}
            busyOverride={transferRunning}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
