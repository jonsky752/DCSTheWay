import f14bu from "./f14bu";

const FPLN = 3056;
const CLR = 3054;
const LSK1 = 3060;
const ARROW_UP = 3045;
const ARROW_DOWN = 3046;

const characters = {
  3001: "0",
  3002: "1",
  3003: "2",
  3004: "3",
  3005: "4",
  3006: "5",
  3007: "6",
  3008: "7",
  3009: "8",
  3010: "9",
  3015: "E",
  3024: "N",
  3029: "S",
  3033: "W",
  3049: ".",
};

const waypoint = (latHem, lat, longHem, long) => ({
  latHem,
  lat,
  longHem,
  long,
});

const fourWaypoints = [
  waypoint("N", "4359.985", "E", "04008.605"),
  waypoint("N", "4400.000", "E", "04000.000"),
  waypoint("S", "5905.599", "E", "04654.895"),
  waypoint("N", "5546.826", "W", "11703.146"),
];

const keyPresses = (commands) =>
  commands.filter(({ activate }) => activate === 1);

const scratchpadsAtInsert = (commands) => {
  const entries = [];
  let scratchpad = "";
  for (const command of keyPresses(commands)) {
    if (characters[command.code]) scratchpad += characters[command.code];
    if (command.code === CLR) scratchpad = "";
    if (command.code === LSK1) {
      entries.push(scratchpad);
      scratchpad = "";
    }
  }
  return entries;
};

describe("F-14B(U) CDNU flight plan insertion", () => {
  beforeEach(() => {
    f14bu.extraDelay = 0;
  });

  test("sends no commands when there are no waypoints", () => {
    expect(f14bu.createButtonCommands([])).toEqual([]);
  });

  test("uses the same three keys once per waypoint", () => {
    const codes = keyPresses(f14bu.createButtonCommands(fourWaypoints)).map(
      ({ code }) => code,
    );

    expect(codes.filter((code) => code === FPLN)).toHaveLength(4);
    expect(codes.filter((code) => code === CLR)).toHaveLength(4);
    expect(codes.filter((code) => code === LSK1)).toHaveLength(4);
  });

  test("never scrolls the flight plan or presses another line select key", () => {
    const codes = keyPresses(f14bu.createButtonCommands(fourWaypoints)).map(
      ({ code }) => code,
    );

    expect(codes).not.toContain(ARROW_UP);
    expect(codes).not.toContain(ARROW_DOWN);
    for (const otherLsk of [3061, 3062, 3063]) {
      expect(codes).not.toContain(otherLsk);
    }
  });

  test("types each position as delimiter free DMM in TheWay's order", () => {
    const commands = f14bu.createButtonCommands(fourWaypoints);

    expect(scratchpadsAtInsert(commands)).toEqual([
      "N4359.985E04008.605",
      "N4400.000E04000.000",
      "S5905.599E04654.895",
      "N5546.826W11703.146",
    ]);
  });

  test("follows every key press with a settle pause", () => {
    const commands = f14bu.createButtonCommands([fourWaypoints[0]]);

    for (let i = 0; i < commands.length; i += 2) {
      expect(commands[i]).toMatchObject({ activate: 1, addDepress: "true" });
      expect(commands[i + 1]).toMatchObject({
        code: commands[i].code,
        activate: 0,
        addDepress: "false",
      });
    }
  });

  test("rejects characters the CDNU keyboard cannot produce", () => {
    expect(() =>
      f14bu.createButtonCommands([
        waypoint("N", "43-59.985", "E", "04008.605"),
      ]),
    ).toThrow(/CDNU character/);
  });
});
