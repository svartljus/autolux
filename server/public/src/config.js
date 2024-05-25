export const LEVEL = {
  length: 1000,

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
      x: 500,
      y: 100,
    },
    {
      index: 4,
      x: 650,
      y: 300,
    },
    {
      index: 5,
      x: 500,
      y: 450,
    },
    {
      index: 6,
      x: 300,
      y: 200,
    },
    {
      index: 7,
      x: 250,
      y: 350,
    },
  ],

  segments: [
    { from: 0, to: 1, length: 15 },
    { from: 1, to: 2, length: 25 },
    { from: 2, to: 3, length: 15 },
    { from: 3, to: 4, length: 25 },
    { from: 4, to: 5, length: 20 },
    { from: 5, to: 6, length: 30 },
    { from: 6, to: 7, length: 15 },
  ],

  trafficlights: {
    start: 10,
    end: 900,
    every: 16,
    brightness: 50,
  },

  speakers: [
    {
      start: 0,
      end: 20,
      feather: 100,
      output: 0,
    },
    {
      start: 90,
      end: 100,
      feather: 100,
      output: 0,
    },
    {
      start: 20,
      end: 50,
      feather: 100,
      output: 1,
    },
    {
      start: 60,
      end: 70,
      feather: 100,
      output: 2,
    },
    {
      start: 80,
      end: 90,
      feather: 100,
      output: 3,
    },
  ],

  zones: [
    {
      type: "curve",
      startPercent: 9.0,
      lengthPercent: 3.0,
      featherPercent: 2.0,
    },
    {
      type: "curve",
      startPercent: 26.0,
      lengthPercent: 3.0,
      featherPercent: 3.0,
    },
    {
      type: "curve",
      startPercent: 37.0,
      lengthPercent: 3.0,
      featherPercent: 4.0,
    },
    {
      type: "curve",
      startPercent: 54.0,
      lengthPercent: 3.0,
      featherPercent: 4.0,
    },
    {
      type: "curve",
      startPercent: 68.0,
      lengthPercent: 3.0,
      featherPercent: 2.0,
    },
    {
      type: "curve",
      startPercent: 88.0,
      lengthPercent: 3.0,
      featherPercent: 2.0,
    },
    {
      type: "speedup",
      startPercent: 60.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
    },
    {
      type: "slowdown",
      startPercent: 30.0,
      lengthPercent: 5.0,
      featherPercent: 4.0,
    },
    {
      type: "goal",
      startPercent: 95.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
    },
    {
      type: "start",
      startPercent: 0.0,
      lengthPercent: 5.0,
      featherPercent: 3.0,
    },
    {
      type: "tunnel",
      startPercent: 14.0,
      lengthPercent: 10.0,
      featherPercent: 4.0,
    },
  ],
};
