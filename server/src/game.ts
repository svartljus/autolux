import { artnetbuffers, blitArtNet, ledbuffer } from "./artnet";
import { LEVEL } from "./gameconfig";
import { broadcast } from "./web";
import { v4 } from "uuid";

const SHOWMODE_OUTPUT = 0
const SHOWMODE_DMXMAPPING = 1
const SHOWMODE_ZONES = 2
const SHOWMODE_PIXELCOUNT = 3

let ledpositions = [];
let ledcount = 0;
let ledBackgroundBufferDefault;
let ledBackgroundBufferZones;
let ledBackgroundBufferPixelCount;
let MAX_SPEED_METERS_PER_SECOND = 0.66;
let LED_PIXELS_PER_METER = 60.0;
let OVERDRIVE_METERS_PER_SECOND = 0.66;

let LEDS_PER_SECOND_MAXSPEED =
  MAX_SPEED_METERS_PER_SECOND * LED_PIXELS_PER_METER;
let LEDS_PER_SECOND_OVERDRIVE =
  OVERDRIVE_METERS_PER_SECOND * LED_PIXELS_PER_METER;
let segmentlengthledmultiplier = 1.0;
let showMode = 0;
let updateSpeed = 0;

export let PLAYER_LED_COLORS = [
  [255, 30, 10],
  [10, 255, 30],
  [50, 10, 255],
  [255, 10, 255],
  [230, 230, 10],
  [10, 220, 240],
];

export let PLAYER_DISPLAY_COLORS = [
  [250, 30, 10],
  [10, 230, 30],
  [90, 10, 230],
  [230, 10, 230],
  [250, 250, 10],
  [10, 210, 220],
];

interface PlayerState {
  index: number;
  id: string;
  age: number;
  throttle: number;
  position: number;
  velocity: number;
  overdrive: number;
  overheating: boolean;
  heat: number;
  lastposition: number;
  color: number[];
  ledcolor: number[];
  displaycolor: number[];
  lastseen: number;
  zones: string[];
}

interface GameState {
  players: PlayerState[];
  demoloop: boolean;
  demotimer: number;
  gamestate: string;
  gametimer: number;
  tracklength: number;
  blinkphase: number;
  overheatblink1: boolean;
  overheatblink2: boolean;
  overheatblink3: boolean;
}

let level;

let gamestate: GameState = {
  players: [],
  demoloop: true,
  demotimer: 0,
  gamestate: "waiting",
  gametimer: 0,
  tracklength: 42,
  blinkphase: 0,
  overheatblink1: false,
  overheatblink2: false,
  overheatblink3: false,
};

function addColors(rgb1, rgb2) {
  return [
    Math.round(Math.max(0, Math.min(255, rgb1[0] + rgb2[0]))),
    Math.round(Math.max(0, Math.min(255, rgb1[1] + rgb2[1]))),
    Math.round(Math.max(0, Math.min(255, rgb1[2] + rgb2[2]))),
  ];
}

function addMulColors(rgb1, rgb2, mul) {
  return [
    Math.round(Math.max(0, Math.min(255, rgb1[0] + mul * rgb2[0]))),
    Math.round(Math.max(0, Math.min(255, rgb1[1] + mul * rgb2[1]))),
    Math.round(Math.max(0, Math.min(255, rgb1[2] + mul * rgb2[2]))),
  ];
}

