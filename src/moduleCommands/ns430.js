// ============================================================
// NS430 waypoint entry helpers
// Shared across aircraft that host the ED NS430
// ============================================================

class ns430 {

  // ============================================================
  // MODULE METADATA
  // ============================================================

  static slotVariant = "";
  static #device = 257;
  static extraDelay = 0;

  static #buttonPauseMs = 100;
  static #betweenButtonPauseMs = 200;

  static #rotaryPauseMs = 150;
  static #betweenRotaryPauseMs = 100;

  static #rotaryPushPauseMs = 200;
  static #betweenRotaryPushPauseMs = 100;

  static #cursorPauseMs = 200;

  static #holdClrMs = 2800;

  static #postEntSettleMs = 250;

  // ============================================================
  // NS430 COMMAND CODES
  // ============================================================

  static #codes = {
    CLRD: 3023,
    CLRU: 3044,
    DIRD: 3021,
    DIRU: 3042,
    ENTD: 3024,
    ENTU: 3045,
    FPLD: 3017,
    FPLU: 3038,
    MENUD: 3022,
    MENUU: 3043,
    MSGU: 3016,
    MSGD: 3037,
    RIGHT_BIG: 3026,
    RIGHT_SMALL: 3028,
    RIGHT_SMALL_PUSHD: 3027,
    RIGHT_SMALL_PUSHU: 3046,
  };

  static #codesPayload = [];
  static #lastEnteredName = "     ";

  // ============================================================
  // CHARACTER SETS
  // ============================================================

  static #nameCharset = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  static #coordCharsets = [
    "NS",
    "012345678",
    "0123456789",
    "012345",
    "0123456789",
    "0123456789",
    "0123456789",
    "EW",
    "01",
    "01234567",
    "0123456789",
    "012345",
    "0123456789",
    "0123456789",
    "0123456789",
  ];

  // ============================================================
  // PAYLOAD MANAGEMENT
  // ============================================================

  static resetPayload() {
    this.#codesPayload = [];
  }

  static getPayload() {
    return this.#codesPayload.slice();
  }

  // ============================================================
// LOW LEVEL INPUT HELPERS
// ============================================================

// Pause
static #pause(ms) {
  this.#codesPayload.push({
    device: 0,
    code: 0,
    delay: ms,
    activate: 0,
  });
}

// Button timings
static #button( codeDown, codeUp, pressMs = this.#buttonPauseMs, betweenMs = this.#betweenButtonPauseMs ) {
  this.#codesPayload.push({
    device: this.#device,
    code: codeDown,
    delay: 0,
    activate: 1,
    addDepress: "false",
  });
  this.#pause(pressMs);
  this.#codesPayload.push({
    device: this.#device,
    code: codeUp,
    delay: 0,
    activate: 0,
    addDepress: "false",
  });
  this.#pause(betweenMs);
}


// Rotary timings
static #rotary( code, dir, addDepress = "false", pressMs = this.#rotaryPauseMs, betweenMs = this.#betweenRotaryPauseMs ) {
  this.#codesPayload.push({
    device: this.#device,
    code,
    delay: pressMs,
    activate: dir,
    addDepress,
  });
  this.#codesPayload.push({
    device: this.#device,
    code,
    delay: betweenMs,
    activate: 0,
    addDepress,
  });
}


// Rotary push timings
static #rotaryPush( codeDown, codeUp, pushsMs = this.#rotaryPushPauseMs, betweenMs = this.#betweenRotaryPushPauseMs ) {
  this.#codesPayload.push({
    device: this.#device,
    code: codeDown,
    delay: pushsMs,
    activate: 1,
    addDepress: "false",
  });
  this.#codesPayload.push({
    device: this.#device,
    code: codeUp,
    delay: betweenMs,
    activate: 0,
    addDepress: "false",
  });
  this.#pause(betweenMs);
}

