class c130j {
  static slotVariant = ""; // Holds the variant type
  static #device_id = 25; // Device ID, private
  static #device_id2 = 26; // Device ID, private
  static extraDelay = 0; // Extra delay constant
  static #delay_value = this.extraDelay; // Total delay value
  static #delay10 = 10 + this.extraDelay; // 10 ms delay + extra delay
  static #delay50 = 50 + this.extraDelay; // 50 ms delay + extra delay
  static #delay100 = this.extraDelay + 100; // 100 ms delay + extra delay
  static #kuKeycodes = {
    "0": 3030,
    "1": 3031,
    "2": 3032,
    "3": 3033,
    "4": 3034,
    "5": 3035,
    "6": 3036,
    "7": 3037,
    "8": 3038,
    "9": 3039,
    "a": 3042,
    "b": 3043,
    "c": 3044,
    "d": 3045,
    "e": 3046,
    "f": 3047,
    "g": 3048,
    "h": 3049,
    "i": 3050,
    "j": 3051,
    "k": 3052,
    "l": 3053,
    "m": 3054,
    "n": 3055,
    "o": 3056,
    "p": 3057,
    "q": 3058,
    "r": 3059,
    "s": 3060,
    "t": 3061,
    "u": 3062,
    "v": 3063,
    "w": 3064,
    "x": 3065,
    "y": 3066,
    "z": 3067,
    ".": 3040,
    "/": 3068,
    "CLR": 3029,
    "DEL":3028,
    "IDX": 3016,
    "DIR": 3018,
    "EXC":3025,
    "NXT":3026,
    "PRV":3027,
    "L1": 3001,
    "L2": 3002,
    "L3": 3003,
    "L4": 3004,
    "L5": 3005,
    "L6": 3006,
    "R1": 3007,
    "R2": 3008,
    "R3": 3009,
    "R4": 3010,
    "R5": 3011,
    "R6": 3012,
  };
  static #codesPayload = []; // Holds the generated codes

  // Method to add keyboard codes
  static #addKeyboardCode(character, device = this.#device_id) {
    const characterCode = this.#kuKeycodes[character.toLowerCase()];
    if (characterCode !== undefined) {
      this.#codesPayload.push({
        device: device,
        code: characterCode,
        delay: this.#delay_value,
        activate: 1,
        addDepress: "true",
      });
    }
  }

  // Main method to create button commands based on waypoints
  static createButtonCommands(waypoints) {
    this.#codesPayload = []; // Reset the payload

                                                                                     // Pilot Route 1
if (this.slotVariant === "c130Plt") {
      
      
// Delete existing Flight plans

// Press INDX key
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press L6 Zeroise
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["L6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press L1 for Routes
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["L1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press R6 for Verify
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["R6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

//Set up New FLPLN

// Press INDX key
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press R1 for route 1
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["R1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Clear scratchpad (long press CLR)
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["CLR"],
  delay: 2000,
  activate: 1,
  addDepress: "false",
});
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 0,
  addDepress: "false",
});
    for (let k = 0; k < 20; k++) {
      this.#codesPayload.push({
        device: this.#device_id,
        code: this.#kuKeycodes["CLR"],
        delay: this.#delay50,
        activate: 1,
        addDepress: "true",
      });
    }


// **** waypoint 1 entry *****
if (waypoints.length > 0) {
  const wp1 = waypoints[0];
  const rKey1 = this.#kuKeycodes["L1"]; // first waypoint goes on L1

 
  // Latitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id,
    code: this.#kuKeycodes[wp1.latHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Latitude digits
  for (let j = 0; j < wp1.lat.length; j++) {
    if (j !== 2) this.#addKeyboardCode(wp1.lat.charAt(j));
  }

  // Longitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id,
    code: this.#kuKeycodes[wp1.longHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Longitude digits
  for (let j = 0; j < wp1.long.length; j++) {
    if (j !== 3) this.#addKeyboardCode(wp1.long.charAt(j));
  }

  // Enter waypoint
  this.#codesPayload.push({
    device: this.#device_id,
    code: rKey1,
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });
}
// **** waypoint 1 entry end *****

// Press Next Page
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["NXT"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// ===== WAYPOINT ENTRY (PAGED) for remaining waypoints =====
for (let i = 1; i < waypoints.length; i++) { // start from 1
  const waypoint = waypoints[i];

  // Page forward every 4 waypoints (except first after wp1)
  if (i > 1 && (i-1) % 4 === 0) { 
    this.#codesPayload.push({
      device: this.#device_id,
      code: this.#kuKeycodes["NXT"],
      delay: this.#delay100,
      activate: 1,
      addDepress: "true",
    });
  }

  // First waypoint after wp1 goes to R1
  const rKey = (i === 1) ? this.#kuKeycodes["R1"] : this.#kuKeycodes[`R${((i-1) % 4) + 1}`];

  // Latitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id,
    code: this.#kuKeycodes[waypoint.latHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Latitude digits
  for (let j = 0; j < waypoint.lat.length; j++) {
    if (j !== 2) {
      this.#addKeyboardCode(waypoint.lat.charAt(j));
    }
  }

  // Longitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id,
    code: this.#kuKeycodes[waypoint.longHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Longitude digits
  for (let j = 0; j < waypoint.long.length; j++) {
    if (j !== 3) {
      this.#addKeyboardCode(waypoint.long.charAt(j));
    }
  }

  // Enter waypoint
  this.#codesPayload.push({
    device: this.#device_id,
    code: rKey,
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });
}