function stepGame(deltaTime) {
  const ovrspeed = 0.1 * deltaTime;
  const heatfadeadd = 0.1 * deltaTime;
  const heatfadesub = 0.2 * deltaTime;

  gamestate.blinkphase += deltaTime;
  while (gamestate.blinkphase > 1.0) {
    gamestate.blinkphase -= 1.0;
  }

  gamestate.overheatblink1 = (gamestate.blinkphase * 2.0) % 1.0 > 0.5;
  gamestate.overheatblink2 = (gamestate.blinkphase * 3.0) % 1.0 > 0.5;
  gamestate.overheatblink3 = (gamestate.blinkphase * 4.0) % 1.0 > 0.5;

  const maxvel = LEDS_PER_SECOND_MAXSPEED * deltaTime;
  const maxovr = LEDS_PER_SECOND_OVERDRIVE * deltaTime;
  for (let p = 0; p < gamestate.players.length; p++) {
    const pl: PlayerState = gamestate.players[p];
    const overheatmul = pl.overheating ? 0.25 : 1.0;
    let zonemul = 1.0;

    pl.index = p;

    pl.zones = [];
    for (const z of level.zones) {
      if (pl.position >= z.startPixel && pl.position < z.endPixel) {
        pl.zones.push(z.id);
        if (z.type === "speed") {
          zonemul = z.speedMultiplier;
        }
      }
    }

    pl.position += pl.velocity * maxvel * overheatmul * zonemul;
    pl.position += pl.overdrive * maxovr * overheatmul * zonemul;
    while (pl.position > ledcount) {
      pl.position -= ledcount;
    }
    while (pl.position < 0) {
      pl.position += ledcount;
    }

    if (pl.throttle > 66) {
      pl.heat += (heatfadeadd * (pl.throttle - 66)) / 100;
      if (pl.heat > 1.0) {
        pl.heat = 1.0;
      }
    } else {
      pl.heat -= heatfadesub;
      if (pl.heat < 0.0) {
        pl.heat = 0.0;
      }
    }

    pl.velocity += (pl.throttle / 100.0 - pl.velocity) * 0.33;
    if (pl.velocity < 0.0) {
      pl.velocity = 0.0;
    }
    if (pl.velocity > 1.0) {
      pl.velocity = 1.0;
    }

    pl.overdrive += ovrspeed * (pl.velocity - 0.75);

    // pl.heat = Math.min(1.0, Math.max(0, (pl.overdrive - 0.01) * 4.0));

    // pl.overdrive += (ovrfadeadd * pl.throttle) / 100;
    // if (pl.throttle < 10) {
    //   pl.overdrive -= ovrfadesub;
    // }
    if (pl.overdrive < 0.0) {
      pl.overdrive = 0.0;
    }
    if (pl.overdrive > 1.0) {
      pl.overdrive = 1.0;
    }

    pl.overheating = pl.heat > 0.75;

    pl.zones = [];
    for (const z of level.zones) {
      if (pl.position >= z.startPixel && pl.position < z.endPixel) {
        pl.zones.push(pl.id);
      }

      if (pl.position >= z.startPixel && pl.lastposition < z.startPixel) {
        // console.log("player entepplad zone", z);
        const update = {
          type: "enter-zone",
          player: p,
          playerid: pl.id,
          zone: z.type,
          zonedata: z,
        };
        broadcast(update);
      }

      if (pl.position >= z.endPixel && pl.lastposition < z.endPixel) {
        // console.log("player left zone", z);
        const update = {
          type: "leave-zone",
          player: p,
          playerid: pl.id,
          zone: z.type,
          zonedata: z,
        };
        broadcast(update);
      }
    }

    pl.lastposition = pl.position;
  }
}

function renderBuffer(mode: number = 0) {
  const output = [];

  for (let l = 0; l < ledcount; l++) {
    output[l] = [0, 0, 0];

    if (mode === SHOWMODE_PIXELCOUNT) {
      const ci = Math.floor(l / 20);
      // pixel counting mode, RRRRR GGGGG BBBBB etc ....
      let countcolor = [0, 0, 0];
      switch (ci % 3) {
        case 0:
          countcolor = [64, 0, 0];
          break;
        case 1:
          countcolor = [0, 64, 0];
          break;
        case 2:
          countcolor = [0, 0, 64];
          break;
      }

      output[l] = addColors(output[l], countcolor);
      if (l % 20 === 0) {
        output[l] = addColors(output[l], [255, 255, 255]);
      }
    }

    if (mode === SHOWMODE_OUTPUT || mode === SHOWMODE_ZONES) {
      if (level.trafficlights) {
        if (l >= level.trafficlights.start && l < level.trafficlights.end) {
          var o = (l - level.trafficlights.start) % level.trafficlights.every;
          if (o === 0) {
            output[l] = [
              level.trafficlights.brightness,
              level.trafficlights.brightness,
              level.trafficlights.brightness,
            ];
          }
        }
      }
    }
  }

  for (let zi = 0; zi < level.zones.length; zi++) {
    const z = level.zones[zi];

    for (let l = z.startPixel; l < z.endPixel; l++) {
      if (mode === SHOWMODE_DMXMAPPING || mode === SHOWMODE_ZONES) {
        let zonecolor = [0, 0, 0];
        switch (zi % 3) {
          case 0:
            zonecolor = [30, 10, 10];
            break;
          case 1:
            zonecolor = [10, 30, 10];
            break;
          case 2:
            zonecolor = [10, 10, 30];
            break;
        }

        output[l] = addColors(output[l], zonecolor);

        // if (l % 10 === 0) {
        //   output[l] = addColors(output[l], [15, 15, 15]);
        // }
        // if (l % 100 === 0) {
        //   output[l] = addColors(output[l], [25, 25, 25]);
        // }

        if (l === z.startPixel || l === z.endPixel - 1) {
          output[l] = addColors(output[l], [
            zonecolor[0] * 3,
            zonecolor[1] * 3,
            zonecolor[2] * 3,
          ]);
        }
      }

      if (mode === SHOWMODE_OUTPUT) {
        if (z.type === "checkpoint") {
          if (l === z.startPixel) {
            output[l] = addColors(output[l], z.color || [50, 50, 50]);
          }
          // if (l === z.endPixel-1) {
          //   output[l] = addColors(output[l], z.color || [50, 50, 50]);
          // }
        }
        //  else if (z.type === "speedup") {
        //   output[l] = addColors(output[l], [0, 10, 0]);
        // } else if (z.type === "slowdown") {
        //   output[l] = addColors(output[l], [10, 0, 0]);
        // } else if (z.type === "tunnel") {
        //   output[l] = addColors(output[l], [10, 10, 10]);
        // } else {
        //   output[l] = addColors(output[l], [20, 10, 20]);
        // }
      }

      if (z.type === "goal") {
        output[l] = addColors(output[l], z.color || [10, 10, 10]);
        // } else if (z.type === "start") {
        // output[l] = addColors(output[l], [10, 20, 10]);
      }
    }
  }

  return output;
}

