import ConvertModuleWaypoints from "./ConvertModuleWaypoints";

let dcsWaypoints;
beforeAll(() => {
  dcsWaypoints = [
    {
      id: 1,
      name: "W1",
      lat: 43.999756838301,
      long: 40.143417541493,
      elev: 735.44140625,
    },
    {
      id: 2,
      name: "W2",
      lat: 44.0000001,
      long: 40.0000001,
      elev: 735.44140625,
    },
    { id: 3, name: "W3", lat: -59.09332, long: 46.91491, elev: 735.44140625 },
    { id: 4, name: "W4", lat: 55.78044, long: 117.05243, elev: 735.44140625 },
  ];
});
describe("converting DMM coordinates", () => {
  test("00.00.000", function () {
    const converted = ConvertModuleWaypoints(dcsWaypoints, "F-16C_50");
    const expected = [
      {
        id: 1,
        name: "W1",
        lat: "43.59.985",
        latHem: "N",
        long: "040.08.605",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 2,
        name: "W2",
        lat: "44.00.000",
        latHem: "N",
        long: "040.00.000",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 3,
        name: "W3",
        lat: "59.05.599",
        latHem: "S",
        long: "046.54.895",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 4,
        name: "W4",
        lat: "55.46.826",
        latHem: "N",
        long: "117.03.146",
        longHem: "E",
        elev: "2412",
      },
    ];
    expect(converted).toEqual(expected);
  });
  test("ddmm.mmm for the F-14B(U) CDNU", function () {
    const converted = ConvertModuleWaypoints(dcsWaypoints, "F-14BU");
    const expected = [
      {
        id: 1,
        name: "W1",
        lat: "4359.985",
        latHem: "N",
        long: "04008.605",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 2,
        name: "W2",
        lat: "4400.000",
        latHem: "N",
        long: "04000.000",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 3,
        name: "W3",
        lat: "5905.599",
        latHem: "S",
        long: "04654.895",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 4,
        name: "W4",
        lat: "5546.826",
        latHem: "N",
        long: "11703.146",
        longHem: "E",
        elev: "2412",
      },
    ];
    expect(converted).toEqual(expected);
  });
  test("carries 60 minutes into a degree for the F-14B(U) CDNU", function () {
    const converted = ConvertModuleWaypoints(
      [{ id: 1, name: "W1", lat: 43.9999999, long: 39.9999999, elev: 0 }],
      "F-14BU",
    );
    expect(converted[0].lat).toBe("4400.000");
    expect(converted[0].long).toBe("04000.000");
  });
  test("00.00.00", function () {
    const converted = ConvertModuleWaypoints(dcsWaypoints, "AH-64D_BLK_II");
    const expected = [
      {
        id: 1,
        name: "W1",
        lat: "43.59.99",
        latHem: "N",
        long: "040.08.61",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 2,
        name: "W2",
        lat: "44.00.00",
        latHem: "N",
        long: "040.00.00",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 3,
        name: "W3",
        lat: "59.05.60",
        latHem: "S",
        long: "046.54.89",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 4,
        name: "W4",
        lat: "55.46.83",
        latHem: "N",
        long: "117.03.15",
        longHem: "E",
        elev: "2412",
      },
    ];
    expect(converted).toEqual(expected);
  });
  test("00.00.0", function () {
    const converted = ConvertModuleWaypoints(dcsWaypoints, "Ka-50");
    const expected = [
      {
        id: 1,
        name: "W1",
        lat: "44.00.0",
        latHem: "N",
        long: "040.08.6",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 2,
        name: "W2",
        lat: "44.00.0",
        latHem: "N",
        long: "040.00.0",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 3,
        name: "W3",
        lat: "59.05.6",
        latHem: "S",
        long: "046.54.9",
        longHem: "E",
        elev: "2412",
      },
      {
        id: 4,
        name: "W4",
        lat: "55.46.8",
        latHem: "N",
        long: "117.03.1",
        longHem: "E",
        elev: "2412",
      },
    ];
    expect(converted).toEqual(expected);
  });
});
