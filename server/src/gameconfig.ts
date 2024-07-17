export const LEVEL = {
  length: 100,

  vertices: [
    {
      index: 0,
      x: 100,
      y: 300,
    },
    {
      index: 1,
      x: 140,
      y: 100,
    },
    {
      index: 2,
      x: 400,
      y: 150,
    },
    {
      index: 3,
      x: 600,
      y: 300,
    },
    // {
    //   index: 4,
    //   x: 600,
    //   y: 450,
    // },
  ],

  segments: [
    { from: 0, to: 1, length: 150 },
    { from: 1, to: 2, length: 150 },
    { from: 2, to: 3, length: 150 },
    { from: 3, to: 0, length: 150 },
    // { from: 4, to: 0, length: 160 },
  ],

  trafficlights: {
    start: 10,
    end: 800,
    every: 16,
    brightness: 30,
  },

  zones: [
    {
      id: "goal",
      type: "goal",
      startPercent: 95.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
    },
    {
      id: "start",
      type: "start",
      startPercent: 0.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
    },


    {
      id: "fastzone",
      type: "speed",
      startPercent: 10.0,
      lengthPercent: 10.0,
      featherPercent: 3.0,
      speedMultiplier: 2.0
    },

    {
      id: "slowzone",
      type: "speed",
      startPercent: 60.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
      speedMultiplier: 0.66
    },
    {
      id: "slowzone",
      type: "speed",
      startPercent: 65.0,
      lengthPercent: 10.0,
      featherPercent: 3.0,
      speedMultiplier: 0.33
    },
    {
      id: "slowzone",
      type: "speed",
      startPercent: 75.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
      speedMultiplier: 0.66
    },


    {
      type: "checkpoint",
      startPercent: 30.0,
      lengthPercent: 1.0,
      featherPercent: 0.0,
      note: 'C4',
      color: [100,150,200],
    },
    {
      type: "checkpoint",
      startPercent: 35.0,
      lengthPercent: 1.0,
      featherPercent: 0.0,
      note: 'E4',
      color: [100,150,200],
    },
    {
      type: "checkpoint",
      startPercent: 40.0,
      lengthPercent: 1.0,
      featherPercent: 0.0,
      note: 'G4',
      color: [100,150,200],
    },
    {
      type: "checkpoint",
      startPercent: 45.0,
      lengthPercent: 1.0,
      featherPercent: 0.0,
      note: 'B4',
      color: [100,150,200],
    },
    {
      type: "checkpoint",
      startPercent: 80.0,
      lengthPercent: 1.0,
      featherPercent: 0.0,
      note: 'C5',
      color: [100,150,200],
    },
    // {
    //   type: "checkpoint",
    //   startPercent: 80.0,
    //   lengthPercent: 2.0,
    //   featherPercent: 0.0,
    // },
  ],
};