// Held button
static #holdButton(codeDown, codeUp, holdMs, betweenMs = this.#betweenButtonPauseMs ) {
  this.#codesPayload.push({
    device: this.#device,
    code: codeDown,
    delay: 0,
    activate: 1,
    addDepress: "false",
  });
  this.#pause(holdMs);
  this.#codesPayload.push({
    device: this.#device,
    code: codeUp,
    delay: 0,
    activate: 0,
    addDepress: "false",
  });
  this.#pause(betweenMs);
}
  // ============================================================
  // NAMED BUTTON / ROTARY HELPERS
  // ============================================================

  static #CLR() {
  this.#button(this.#codes.CLRD, this.#codes.CLRU);
}

static #DIR() {
  this.#button(this.#codes.DIRD, this.#codes.DIRU);
}

static #ENT(releaseMs = this.#betweenButtonPauseMs) {
  this.#button(this.#codes.ENTD, this.#codes.ENTU, this.#buttonPauseMs, releaseMs);
}

static #FPL() {
  this.#button(this.#codes.FPLD, this.#codes.FPLU);
}

static #MENU() {
  this.#button(this.#codes.MENUD, this.#codes.MENUU);
}

static #MSG() {
  this.#button(this.#codes.MSGD, this.#codes.MSGU);
}

static #BIGr(addDepress = "false") {
  this.#rotary(this.#codes.RIGHT_BIG, 1, addDepress, this.#cursorPauseMs, this.#betweenRotaryPauseMs);
}

static #BIGl(addDepress = "false") {
  this.#rotary(this.#codes.RIGHT_BIG, -1, addDepress, this.#cursorPauseMs, this.#betweenRotaryPauseMs);
}

static #SMALLr(addDepress = "false") {
  this.#rotary(this.#codes.RIGHT_SMALL, 1, addDepress);
}

static #SMALLl(addDepress = "false") {
  this.#rotary(this.#codes.RIGHT_SMALL, -1, addDepress);
}

static #SMALLp() {
  this.#rotaryPush(
    this.#codes.RIGHT_SMALL_PUSHD,
    this.#codes.RIGHT_SMALL_PUSHU
  );
}

