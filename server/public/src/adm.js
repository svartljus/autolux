import { fixColorDisplayGamma, hexColorFromArray } from "./util.js";

console.log("hej admin");

let level;

let canvaselement;
let ctx;
let canvaswidth;
let canvasheight;

let canvaselement2;
let ctx2;
let canvaswidth2;
let canvasheight2;

let canvaselement3;
let ctx3;
let canvaswidth3;
let canvasheight3;

let playerthrottleelement = [0, 0, 0];
let playervelocityelement = [0, 0, 0];
let playerpositionelement = [0, 0, 0];
let ledpositions = [];
let ledbuffer = [];
let ledbuffer2 = [];
let ledcount = 0;
let universes = [];

let useMic = true;

let ledspersecondmaxspeed = 20.0;
let segmentlengthledmultiplier = 2.0;

let gamestate = {
  players: [
    // { index: 0, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
    // { index: 1, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
    // { index: 2, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
  ],
  demoloop: true,
  demotimer: 0,
  gamestate: "waiting",
  gametimer: 0,
};

function updateUI() {
  // for (var p = 0; p < 3; p++) {
  //   gamestate.players[p].throttle = playerthrottleelement[p].value;
  //   playerpositionelement[p].textContent = `${
  //     Math.round(gamestate.players[p].position * 100) / 100
  //   }/${ledcount}`;
  //   playervelocityelement[p].textContent = `${
  //     Math.round(gamestate.players[p].velocity * 100) / 100
  //   }`;
  // }
}

function stepGame(deltaTime) {
  //   const velfadesub = 0.5 * deltaTime;
  //   const velfadeadd = 1.0 * deltaTime;
  //   const maxvel = ledspersecondmaxspeed * deltaTime;
  //   for (var p = 0; p < 3; p++) {
  //     gamestate.players[p].position += gamestate.players[p].velocity * maxvel;
  //     while (gamestate.players[p].position > ledcount) {
  //       gamestate.players[p].position -= ledcount;
  //     }
  //     gamestate.players[p].velocity -= velfadesub;
  //     if (gamestate.players[p].velocity < 0.0) {
  //       gamestate.players[p].velocity = 0.0;
  //     }
  //     gamestate.players[p].velocity +=
  //       (velfadeadd * gamestate.players[p].throttle) / 100;
  //     if (gamestate.players[p].velocity > 1.0) {
  //       gamestate.players[p].velocity = 1.0;
  //     }
  //   }
}

function renderFrame() {
  // update led buffer

  // for (let l = 0; l < ledcount; l++) {
  //   ledbuffer[l] = "#000";
  // }
  // for (const z of level.zones) {
  //   let sp = z.startPixel; // Math.round((z.startPercent * ledcount) / 100);
  //   let ep = z.endPixel; // Math.round(((z.startPercent + z.lengthPercent) * ledcount) / 100);
  //   for (let l = sp; l < ep; l++) {
  //     if (z.type === "curve") {
  //       ledbuffer[l] = "#444";
  //     } else if (z.type === "speedup") {
  //       ledbuffer[l] = "#042";
  //     } else if (z.type === "slowdown") {
  //       ledbuffer[l] = "#400";
  //     } else if (z.type === "goal") {
  //       ledbuffer[l] = "#333";
  //     } else if (z.type === "start") {
  //       ledbuffer[l] = "#333";
  //     } else if (z.type === "tunnel") {
  //       ledbuffer[l] = "#235";
  //     } else {
  //       ledbuffer[l] = "#333";
  //     }
  //   }
  // }
  // let playercolor = ["#f66", "#6f6", "#6cf"];
  // for (let p = 0; p < gamestate.players.length; p++) {
  //   let l = Math.round(gamestate.players[p].position);
  //   ledbuffer[l] = playercolor[p];
  // }

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
    ctx.fillStyle = hexColorFromArray(fixColorDisplayGamma(ledbuffer[s.index]));
    ctx.fillRect(s.x - 1, s.y - 1, 3, 3);
  }

  //

  ctx2.fillStyle = "#222";
  ctx2.fillRect(0, 0, canvaswidth2, canvasheight2);

  ctx2.strokeStyle = "";

  for (const s of ledpositions) {
    ctx2.fillStyle = hexColorFromArray(
      fixColorDisplayGamma(ledbuffer[s.index])
    );
    let llx = (s.index % 128) * 5;
    let lly = (s.index >> 7) * 15;
    ctx2.fillRect(llx, lly, 4, 12);
  }

  //

  ctx3.fillStyle = "#222";
  ctx3.fillRect(0, 0, canvaswidth3, canvasheight3);

  ctx3.strokeStyle = "";

  for (const k of Object.keys(universes)) {
    const arr = universes[k];
    if (arr) {
      // console.log('arr', k, arr)
      for (var i = 0; i < Math.round(arr.length / 3); i++) {
        // ctx3.fillStyle = '#f0f'
        ctx3.fillStyle = hexColorFromArray(
          fixColorDisplayGamma(arr.slice(i * 3, i*3+3))
        );
        let llx = i * 5;
        let lly = k * 15;
        ctx3.fillRect(llx, lly, 4, 12);
      }
    }
  }

  updateUI();

  stepGame(1.0 / 5.0);
  setTimeout(renderFrame, 1000.0 / 200.0);
}

