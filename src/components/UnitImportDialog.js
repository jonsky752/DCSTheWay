import React from "react";
import { useSelector } from "react-redux";
import { UNIT_LOOKUP } from "../data/unitLookupFromCatalog";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Menu,
  FormGroup,
  FormControlLabel,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";

const { ipcRenderer } = window.require("electron");

// ---- LocalStorage keys (UI prefs) ----
const LS_PREFIX = "theway.unitImport.";
const LS_KEYS = {
  coalition: `${LS_PREFIX}coalition`,
  type: `${LS_PREFIX}type`,
  origin: `${LS_PREFIX}origin`,
  withinEnabled: `${LS_PREFIX}withinEnabled`,
  withinRadius: `${LS_PREFIX}withinRadius`,
  unitsMode: `${LS_PREFIX}unitsMode`,
  colWidths: `${LS_PREFIX}colWidths`,
  coordFmt: `${LS_PREFIX}coordFmt`,
  colVis: `${LS_PREFIX}colVis`,
};

const readLS = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    if (v === null || v === undefined || v === "") return fallback;
    return v;
  } catch {
    return fallback;
  }
};

const readLSJson = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const writeLSJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

// ---- Unit type -> Category/Subcategory lookup (from UNIT_CATALOG) ----
const getCatSubForType = (type) => {
  if (!type) return { category: "Unknown", subcategory: "Unknown" };
  return UNIT_LOOKUP[type] || { category: "Unknown", subcategory: "Unknown" };
};
  
// ===== Coordinate converters (matching your Convertors.js behaviour) =====
const decimalToDMM = (decimalCoordinate) => {
  const deg = Math.abs(Math.trunc(decimalCoordinate));
  const parts = String(decimalCoordinate).split(".");
  const frac = parts[1] ? Number("0." + parts[1]) : 0;
  const min = frac * 60;
  return { deg, min };
};

const decimalToDMS = (decimalCoordinate) => {
  const deg = Math.trunc(decimalCoordinate);
  const parts = String(decimalCoordinate).split(".");
  const frac = parts[1] ? Number("0." + parts[1]) : 0;
  const minDec = frac * 60;
  const min = Math.trunc(minDec);
  const parts2 = String(minDec).split(".");
  const frac2 = parts2[1] ? Number("0." + parts2[1]) : 0;
  const sec = Math.trunc(frac2 * 60);
  return { deg, min, sec };
};

// Source logic copied from Convertors.js (stack overflow based)
const decimalToMGRS = (Lat, Long) => {
  if (Lat < -80) return "Too far South";
  if (Lat > 84) return "Too far North";
  const c = 1 + Math.floor((Long + 180) / 6);
  const e = c * 6 - 183;
  const k = (Lat * Math.PI) / 180;
  const l = (Long * Math.PI) / 180;
  const m = (e * Math.PI) / 180;
  const n = Math.cos(k);
  const o = 0.006739496819936062 * Math.pow(n, 2);
  const p = 40680631590769 / (6356752.314 * Math.sqrt(1 + o));
  const q = Math.tan(k);
  const r = q * q;
  const t = l - m;
  const u = 1.0 - r + o;
  const v = 5.0 - r + 9 * o + 4.0 * (o * o);
  const w = 5.0 - 18.0 * r + r * r + 14.0 * o - 58.0 * r * o;
  const x = 61.0 - 58.0 * r + r * r + 270.0 * o - 330.0 * r * o;
  const y = 61.0 - 479.0 * r + 179.0 * (r * r) - r * r * r;
  const z = 1385.0 - 3111.0 * r + 543.0 * (r * r) - r * r * r;

  let aa =
    p * n * t +
    (p / 6.0) * Math.pow(n, 3) * u * Math.pow(t, 3) +
    (p / 120.0) * Math.pow(n, 5) * w * Math.pow(t, 5) +
    (p / 5040.0) * Math.pow(n, 7) * y * Math.pow(t, 7);

  let ab =
    6367449.14570093 *
      (k -
        0.00251882794504 * Math.sin(2 * k) +
        0.00000264354112 * Math.sin(4 * k) -
        0.00000000345262 * Math.sin(6 * k) +
        0.000000000004892 * Math.sin(8 * k)) +
    (q / 2.0) * p * Math.pow(n, 2) * Math.pow(t, 2) +
    (q / 24.0) * p * Math.pow(n, 4) * v * Math.pow(t, 4) +
    (q / 720.0) * p * Math.pow(n, 6) * x * Math.pow(t, 6) +
    (q / 40320.0) * p * Math.pow(n, 8) * z * Math.pow(t, 8);

  aa = aa * 0.9996 + 500000.0;
  ab = ab * 0.9996;
  if (ab < 0.0) ab += 10000000.0;

  const ad = "CDEFGHJKLMNPQRSTUVWXX".charAt(Math.floor(Lat / 8 + 10));
  const ae = Math.floor(aa / 100000);
  const af = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"][(c - 1) % 3].charAt(ae - 1);
  const ag = Math.floor(ab / 100000) % 20;
  const ah = ["ABCDEFGHJKLMNPQRSTUV", "FGHJKLMNPQRSTUVABCDE"][(c - 1) % 2].charAt(ag);

  function pad(val) {
    if (val < 10) val = "0000" + val;
    else if (val < 100) val = "000" + val;
    else if (val < 1000) val = "00" + val;
    else if (val < 10000) val = "0" + val;
    return val;
  }

  aa = Math.floor(aa % 100000);
  aa = pad(aa);
  ab = Math.floor(ab % 100000);
  ab = pad(ab);
  return c + ad + " " + af + ah + " " + aa + " " + ab;
};