static #holdCLR() {
  this.#holdButton(
    this.#codes.CLRD,
    this.#codes.CLRU,
    this.#holdClrMs
  );
}

  // ============================================================
  // AUTOMATIC / CALCULATION HELPERS
  // Keep the builders below focused on readable press sequences.
  // ============================================================

  static #indexInCharset(charset, ch) {
    const idx = charset.indexOf(ch);
    return idx >= 0 ? idx : 0;
  }

  static #shortestSteps(from, to, charset) {
    const len = charset.length;
    const a = this.#indexInCharset(charset, from);
    const b = this.#indexInCharset(charset, to);
    const cw = (b - a + len) % len;
    const ccw = cw - len;
    return Math.abs(cw) <= Math.abs(ccw) ? cw : ccw;
  }

  static #sanitizeName(name) {
    return String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9+]/g, " ")
      .padEnd(5, " ")
      .slice(0, 5);
  }

  static #formatDecimalDegreesToEditableChars(value, isLat) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Invalid ${isLat ? "latitude" : "longitude"} snapshot value: ${value}`);
    }

    const hemi = numericValue >= 0
      ? (isLat ? "N" : "E")
      : (isLat ? "S" : "W");

    let absValue = Math.abs(numericValue);
    let degrees = Math.floor(absValue);
    let minutesHundredths = Math.round((absValue - degrees) * 60 * 100);

    if (minutesHundredths >= 6000) {
      degrees += 1;
      minutesHundredths = 0;
    }

    const maxDegrees = isLat ? 89 : 179;
    if (degrees > maxDegrees) {
      degrees = maxDegrees;
      minutesHundredths = 5999;
    }

    const degreeWidth = isLat ? 2 : 3;
    const degreeDigits = String(degrees).padStart(degreeWidth, "0");
    const minuteWhole = Math.floor(minutesHundredths / 100);
    const minuteDecimal = minutesHundredths % 100;
    const minuteDigits = `${String(minuteWhole).padStart(2, "0")}${String(minuteDecimal).padStart(2, "0")}`;

    return [hemi, ...degreeDigits.split(""), ...minuteDigits.split("")];
  }

  static #formatWaypointFieldToEditableChars(coordText, hemi, isLat) {
    const safeHemi = String(hemi || (isLat ? "N" : "E")).toUpperCase();
    const digitsOnly = String(coordText || "").replace(/\D/g, "");
    const expectedLength = isLat ? 6 : 7;
    const paddedDigits = digitsOnly.padStart(expectedLength, "0").slice(-expectedLength);
    return [safeHemi, ...paddedDigits.split("")];
  }

  static #waypointToTargetChars(waypoint) {
    const latHem = waypoint?.latHemi || waypoint?.latHem || "N";
    const longHem = waypoint?.longHemi || waypoint?.longHem || "E";

    const latChars = this.#formatWaypointFieldToEditableChars(waypoint?.lat, latHem, true);
    const longChars = this.#formatWaypointFieldToEditableChars(waypoint?.long, longHem, false);

    return [...latChars, ...longChars];
  }

  static #snapshotToCurrentChars(snapshot) {
    const latValue = snapshot?.lat ?? snapshot?.Lat ?? snapshot?.latitude;
    const longValue = snapshot?.long ?? snapshot?.lon ?? snapshot?.Long ?? snapshot?.longitude;

    const latChars = this.#formatDecimalDegreesToEditableChars(latValue, true);
    const longChars = this.#formatDecimalDegreesToEditableChars(longValue, false);

    return [...latChars, ...longChars];
  }

  static #turnSmallBySteps(steps) {
    if (steps === 0) {
      return;
    }

    const stepFn = steps > 0 ? this.#SMALLr.bind(this) : this.#SMALLl.bind(this);
    for (let s = 0; s < Math.abs(steps); s += 1) {
      stepFn();
    }
  }

  static #setCharacter(fromChar, toChar, charset) {
    const steps = this.#shortestSteps(fromChar, toChar, charset);
    this.#turnSmallBySteps(steps);
    return toChar;
  }

  static #applyNameCharacter(current, target, index) {
    const previousChar = current[index];
    current[index] = this.#setCharacter(previousChar, target[index], this.#nameCharset);

    if (previousChar !== target[index]) {
      for (let j = index + 1; j < current.length; j += 1) {
        current[j] = " ";
      }
    }
  }

  static #enterNameAutomatically(name) {
    const target = this.#sanitizeName(name).split("");
    const current = this.#lastEnteredName.split("");

    for (let i = 0; i < current.length; i += 1) {
      this.#applyNameCharacter(current, target, i);

      if (i < current.length - 1) {
        this.#BIGr();
      }
    }

    this.#lastEnteredName = target.join("");
  }

  static #enterCoordinatesAutomatically(current, target) {
    current[0] = this.#setCharacter(current[0], target[0], this.#coordCharsets[0]);

    this.#pause(100);
    this.#BIGr();
    this.#pause(100);

    for (let i = 1; i < this.#coordCharsets.length; i += 1) {
      current[i] = this.#setCharacter(current[i], target[i], this.#coordCharsets[i]);

      if (i < this.#coordCharsets.length - 1) {
        this.#BIGr();
      }
    }
  }

  // ============================================================
// SETUP COMMANDS
// ============================================================

