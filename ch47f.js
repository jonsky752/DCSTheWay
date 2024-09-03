class ch47f {
  static slotVariant = ""; // Holds the variant type
  static #device_id = 3; // Device ID, private
  static extraDelay = 200; // Extra delay constant
  static #delay_value = 10 + this.extraDelay; // Total delay value
  static #delay10 = 10 + this.extraDelay; // 10 ms delay + extra delay
  static #delay50 = 50 + this.extraDelay; // 50 ms delay + extra delay
  static #delay100 = this.extraDelay + 100; // 100 ms delay + extra delay
  static #kuKeycodes = {
    "1": 3030,
    "2": 3031,
    "3": 3032,
    "4": 3033,
    "5": 3034,
    "6": 3035,
    "7": 3036,
    "8": 3037,
    "9": 3038,
    "0": 3039,
    "a": 3043,
    "b": 3044,
    "c": 3045,
    "d": 3046,
    "e": 3047,
    "f": 3048,
    "g": 3049,
    "h": 3050,
    "i": 3051,
    "j": 3052,
    "k": 3053,
    "l": 3054,
    "m": 3055,
    "n": 3056,
    "o": 3057,
    "p": 3058,
    "q": 3059,
    "r": 3060,
    "s": 3061,
    "t": 3062,
    "u": 3063,
    "v": 3064,
    "w": 3065,
    "x": 3066,
    "y": 3067,
    "z": 3068,
    ".": 3040,
    "/": 3042,
    "UP": 3026,
    "DOWN": 3027,
    "CLR": 3028,
    "FPLN": 3002,
    "IDX": 3004,
    "DIR": 3005,
    "L1": 3008,
    "L2": 3009,
    "L3": 3010,
    "L4": 3011,
    "L5": 3012,
    "L6": 3013,
    "R1": 3014,
    "R2": 3015,
    "R3": 3016,
    "R4": 3017,
    "R5": 3018,
    "R6": 3019,
  };
  static #codesPayload = []; // Holds the generated codes

  // Method to add keyboard codes
  static #addKeyboardCode(character) {
    const characterCode = this.#kuKeycodes[character.toLowerCase()];
    if (characterCode !== undefined) {
      this.#codesPayload.push({
        device: this.#device_id,
        code: characterCode,
        delay: this.#delay10,
        activate: 1,
        addDepress: "true",
      });
    }
  }

  // Main method to create button commands based on waypoints
  static createButtonCommands(waypoints) {
    this.#codesPayload = []; // Reset the payload

    // Initial button commands
    this.#codesPayload.push({
      device: this.#device_id,
      code: this.#kuKeycodes["IDX"],
      delay: this.#delay_value,
      activate: 1,
      addDepress: "true",
    });

    // Select Procedures/PATT List
    this.#codesPayload.push({
      device: this.#device_id,
      code: this.#kuKeycodes["L6"],
      delay: this.#delay_value,
      activate: 1,
      addDepress: "true",
    });

    // Select ACP
    this.#codesPayload.push({
      device: this.#device_id,
      code: this.#kuKeycodes["L6"],
      delay: this.#delay_value,
      activate: 1,
      addDepress: "true",
    });

    // Loop through waypoints
    for (const waypoint of waypoints) {
      // Clear the Scratchpad
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["CLR"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Increment ACP - UP ARROW
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["UP"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Type hem for latitude
      if (waypoint.latHem === "N") {
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["n"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
      } else {
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["s"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
      }

      // Type latitude
      for (let i = 0; i < waypoint.lat.length; i++) {
        if (i !== 2) {
          this.#addKeyboardCode(waypoint.lat.charAt(i));
        }
      }

      // Type hem for longitude
      if (waypoint.longHem === "E") {
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["e"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
      } else {
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["w"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
      }

      // Type longitude
      for (let i = 0; i < waypoint.long.length; i++) {
        if (i !== 3) {
          this.#addKeyboardCode(waypoint.long.charAt(i));
        }
      }

      // Press LSK L1 to enter coordinates
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["L1"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Type elevation
      for (let i = 0; i < waypoint.elev.length; i++) {
        this.#addKeyboardCode(waypoint.elev.charAt(i));
      }

      // Press LSK L3 to enter elevation
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["L3"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Press /
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["/"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Type name
      const match = waypoint.name.match(/^Waypoint (\d+)$/);
      if (match) {
        waypoint.name = match[1];
      }
      for (let i = 0; i < Math.min(waypoint.name.length, 9); i++) {
        this.#addKeyboardCode(waypoint.name.charAt(i));
      }

      // Press LSK L2 to enter waypoint ident
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["L2"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });
    }

    // Handle different slotVariants after processing waypoints
    if (this.slotVariant === "ch47NEW") {
      // New flight plan actions
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["DIR"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["L6"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["R1"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["DIR"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Iterate over waypoints for the second loop
      for (let i = 0; i < waypoints.length; i++) {
        const waypoint = waypoints[i];

        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["CLR"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });

        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["/"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });

        // Enter waypoint name
        const match = waypoint.name.match(/^Waypoint (\d+)$/);
        if (match) {
          waypoint.name = match[1];
        }
        for (let i = 0; i < Math.min(waypoint.name.length, 9); i++) {
          this.#addKeyboardCode(waypoint.name.charAt(i));
        }

        // Press L1 for the first cycle, then L5 for all other cycles
        if (i === 0) {
          // First cycle
          this.#codesPayload.push({
            device: this.#device_id,
            code: this.#kuKeycodes["L1"], // Press L1 on the first cycle
            delay: this.#delay_value,
            activate: 1,
            addDepress: "true",
            });
          } else {
          // Subsequent cycles
          this.#codesPayload.push({
            device: this.#device_id,
            code: this.#kuKeycodes["DOWN"],
            delay: this.#delay100,
            activate: 1,
            addDepress: "true",
            });
          this.#codesPayload.push({
            device: this.#device_id,
            code: this.#kuKeycodes["L5"], // Press L5 on subsequent cycles
            delay: this.#delay_value,
            activate: 1,
            addDepress: "true",
            });
          }
      }
    
    
    } else if (this.slotVariant === "ch47ADD") {
      // Additional actions for ch47ADD
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["FPLN"],
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });

      // Press Down arrow a lot to get to end of any length flight plan
      for (let k = 0; k < 30; k++) {
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["DOWN"],
          delay: this.#delay100,
          activate: 1,
          addDepress: "true",
          });
        }

        for (let i = 0; i < waypoints.length; i++) {
        const waypoint = waypoints[i];

        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["CLR"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });

        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["/"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });

        // Handle the waypoint name and entry logic
        const match = waypoint.name.match(/^Waypoint (\d+)$/);
        if (match) {
          waypoint.name = match[1];
        }
        for (let i = 0; i < Math.min(waypoint.name.length, 9); i++) {
          this.#addKeyboardCode(waypoint.name.charAt(i));
        }

        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["DOWN"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
        
        // Press LSK L5 to enter
        this.#codesPayload.push({
          device: this.#device_id,
          code: this.#kuKeycodes["L5"],
          delay: this.#delay_value,
          activate: 1,
          addDepress: "true",
        });
      }
    }

    return this.#codesPayload; // Return the generated payload
  }
}

export default ch47f;
