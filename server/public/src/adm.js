import { LEVEL } from "./config.js";

console.log("hej admin");

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
let synth;
let osc1;
let osc2;
let osc3;

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
          if (synth) {
            const now = Tone.now();
            synth.triggerAttackRelease("E4", "8n", now);
          }
        }
      } else if (data.type === "leave-zone") {
        console.log("leave zone event", data);
      } else if (data.type === "sound") {
        if (synth) {
          const now = Tone.now();
          synth.triggerAttackRelease("E4", "8n", now);
        }
      } else if (data.type === "player-update") {
        if (osc1) {
          osc1.volume.value = Math.max(
            -24,
            Math.min(1.0, -24.0 + data.players[0].totalvelocity * 30)
          );
          osc1.frequency.value = 100 + data.players[0].totalvelocity * 300;
        }

        if (osc2) {
          osc2.volume.value = Math.max(
            -24,
            Math.min(1.0, -24.0 + data.players[1].totalvelocity * 30)
          );

          osc2.frequency.value = 100 + data.players[1].totalvelocity * 300;
        }

        if (osc3) {
          osc3.volume.value = Math.max(
            -24,
            Math.min(1.0, -24.0 + data.players[2].totalvelocity * 30)
          );

          osc3.frequency.value = 100 + data.players[2].totalvelocity * 300;
        }
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

  // co
  // nst data = {
  //   type: "input",
  //   player: 2,
  //   throttle: level / 50,
  // };

  // conn.send(JSON.stringify(data));
}

function connectBle() {
  return navigator.bluetooth
    .requestDevice({
      // acceptAllDevices: true,
      filters: [
        {
          services: [0x9999],
        },
      ],
    })
    .then((device) => {
      console.log("got device", device);
      // this.device = device;
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("got server", server);
      // this.server = server;
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

function init() {
  connectWs();

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
  for (const z of level.zones) {
    z.startPixel = Math.round((z.startPercent * ledcount) / 100);

    z.endPixel = Math.round(
      ((z.startPercent + z.lengthPercent) * ledcount) / 100
    );
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
  document
    .getElementById("connectble")
    .addEventListener("click", () => connectBle());

  //   startDemo();
  restartGame();

  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);

  renderFrame();

  playerthrottleelement[0].addEventListener("input", (e) => {
    console.log("slider 1 changed", e);

    const data = {
      type: "input",
      player: 0,
      throttle: playerthrottleelement[0].value,
    };
    conn.send(JSON.stringify(data));
  });

  playerthrottleelement[1].addEventListener("input", (e) => {
    console.log("slider 2 changed", e);

    const data = {
      type: "input",
      player: 1,
      throttle: playerthrottleelement[1].value,
    };
    conn.send(JSON.stringify(data));
  });

  playerthrottleelement[2].addEventListener("input", (e) => {
    console.log("slider 3 changed", e);

    const data = {
      type: "input",
      player: 2,
      throttle: playerthrottleelement[2].value,
    };
    conn.send(JSON.stringify(data));
  });

  window.addEventListener("gamepadconnected", (event) => {
    console.log("A gamepad connected:");
    console.log(event.gamepad);

    event.gamepad.addEventListener("");
  });

  window.addEventListener("gamepaddisconnected", (event) => {
    console.log("A gamepad disconnected:");
    console.log(event.gamepad);
  });

  setInterval(() => {
    var gamepads = navigator.getGamepads();

    var idx = 0;
    for (const g of gamepads) {
      if (!g) {
        continue;
      }

      // console.log(
      //   "gp",
      //   g,
      //   g.buttons.map((b) => b.value)
      // );

      if (idx === 0) {
        let lev = Math.floor(g.buttons[6].value * 100);
        if (lev != playerthrottleelement[0].value) {
          playerthrottleelement[0].value = lev;
          const data = {
            type: "input",
            player: 0,
            throttle: playerthrottleelement[0].value,
          };
          conn.send(JSON.stringify(data));
        }
      }

      if (idx === 1) {
        let lev = Math.floor(g.buttons[7].value * 100);
        if (lev != playerthrottleelement[1].value) {
          playerthrottleelement[1].value = lev;
          const data = {
            type: "input",
            player: 1,
            throttle: playerthrottleelement[1].value,
          };
          conn.send(JSON.stringify(data));
        }
      }

      idx++;
    }
  }, 20);

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then(function (stream) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      scriptProcessor.onaudioprocess = function () {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const arraySum = array.reduce((a, value) => Math.max(a, value), 0);
        const average = arraySum / 3;
        // console.log(Math.round(average));
        // colorPids(average);

        if (useMic) {
          let lev = Math.max(0, Math.floor(average * 3) - 70);
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
      };
    })
    .catch(function (err) {
      /* handle the error */
      console.error(err);
    });

  document.addEventListener("click", async () => {
    await Tone.start();
    console.log("audio is ready");

    synth = new Tone.Synth().toDestination();

    osc1 = new Tone.Oscillator(101, "sine").toDestination().start();
    osc1.volume.value = 0.5;

    osc2 = new Tone.Oscillator(102, "sine").toDestination().start();
    osc2.volume.value = 0.5;

    osc3 = new Tone.Oscillator(103, "sine").toDestination().start();
    osc3.volume.value = 0.5;
  });
}

window.addEventListener("load", init);
