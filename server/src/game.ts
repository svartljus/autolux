import { blitArtNet, ledbuffer } from "./artnet";
import { LEVEL } from "./gameconfig";
import { broadcast } from "./web";

let ledpositions = [];
let ledcount = 0;
let MAX_SPEED_METERS_PER_SECOND = 0.66;
let LED_PIXELS_PER_METER = 60.0;
let OVERDRIVE_METERS_PER_SECOND = 0.33;

let LEDS_PER_SECOND_MAXSPEED =
  MAX_SPEED_METERS_PER_SECOND * LED_PIXELS_PER_METER;
let LEDS_PER_SECOND_OVERDRIVE =
  OVERDRIVE_METERS_PER_SECOND * LED_PIXELS_PER_METER;
let segmentlengthledmultiplier = 1.0;

let level;
let gamestate = {
  players: [
    {
      index: 0,
      throttle: 0,
      position: 0,
      velocity: 0,
      overdrive: 0,
      lastposition: -1,
    },
    {
      index: 1,
      throttle: 0,
      position: 0,
      velocity: 0,
      overdrive: 0,
      lastposition: -1,
    },
    {
      index: 2,
      throttle: 0,
      position: 0,
      velocity: 0,
      overdrive: 0,
      lastposition: -1,
    },
  ],
  demoloop: true,
  demotimer: 0,
  gamestate: "waiting",
  gametimer: 0,
};

function addColors(rgb1, rgb2) {
  return [
    Math.max(0, Math.min(255, rgb1[0] + rgb2[0])),
    Math.max(0, Math.min(255, rgb1[1] + rgb2[1])),
    Math.max(0, Math.min(255, rgb1[2] + rgb2[2])),
  ];
}

function addMulColors(rgb1, rgb2, mul) {
  return [
    Math.max(0, Math.min(255, rgb1[0] + mul * rgb2[0])),
    Math.max(0, Math.min(255, rgb1[1] + mul * rgb2[1])),
    Math.max(0, Math.min(255, rgb1[2] + mul * rgb2[2])),
  ];
}

function stepGame(deltaTime) {
  const velfadeadd = 1.66 * deltaTime;
  const velfadesub = 0.5 * deltaTime;
  const ovrfadeadd = 0.1 * deltaTime;
  const ovrfadesub = 1.0 * deltaTime;
  const maxvel = LEDS_PER_SECOND_MAXSPEED * deltaTime;
  const maxovr = LEDS_PER_SECOND_OVERDRIVE * deltaTime;
  for (var p = 0; p < 3; p++) {
    gamestate.players[p].position += gamestate.players[p].velocity * maxvel;
    gamestate.players[p].position += gamestate.players[p].overdrive * maxovr;
    while (gamestate.players[p].position > ledcount) {
      gamestate.players[p].position -= ledcount;
    }
    gamestate.players[p].velocity -= velfadesub;
    if (gamestate.players[p].velocity < 0.0) {
      gamestate.players[p].velocity = 0.0;
    }
    if (gamestate.players[p].throttle < 0.1) {
      gamestate.players[p].overdrive -= ovrfadesub;
      if (gamestate.players[p].overdrive < 0.0) {
        gamestate.players[p].overdrive = 0.0;
      }
    }
    gamestate.players[p].velocity +=
      (velfadeadd * gamestate.players[p].throttle) / 100;
    gamestate.players[p].overdrive +=
      (ovrfadeadd * gamestate.players[p].throttle) / 100;
    if (gamestate.players[p].velocity > 1.0) {
      gamestate.players[p].velocity = 1.0;
    }
    if (gamestate.players[p].overdrive > 1.0) {
      gamestate.players[p].overdrive = 1.0;
    }

    for (const z of level.zones) {
      // console.log(
      //   "pixel",
      //   z.id,
      //   z.startPixel,
      //   z.endPixel,
      //   gamestate.players[p].position,
      //   gamestate.players[p].lastposition
      // );
      if (
        gamestate.players[p].position > z.startPixel &&
        gamestate.players[p].lastposition <= z.startPixel
      ) {
        console.log("player entered zone", z);
        const update = {
          type: "enter-zone",
          player: p,
          zone: z.id,
          zonedata: z,
        };
        broadcast(update);
      }

      if (
        gamestate.players[p].position > z.endPixel &&
        gamestate.players[p].lastposition <= z.endPixel
      ) {
        console.log("player left zone", z);
        const update = {
          type: "leave-zone",
          player: p,
          zone: z.id,
          zonedata: z,
        };
        broadcast(update);
      }
    }

    gamestate.players[p].lastposition = gamestate.players[p].position;
  }
}

