import { useEffect } from "react";
import { dcsPointActions } from "../store/dcsPoint";
import { waypointsActions } from "../store/waypoints";
import { uiActions } from "../store/ui";
import { useDispatch, useSelector } from "react-redux";
import { throttle } from "lodash";

const { ipcRenderer } = window.require("electron");

const useElectronIpcListeners = () => {
  const dispatch = useDispatch();
  const { lat, long, elev, module } = useSelector((state) => state.dcsPoint);
  const dcsWaypointsCount = useSelector((state) => state.waypoints.dcsWaypoints.length);

  useEffect(() => {
    const onSaveWaypoint = () => {
      if (module && lat && long) {
        dispatch(
          waypointsActions.addDcsWaypoint({
            lat,
            long,
            elev,
          }),
        );
      }
    };

    const onUnitImportAddWaypoints = (_event, units) => {
      if (!Array.isArray(units)) return;

      // Numbering: we prefix each imported unit with the next waypoint index in your list.
      // Example: "7 T72B"
      const startIndex = dcsWaypointsCount; // current number of waypoints at time of import

      units.forEach((u, idx) => {
        const latNum = Number(u.lat);
        const longNum = Number(u.lon ?? u.long);
        const elevNumRaw = Number(u.elevM ?? u.elev);
        const elevNum = Number.isFinite(elevNumRaw) ? elevNumRaw : 1;

        if (!Number.isFinite(latNum) || !Number.isFinite(longNum)) return;

        const typeStr =
          (typeof u.type === "string" && u.type.trim()) ||
          (typeof u.unitType === "string" && u.unitType.trim()) ||
          (typeof u.className === "string" && u.className.trim()) ||
          (typeof u.name === "string" && u.name.trim()) ||
          "UNIT";

        const wpNumber = startIndex + idx + 1;

        dispatch(
          waypointsActions.addDcsWaypoint({
            lat: latNum,
            long: longNum,
            elev: elevNum,
            name: `${wpNumber} ${typeStr}`,
          }),
        );
      });
    };

    const onFileOpened = (event, msg) => {
      dispatch(waypointsActions.appendWaypoints(msg));
    };

    const onDeleteWaypoints = () => {
      dispatch(waypointsActions.deleteAll());
    };

    const onDeleteLastWaypoint = () => {
      dispatch(waypointsActions.deleteLast());
    };

    const onPreferencesReceived = (e, preferences) => {
      dispatch(uiActions.setUserPreferences(preferences));
    };

    // In dev (React 18 StrictMode / HMR), effects can mount twice — ensure we don't stack listeners.
    ipcRenderer.removeListener("saveWaypoint", onSaveWaypoint);
    ipcRenderer.removeListener("unitImport:addWaypoints", onUnitImportAddWaypoints);
    ipcRenderer.removeListener("fileOpened", onFileOpened);
    ipcRenderer.removeListener("deleteWaypoints", onDeleteWaypoints);
    ipcRenderer.removeListener("deleteLastWaypoint", onDeleteLastWaypoint);
    ipcRenderer.removeListener("preferencesReceived", onPreferencesReceived);

    ipcRenderer.on("saveWaypoint", onSaveWaypoint);
    ipcRenderer.on("unitImport:addWaypoints", onUnitImportAddWaypoints);
    ipcRenderer.on("fileOpened", onFileOpened);
    ipcRenderer.on("deleteWaypoints", onDeleteWaypoints);
    ipcRenderer.on("deleteLastWaypoint", onDeleteLastWaypoint);
    ipcRenderer.on("preferencesReceived", onPreferencesReceived);

    return () => {
      ipcRenderer.removeListener("saveWaypoint", onSaveWaypoint);
      ipcRenderer.removeListener("unitImport:addWaypoints", onUnitImportAddWaypoints);
      ipcRenderer.removeListener("fileOpened", onFileOpened);
      ipcRenderer.removeListener("deleteWaypoints", onDeleteWaypoints);
      ipcRenderer.removeListener("deleteLastWaypoint", onDeleteLastWaypoint);
      ipcRenderer.removeListener("preferencesReceived", onPreferencesReceived);
    };
  }, [lat, long, elev, module, dcsWaypointsCount]);

  useEffect(() => {
    ipcRenderer.send("getPreferences");
    ipcRenderer.on(
      "dataReceived",
      throttle((event, msg) => {
        dispatch(dcsPointActions.changeCoords(JSON.parse(msg)));
      }, 100),
    );

    return () => {
      ipcRenderer.removeAllListeners("dataReceived");
    };
  }, []);
};

export default useElectronIpcListeners;