// Activate
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["R6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Execute
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["EXC"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// INDX
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// R1
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["R1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L1
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["L1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Direct
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["DIR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L6
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["L6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Del
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["DEL"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L2
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["L2"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Execute
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["EXC"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

//CLEAR CNI MESSAGES
// CLR
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});
this.#codesPayload.push({
  device: this.#device_id,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});
    
    

                                                                                  // Co Pilot

    } else if (this.slotVariant === "c130CoPlt") {

         
          // Delete existing Flight plans

// Press INDX key
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press L6 Zeroise
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["L6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press L1 for Routes
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["L1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press R6 for Verify
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["R6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

//Set up New FLPLN

// Press INDX key
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Press R1 for route 1
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["R1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Clear scratchpad (long press CLR)
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["CLR"],
  delay: 2000,
  activate: 1,
  addDepress: "false",
});
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 0,
  addDepress: "false",
});
    for (let k = 0; k < 20; k++) {
      this.#codesPayload.push({
        device: this.#device_id2,
        code: this.#kuKeycodes["CLR"],
        delay: this.#delay50,
        activate: 1,
        addDepress: "true",
      });
    }


// **** waypoint 1 entry *****
if (waypoints.length > 0) {
  const wp1 = waypoints[0];
  const rKey1 = this.#kuKeycodes["L1"]; // first waypoint goes on L1

 
  // Latitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id2,
    code: this.#kuKeycodes[wp1.latHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Latitude digits
for (let j = 0; j < wp1.lat.length; j++) {
  if (j !== 2) this.#addKeyboardCode(wp1.lat.charAt(j), this.#device_id2);
}

  // Longitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id2,
    code: this.#kuKeycodes[wp1.longHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Longitude digits
for (let j = 0; j < wp1.long.length; j++) {
  if (j !== 3) this.#addKeyboardCode(wp1.long.charAt(j), this.#device_id2);
}

  // Enter waypoint
  this.#codesPayload.push({
    device: this.#device_id2,
    code: rKey1,
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });
}
// **** waypoint 1 entry end *****

// Press Next Page
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["NXT"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// ===== WAYPOINT ENTRY (PAGED) for remaining waypoints =====
for (let i = 1; i < waypoints.length; i++) { // start from 1
  const waypoint = waypoints[i];

  // Page forward every 4 waypoints (except first after wp1)
  if (i > 1 && (i-1) % 4 === 0) { 
    this.#codesPayload.push({
      device: this.#device_id2,
      code: this.#kuKeycodes["NXT"],
      delay: this.#delay100,
      activate: 1,
      addDepress: "true",
    });
  }

  // First waypoint after wp1 goes to R1
  const rKey = (i === 1) ? this.#kuKeycodes["R1"] : this.#kuKeycodes[`R${((i-1) % 4) + 1}`];

  // Latitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id2,
    code: this.#kuKeycodes[waypoint.latHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  /// Latitude digits
for (let j = 0; j < waypoint.lat.length; j++) {
  if (j !== 2) {
    this.#addKeyboardCode(waypoint.lat.charAt(j), this.#device_id2);
  }
}

  // Longitude hemisphere
  this.#codesPayload.push({
    device: this.#device_id2,
    code: this.#kuKeycodes[waypoint.longHem.toLowerCase()],
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });

  // Longitude digits
for (let j = 0; j < waypoint.long.length; j++) {
  if (j !== 3) {
    this.#addKeyboardCode(waypoint.long.charAt(j), this.#device_id2);
  }
}

  // Enter waypoint
  this.#codesPayload.push({
    device: this.#device_id2,
    code: rKey,
    delay: this.#delay100,
    activate: 1,
    addDepress: "true",
  });
}

// Activate
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["R6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Execute
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["EXC"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// INDX
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["IDX"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// R1
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["R1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L1
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["L1"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Direct
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["DIR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L6
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["L6"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Del
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["DEL"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// L2
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["L2"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

// Execute
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["EXC"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});

//CLEAR CNI MESSAGES
// CLR
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});
this.#codesPayload.push({
  device: this.#device_id2,
  code: this.#kuKeycodes["CLR"],
  delay: this.#delay100,
  activate: 1,
  addDepress: "true",
});
    }

    return this.#codesPayload; // Return the generated payload
  }
}

export default c130j;