const formatPosition = (lat, lon, fmt) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

  if (fmt === "DEC") {
    const ns = lat >= 0 ? "N" : "S";
    const ew = lon >= 0 ? "E" : "W";
    return `${ns} ${Math.abs(lat).toFixed(6)}  ${ew} ${Math.abs(lon).toFixed(6)}`;
  }

  if (fmt === "DMS") {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";

  const pad2 = (n) => String(n).padStart(2, "0");

  const toDMSParts = (absDec) => {
    const deg = Math.floor(absDec);
    const minDec = (absDec - deg) * 60;
    const min = Math.floor(minDec);
    const sec = Math.floor((minDec - min) * 60);
    return { deg, min, sec };
  };

  const d1 = toDMSParts(Math.abs(lat));
  const d2 = toDMSParts(Math.abs(lon));

  // Note: no spaces like your example: N42°07'07"
  return `${ns}${d1.deg}°${pad2(d1.min)}'${pad2(d1.sec)}"  ${ew}${d2.deg}°${pad2(d2.min)}'${pad2(d2.sec)}"`;
  }

  if (fmt === "DMS_S") {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";

  const pad2 = (n) => String(n).padStart(2, "0");
  const padSec2dp = (s) => s.toFixed(2).padStart(5, "0"); // 0.00 -> "00.00", 6.78 -> "06.78"

  const toDMSSParts = (absDec) => {
    let deg = Math.floor(absDec);
    let minDec = (absDec - deg) * 60;
    let min = Math.floor(minDec);
    let sec = (minDec - min) * 60;

    // Handle rounding rollover (e.g. 59.999 -> 60.00)
    sec = Number(sec.toFixed(2));
    if (sec >= 60) {
      sec = 0;
      min += 1;
      if (min >= 60) {
        min = 0;
        deg += 1;
      }
    }

    return { deg, min, sec };
  };

  const d1 = toDMSSParts(Math.abs(lat));
  const d2 = toDMSSParts(Math.abs(lon));

  return `${ns}${d1.deg}°${pad2(d1.min)}'${padSec2dp(d1.sec)}"  ${ew}${d2.deg}°${pad2(d2.min)}'${padSec2dp(d2.sec)}"`;
}

  if (fmt === "DMM") {
    const ns = lat >= 0 ? "N" : "S";
    const ew = lon >= 0 ? "E" : "W";
    const d1 = decimalToDMM(Math.abs(lat));
    const d2 = decimalToDMM(Math.abs(lon));
    return `${ns} ${d1.deg}°${d1.min.toFixed(3)}'  ${ew} ${d2.deg}°${d2.min.toFixed(3)}'`;
  }

  if (fmt === "MGRS") {
    return decimalToMGRS(lat, lon);
  }

  return "";
};

