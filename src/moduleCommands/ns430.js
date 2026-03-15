class ns430 {
  // ============================================================
  // Module metadata
  // ============================================================

  static slotVariant = "";
  static #device = 257;

  static extraDelay = 0;

  static #delay0 = 0 + this.extraDelay;
  static #delay50 = 50 + this.extraDelay;
  static #delay100 = 100 + this.extraDelay;
  static #delay200 = 200 + this.extraDelay;
  static #delay500 = 500 + this.extraDelay;

  // ============================================================
  // NS430 command codes
  // Based on DCS-BIOS NS430.lua
  // ============================================================

  static #codes = {
    CDI: 3014,
    OBS: 3015,
    MSG: 3016,
    FPL: 3017,
    PROC: 3018,

    DIRECT_TO: 3021,
    MENU: 3022,
    CLR: 3023,
    ENT: 3024,

    RIGHT_BIG: 3025,
    RIGHT_SMALL_PUSH: 3027,
    RIGHT_SMALL: 3028,
  };

  static #codesPayload = [];

  // ============================================================
  // Helpers
  // ============================================================

  static #tap(command, delayAfter = this.#delay100) {
    this.#codesPayload.push([this.#delay0, this.#device, command, 1]);
    this.#codesPayload.push([this.#delay50, this.#device, command, 0]);
    if (delayAfter > 0) {
      this.#codesPayload.push([delayAfter, 0, 0, 0]);
    }
  }

  static #turnBig(steps) {
    if (!steps) return;
    const dir = steps >= 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i++) {
      this.#codesPayload.push([this.#delay0, this.#device, this.#codes.RIGHT_BIG, dir]);
      this.#codesPayload.push([this.#delay50, this.#device, this.#codes.RIGHT_BIG, 0]);
    }
  }

  static #turnSmall(steps) {
    if (!steps) return;
    const dir = steps >= 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i++) {
      this.#codesPayload.push([this.#delay0, this.#device, this.#codes.RIGHT_SMALL, dir]);
      this.#codesPayload.push([this.#delay50, this.#device, this.#codes.RIGHT_SMALL, 0]);
    }
  }

  static #pushSmall(delayAfter = this.#delay100) {
    this.#tap(this.#codes.RIGHT_SMALL_PUSH, delayAfter);
  }

  static #ent(delayAfter = this.#delay200) {
    this.#tap(this.#codes.ENT, delayAfter);
  }

  static #clr(delayAfter = this.#delay200) {
    this.#tap(this.#codes.CLR, delayAfter);
  }

  static #menu(delayAfter = this.#delay200) {
    this.#tap(this.#codes.MENU, delayAfter);
  }

  static #directTo(delayAfter = this.#delay200) {
    this.#tap(this.#codes.DIRECT_TO, delayAfter);
  }

  static #fpl(delayAfter = this.#delay200) {
    this.#tap(this.#codes.FPL, delayAfter);
  }

  static #proc(delayAfter = this.#delay200) {
    this.#tap(this.#codes.PROC, delayAfter);
  }

  static resetPayload() {
    this.#codesPayload = [];
  }

  static getPayload() {
    return this.#codesPayload;
  }

  // ============================================================
  // Basic navigation helpers
  // ============================================================

  static openDirectTo() {
    this.resetPayload();
    this.#directTo();
    return this.getPayload();
  }

  static pressEnt() {
    this.resetPayload();
    this.#ent();
    return this.getPayload();
  }

  static pressClr() {
    this.resetPayload();
    this.#clr();
    return this.getPayload();
  }

  static rotateRightBig(steps) {
    this.resetPayload();
    this.#turnBig(steps);
    return this.getPayload();
  }

  static rotateRightSmall(steps) {
    this.resetPayload();
    this.#turnSmall(steps);
    return this.getPayload();
  }

  static pushRightSmall() {
    this.resetPayload();
    this.#pushSmall();
    return this.getPayload();
  }

  // ============================================================
  // Placeholder for future waypoint flow
  // ============================================================

  static createUserWaypointSkeleton() {
    this.resetPayload();

    // Placeholder only.
    // We still need to confirm exact page sequence for:
    // WPT -> USER -> NEW -> blank name entry -> ENT
    // then capture aircraft position timing.

    this.#menu();
    this.#turnBig(1);
    this.#turnSmall(1);
    this.#ent();

    return this.getPayload();
  }
}

module.exports = ns430;