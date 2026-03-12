class ah6j {

  // ============================================================
  // Module metadata
  // ============================================================

  static slotVariant = "";

  static #device = 13;

  static extraDelay = 0;

  static #delay0 = 0 + this.extraDelay;
  static #delay100 = 100 + this.extraDelay;
  static #delay500 = 500 + this.extraDelay;


  // ============================================================
  // Cockpit command codes
  // ============================================================

  static #codes = {
    AUX: 3311,
    WPT: 3306,
    ENT: 3313,
    INNER: 3314,
    OUTER: 3315,
  };

  static #codesPayload = [];


  // ============================================================
  // Character set used by the TNL3100 waypoint name field
  // ============================================================

  static #nameCharset = "XYZ0123456789 ABCDEFGHIJKLMNOPQRSTUVW";


  // ============================================================
  // KNOB / BUTTON HELPER FUNCTIONS
  // ============================================================

  // Turn inner knob multiple steps
  static #pushInnerSteps(device, steps) {

    const dir = steps >= 0 ? 1 : -1;

    for (let i = 0; i < Math.abs(steps); i++) {
      this.#codesPayload.push({
        device: device,
        code: this.#codes.INNER,
        delay: this.#delay0,
        activate: dir,
      });
    }
  }

  // Turn outer knob clockwise
  static #pushOuterCW(device, count = 1) {

    for (let i = 0; i < count; i++) {
      this.#codesPayload.push({
        device: device,
        code: this.#codes.OUTER,
        delay: this.#delay100,
        activate: 1,
      });
    }
  }

  // Turn outer knob counter-clockwise
  static #pushOuterCCW(device, count = 1) {

    for (let i = 0; i < count; i++) {
      this.#codesPayload.push({
        device: device,
        code: this.#codes.OUTER,
        delay: this.#delay100,
        activate: -1,
      });
    }
  }

  // Press + release a button
  static #press(device, code) {

    this.#codesPayload.push({
      device: device,
      code: code,
      delay: this.#delay100,
      activate: 1,
      addDepress: "false",
    });

    this.#codesPayload.push({
      device: device,
      code: code,
      delay: this.#delay500,
      activate: 0,
      addDepress: "false",
    });
  }


  // ============================================================
  // WAYPOINT NAME HANDLING
  // ============================================================

  static #indexInCharset(charset, ch) {
    const i = charset.indexOf(ch);
    return i >= 0 ? i : 0;
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

    const raw = String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, " ");

    return raw.padEnd(3, " ").slice(0, 3);
  }

  static #buildLabel(waypoint, num) {

    const prefix = this.#sanitizeName(waypoint?.name);
    const suffix = String(num % 10);

    return `${prefix}${suffix}`;
  }


  // ============================================================
  // COORDINATE PARSING
  //
  // TheWay format:
  //   LAT  = "41.36.275"
  //   LONG = "041.36.471"
  //
  // Converted to:
  //   degrees
  //   minutes (stored as integer thousandths)
  // ============================================================

  static #parseCoord(coord) {

    const p = String(coord || "").split(".");

    if (p.length !== 3) {
      return { deg: 0, min: 0 };
    }

    const deg = parseInt(p[0], 10) || 0;

    const min =
      (parseInt(p[1], 10) || 0) * 1000 +
      (parseInt(p[2], 10) || 0);

    return { deg, min };
  }


  // ============================================================
  // DIGIT MANIPULATION HELPERS
  // ============================================================

  static #digit(value, place) {
    return Math.floor(value / place) % 10;
  }

  static #digitSteps(a, b) {

    const cw = (b - a + 10) % 10;
    const ccw = cw - 10;

    return Math.abs(cw) <= Math.abs(ccw) ? cw : ccw;
  }

  static #apply(value, steps, place) {
    return value + steps * place;
  }


  // ============================================================
  // MAIN COMMAND GENERATOR
  // ============================================================

  static createButtonCommands(waypoints) {

    this.#codesPayload = [];

    const device = this.#device;

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return this.#codesPayload;
    }

    const reference = waypoints[0];


    // ========================================================
// INITIAL TNL3100 MODE SETUP (run once)
// ========================================================