function renderPlayerBuffer() {
  const output = [];

  for (let l = 0; l < ledcount; l++) {
    output[l] = [0, 0, 0];
  }

  for (let p = 0; p < gamestate.players.length; p++) {
    const pl: PlayerState = gamestate.players[p];
    let l = Math.round(pl.position);
    let fadeleds =
      3 + Math.max(0, Math.round(pl.velocity * 15 + pl.overdrive * 30));
    let l2 = Math.round(pl.position - fadeleds);
    let playermul = 0.8 + 0.8 * pl.overdrive;

    if (pl.overheating && gamestate.overheatblink1) {
      playermul *= 0.2;
    }
    if (l >= 0 && l < ledcount) {
      output[l] = addMulColors(output[l], pl.ledcolor, playermul);
    }
    for (var f = 1; f < fadeleds; f++) {
      let mul = 1.0 - f / fadeleds;
      l2 = l - f;
      if (l2 < 0) {
        l2 += ledcount;
      }
      if (l2 > ledcount) {
        l2 -= ledcount;
      }
      if (l2 >= 0 && l2 < ledcount) {
        output[l2] = addMulColors(output[l2], pl.ledcolor, playermul * mul);
      }
    }
  }

  return output;
}

function addBuffers(buf1, buf2) {
  const output = [];
  for (let l = 0; l < ledcount; l++) {
    output[l] = addColors(buf1[l], buf2[l]);
  }

  return output;
}

function renderFrame() {
  const tmp3 = renderPlayerBuffer();
  const bgbuf =
    showMode === SHOWMODE_PIXELCOUNT
      ? ledBackgroundBufferPixelCount
      : showMode === SHOWMODE_ZONES
      ? ledBackgroundBufferZones
      : ledBackgroundBufferDefault;
  const combined = addBuffers(bgbuf, tmp3);
  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = combined[l];
  }
}

function resetPlayer(idx) {
  if (gamestate.players[idx]) {
    gamestate.players[idx].position = 20 + 30 * idx;
    gamestate.players[idx].velocity = 10 + 300 * Math.random();
  }
}

function restartGame() {
  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);
}

function startDemo() {
  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);
}

export function setPlayerInput(index, throttle, brake) {
  if (gamestate.players[index]) {
    gamestate.players[index].throttle = throttle;
  }
}

export function setPlayerThrottle(id: string, throttle: number) {
  // gamestate.players[index].throttle = throttle;
  const pl = gamestate.players.find((t) => t.id === id);
  if (pl) {
    pl.throttle = throttle;
    pl.age = 0;
    pl.lastseen = Date.now();
  }
}

export function startPlayerBoost(id: string) {
  // gamestate.players[index].throttle = throttle;
}

export function getFreePlayerIndex(id: string) {
  // gamestate.players[index].throttle = throttle;
}

export function getNumberOfPlayers() {
  // gamestate.players[index].throttle = throttle;
  return gamestate.players.length;
}

