import { LEVEL } from "./config.js";

console.log("hej");

let level;

let canvaselement;
let ctx;
let canvaswidth;
let canvasheight;

let playerthrottleelement = [0, 0, 0];
let playervelocityelement = [0, 0, 0];
let playerpositionelement = [0, 0, 0];
let ledpositions = [];
let ledbuffer = [];
let ledcount = 0;

let ledspersecondmaxspeed = 20.0;
let segmentlengthledmultiplier = 2.0;

let gamestate = {
  players: [
    { index: 0, throttle: 0, position: 0, velocity: 0 },
    { index: 1, throttle: 0, position: 0, velocity: 0 },
    { index: 2, throttle: 0, position: 0, velocity: 0 },
  ],
  demoloop: true,
  demotimer: 0,
  gamestate: "waiting",
  gametimer: 0,
};

function updateUI() {
  for (var p = 0; p < 3; p++) {
    gamestate.players[p].throttle = playerthrottleelement[p].value;
    playerpositionelement[p].textContent = `${
      Math.round(gamestate.players[p].position * 100) / 100
    }/${ledcount}`;
    playervelocityelement[p].textContent = `${
      Math.round(gamestate.players[p].velocity * 100) / 100
    }`;
  }
}

function stepGame(deltaTime) {
  const velfadesub = 0.5 * deltaTime;
  const velfadeadd = 1.0 * deltaTime;
  const maxvel = ledspersecondmaxspeed * deltaTime;

  for (var p = 0; p < 3; p++) {
    gamestate.players[p].position += gamestate.players[p].velocity * maxvel;

    while (gamestate.players[p].position > ledcount) {
      gamestate.players[p].position -= ledcount;
    }

    gamestate.players[p].velocity -= velfadesub;
    if (gamestate.players[p].velocity < 0.0) {
      gamestate.players[p].velocity = 0.0;
    }

    gamestate.players[p].velocity +=
      (velfadeadd * gamestate.players[p].throttle) / 100;
    if (gamestate.players[p].velocity > 1.0) {
      gamestate.players[p].velocity = 1.0;
    }
  }
}

function renderFrame() {
  // update led buffer

  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = "#000";
  }
  for (const z of level.zones) {
    let sp = Math.round((z.startPercent * ledcount) / 100);
    let ep = Math.round(((z.startPercent + z.lengthPercent) * ledcount) / 100);
    for (let l = sp; l < ep; l++) {
      if (z.type === "curve") {
        ledbuffer[l] = "#444";
      } else if (z.type === "speedup") {
        ledbuffer[l] = "#042";
      } else if (z.type === "slowdown") {
        ledbuffer[l] = "#400";
      } else if (z.type === "goal") {
        ledbuffer[l] = "#333";
      } else if (z.type === "start") {
        ledbuffer[l] = "#333";
      } else if (z.type === "tunnel") {
        ledbuffer[l] = "#235";
      } else {
        ledbuffer[l] = "#333";
      }
    }
  }
  let playercolor = ["#f66", "#6f6", "#6cf"];
  for (let p = 0; p < 3; p++) {
    let l = Math.round(gamestate.players[p].position);
    ledbuffer[l] = playercolor[p];
  }

  // update ui

  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvaswidth, canvasheight);

  for (const v of level.vertices) {
    ctx.fillStyle = "#aaa";
    ctx.fillRect(v.x - 2, v.y - 2, 5, 5);
    ctx.fillText(`#${v.index}`, v.x, v.y + 15);
  }

  for (const s of level.segments) {
    const v0 = level.vertices[s.from];
    const v1 = level.vertices[s.to];
    ctx.strokeColor = "#444";
    ctx.beginPath();
    ctx.moveTo(v0.x, v0.y);
    ctx.lineTo(v1.x, v1.y);
    ctx.stroke();
  }

  ctx.strokeStyle = "";

  for (const s of ledpositions) {
    ctx.fillStyle = ledbuffer[s.index];

    ctx.fillRect(s.x - 1, s.y - 1, 3, 3);

    let llx = (s.index % 128) * 5;
    let lly = (s.index >> 7) * 15;
    ctx.fillRect(llx, lly, 5, 15);
  }

  updateUI();

  stepGame(1.0 / 30.0);
  setTimeout(renderFrame, 1000.0 / 30.0);
}

function resetPlayer(idx) {
  gamestate.players[idx].position = 0;
  gamestate.players[idx].velocity = 0;
  playerthrottleelement[idx].value = 0;
}

function restartGame() {
  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);
}

function stopGame() {}

function startDemo() {
  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);
}

function init() {
  level = LEVEL;

  let offset = 0;
  ledpositions = [];
  ledbuffer = [];
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
      ledbuffer.push("#880000");
    }

    offset += len;
  }
  ledcount = offset;
  console.log("total leds", ledcount);

  for (let l = 0; l < ledcount; l++) {
    ledbuffer[l] = "#000";
  }

  canvaselement = document.getElementById("canvas");
  canvaswidth = canvaselement.clientWidth;
  canvasheight = canvaselement.clientHeight;
  ctx = canvaselement.getContext("2d");
  canvaselement.width = canvaswidth;
  canvaselement.height = canvasheight;

  playerthrottleelement[0] = document.getElementById("throttle1");
  playerthrottleelement[1] = document.getElementById("throttle2");
  playerthrottleelement[2] = document.getElementById("throttle3");

  playerpositionelement[0] = document.getElementById("position1");
  playerpositionelement[1] = document.getElementById("position2");
  playerpositionelement[2] = document.getElementById("position3");

  playervelocityelement[0] = document.getElementById("velocity1");
  playervelocityelement[1] = document.getElementById("velocity2");
  playervelocityelement[2] = document.getElementById("velocity3");

  document
    .getElementById("reset1")
    .addEventListener("click", () => resetPlayer(0));
  document
    .getElementById("reset2")
    .addEventListener("click", () => resetPlayer(1));
  document
    .getElementById("reset3")
    .addEventListener("click", () => resetPlayer(2));

  document
    .getElementById("restartgame")
    .addEventListener("click", () => restartGame());
  document
    .getElementById("stopgame")
    .addEventListener("click", () => stopGame());
  document
    .getElementById("startdemo")
    .addEventListener("click", () => startDemo());

  //   startDemo();
  restartGame();

  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);

  renderFrame();
}

window.addEventListener("load", init);
