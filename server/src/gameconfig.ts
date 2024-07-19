export const LEVEL = {
  length: 100,

  vertices: [
    {
      index: 0,
      x: 250,
      y: 400,
    },
    {
      index: 1,
      x: 100,
      y: 450,
    },
    {
      index: 2,
      x: 50,
      y: 140,
    },
    {
      index: 3,
      x: 150,
      y: 180,
    },
    {
      index: 4,
      x: 600,
      y: 50,
    },
    {
      index: 5,
      x: 450,
      y: 250,
    },
    {
      index: 6,
      x: 400,
      y: 150,
    },
    {
      index: 7,
      x: 650,
      y: 200,
    },
    {
      index: 8,
      x: 350,
      y: 400,
    },
  ],

  segments: [
    { from: 0, to: 1, length: 20 },
    { from: 1, to: 2, length: 80 },
    { from: 2, to: 3, length: 48 },
    { from: 3, to: 4, length: 175 },
    { from: 4, to: 5, length: 80 },
    { from: 5, to: 6, length: 64 },
    { from: 6, to: 7, length: 80 },
    { from: 7, to: 8, length: 80 },
  ],

  trafficlights: {
    start: 10,
    end: 800,
    every: 16,
    brightness: 20,
  },

  zones: [
    {
      id: "goal",
      type: "goal",
      startPercent: 95.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
      color: [30, 30, 30],
    },
    {
      id: "start",
      type: "start",
      startPercent: 1.0,
      lengthPercent: 3.0,
      featherPercent: 3.0,
    },


    // {
    //   id: "fastzone",
    //   type: "speed",
    //   startPercent: 10.0,
    //   lengthPercent: 10.0,
    //   featherPercent: 3.0,
    //   speedMultiplier: 2.0
    // },

    {
      id: "slow1",
      type: "speed",
      startPercent: 3.0,
      lengthPercent: 15.0,
      featherPercent: 3.0,
      speedMultiplier: 0.4
    },

    {
      id: "slow2",
      type: "speed",
      startPercent: 23.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
      speedMultiplier: 0.8
    },

    // {
    //   id: "fastzone",
    //   type: "speed",
    //   startPercent: 4.0,
    //   lengthPercent: 20.0,
    //   featherPercent: 3.0,
    //   speedMultiplier: 2.0
    // },

    {
      id: "slow2",
      type: "speed",
      startPercent: 35.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
      speedMultiplier: 0.66
    },

    {
      id: "fastzone",
      type: "speed",
      startPercent: 50.0,
      lengthPercent: 10.0,
      featherPercent: 3.0,
      speedMultiplier: 1.66
    },

    // {
    //   id: "fastzone",
    //   type: "speed",
    //   startPercent: 70.0,
    //   lengthPercent: 15.0,
    //   featherPercent: 3.0,
    //   speedMultiplier: 2.0
    // },


    // {
    //   id: "slowzone",
    //   type: "speed",
    //   startPercent: 65.0,
    //   lengthPercent: 10.0,
    //   featherPercent: 3.0,
    //   speedMultiplier: 0.33
    // },
    // {
    //   id: "slowzone",
    //   type: "speed",
    //   startPercent: 75.0,
    //   lengthPercent: 5.0,
    //   featherPercent: 3.0,
    //   speedMultiplier: 0.66
    // },


    // {
    //   type: "checkpoint",
    //   startPercent: 30.0,
    //   lengthPercent: 1.0,
    //   featherPercent: 0.0,
    //   note: 'C4',
    //   color: [100,150,200],
    // },
    // {
    //   type: "checkpoint",
    //   startPercent: 35.0,
    //   lengthPercent: 1.0,
    //   featherPercent: 0.0,
    //   note: 'E4',
    //   color: [100,150,200],
    // },
    // {
    //   type: "checkpoint",
    //   startPercent: 40.0,
    //   lengthPercent: 1.0,
    //   featherPercent: 0.0,
    //   note: 'G4',
    //   color: [100,150,200],
    // },
    // {
    //   type: "checkpoint",
    //   startPercent: 45.0,
    //   lengthPercent: 1.0,
    //   featherPercent: 0.0,
    //   note: 'B4',
    //   color: [100,150,200],
    // },
    // {
    //   type: "checkpoint",
    //   startPercent: 80.0,
    //   lengthPercent: 1.0,
    //   featherPercent: 0.0,
    //   note: 'C5',
    //   color: [100,150,200],
    // },
    // {
    //   type: "checkpoint",
    //   startPercent: 80.0,
    //   lengthPercent: 2.0,
    //   featherPercent: 0.0,
    // },
  ],
};
