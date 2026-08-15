class jf17 {
  static slotVariant = "";
  static extraDelay = 0;
  static delay = 120;

  static #ufcpDevice = 46;
  static #codesPayload = [];

  static #ufcpCodes = {
    0: 3224,
    1: 3202,
    2: 3203,
    3: 3204,
    4: 3209,
    5: 3210,
    6: 3211,
    7: 3216,
    8: 3217,
    9: 3218,
    DST: 3209,
    R1: 3206,
    L2: 3212,
    L3: 3219,
    R4: 3227,
  };

  static #press(codeName, delay = this.delay) {
    return {
      device: this.#ufcpDevice,
      code: this.#ufcpCodes[codeName],
      delay: delay + this.extraDelay,
      activate: 1,
      addDepress: "true",
    };
  }

  static #typeDigits(text) {
    for (const char of String(text)) {
      if (this.#ufcpCodes[char] !== undefined) {
        this.#codesPayload.push(this.#press(char));
      }
    }
  }

  static #pointBase() {
    if (this.slotVariant === "JF-17_RP") return 30;
    if (this.slotVariant === "JF-17_PP") return 36;
    return 1;
  }

  static #pointLimit() {
    if (this.slotVariant === "JF-17_RP") return 6;
    if (this.slotVariant === "JF-17_PP") return 4;
    return 29;
  }

  static createButtonCommands(waypoints) {
    this.#codesPayload = [];

    this.#codesPayload.push(this.#press("DST", 350));

    const base = this.#pointBase();
    const limit = this.#pointLimit();
    const selectedWaypoints = waypoints.slice(0, limit);

    for (let index = 0; index < selectedWaypoints.length; index++) {
      const waypoint = selectedWaypoints[index];
      const pointNumber = String(base + index);

      this.#codesPayload.push(this.#press("R1", 180));
      this.#typeDigits(pointNumber);
      this.#codesPayload.push(this.#press("R1", 260));

      this.#codesPayload.push(this.#press("L2", 180));
      this.#typeDigits(waypoint.lat);
      this.#codesPayload.push(this.#press("L2", 260));

      this.#codesPayload.push(this.#press("L3", 180));
      this.#typeDigits(waypoint.long);
      this.#codesPayload.push(this.#press("L3", 260));

      this.#codesPayload.push(this.#press("R4", 180));
      this.#typeDigits(waypoint.elev);
      this.#codesPayload.push(this.#press("R4", 300));
    }

    return this.#codesPayload;
  }
}

export default jf17;
