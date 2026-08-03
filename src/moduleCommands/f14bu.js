class f14bu {
  static extraDelay = 0;

  static #device = 81; // devices.CDNU

  // Cockpit/command_defs.lua numbers the CDNU clickables from 3001 upwards.
  static #keys = {
    0: 3001,
    1: 3002,
    2: 3003,
    3: 3004,
    4: 3005,
    5: 3006,
    6: 3007,
    7: 3008,
    8: 3009,
    9: 3010,
    e: 3015,
    n: 3024,
    s: 3029,
    w: 3033,
    ".": 3049,
  };

  static #CLR = 3054;
  static #FPLN = 3056;
  static #LSK1 = 3060;

  static #codesPayload = [];

  /*
    TheWay.lua uses "delay" as the time the key stays held and then moves to the
    next command without a gap. A command that sends the released state and asks
    for no depress is therefore a pure pause, which is what gives the CDNU time
    to accept each keystroke and to process an insertion.

    Button Delay from settings is applied later by GetModuleCommands.
  */
  static #press(code, holdMs, settleMs) {
    this.#codesPayload.push({
      device: this.#device,
      code,
      delay: holdMs,
      activate: 1,
      addDepress: "true",
    });
    this.#codesPayload.push({
      device: this.#device,
      code,
      delay: settleMs,
      activate: 0,
      addDepress: "false",
    });
  }

  static #type(text) {
    for (const character of text) {
      const code = this.#keys[character.toLowerCase()];
      if (code === undefined)
        throw new Error(`Unsupported F-14B(U) CDNU character: ${character}`);
      this.#press(code, 60, 60);
    }
  }

  static createButtonCommands(waypoints) {
    this.#codesPayload = [];

    /*
      Heatblur CDNU, "FPLN Page Insert a Waypoint": type a position into the
      scratchpad as Nddmm.mmmWdddmm.mmm, then press the LSK of the waypoint the
      new point should precede. LSK1 is the active waypoint row, so it inserts
      the point regardless of how long the flight plan is or where it happens to
      be scrolled, which keeps every waypoint identical to send.

      The CDNU hands out display IDs to crew-entered points from 51 upwards in
      creation order, so sending TheWay's list front to back gives 51 for the
      first waypoint, 52 for the second, and so on.

      One LSK press per point only. A second press is the airborne
      "CONFIRM FLT PLN CHG" prompt; on the ground it opens WP EDIT and the next
      coordinate would overwrite the point just entered.
    */
    for (const waypoint of waypoints) {
      this.#press(this.#FPLN, 120, 400);
      this.#press(this.#CLR, 120, 250);
      this.#type(
        waypoint.latHem + waypoint.lat + waypoint.longHem + waypoint.long,
      );
      this.#press(this.#LSK1, 150, 900);
    }

    return this.#codesPayload;
  }
}

export default f14bu;