export function createPlayerId() {
  // gamestate.players[index].throttle = throttle;
  return v4();
}

export function getPlayerState(id: string): PlayerState | undefined {
  return gamestate.players.find((t) => t.id === id);
}

export function touchPlayer(id: string): number {
  // find place for player

  const idx = gamestate.players.findIndex((t) => t.id === id);
  if (idx !== -1) {
    gamestate.players[idx].lastseen = Date.now();
    return gamestate.players[idx].index;
  }

  const position = 20 + 30 * idx;
  const velocity = 10 + 300 * Math.random();
  const index = gamestate.players.length + 1;
  const ledcolor = PLAYER_LED_COLORS[index % PLAYER_LED_COLORS.length];
  const displaycolor =
    PLAYER_DISPLAY_COLORS[index % PLAYER_DISPLAY_COLORS.length];
  const newplayer: PlayerState = {
    index,
    id,
    throttle: 0,
    position,
    velocity,
    overdrive: 0,
    heat: 0,
    age: 0,
    lastposition: -1,
    color: ledcolor,
    ledcolor,
    displaycolor,
    lastseen: Date.now(),
    overheating: false,
    zones: [],
  };
  gamestate.players.push(newplayer);

  return newplayer.index;
}

export function disconnectPlayer(id: string) {}

export function setShowMode(mode: number) {
  showMode = mode;
}

export function setUpdateSpeed(speed: number) {
  updateSpeed = speed;
}

export function sendMapInfo() {
  const update = {
    type: "map",
    positions: ledpositions,
    // debugbuffer: ledbackgroundbuffer2,
    level: level,
  };

  broadcast(update);
}

export function initGame() {
  level = LEVEL;

  let offset = 0;
  ledpositions = [];
  for (const s of level.segments) {
    const v0 = level.vertices[s.from];
    const v1 = level.vertices[s.to];
    const len = s.length * segmentlengthledmultiplier;

    for (var p = 0; p < len; p++) {
      const a1 = p / len;
      const a0 = 1.0 - a1;
      const px = v0.x * a0 + v1.x * a1;
      const py = v0.y * a0 + v1.y * a1;
      ledpositions.push({
        x: px,
        y: py,
        index: offset + p,
      });
    }

    offset += len;
  }
  ledcount = offset;
  for (const z of level.zones) {
    z.startPixel = Math.round((z.startPercent * ledcount) / 100);
    z.endPixel = Math.round(
      ((z.startPercent + z.lengthPercent) * ledcount) / 100
    );
  }
  console.log("total leds", ledcount);

  gamestate.tracklength = ledcount;

  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = "#000";
  }

  ledBackgroundBufferDefault = renderBuffer(SHOWMODE_OUTPUT);
  ledBackgroundBufferZones = renderBuffer(SHOWMODE_ZONES);
  ledBackgroundBufferPixelCount = renderBuffer(SHOWMODE_PIXELCOUNT);

  restartGame();

  function queueFullUpdate() {
    setTimeout(
      () => {
        const update = {
          type: "map",
          buffer: ledbuffer,
        };

        broadcast(update);

        const update2 = {
          type: "artnet",
          universes: artnetbuffers,
        };

        broadcast(update2);

        queueFullUpdate();
      },
      updateSpeed ? 100 : 1000
    );
  }

  queueFullUpdate();

  setInterval(() => {
    // purge idle players
    gamestate.players = gamestate.players.filter((pl) => {
      const inactivity = Date.now() - pl.lastseen;
      const purge = inactivity > 15000;
      if (purge) {
        console.log("Purging inactive player", pl.id, inactivity);
      }
      return !purge;
    });
  }, 1000);

  let frame = 0;
  setInterval(() => {
    stepGame(16 / 1000);
    renderFrame();
    blitArtNet(showMode === 1);
    frame++;
  }, 16);

  setInterval(() => {
    const update = {
      type: "player-update",
      tracklength: ledcount,
      players: gamestate.players.map((p) => {
        return {
          id: p.id,
          index: p.index + 1,
          position: p.position,
          velocity: p.velocity,
          overdrive: p.overdrive,
          heat: p.heat,
          totalvelocity: (p.velocity + p.overdrive) / 2.0,
          inactivity: Date.now() - p.lastseen,
          overheating: p.overheating,
        };
      }),
      blinkphase: gamestate.blinkphase,
    };
    broadcast(update);
  }, 80);
}