function resetPlayer(idx) {
  if (gamestate.players[idx]) {
    gamestate.players[idx].position = 0;
    gamestate.players[idx].velocity = 0;
  }
  if (playerthrottleelement[idx]) {
    playerthrottleelement[idx].value = 0;
  }
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

let conn;
// let synth;
// let osc1;
// let osc2;
// let osc3;

function connectWs() {
  conn = new WebSocket(`ws://${location.host}/socket`);

  conn.addEventListener("close", () => {
    setTimeout(connectWs, 1000);
  });

  conn.addEventListener("message", (m) => {
    const data = JSON.parse(m.data);
    if (data) {
      if (data.type === "enter-zone") {
        console.log("enter zone event", data);
        if (data.zone === "goal") {
          // if (synth) {
          //   const now = Tone.now();
          //   synth.triggerAttackRelease("E4", "8n", now);
          // }
        }
      } else if (data.type === "leave-zone") {
        console.log("leave zone event", data);
      } else if (data.type === "gamestate") {
        console.log("got gamestate", data);
      } else if (data.type === "map") {
        console.log("got map update", data);
        if (data.buffer) {
          ledbuffer = data.buffer;
        }
        if (data.positions) {
          ledpositions = data.positions;
        }
        if (data.level) {
          level = data.level;
        }
      } else if (data.type === "artnet") {
        console.log("got artnet update", data);
        if (data.universes) {
          universes = data.universes;
        }
      } else if (data.type === "sound") {
        // if (synth) {
        //   const now = Tone.now();
        //   synth.triggerAttackRelease("E4", "8n", now);
        // }
      } else if (data.type === "connected") {
        conn.send(
          JSON.stringify({
            type: "admin-hello",
          })
        );
      } else if (data.type === "player-update") {
        console.log("got player update", data);
      } else {
        console.log("Unhandled message", data);
      }
    }
  });
}

let characteristic;

function valueChanged(e) {
  const value = event.target.value;
  const b0 = value.getUint8(0);
  const b1 = value.getUint8(1);

  const level = b1 * 256 + b0;
  console.log("characteristics value changed", e, b0, b1, level);

  useMic = false;

  let lev = Math.max(0, Math.floor(level / 8) - 5);
  if (lev != playerthrottleelement[2].value) {
    playerthrottleelement[2].value = lev;
    const data = {
      type: "input",
      player: 2,
      throttle: playerthrottleelement[2].value,
    };

    conn.send(JSON.stringify(data));
  }
}

function connectBle() {
  return navigator.bluetooth
    .requestDevice({
      filters: [
        {
          services: [0x9999],
        },
      ],
    })
    .then((device) => {
      console.log("got device", device);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("got server", server);
      return server.getPrimaryService(0x9999);
    })
    .then((service) => {
      console.log("got service", service);
      return service.getCharacteristic(0x8888);
    })
    .then((char) => {
      console.log("got char", char);
      characteristic = char;
      return char.startNotifications();
    })
    .then((char2) => {
      char2.addEventListener("characteristicvaluechanged", valueChanged);
    });
}

function setShowMode(mode) {
  const data = {
    type: "set-show-mode",
    mode,
  };

  conn.send(JSON.stringify(data));
}

function init() {
  connectWs();

  level = {
    vertices: [],
    segments: [],
    zones: [],
    positions: [],
  };

  ledpositions = [];
  ledbuffer = [];
  ledbuffer2 = [];
  ledcount = 0;

  canvaselement = document.getElementById("canvas");
  canvaswidth = canvaselement.clientWidth;
  canvasheight = canvaselement.clientHeight;
  ctx = canvaselement.getContext("2d");
  canvaselement.width = canvaswidth;
  canvaselement.height = canvasheight;

  canvaselement2 = document.getElementById("canvas2");
  canvaswidth2 = canvaselement2.clientWidth;
  canvasheight2 = canvaselement2.clientHeight;
  ctx2 = canvaselement2.getContext("2d");
  canvaselement2.width = canvaswidth2;
  canvaselement2.height = canvasheight2;

  canvaselement3 = document.getElementById("canvas3");
  canvaswidth3 = canvaselement3.clientWidth;
  canvasheight3 = canvaselement3.clientHeight;
  ctx3 = canvaselement3.getContext("2d");
  canvaselement3.width = canvaswidth3;
  canvaselement3.height = canvasheight3;

  // playerthrottleelement[0] = document.getElementById("throttle1");
  // playerthrottleelement[1] = document.getElementById("throttle2");
  // playerthrottleelement[2] = document.getElementById("throttle3");

  // playerpositionelement[0] = document.getElementById("position1");
  // playerpositionelement[1] = document.getElementById("position2");
  // playerpositionelement[2] = document.getElementById("position3");

  // playervelocityelement[0] = document.getElementById("velocity1");
  // playervelocityelement[1] = document.getElementById("velocity2");
  // playervelocityelement[2] = document.getElementById("velocity3");

  // document
  //   .getElementById("reset1")
  //   .addEventListener("click", () => resetPlayer(0));
  // document
  //   .getElementById("reset2")
  //   .addEventListener("click", () => resetPlayer(1));
  // document
  //   .getElementById("reset3")
  //   .addEventListener("click", () => resetPlayer(2));
  // document
  //   .getElementById("restartgame")
  //   .addEventListener("click", () => restartGame());
  // document
  //   .getElementById("stopgame")
  //   .addEventListener("click", () => stopGame());
  // document
  //   .getElementById("startdemo")
  //   .addEventListener("click", () => startDemo());
  // document
  //   .getElementById("connectble")
  //   .addEventListener("click", () => connectBle());

  document
    .getElementById("show0")
    .addEventListener("click", () => setShowMode(0));
  document
    .getElementById("show1")
    .addEventListener("click", () => setShowMode(1));
  document
    .getElementById("show2")
    .addEventListener("click", () => setShowMode(2));

  //   startDemo();
  restartGame();

  // resetPlayer(0);
  // resetPlayer(1);
  // resetPlayer(2);

  renderFrame();

  window.addEventListener("gamepadconnected", (event) => {
    console.log("A gamepad connected:");
    console.log(event.gamepad);
  });

  window.addEventListener("gamepaddisconnected", (event) => {
    console.log("A gamepad disconnected:");
    console.log(event.gamepad);
  });
}

window.addEventListener("load", init);
