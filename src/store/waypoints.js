import { createSlice } from "@reduxjs/toolkit";
import { arrayMove } from "@dnd-kit/sortable";

const initialState = { dcsWaypoints: [], idCounter: 1 };

// Normalize imported waypoint names so jets that require letters-first are happy
// Examples:
// "1 AAV7," -> "AAV7 1"
// "12 SA-10" -> "SA-10 12"
// "AAV7" -> "AAV7"
const normalizeImportedName = (name, fallbackId) => {
  const raw = typeof name === "string" ? name.trim() : "";
  if (!raw) return `Waypoint ${fallbackId}`;

  // Remove trailing commas/spaces
  const cleaned = raw.replace(/,+\s*$/, "").trim();

  // If it starts with a number then whitespace then text, flip it
  const m = cleaned.match(/^(\d+)\s+(.+)$/);
  if (m) return `${m[2].trim()} ${m[1]}`;

  return cleaned;
};

const waypointsSlice = createSlice({
  name: "waypoints",
  initialState,
  reducers: {
    addDcsWaypoint(state, action) {
      const payload = action.payload;

      state.dcsWaypoints.push({
        id: state.idCounter,
        name: normalizeImportedName(payload?.name, state.idCounter),
        lat: payload.lat,
        long: payload.long,
        elev: payload.elev,
      });
      state.idCounter++;
    },
    changeName(state, action) {
      const index = state.dcsWaypoints.findIndex(
        (i) => i.id === action.payload.id,
      );
      state.dcsWaypoints[index]["name"] = action.payload.name;
    },
    changeElevation(state, action) {
      const index = state.dcsWaypoints.findIndex(
        (i) => i.id === action.payload.id,
      );
      state.dcsWaypoints[index]["elev"] = action.payload.elev;
    },
    delete(state, action) {
      const index = state.dcsWaypoints.findIndex(
        (i) => i.id === action.payload,
      );
      state.dcsWaypoints.splice(index, 1);
    },
    deleteAll(state) {
      state.dcsWaypoints = [];
      state.idCounter = 1;
    },
    deleteLast(state) {
      state.dcsWaypoints.pop();
    },
    changeOrder(state, action) {
      const oldIndex = state.dcsWaypoints.findIndex(
        (i) => i.id === action.payload.over,
      );
      const newIndex = state.dcsWaypoints.findIndex(
        (i) => i.id === action.payload.active,
      );
      state.dcsWaypoints = arrayMove(state.dcsWaypoints, newIndex, oldIndex);
    },
    appendWaypoints(state, action) {
      for (const waypoint of action.payload) {
        state.dcsWaypoints.push({
          id: state.idCounter,
          name: normalizeImportedName(waypoint?.name, state.idCounter),
          lat: waypoint.lat,
          long: waypoint.long,
          elev: waypoint.elev,
        });
        state.idCounter++;
      }
    },
  },
});

export const waypointsActions = waypointsSlice.actions;
export default waypointsSlice.reducer;