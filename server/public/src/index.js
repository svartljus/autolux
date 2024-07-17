console.log("hej index");

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

let useMic = true;

let ledspersecondmaxspeed = 20.0;
let segmentlengthledmultiplier = 2.0;

let gamestate = {
  players: [
    { index: 0, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
    { index: 1, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
    { index: 2, throttle: 0, position: 0, velocity: 0, lastposition: 0 },
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
    let sp = z.startPixel; // Math.round((z.startPercent * ledcount) / 100);
    let ep = z.endPixel; // Math.round(((z.startPercent + z.lengthPercent) * ledcount) / 100);
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
      } else if (data.type === "sound") {
        // if (synth) {
        //   const now = Tone.now();
        //   synth.triggerAttackRelease("E4", "8n", now);
        // }
      } else if (data.type === "gamestate") {
      } else if (data.type === "map") {
      } else if (data.type === "artnet") {
      } else if (data.type === "player-update") {
        // if (osc1) {
        //   osc1.volume.value = Math.max(
        //     -24,
        //     Math.min(1.0, -24.0 + data.players[0].totalvelocity * 30)
        //   );
        //   osc1.frequency.value = 100 + data.players[0].totalvelocity * 300;
        // }

        // if (osc2) {
        //   osc2.volume.value = Math.max(
        //     -24,
        //     Math.min(1.0, -24.0 + data.players[1].totalvelocity * 30)
        //   );

        //   osc2.frequency.value = 100 + data.players[1].totalvelocity * 300;
        // }

        // if (osc3) {
        //   osc3.volume.value = Math.max(
        //     -24,
        //     Math.min(1.0, -24.0 + data.players[2].totalvelocity * 30)
        //   );

        //   osc3.frequency.value = 100 + data.players[2].totalvelocity * 300;
        // }
      } else {
        console.log("Unhandled message", data);
      }
    }
  });
}

function init() {
  // connectWs();
  location = 'play.html'
}

window.addEventListener("load", init);