this.#press(device, this.#codes.AUX);
this.#press(device, this.#codes.AUX);
this.#press(device, this.#codes.AUX);

this.#press(device, this.#codes.WPT);


// ========================================================
// WAYPOINT ENTRY LOOP
// ========================================================

for (let i = 1; i < waypoints.length; i++) {

  const prev = reference;
  const next = waypoints[i];

  const label = this.#buildLabel(next, i + 1);


  // ----------------------------------------------------
  // CREATE NEW WAYPOINT
  // ----------------------------------------------------

  this.#pushOuterCW(device, 1);
  this.#pushOuterCW(device, 1);

  this.#press(device, this.#codes.ENT);

  this.#pushOuterCW(device, 1);

  this.#press(device, this.#codes.ENT);


  // ----------------------------------------------------
  // NAME ENTRY
  // ----------------------------------------------------

      let current = ["X","X","X","X"];
      const target = label.split("");

      for (let c = 0; c < 4; c++) {

        const s = this.#shortestSteps(
          current[c],
          target[c],
          this.#nameCharset
        );

        this.#pushInnerSteps(device, s);

        current[c] = target[c];

        if (c < 3) this.#pushOuterCW(device,1);
      }


      // ----------------------------------------------------
      // COORDINATE ENTRY
      // ----------------------------------------------------

      const prevLat = this.#parseCoord(prev.lat);
      const nextLat = this.#parseCoord(next.lat);

      const prevLon = this.#parseCoord(prev.long);
      const nextLon = this.#parseCoord(next.long);

      // move from name field to longitude thousandths
      this.#pushOuterCCW(device,4);


      // ----------------------------------------------------
      // LONGITUDE MINUTES
      // ----------------------------------------------------

      let lonMin = prevLon.min;

      for (let p = 1; p <= 10000; p *= 10) {

        const a = this.#digit(lonMin, p);
        const b = this.#digit(nextLon.min, p);

        const s = this.#digitSteps(a, b);

        this.#pushInnerSteps(device, s);

        lonMin = this.#apply(lonMin, s, p);

        this.#pushOuterCCW(device, 1);
      }


      // ----------------------------------------------------
      // LONGITUDE DEGREES
      // ----------------------------------------------------

      let lonDeg = prevLon.deg;

      const lonWidth = Math.max(
        String(prevLon.deg).length,
        String(nextLon.deg).length,
        2
      );

      for (let p = 1; p < Math.pow(10, lonWidth); p *= 10) {

        const a = this.#digit(lonDeg, p);
        const b = this.#digit(nextLon.deg, p);

        const s = this.#digitSteps(a, b);

        this.#pushInnerSteps(device, s);

        lonDeg = this.#apply(lonDeg, s, p);

        this.#pushOuterCCW(device, 1);
      }


      // ----------------------------------------------------
      // LATITUDE MINUTES
      // ----------------------------------------------------

      let latMin = prevLat.min;

      for (let p = 1; p <= 10000; p *= 10) {

        const a = this.#digit(latMin, p);
        const b = this.#digit(nextLat.min, p);

        const s = this.#digitSteps(a, b);

        this.#pushInnerSteps(device, s);

        latMin = this.#apply(latMin, s, p);

        this.#pushOuterCCW(device, 1);
      }


      // ----------------------------------------------------
      // LATITUDE DEGREES
      // ----------------------------------------------------

      let latDeg = prevLat.deg;

      for (let p = 1; p <= 10; p *= 10) {

        const a = this.#digit(latDeg, p);
        const b = this.#digit(nextLat.deg, p);

        const s = this.#digitSteps(a, b);

        this.#pushInnerSteps(device, s);

        latDeg = this.#apply(latDeg, s, p);

        if (p < 10) this.#pushOuterCCW(device, 1);
      }


      // ----------------------------------------------------
      // RETURN TO NAME FIELD
      // ----------------------------------------------------

      this.#pushOuterCCW(device,4);


      // ----------------------------------------------------
      // SAVE WAYPOINT
      // ----------------------------------------------------

      this.#press(device, this.#codes.ENT);
    }

    return this.#codesPayload;
  }

}

export default ah6j;