static buildSetupCommands(deletePasses = 10) {
  this.resetPayload();
  this.#lastEnteredName = "     ";

  this.#pause(100);

  // Sequence: establish a reliable starting point.
  this.#holdCLR();
  this.#BIGr();

  for (let i = 0; i < 9; i += 1) {
    this.#SMALLr();
  }

  // Automatic: delete all user waypoints.
  for (let i = 0; i < deletePasses; i += 1) {
    this.#MENU();
    this.#SMALLr("true");
    this.#ENT();
    this.#ENT();
  }

  // Sequence: exit the delete loop cleanly.
  this.#SMALLp();
  this.#pause(300);
  this.#SMALLl();
  this.#pause(300);
  this.#SMALLr();
  this.#SMALLr();
  this.#SMALLr();
  this.#pause(300);
  this.#CLR();
  this.#CLR();
  this.#CLR();
  this.#CLR();

  return this.getPayload();
}

// Inner Push in it's own payload
static buildFinalSetupPushCommands() {
  this.resetPayload();

  this.#pause(100);
  this.#SMALLp();
  this.#pause(200);

  return this.getPayload();
}
  // ============================================================
  // NAME ENTRY COMMANDS
  // ============================================================

  static buildNameCharactersCommands(name) {
    this.resetPayload();

    this.#pause(100);

    // Sequence: move to first editable name character.
    this.#SMALLr();

    this.#pause(200);

    // Automatic: enter the name from current cached state.
    this.#enterNameAutomatically(name);

    this.#pause(500);

    return this.getPayload();
  }

  static buildConfirmNameCommands() {
    this.resetPayload();

    // Sequence: confirm name entry.
    this.#ENT(this.#postEntSettleMs);

    return this.getPayload();
  }

  static buildNameEntryCommands(name) {
    return [
      ...this.buildNameCharactersCommands(name),
      ...this.buildConfirmNameCommands(),
    ];
  }

  // ============================================================
  // MOVE TO POSITION FIELD
  // ============================================================

  static buildMoveToPositionFieldCommands() {
    this.resetPayload();

    this.#pause(100);

    // Sequence: step through prompts to the position page.
    for (let i = 0; i < 5; i += 1) {
      this.#ENT();
    }
    this.#ENT(this.#postEntSettleMs);

    this.#pause(100);

    // Sequence: return the cursor to the first editable position character.
    this.#SMALLr();
    for (let i = 0; i < 7; i += 1) {
      this.#BIGl();
    }
    //this.#SMALLr();

    this.#pause(200);

    return this.getPayload();
  }

  // ============================================================
  // COORDINATE ENTRY COMMANDS
  // ============================================================

  static buildCoordinateEntryCommands(currentPosition, waypoint) {
    this.resetPayload();

    const current = this.#snapshotToCurrentChars(currentPosition);
    const target = this.#waypointToTargetChars(waypoint);

    // DEBUG: show coordinate conversion.
    const rawLat = currentPosition?.lat;
    const rawLon = currentPosition?.long ?? currentPosition?.lon;

    const roundedLat = current.slice(0, 7).join("");
    const roundedLon = current.slice(7).join("");

    const targetLat = target.slice(0, 7).join("");
    const targetLon = target.slice(7).join("");

    console.log("NS430 POSITION DEBUG");
    console.log("Raw aircraft position:", rawLat, rawLon);
    console.log("Rounded editable:", roundedLat, roundedLon);
    console.log("Target waypoint:", targetLat, targetLon);
    console.log("Waypoint source:", waypoint);
    console.log("------------------------------------------------");

    // Automatic: edit every coordinate character from current to target.
    this.#enterCoordinatesAutomatically(current, target);

    this.#pause(200);

    // Sequence: confirm coordinate entry.
    this.#ENT();
    this.#pause(400);
    this.#ENT();
    this.#pause(400);
    this.#ENT();

    return this.getPayload();
  }

  // ============================================================
  // SAVE WAYPOINT COMMANDS
  // ============================================================

  static buildSaveWaypointCommands() {
    this.resetPayload();

    this.#pause(200);

    // Sequence: save and return.
    this.#SMALLp();
    this.#MSG();
    this.#MSG();

    return this.getPayload();
  }
}

export default ns430;