function renderFrame() {
  //     // update led buffer
  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = [0, 0, 0];
  }

  for (const z of level.zones) {
    let sp = z.startPixel;
    let ep = z.endPixel;

    for (let l = sp; l < ep; l++) {
      if (z.type === "curve") {
        ledbuffer[l] = addColors(ledbuffer[l], [25, 0, 0]);
      } else if (z.type === "speedup") {
        ledbuffer[l] = addColors(ledbuffer[l], [0, 10, 0]);
      } else if (z.type === "slowdown") {
        ledbuffer[l] = addColors(ledbuffer[l], [10, 0, 0]);
      } else if (z.type === "goal") {
        ledbuffer[l] = addColors(ledbuffer[l], [20, 10, 10]);
      } else if (z.type === "start") {
        ledbuffer[l] = addColors(ledbuffer[l], [10, 20, 10]);
      } else if (z.type === "tunnel") {
        ledbuffer[l] = addColors(ledbuffer[l], [10, 10, 10]);
      } else {
        ledbuffer[l] = addColors(ledbuffer[l], [20, 10, 20]);
      }
    }
  }
  let playercolor = [
    [0xff, 30, 20],
    [50, 0xef, 50],
    [20, 30, 0xff],
  ];
  for (let p = 0; p < 3; p++) {
    let l = Math.round(gamestate.players[p].position);
    let fadeleds =
      3 +
      Math.max(
        0,
        Math.round(
          gamestate.players[p].velocity * 20 +
            gamestate.players[p].overdrive * 40
        )
      );
    let l2 = Math.round(gamestate.players[p].position - fadeleds);
    let playermul = 0.8 + 0.8 * gamestate.players[p].overdrive;
    if (l >= 0 && l < ledcount) {
      ledbuffer[l] = addMulColors(ledbuffer[l], playercolor[p], playermul);
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
        ledbuffer[l2] = addMulColors(
          ledbuffer[l2],
          playercolor[p],
          playermul * mul
        );
      }
    }
  }
}

function resetPlayer(idx) {
  gamestate.players[idx].position = 20 + 30 * idx;
  gamestate.players[idx].velocity = 10 + 300 * Math.random();
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

//   function init() {//   }

//   window.addEventListener("load", init);

export function setPlayerInput(index, throttle, brake) {
  gamestate.players[index].throttle = throttle;
}

export function initGame() {
  level = LEVEL;

  let offset = 0;
  ledpositions = [];
  //   ledbuffer = [];
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

  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = "#000";
  }

  restartGame();

  setInterval(() => {
    const update = {
      type: "map",
      positions: ledpositions,
      buffer: ledbuffer,
    };
    broadcast(update);
  }, 5000);

  let frame = 0;
  setInterval(() => {
    stepGame(16 / 1000);
    renderFrame();
    blitArtNet();
    if (frame % 50 === 0) {
      console.log("gamestate", gamestate);
    }
    frame++;
  }, 16);

  setInterval(() => {
    console.log("gamestate", gamestate);

    // const osc = new Tone.Oscillator(440, "sine").toDestination().start();
    const update = {
      type: "player-update",
      players: gamestate.players.map((p) => {
        return {
          position: p.position,
          velocity: p.velocity * MAX_SPEED_METERS_PER_SECOND,
          overdrive: p.overdrive * OVERDRIVE_METERS_PER_SECOND,
          totalvelocity:
            p.velocity * MAX_SPEED_METERS_PER_SECOND +
            p.overdrive * OVERDRIVE_METERS_PER_SECOND,
        };
      }),
    };
    broadcast(update);
  }, 60);
}