export default function UnitImportDialog({ open, onClose }) {
  // Header controls (remembered)
  const [intelCoalitionFilter, setIntelCoalitionFilter] = React.useState(readLS(LS_KEYS.coalition, "All"));
  const [intelUnitType, setIntelUnitType] = React.useState(readLS(LS_KEYS.type, "Ground")); // Ground/Air/Naval/All
  const [intelOrigin, setIntelOrigin] = React.useState(readLS(LS_KEYS.origin, "Camera position"));

  const [intelWithinEnabled, setIntelWithinEnabled] = React.useState(true);
  const [unitsMode, setUnitsMode] = React.useState(readLS(LS_KEYS.unitsMode, "Imperial")); // Imperial|Metric

  const [intelRadius, setIntelRadius] = React.useState(2);

  const [coordFmt, setCoordFmt] = React.useState(readLS(LS_KEYS.coordFmt, "DEC")); // DEC/DMS/DMM/MGRS

  const [isIntelLoading, setIsIntelLoading] = React.useState(false);

  // Last known DCS point (fallback for BRG/RNG if snapshot origin missing)
  const { lat: dcsLat, long: dcsLon } = useSelector((state) => state.dcsPoint);

  // Sorting
  const [orderBy, setOrderBy] = React.useState("selected");
const [order, setOrder] = React.useState("desc"); // selected first

  // Column widths (remembered)
  const defaultColWidths = {
    coalition: 110,
    type: 170,
    category: 140,
    subcategory: 160,
    capability: 160,
    name: 240,
    position: 300,
    elev: 110,
    brgDeg: 110,
    rng: 120,
    speed: 110,
    import: 60,
  };

  const [colWidths, setColWidths] = React.useState(() => {
    const saved = readLSJson(LS_KEYS.colWidths, null);
    return saved && typeof saved === "object" ? { ...defaultColWidths, ...saved } : defaultColWidths;
  });

  

// Column visibility (remembered). Import is always shown.
const defaultColVis = {
  coalition: true,
  type: true,
  category: true,
  subcategory: true,
  capability: true,
  name: true,
  position: true,
  elev: true,
  brgDeg: true,
  rng: true,
    speed: true,
};

const [colVis, setColVis] = React.useState(() => {
  const saved = readLSJson(LS_KEYS.colVis, null);
  return saved && typeof saved === "object" ? { ...defaultColVis, ...saved } : defaultColVis;
});

React.useEffect(() => {
  const t = window.setTimeout(() => writeLSJson(LS_KEYS.colVis, colVis), 200);
  return () => window.clearTimeout(t);
}, [colVis]);

const isColVisible = (key) => {
    if (key === "import") return true; // always shown
    return !!colVis[key];
  };

const visibleColCount = React.useMemo(() => {
  const keys = ["coalition","type","category","subcategory","capability","name","position","elev","brgDeg","rng","speed","import"];
  return keys.reduce((acc, k) => acc + (isColVisible(k) ? 1 : 0), 0);
}, [colVis]);
  const dragRef = React.useRef(null);

  const refreshMinTimerRef = React.useRef(0); // store "min active until" timestamp

  
  // Column show/hide menu
  const [colsAnchorEl, setColsAnchorEl] = React.useState(null);
  const colsMenuOpen = Boolean(colsAnchorEl);

  const toggleCol = (key) => setColVis((prev) => ({ ...prev, [key]: !prev[key] }));
// Snapshot + import selection
  const [snapshot, setSnapshot] = React.useState([]);
  const [importMap, setImportMap] = React.useState({});
  const prevPosRef = React.useRef(new Map());

  
  // Snapshot timing for speed calculation
  const lastSnapshotAtRef = React.useRef(0);
  const prevSnapshotAtRef = React.useRef(0);

  // Snapshot age display (bottom-right)
  const [snapshotAgeText, setSnapshotAgeText] = React.useState("No snapshot");
// Snapshot reference point for BRG/RNG + Within
  const [refPoint, setRefPoint] = React.useState(null);

  // Keep the snapshot age label ticking while the dialog is open.
  // (We store the snapshot timestamp in a ref, so we need an interval to force UI updates.)
  React.useEffect(() => {
    if (!open) return;

    const formatAge = (ms) => {
      if (!Number.isFinite(ms) || ms <= 0) return "0s";
      const totalSec = Math.floor(ms / 1000);
      const s = totalSec % 60;
      const m = Math.floor(totalSec / 60) % 60;
      const h = Math.floor(totalSec / 3600);
      if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
      if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
      return `${s}s`;
    };

    const tick = () => {
      const t = lastSnapshotAtRef.current;
      if (!t) {
        setSnapshotAgeText("No snapshot");
        return;
      }
      setSnapshotAgeText(formatAge(Date.now() - t));
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [open]);

  // Persist user choices
  React.useEffect(() => writeLS(LS_KEYS.coalition, intelCoalitionFilter), [intelCoalitionFilter]);
  React.useEffect(() => writeLS(LS_KEYS.type, intelUnitType), [intelUnitType]);
  React.useEffect(() => writeLS(LS_KEYS.origin, intelOrigin), [intelOrigin]);
  //React.useEffect(() => writeLS(LS_KEYS.withinEnabled, String(intelWithinEnabled)), [intelWithinEnabled]);
  React.useEffect(() => writeLS(LS_KEYS.unitsMode, unitsMode), [unitsMode]);
  React.useEffect(() => writeLS(LS_KEYS.coordFmt, coordFmt), [coordFmt]);

  React.useEffect(() => {
    if (Number.isFinite(Number(intelRadius))) writeLS(LS_KEYS.withinRadius, String(intelRadius));
  }, [intelRadius]);

  // Persist col widths (debounced)
  React.useEffect(() => {
    const t = window.setTimeout(() => writeLSJson(LS_KEYS.colWidths, colWidths), 200);
    return () => window.clearTimeout(t);
  }, [colWidths]);

  // ===== Helper math =====
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const bearingDeg = (lat1, lon1, lat2, lon2) => {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  const metersToFeet = (m) => m * 3.28084;
  const nmToKm = (nm) => nm * 1.852;
  const kmToNm = (km) => km / 1.852;

  // ===== wsType helpers =====
  const getWsLevels = (u) => {
    const T = u?.Type;
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const l1 = Array.isArray(T) ? toNum(T[0] ?? T[1]) : toNum(T?.level1 ?? T?.Level1 ?? T?.[1] ?? T?.["1"]);
    const l2 = Array.isArray(T) ? toNum(T[1] ?? T[2]) : toNum(T?.level2 ?? T?.Level2 ?? T?.[2] ?? T?.["2"]);
    const l3 = Array.isArray(T) ? toNum(T[2] ?? T[3]) : toNum(T?.level3 ?? T?.Level3 ?? T?.[3] ?? T?.["3"]);
    return { l1, l2, l3 };
  };

  const classifyAndCapability = (u) => {
      const { l1, l2, l3 } = getWsLevels(u);

      // --- Base classification from wsType (good for vehicles/SAM/etc) ---
      let cls = "Unknown";
      if (l1 === 1) cls = "Air";
      else if (l1 === 3) cls = "Naval";
      else if (l1 === 4) cls = "Weapon";
      else if (l1 === 5) cls = "Static";
      else if (l1 === 2) {
        if (l2 === 16) cls = "SAM/Radar";
        else if (l2 === 17) cls = "Armour";
        else if (l2 === 20) cls = "Infantry";
        else cls = "Vehicle";
        if ([101, 102, 103, 105].includes(l3)) cls = "SAM/Radar";
      }

      let cap = "";
      if (l3 === 25) cap = "None"; // was "No Weapon"
      else if (l3 === 26) cap = "Gun";
      else if (l3 === 27) cap = "Missile";
      else if (l3 === 104) cap = "Gun + Missile";
      else if (l3 === 101) cap = "Radar";
      else if (l3 === 102) cap = "Radar + Missile";
      else if (l3 === 103) cap = "Radar + Gun + Missile";
      else if (l3 === 105) cap = "Radar + Gun";

      const radarActive = u?.Flags?.RadarActive ?? u?.flags?.RadarActive;
      if (radarActive && cap && !cap.includes("Radar")) cap = `Radar + ${cap}`;
      if (radarActive && !cap) cap = "Radar";
      if (!cap) cap = "—";

      // --- Infantry/MANPAD overrides (use DCS type string; wsType is too coarse for infantry) ---
      const typeName =
        (typeof u?.type === "string" && u.type) ||
        (typeof u?.Type === "string" && u.Type) ||
        (typeof u?.unitType === "string" && u.unitType) ||
        "";
      const t = typeName.toLowerCase();

      const looksInfantry =
        t.includes("soldier") || t.includes("infantry") || t.includes("paratrooper") || t.includes("jtac");
      const isJtac = t.includes("jtac");

      const isManpadWord = t.includes("manpad") || t.includes("stinger") || t.includes("igla") || t.includes("sa-18");
      const isCommSupport = /\b(comm|dsr)\b/i.test(typeName); // reload/support only (can't fire)
      const isRpg = t.includes("rpg");

      if (isJtac) {
        cls = "Infantry";
        cap = "None";
      } else if (isCommSupport && isManpadWord) {
        // Stinger/Igla comm/dsr: support only
        cls = "Infantry";
        cap = "None";
      } else if (isManpadWord) {
        // Actual MANPAD shooter
        cls = "MANPAD";
        cap = "IR Missile";
      } else if (looksInfantry) {
        cls = "Infantry";
        cap = isRpg ? "RPG" : "Small Arms";
      }

      // Normalise any remaining legacy labels
      if (cap === "No Weapon") cap = "None";

      return { cls, cap, l1 };
    };

const refPointEffective = React.useMemo(() => {
    if (refPoint && Number.isFinite(refPoint.lat) && Number.isFinite(refPoint.lon)) return refPoint;
    if (typeof dcsLat === "number" && typeof dcsLon === "number") return { lat: dcsLat, lon: dcsLon };
    return null;
  }, [refPoint, dcsLat, dcsLon]);

  // ===== Receive snapshot results =====
  React.useEffect(() => {
    const onSnapshot = (_event, payload) => {
      try {
        // Allow for possible wrapper shapes from main process: { payload: {...} } etc.
        const msg = payload && payload.payload ? payload.payload : payload;

        const units = Array.isArray(msg) ? msg : msg && Array.isArray(msg.units) ? msg.units : [];

        const origin = !Array.isArray(msg) && msg && msg.origin ? msg.origin : null;
        if (origin && Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lon))) {
          setRefPoint({ lat: Number(origin.lat), lon: Number(origin.lon) });
        }

        const normalized = units
          .map((u) => {
            const lat = Number(u.lat);
            const lon = Number(u.lon ?? u.long);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

            const coalition =
              typeof u.coalition === "string"
                ? u.coalition
                : u.coalition === 1
                  ? "Red"
                  : u.coalition === 2
                    ? "Blue"
                    : "Neutral";

            const type =
              (typeof u.type === "string" && u.type) ||
              (typeof u.Type === "string" && u.Type) ||
              (typeof u.unitType === "string" && u.unitType) ||
              "UNIT";

            const id = u.id ?? u.ObjectId ?? u.unitId ?? u.name ?? `${lat},${lon}`;

            const { cls, cap, l1 } = classifyAndCapability(u);

            const domain =
              l1 === 1
                ? "Air"
                : l1 === 3
                  ? "Naval"
                  : l1 === 2
                    ? "Ground"
                    : l1 === 5
                      ? "Static"
                      : l1 === 4
                        ? "Weapon"
                        : "Unknown";

            const { category, subcategory } = getCatSubForType(type);

            return {
              id,
              coalition,
              type,
              Type: u.Type,
              domain,
              category,
              subcategory,
              className: typeof u.className === "string" && u.className.trim() ? u.className.trim() : cls,
              capability: cap,
              name: (typeof u.name === "string" && u.name) || "",
              lat,
              lon,
              elevM: Number.isFinite(Number(u.elevM))
                ? Number(u.elevM)
                : Number.isFinite(Number(u.elev))
                  ? Number(u.elev)
                  : 0,
              Flags: u.Flags ?? u.flags ?? null,
            };
          })
          .filter(Boolean);

       setSnapshot(normalized);

setImportMap((prev) => {
  const next = {};
  for (const u of normalized) {
    // keep selection if it was already selected
    next[u.id] = !!prev?.[u.id];
  }
  return next;
});

        lastSnapshotAtRef.current = Date.now();
        setSnapshotAgeText("0s");
      } finally {
        const releaseLoading = () => setIsIntelLoading(false);

const now = Date.now();
const minUntil = refreshMinTimerRef.current || now;

if (now >= minUntil) {
  releaseLoading();
} else {
  setTimeout(releaseLoading, minUntil - now);
}
      }
    };

    ipcRenderer.on("intel:snapshotResult", onSnapshot);
    return () => ipcRenderer.removeListener("intel:snapshotResult", onSnapshot);
  }, []);

  // Crosshair on while open
  React.useEffect(() => {
    if (!open) return;
    ipcRenderer.send("messageToDcs", { type: "crosshair", payload: "true" });
    return () => {
      ipcRenderer.send("messageToDcs", { type: "crosshair", payload: "false" });
    };
  }, [open]);

  const handleSort = (key) => {
    if (orderBy === key) setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setOrderBy(key);
      setOrder("asc");
    }
  };

  const refresh = React.useCallback(() => {
  // Clear any existing minimum timer
  if (refreshMinTimerRef.current) {
    clearTimeout(refreshMinTimerRef.current);
    refreshMinTimerRef.current = null;
  }

  // Mark as loading immediately
  setIsIntelLoading(true);

  // Enforce minimum visible "active" time (2s)
  const minActiveUntil = Date.now() + 2000;

  // Store current positions for moved comparison
  prevSnapshotAtRef.current = lastSnapshotAtRef.current || Date.now();
  const prev = new Map();
  for (const u of snapshot) prev.set(u.id, { lat: u.lat, lon: u.lon });
  prevPosRef.current = prev;

  const coalition = (intelCoalitionFilter || "All").toLowerCase();
  const origin = intelOrigin === "Ownship" ? "ownship" : "camera";
  const domain = intelUnitType === "All" ? "all" : (intelUnitType || "Ground").toLowerCase();

  const radiusNm =
    intelWithinEnabled
      ? Math.max(0, unitsMode === "Metric" ? kmToNm(Number(intelRadius) || 0) : Number(intelRadius) || 0)
      : 9999;

  ipcRenderer.send("messageToDcs", {
    cmd: "INTEL_SNAPSHOT",
    radiusNm,
    coalition,
    domain,
    origin,
    type: "intel_snapshot",
    payload: { radiusNm, coalition, domain, origin },
  });

  // Store when we are allowed to clear loading
  refreshMinTimerRef.current = minActiveUntil;
}, [
  snapshot,
  intelCoalitionFilter,
  intelUnitType,
  intelOrigin,
  intelWithinEnabled,
  intelRadius,
  unitsMode,
]);
  // NOTE: No automatic refresh on open (manual Refresh only)

  const rows = React.useMemo(() => {
    const radiusNm = Math.max(0, unitsMode === "Metric" ? kmToNm(Number(intelRadius) || 0) : Number(intelRadius) || 0);

    return snapshot
      .map((u) => {
        let rngNm = 0;
        let brg = 0;
        if (refPointEffective) {
          const rngM = haversineMeters(refPointEffective.lat, refPointEffective.lon, u.lat, u.lon);
          rngNm = rngM / 1852;
          brg = bearingDeg(refPointEffective.lat, refPointEffective.lon, u.lat, u.lon);
        }

        const prev = prevPosRef.current.get(u.id);
        const movedM = prev ? haversineMeters(prev.lat, prev.lon, u.lat, u.lon) : 0;
        const isStatic = prev ? movedM < 5 : true;

        const dtSec = prev ? Math.max(0.001, (lastSnapshotAtRef.current - prevSnapshotAtRef.current) / 1000) : 0;
        const speedMS = prev && dtSec > 0 ? movedM / dtSec : 0;
        const speedDisplay = unitsMode === "Metric" ? speedMS * 3.6 : speedMS * 1.94384; // km/h or kt

        const displayRng = unitsMode === "Metric" ? nmToKm(rngNm) : rngNm;
        const displayElev = unitsMode === "Metric" ? u.elevM : metersToFeet(u.elevM);

        return {
          id: u.id,
          coalition: u.coalition,
          domain: u.domain,
          type: u.type,
          category: u.category,
          subcategory: u.subcategory,
          className: u.className,
          capability: u.capability,
          name: u.name && u.name.trim().length > 0 ? u.name : u.type,
          position: formatPosition(u.lat, u.lon, coordFmt),
          lat: u.lat,
          lon: u.lon,
          elevM: u.elevM,
          brgDeg: brg,
          rngNm,
          displayRng,
          displayElev,
          speed: speedDisplay,
          moved: prev ? movedM >= 5 : false, // <— drives red outline
        };
      })
      .filter((r) => {
        if (intelCoalitionFilter !== "All" && r.coalition !== intelCoalitionFilter) return false;

        // Type filter
        if (intelUnitType !== "All") {
          if (intelUnitType === "Ground" && r.domain !== "Ground") return false;
          if (intelUnitType === "Air" && r.domain !== "Air") return false;
          if (intelUnitType === "Naval" && r.domain !== "Naval") return false;
        }

        return true;
      })
      .filter((r) => (intelWithinEnabled ? r.rngNm <= radiusNm : true));
  }, [snapshot, intelCoalitionFilter, intelUnitType, intelWithinEnabled, intelRadius, unitsMode, refPointEffective, coordFmt]);

  const sortedRows = React.useMemo(() => {
    const dir = order === "asc" ? 1 : -1;
    const key = orderBy;

    const getter = (r) => {
      if (key === "rng") return r.displayRng;
      if (key === "elev") return r.displayElev;
      if (key === "speed") return r.speed;
      if (key === "selected") return importMap[r.id] ? 1 : 0; // <— NEW (1 selected, 0 not)
      return r[key];
    };

    const cmp = (a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return (
        String(va ?? "").localeCompare(String(vb ?? ""), undefined, { numeric: true, sensitivity: "base" }) * dir
      );
    };

    return [...rows].sort(cmp);
  }, [rows, order, orderBy]);

  const selectedCount = React.useMemo(
    () => sortedRows.reduce((acc, r) => acc + (importMap[r.id] ? 1 : 0), 0),
    [sortedRows, importMap]
  );
  const allSelected = sortedRows.length > 0 && selectedCount === sortedRows.length;
  const noneSelected = selectedCount === 0;
  const someSelected = !noneSelected && !allSelected;

  const toggleSelectAll = () => {
    const next = { ...importMap };
    const newValue = !allSelected;
    for (const r of sortedRows) next[r.id] = newValue;
    setImportMap(next);
  };

  const toggleRow = (id) => setImportMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleImportSelected = () => {
    const selected = sortedRows
      .filter((r) => !!importMap[r.id])
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        lat: r.lat,
        lon: r.lon,
        elevM: r.elevM,
      }));

    ipcRenderer.send("unitImport:addWaypoints", selected);
    ipcRenderer.send("unitImport:close");
  };

  const cellSepSx = (key, isLast = false) => ({
    width: colWidths[key],
    maxWidth: colWidths[key],
    borderRight: isLast ? "none" : "1px solid",
    borderColor: "divider",
    py: 0.05,
    px: 0.75,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
fontSize: "0.70rem",
  });

  const headCellSx = (key, isLast = false) => ({
    ...cellSepSx(key, isLast),
    fontWeight: 700,
    backgroundColor: "background.paper",
    userSelect: "none",
    fontSize: "0.70rem",
    // IMPORTANT: keep header pinned while TableContainer scrolls
    position: "sticky",
    top: 0,
    zIndex: 3,
  });

  const startResize = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { key, startX: e.clientX, startW: colWidths[key] || 120 };
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", stopResize);
  };

  const onResizeMove = (e) => {
    if (!dragRef.current) return;
    const { key, startX, startW } = dragRef.current;
    const dx = e.clientX - startX;
    const nextW = Math.max(70, Math.min(800, startW + dx));
    setColWidths((prev) => ({ ...prev, [key]: nextW }));
  };

  const stopResize = () => {
    dragRef.current = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", stopResize);
  };

  const ResizeHandle = ({ colKey }) => (
    <div
      onMouseDown={(e) => startResize(colKey, e)}
      style={{ position: "absolute", top: 0, right: 0, width: 8, height: "100%", cursor: "col-resize" }}
      title="Drag to resize"
    />
  );

  // ---- Import checkbox visuals (no green fill; moved => red outline) ----
  const mkBox = (border, tickColor) => {
    const box = (withTick) => (
      <span
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${border}`,
          borderRadius: 3,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          background: "transparent",
          fontSize: 13,
          lineHeight: 1,
          color: tickColor,
        }}
      >
        {withTick ? "✓" : ""}
      </span>
    );
    return { icon: box(false), checkedIcon: box(true) };
  };

  const normalBox = mkBox("rgba(255,255,255,0.45)", "rgba(255,255,255,0.9)");
  const movedBox = mkBox("#c62828", "rgba(255,255,255,0.9)");

  const coordFmtOptions = [
  { value: "DEC", label: "Dec" },
  { value: "DMS", label: "DMS" },
  { value: "DMS_S", label: "DMS.S" }, // <— add
  { value: "DMM", label: "DMM" },
  { value: "MGRS", label: "MGRS" },
];

  const cycleCoordFmt = (dir) => {
    const idx = coordFmtOptions.findIndex((o) => o.value === coordFmt);
    const next = (idx + dir + coordFmtOptions.length) % coordFmtOptions.length;
    setCoordFmt(coordFmtOptions[next].value);
  };

  const elevUnitLabel = unitsMode === "Metric" ? "m" : "ft";
  const speedUnitLabel = unitsMode === "Metric" ? "km/h" : "kt";

  // Compact dropdown widths (rough “just enough”)
  const fcCompact = (min) => ({ minWidth: min, width: "auto" });
  const selectCompactSx = { "& .MuiSelect-select": { py: 1.0 } };

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { width: "100vw", height: "100vh" } }}>
      <DialogContent sx={{ px:0.2, py: 0.8, display: "flex", flexDirection: "column", gap: 1.0, overflow: "hidden", minHeight: 0, flex: 1, position: "relative" }}>
        {/* Header toolbar: Coalition / Type / Within / Units / of / Origin */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={fcCompact(120)}>
            <InputLabel>Coalition</InputLabel>
            <Select
              value={intelCoalitionFilter}
              label="Coalition"
              onChange={(e) => setIntelCoalitionFilter(e.target.value)}
              sx={selectCompactSx}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Red">Red</MenuItem>
              <MenuItem value="Blue">Blue</MenuItem>
              <MenuItem value="Neutral">Neutral</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={fcCompact(110)}>
            <InputLabel>Type</InputLabel>
            <Select
              value={intelUnitType}
              label="Type"
              onChange={(e) => setIntelUnitType(e.target.value)}
              sx={selectCompactSx}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Ground">Ground</MenuItem>
              <MenuItem value="Air">Air</MenuItem>
              <MenuItem value="Naval">Naval</MenuItem>
            </Select>
          </FormControl>

          {/* Within (tight spacing) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Checkbox checked={intelWithinEnabled} onChange={(e) => setIntelWithinEnabled(e.target.checked)} />
            <Typography sx={{ userSelect: "none" }}>Within</Typography>

            <Box
              onWheel={(e) => {
                // only adjust radius when Within is enabled
                if (!intelWithinEnabled) return;

                e.preventDefault();

                const dir = e.deltaY > 0 ? -1 : 1; // wheel down = smaller, wheel up = bigger
                setIntelRadius((prev) => {
                  const n = Number(prev) || 0;
                  return Math.max(0, Math.round(n + dir));
                });
              }}
              sx={{ display: "flex", alignItems: "center" }}
              title="Mouse wheel changes radius"
            >
              <TextField
                size="small"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={intelRadius}
                onChange={(e) => setIntelRadius(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                sx={{ width: 85 }}
              />
            </Box>
          </Box>

          <FormControl size="small" sx={fcCompact(90)}>
            <InputLabel>Units</InputLabel>
            <Select value={unitsMode} label="Units" onChange={(e) => setUnitsMode(e.target.value)} sx={selectCompactSx}>
              <MenuItem value="Imperial">nmi</MenuItem>
              <MenuItem value="Metric">km</MenuItem>
            </Select>
          </FormControl>

          <Typography sx={{ userSelect: "none" }}>of</Typography>

          <FormControl size="small" sx={fcCompact(180)}>
            <InputLabel>Origin</InputLabel>
            <Select value={intelOrigin} label="Origin" onChange={(e) => setIntelOrigin(e.target.value)} sx={selectCompactSx}>
              <MenuItem value="Camera position">Camera position</MenuItem>
              <MenuItem value="Ownship">Ownship</MenuItem>
            </Select>
          </FormControl>


<FormControl size="small" sx={{ width: 115 }}>
  <InputLabel>Show/Hide</InputLabel>
  <OutlinedInput
    label="Show/Hide"
    value="Columns"
    readOnly
    onClick={(e) => setColsAnchorEl(e.currentTarget)}
    endAdornment={
      <InputAdornment position="end">
        <ArrowDropDownIcon sx={{ opacity: 0.7 }} />
      </InputAdornment>
    }
    sx={{
      cursor: "pointer",
      "& input": { cursor: "pointer", py: 1.0 },
    }}
  />
</FormControl>

<Menu
  anchorEl={colsAnchorEl}
  open={colsMenuOpen}
  onClose={() => setColsAnchorEl(null)}
>
  <Box sx={{ px: 2, py: 1.5 }}>
    <FormGroup>
      {[
        ["coalition", "Coalition"],
        ["type", "Type"],
        ["category", "Category"],
        ["subcategory", "SubCategory"],
        ["capability", "Capability"],
        ["name", "Unit / Group Name"],
        ["position", "Position"],
        ["elev", `Elev (${elevUnitLabel})`],
        ["brgDeg", "Bearing"],
        ["rng", "Range"],
        ["speed", `Speed (${speedUnitLabel})`],
      ].map(([key, label]) => (
        <FormControlLabel
          key={key}
          control={
            <Checkbox
              checked={!!colVis[key]}
              onChange={() => toggleCol(key)}
              size="small"
            />
          }
          label={label}
        />
      ))}
    </FormGroup>

    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
      <Button size="small" onClick={() => setColVis(defaultColVis)}>
        Reset
      </Button>
      <Button
        size="small"
        onClick={() =>
          setColVis((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) next[k] = false;
            return next;
          })
        }
      >
        Hide all
      </Button>
      <Button
        size="small"
        onClick={() =>
          setColVis((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) next[k] = true;
            return next;
          })
        }
      >
        Show all
      </Button>
    </Box>
  </Box>
</Menu>

<Box sx={{ flexGrow: 1, minWidth: 8 }} />


          <Button variant="outlined" size="small" onClick={refresh} disabled={isIntelLoading}>
            {isIntelLoading ? "Request" : "Request"}
          </Button>

          <Button
  variant="contained"
  size="small"
  onClick={handleImportSelected}
  disabled={selectedCount === 0}
>
  Import {selectedCount}
</Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: "auto", minHeight: 0, maxHeight: "100%" }}>
          <Table stickyHeader size="small" sx={{ tableLayout: "fixed", borderCollapse: "separate" }}>
            <TableHead>
              <TableRow>
{isColVisible("coalition") && (
  <TableCell sx={headCellSx("coalition")}>
    <TableSortLabel
      active={orderBy === "coalition"}
      direction={orderBy === "coalition" ? order : "asc"}
      onClick={() => handleSort("coalition")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Coalition
    </TableSortLabel>
    <ResizeHandle colKey="coalition" />
  </TableCell>
)}

{isColVisible("type") && (
  <TableCell sx={headCellSx("type")}>
    <TableSortLabel
      active={orderBy === "type"}
      direction={orderBy === "type" ? order : "asc"}
      onClick={() => handleSort("type")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Type
    </TableSortLabel>
    <ResizeHandle colKey="type" />
  </TableCell>
)}

{isColVisible("category") && (
  <TableCell sx={headCellSx("category")}>
    <TableSortLabel
      active={orderBy === "category"}
      direction={orderBy === "category" ? order : "asc"}
      onClick={() => handleSort("category")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Category
    </TableSortLabel>
    <ResizeHandle colKey="category" />
  </TableCell>
)}

{isColVisible("subcategory") && (
  <TableCell sx={headCellSx("subcategory")}>
    <TableSortLabel
      active={orderBy === "subcategory"}
      direction={orderBy === "subcategory" ? order : "asc"}
      onClick={() => handleSort("subcategory")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      SubCategory
    </TableSortLabel>
    <ResizeHandle colKey="subcategory" />
  </TableCell>
)}

{isColVisible("capability") && (
  <TableCell sx={headCellSx("capability")}>
    <TableSortLabel
      active={orderBy === "capability"}
      direction={orderBy === "capability" ? order : "asc"}
      onClick={() => handleSort("capability")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Capability
    </TableSortLabel>
    <ResizeHandle colKey="capability" />
  </TableCell>
)}

{isColVisible("name") && (
  <TableCell sx={headCellSx("name")}>
    <TableSortLabel
      active={orderBy === "name"}
      direction={orderBy === "name" ? order : "asc"}
      onClick={() => handleSort("name")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Unit / Group Name
    </TableSortLabel>
    <ResizeHandle colKey="name" />
  </TableCell>
)}

{isColVisible("position") && (
  <TableCell sx={headCellSx("position")}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <span>Position</span>

      <Box
        onWheel={(e) => {
          e.preventDefault();
          const dir = e.deltaY > 0 ? 1 : -1;
          cycleCoordFmt(dir);
        }}
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        title="Mouse wheel changes coordinate format"
      >
        <Select
          size="small"
          value={coordFmt}
          onChange={(e) => setCoordFmt(e.target.value)}
          variant="outlined"
          sx={{
            height: 26,
            fontSize: "0.70rem",
            "& .MuiSelect-select": { py: 0.3, pr: 2.5 },
          }}
        >
          {coordFmtOptions.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>

    <ResizeHandle colKey="position" />
  </TableCell>
)}

{isColVisible("elev") && (
  <TableCell sx={headCellSx("elev")}>
    <TableSortLabel
      active={orderBy === "elev"}
      direction={orderBy === "elev" ? order : "asc"}
      onClick={() => handleSort("elev")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Elev ({elevUnitLabel})
    </TableSortLabel>
    <ResizeHandle colKey="elev" />
  </TableCell>
)}

{isColVisible("brgDeg") && (
  <TableCell sx={headCellSx("brgDeg")}>
    <TableSortLabel
      active={orderBy === "brgDeg"}
      direction={orderBy === "brgDeg" ? order : "asc"}
      onClick={() => handleSort("brgDeg")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Bearing
    </TableSortLabel>
    <ResizeHandle colKey="brgDeg" />
  </TableCell>
)}

{isColVisible("rng") && (
  <TableCell sx={headCellSx("rng")}>
    <TableSortLabel
      active={orderBy === "rng"}
      direction={orderBy === "rng" ? order : "asc"}
      onClick={() => handleSort("rng")}
      sx={{ width: "100%", justifyContent: "space-between" }}
    >
      Range
    </TableSortLabel>
    <ResizeHandle colKey="rng" />
  </TableCell>
)}

{isColVisible("speed") && (
<TableCell sx={headCellSx("speed")}>
  <TableSortLabel
    active={orderBy === "speed"}
    direction={orderBy === "speed" ? order : "asc"}
    onClick={() => handleSort("speed")}
  >
    Speed ({speedUnitLabel})
  </TableSortLabel>
  <ResizeHandle colKey="speed" />
</TableCell>
)}
{/* Import (always shown) */}
<TableCell
  align="center"
  sx={{
  ...headCellSx("import", true),
  cursor: "pointer",
  px: 0.5,
  position: "relative",

  "&:hover .importSort .MuiTableSortLabel-icon": { opacity: 0.4 },
  "&:hover .importSort.Mui-active .MuiTableSortLabel-icon": { opacity: 1 },
}}
  onClick={() => handleSort("selected")}
  title="Click to sort by selected"
>
  {/* Centered select-all checkbox */}
  <Box
    sx={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    }}
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <Checkbox
      checked={allSelected}
      indeterminate={someSelected}
      onChange={toggleSelectAll}
      inputProps={{ "aria-label": "select/deselect all" }}
      size="small"
      icon={normalBox.icon}
      checkedIcon={normalBox.checkedIcon}
      sx={{ p: 0.25 }}
    />
  </Box>

  {/* Right-aligned sort indicator */}
<Box
  sx={{
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  }}
>
  <TableSortLabel
    className="importSort"
    active={orderBy === "selected"}
    direction={orderBy === "selected" ? order : "desc"}
    sx={{
      m: 0,

      // icon hidden by default (when NOT active)
      "& .MuiTableSortLabel-icon": {
        opacity: 0,
        transition: "opacity 120ms ease-in-out",
      },

      // icon visible when active
      "&.Mui-active .MuiTableSortLabel-icon": {
        opacity: 1,
      },
    }}
  >
    <span />
  </TableSortLabel>
</Box>

  <ResizeHandle colKey="import" />
</TableCell>

</TableRow>
            </TableHead>

            <TableBody>
              {sortedRows.map((row) => {
                const moved = !!row.moved;
                const box = moved ? movedBox : normalBox;

                return (
                  <TableRow key={row.id} hover>
                    {isColVisible("coalition") && <TableCell sx={cellSepSx("coalition")}>{row.coalition}</TableCell>}
{isColVisible("type") && <TableCell sx={cellSepSx("type")}>{row.type}</TableCell>}
{isColVisible("category") && <TableCell sx={cellSepSx("category")}>{row.category}</TableCell>}
{isColVisible("subcategory") && <TableCell sx={cellSepSx("subcategory")}>{row.subcategory}</TableCell>}
{isColVisible("capability") && <TableCell sx={cellSepSx("capability")}>{row.capability}</TableCell>}
{isColVisible("name") && <TableCell sx={cellSepSx("name")}>{row.name}</TableCell>}
{isColVisible("position") && <TableCell sx={cellSepSx("position")}>{row.position}</TableCell>}

{isColVisible("elev") && <TableCell sx={cellSepSx("elev")}>{Math.round(row.displayElev)}</TableCell>}

{isColVisible("brgDeg") && (
  <TableCell sx={cellSepSx("brgDeg")}>
    {Number.isFinite(row.brgDeg) ? row.brgDeg.toFixed(1) : "0.0"}°
  </TableCell>
)}

{isColVisible("rng") && (
  <TableCell sx={cellSepSx("rng")}>
    {Number.isFinite(row.displayRng)
      ? unitsMode === "Metric"
        ? row.displayRng.toFixed(2)
        : row.displayRng.toFixed(1)
      : unitsMode === "Metric"
        ? "0.00"
        : "0.0"}
  </TableCell>
)}

{isColVisible("speed") && (
<TableCell sx={cellSepSx("speed")}>
  {Number.isFinite(row.speed) ? row.speed.toFixed(1) : "0.0"}
</TableCell>
)}
{/* Import (always shown) */}
<TableCell align="center" sx={cellSepSx("import", true)}>
  <Checkbox
    checked={!!importMap[row.id]}
    onChange={() => toggleRow(row.id)}
    size="small"
    icon={box.icon}
    checkedIcon={box.checkedIcon}
    sx={{ p: 0.25 }}
    title={moved ? "Unit has moved since last snapshot" : "Import"}
  />
</TableCell>

                  </TableRow>
                );
              })}

              {sortedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColCount} sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      No units match the current filters (or no snapshot received yet).
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography
  variant="caption"
  sx={{ opacity: 0.5, bottom: 80, fontSize: "0.7rem" }}
>
  Press REQUEST to capture units. REQUEST again to calculate moving units. 
  
  PREVIOUS SNAPSHOT MAY BE SHOWN.  Check Snapshot age -->
</Typography>
      
        {/* Snapshot age (small, bottom-right) */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            right: 28,
            bottom: 5,
            opacity: 0.7,
            fontSize: "0.75rem",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Snapshot age: {snapshotAgeText}
        </Typography>
</DialogContent>

      
    </Dialog>
  );
}