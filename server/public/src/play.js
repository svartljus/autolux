import "../lib/tone.js";
import { hexColorFromArray } from "./util.js";

console.log("hej ctrl");

let myId = "";
let myIndex = -1;
let totalPlayerCount = -1;
let throttleDown = false;
let targetHeat = 0;
let currentHeat = 0;
let currentThrottle = 0;
let targetThrottle = 0;
let lastThrottlePercent = -1;
let currentSpeed = 0;
let targetSpeed = 0;
let overheating = false;
let playerPositionMarkers = {};
let trackLength = 42;
let currentPosition = 0;
let otherPositions = [];

function resetPlayer(idx) {}

function restartGame() {
  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);
}

let conn;
let synth;
let osc1;
let osc2;

function connectWs() {
  conn = new WebSocket(`ws://${location.host}/socket`);

  console.log("location", location);
  if (location.hash.length > 10) {
    myId = location.hash.substring(1);
  }

  conn.addEventListener("close", () => {
    setTimeout(connectWs, 1000);
  });

  conn.addEventListener("message", (m) => {
    const data = JSON.parse(m.data);
    if (data) {
      if (data.type === "connected") {
        console.log("got connected message", data);
        if (!myId) {
          conn.send(
            JSON.stringify({
              type: "get-player-id",
            })
          );
        } else {
          conn.send(
            JSON.stringify({
              type: "player-hello",
              id: myId,
            })
          );
        }
      } else if (data.type === "player-id") {
        console.log("got player id", data);
        myId = data.id;
        conn.send(
          JSON.stringify({
            type: "player-hello",
            id: myId,
          })
        );
        location = `#${myId}`;
      } else if (data.type === "player-info") {
        console.log("got player info", data);
        if (data.id === myId) {
          document.getElementById("playerindex").textContent =
            data.index.toString();

          const color = hexColorFromArray(data.state.displaycolor);
          document.body.style.setProperty("--player-color", color);

          totalPlayerCount = data.count ?? 0;
          document.getElementById("playercount").textContent =
            totalPlayerCount.toString();
        }
      } else if (data.type === "enter-zone") {
        console.log("enter zone event", data);

        if (data.zone === "checkpoint") {
          if (data.playerid === myId) {
            if (synth) {
              const now = Tone.now();
              synth.triggerAttackRelease(
                data.zonedata?.note || "E4",
                "256n",
                now
              );
            }
          }
        }

        if (data.zone === "goal") {
          if (data.playerid === myId) {
            if (synth) {
              const now = Tone.now();
              synth.triggerAttackRelease(
                data.zonedata?.note || "E4",
                "8n",
                now
              );
            }
          }
        }
      } else if (data.type === "leave-zone") {
        console.log("leave zone event", data);
      } else if (data.type === "sound") {
      } else if (data.type === "gamestate") {
      } else if (data.type === "player-update") {
        trackLength = data.tracklength;

        if (data.players.length !== totalPlayerCount) {
          totalPlayerCount = data.players.length ?? 0;
          document.getElementById("playercount").textContent =
            totalPlayerCount.toString();
        }

        const otherpos = [];
        data.players.forEach((p) => {
          if (p.id === myId) {
            targetSpeed = p.totalvelocity;
            targetHeat = p.heat;
            currentPosition = p.position;
            overheating = p.overheating;

            if (p.index !== myIndex) {
              myIndex = p.index;

              document.getElementById("playerindex").textContent =
                myIndex.toString();
            }
            // console.log('got my player info', p)
          } else {
            otherpos.push(p.position);
          }
        });
        otherPositions = otherpos;

        const el3 = document.getElementById("positionmarkers");

        el3.innerHTML = "";

        const positions = {};
        data.players.forEach((p) => {
          const el4 = document.createElement("div");
          el4.classList.add("marker");
          if (p.id === myId) {
            el4.classList.add("you");
          }
          positions[p.id] = el4;
          el4.style.left = `${Math.round((p.position * 100) / trackLength)}%`;
          el3.appendChild(el4);
        });
        playerPositionMarkers = positions;

        data.players.forEach((pl) => {
          const el = playerPositionMarkers[pl.id];
          if (el) {
            el.style.left = `${Math.round((pl.position * 100) / trackLength)}%`;
          }
        });
      } else if (data.type === "artnet") {
      } else if (data.type === "map") {
      } else {
        console.log("Unhandled message", data);
      }
    }
  });
}

// let characteristic;

// function valueChanged(e) {
//   const value = event.target.value;
//   const b0 = value.getUint8(0);
//   const b1 = value.getUint8(1);

//   const level = b1 * 256 + b0;
//   console.log("characteristics value changed", e, b0, b1, level);

//   useMic = false;

//   let lev = Math.max(0, Math.floor(level / 8) - 5);
//   if (lev != playerthrottleelement[2].value) {
//     playerthrottleelement[2].value = lev;
//     const data = {
//       type: "input",
//       player: 2,
//       throttle: playerthrottleelement[2].value,
//     };

//     conn.send(JSON.stringify(data));
//   }

//   // co
//   // nst data = {
//   //   type: "input",
//   //   player: 2,
//   //   throttle: level / 50,
//   // };

//   // conn.send(JSON.stringify(data));
// }

// function connectBle() {
//   return navigator.bluetooth
//     .requestDevice({
//       // acceptAllDevices: true,
//       filters: [
//         {
//           services: [0x9999],
//         },
//       ],
//     })
//     .then((device) => {
//       console.log("got device", device);
//       // this.device = device;
//       return device.gatt.connect();
//     })
//     .then((server) => {
//       console.log("got server", server);
//       // this.server = server;
//       return server.getPrimaryService(0x9999);
//     })
//     .then((service) => {
//       console.log("got service", service);
//       return service.getCharacteristic(0x8888);
//     })
//     .then((char) => {
//       console.log("got char", char);
//       characteristic = char;
//       return char.startNotifications();
//     })
//     .then((char2) => {
//       char2.addEventListener("characteristicvaluechanged", valueChanged);
//     });
// }

function fireBoost() {
  const data = {
    type: "input",
    player: myId,
    fireBoost: true,
  };
  conn.send(JSON.stringify(data));
  boostEnabled = false;
  // document.getElementById("turbobutton").setAttribute("disabled", "");
}

function init() {
  connectWs();

  // level = LEVEL;

  // let offset = 0;
  // ledpositions = [];
  // ledbuffer = [];
  // for (const s of level.segments) {
  //   const v0 = level.vertices[s.from];
  //   const v1 = level.vertices[s.to];
  //   const len = s.length * segmentlengthledmultiplier;

  //   for (var p = 0; p < len; p++) {
  //     const a1 = p / len;
  //     const a0 = 1.0 - a1;
  //     const px = v0.x * a0 + v1.x * a1;
  //     const py = v0.y * a0 + v1.y * a1;
  //     ledpositions.push({
  //       x: px,
  //       y: py,
  //       index: offset + p,
  //     });
  //     ledbuffer.push("#880000");
  //   }

  //   offset += len;
  // }
  // for (const z of level.zones) {
  //   z.startPixel = Math.round((z.startPercent * ledcount) / 100);

  //   z.endPixel = Math.round(
  //     ((z.startPercent + z.lengthPercent) * ledcount) / 100
  //   );
  // }
  // ledcount = offset;
  // console.log("total leds", ledcount);

  // for (let l = 0; l < ledcount; l++) {
  //   ledbuffer[l] = "#000";
  // }

  // document
  //   .getElementById("throttlebutton")
  //   .addEventListener("mousedown", (e) => {
  //     throttleDown = true;
  //     e.stopPropagation();
  //     e.preventDefault();
  //     return false;
  //   });
  // document.getElementById("throttlebutton").addEventListener("mouseup", (e) => {
  //   throttleDown = false;
  //   e.stopPropagation();
  //   e.preventDefault();
  //   return false;
  // });
  // document
  //   .getElementById("throttlebutton")
  //   .addEventListener("mouseout", (e) => {
  //     throttleDown = false;
  //     e.stopPropagation();
  //     e.preventDefault();
  //     return false;
  //   });
  // document.getElementById("turbobutton").addEventListener("mousedown", () => {
  //   fireBoost();
  //   e.stopPropagation();
  //   e.preventDefault();
  //   return false;
  // });
  // document
  //   .getElementById("throttlebutton")
  //   .addEventListener("touchstart", (e) => {
  //     throttleDown = true;
  //     e.stopPropagation();
  //     e.preventDefault();
  //     return false;
  //   });
  // document
  //   .getElementById("throttlebutton")
  //   .addEventListener("touchcancel", (e) => {
  //     throttleDown = false;
  //     e.stopPropagation();
  //     e.preventDefault();
  //     return false;
  //   });
  // document
  //   .getElementById("throttlebutton")
  //   .addEventListener("touchend", (e) => {
  //     throttleDown = false;
  //     e.stopPropagation();
  //     e.preventDefault();
  //     return false;
  //   });

  // document.getElementById("turbobutton").addEventListener("touchstart", () => {
  //   fireBoost();
  //   e.stopPropagation();
  //   e.preventDefault();
  //   return false;
  // });

  // document
  //   .getElementById("connectble")
  //   .addEventListener("click", () => connectBle());
  // document
  //   .getElementById("connectble")
  //   .addEventListener("click", () => connectBle());

  // canvaselement = document.getElementById("canvas");
  // canvaswidth = canvaselement.clientWidth;
  // canvasheight = canvaselement.clientHeight;
  // ctx = canvaselement.getContext("2d");
  // canvaselement.width = canvaswidth;
  // canvaselement.height = canvasheight;

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

  const throttlezone = document.getElementById("throttlezone");
  //   .addEventListener("click", () => connectBle());

  function getThrottleFromY(y, height) {
    let yp = (height - y) / height;
    yp *= 1.2;
    yp -= 0.1;
    return 100.0 * yp;
  }

  throttlezone.addEventListener("mousedown", (e) => {
    throttleDown = true;
    targetThrottle = getThrottleFromY(e.offsetY, throttlezone.offsetHeight);
    throttlezone.classList.add("active");
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("mouseup", (e) => {
    throttleDown = false;
    throttlezone.classList.remove("active");
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("mouseout", (e) => {
    throttleDown = false;
    throttlezone.classList.remove("active");
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("mousemove", (e) => {
    if (e.buttons) {
      targetThrottle = getThrottleFromY(e.offsetY, throttlezone.offsetHeight);
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
  });

  function getThrottleFromTY(y, top, height) {
    let yp = (height - (y - top)) / height;
    yp *= 1.2;
    yp -= 0.1;
    return 100.0 * yp;
  }

  throttlezone.addEventListener("touchstart", (e) => {
    throttleDown = true;
    throttlezone.classList.add("active");
    targetThrottle = getThrottleFromTY(
      e.touches[0].pageY,
      throttlezone.offsetTop,
      throttlezone.offsetHeight
    );
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("touchcancel", (e) => {
    throttlezone.classList.remove("active");
    throttleDown = false;
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("touchend", (e) => {
    throttlezone.classList.remove("active");
    throttleDown = false;
    e.stopPropagation();
    e.preventDefault();
    return false;
  });
  throttlezone.addEventListener("touchmove", (e) => {
    targetThrottle = getThrottleFromTY(
      e.touches[0].pageY,
      throttlezone.offsetTop,
      throttlezone.offsetHeight
    );
    e.stopPropagation();
    e.preventDefault();
    return false;
  });

  restartGame();

  resetPlayer(0);
  resetPlayer(1);
  resetPlayer(2);

  // renderFrame();

  // playerthrottleelement[0].addEventListener("input", (e) => {
  //   console.log("slider 1 changed", e);

  //   const data = {
  //     type: "input",
  //     player: 0,
  //     throttle: playerthrottleelement[0].value,
  //   };
  //   conn.send(JSON.stringify(data));
  // });

  // playerthrottleelement[1].addEventListener("input", (e) => {
  //   console.log("slider 2 changed", e);

  //   const data = {
  //     type: "input",
  //     player: 1,
  //     throttle: playerthrottleelement[1].value,
  //   };
  //   conn.send(JSON.stringify(data));
  // });

  // playerthrottleelement[2].addEventListener("input", (e) => {
  //   console.log("slider 3 changed", e);

  //   const data = {
  //     type: "input",
  //     player: 2,
  //     throttle: playerthrottleelement[2].value,
  //   };
  //   conn.send(JSON.stringify(data));
  // });

  // window.addEventListener("gamepadconnected", (event) => {
  //   console.log("A gamepad connected:");
  //   console.log(event.gamepad);

  //   event.gamepad.addEventListener("");
  // });

  // window.addEventListener("gamepaddisconnected", (event) => {
  //   console.log("A gamepad disconnected:");
  //   console.log(event.gamepad);
  // });

  // setInterval(() => {
  //   var gamepads = navigator.getGamepads();

  //   var idx = 0;
  //   for (const g of gamepads) {
  //     if (!g) {
  //       continue;
  //     }

  //     // console.log(
  //     //   "gp",
  //     //   g,
  //     //   g.buttons.map((b) => b.value)
  //     // );

  //     if (idx === 0) {
  //       let lev = Math.floor(g.buttons[6].value * 100);
  //       if (lev != playerthrottleelement[0].value) {
  //         playerthrottleelement[0].value = lev;
  //         const data = {
  //           type: "input",
  //           player: 0,
  //           throttle: playerthrottleelement[0].value,
  //         };
  //         conn.send(JSON.stringify(data));
  //       }
  //     }

  //     if (idx === 1) {
  //       let lev = Math.floor(g.buttons[7].value * 100);
  //       if (lev != playerthrottleelement[1].value) {
  //         playerthrottleelement[1].value = lev;
  //         const data = {
  //           type: "input",
  //           player: 1,
  //           throttle: playerthrottleelement[1].value,
  //         };
  //         conn.send(JSON.stringify(data));
  //       }
  //     }

  //     idx++;
  //   }
  // }, 20);

  // setInterval(() => {
  //   // console.log('throttle', throttleDown)
  //   throttleBuffer.push(throttleDown)
  //   if (throttleBuffer.length > THROTTLEBUFFER_LENGTH) {
  //     throttleBuffer = throttleBuffer.slice(throttleBuffer.length - THROTTLEBUFFER_LENGTH);
  //   }
  // }, 10);

  let lastSend = 0;

  setInterval(() => {
    const throttle = Math.max(
      0,
      Math.min(100, Math.round(currentThrottle * 10) / 10.0)
    );
    const delta = Date.now() - lastSend;
    if (throttle !== lastThrottlePercent || delta > 10000) {
      console.log("send throttle", myId, throttleDown, throttle);
      const data = {
        player: myId,
        type: "input",
        throttle,
      };
      try {
        if (conn) {
          conn.send(JSON.stringify(data));
        }
      } catch (e) {
        console.warn("failed to send", e);
      }
      lastThrottlePercent = throttle;
      lastSend = Date.now();
    }
  }, 40);

  // const THROTTLE_INC_ADD = 10;
  // const THROTTLE_INC_MUL = 1.4;
  // const THROTTLE_DEC_SUB = 20;
  // const THROTTLE_DEC_MUL = 0.5;

  function goFullscreen() {
    console.log("play?");
    document.documentElement.requestFullscreen().then(() => {
      document.getElementById("fullscreenmodal").classList.add("hidden");
    });
  }

  function closeFullscreenPopup() {
    if (document.fullscreenElement) {
      return;
    }

    document.getElementById("fullscreenmodal").classList.add("hidden");
  }

  document
    .getElementById("gofullscreen")
    .addEventListener("click", () => goFullscreen());

  document
    .getElementById("closefullscreen")
    .addEventListener("click", () => closeFullscreenPopup());

  setInterval(() => {
    // const mult = 1.0 / 32.0;

    currentThrottle += (targetThrottle - currentThrottle) * 0.2;
    currentHeat += (targetHeat - currentHeat) * 0.3;
    currentSpeed += (targetSpeed - currentSpeed) * 0.3;

    // if (throttleDown) {
    //   currentThrottle += THROTTLE_INC_ADD * mult;
    //   currentThrottle += currentThrottle * (THROTTLE_INC_MUL * mult);
    //   if (currentThrottle > 100) {
    //     currentThrottle = 100;
    //   }
    // } else {
    //   currentThrottle -= THROTTLE_DEC_SUB * mult;
    //   currentThrottle -= currentThrottle * (THROTTLE_DEC_MUL * mult);
    //   if (currentThrottle < 0) {
    //     currentThrottle = 0;
    //   }
    // }

    // document.getElementById("throttlefill").style.width = `${Math.round(
    //   currentThrottle
    // )}%`;

    document.getElementById("speedometerfill").style.width = `${Math.round(
      currentSpeed * 100
    )}%`;

    document.getElementById("heatfill").style.width = `${Math.round(
      currentHeat * 100
    )}%`;

    if (overheating) {
      if (
        !document.getElementById("heatmeter").classList.contains("overheating")
      ) {
        document.getElementById("heatmeter").classList.add("overheating");
      }
    } else {
      if (
        document.getElementById("heatmeter").classList.contains("overheating")
      ) {
        document.getElementById("heatmeter").classList.remove("overheating");
      }
    }

    const throttleHeight =
      10 + Math.max(0, Math.min(100, currentThrottle)) * 0.9;
    document.getElementById("throttlezonefill").style.height = `${Math.round(
      throttleHeight
    )}%`;

    if (osc1 && osc2) {
      osc1.volume.value = Math.max(
        -24,
        Math.min(1.0, -24.0 + currentSpeed * 20)
      );
      osc1.frequency.value = 100 + currentSpeed * 300;

      osc2.volume.value = Math.max(
        -24,
        Math.min(1.0, -24.0 + currentSpeed * 20)
      );
      osc2.frequency.value = 101 + currentSpeed * 290;
    }
  }, 16);

  // navigator.mediaDevices
  //   .getUserMedia({
  //     audio: true,
  //     video: true,
  //   })
  //   .then(function (stream) {
  //     const audioContext = new AudioContext();
  //     const analyser = audioContext.createAnalyser();
  //     const microphone = audioContext.createMediaStreamSource(stream);
  //     const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
  //     analyser.smoothingTimeConstant = 0.8;
  //     analyser.fftSize = 1024;
  //     microphone.connect(analyser);
  //     analyser.connect(scriptProcessor);
  //     scriptProcessor.connect(audioContext.destination);
  //     scriptProcessor.onaudioprocess = function () {
  //       const array = new Uint8Array(analyser.frequencyBinCount);
  //       analyser.getByteFrequencyData(array);
  //       const arraySum = array.reduce((a, value) => Math.max(a, value), 0);
  //       const average = arraySum / 3;
  //       // console.log(Math.round(average));
  //       // colorPids(average);
  //       if (useMic) {
  //         let lev = Math.max(0, Math.floor(average * 3) - 70);
  //         if (lev != playerthrottleelement[2].value) {
  //           playerthrottleelement[2].value = lev;
  //           const data = {
  //             type: "input",
  //             player: 2,
  //             throttle: playerthrottleelement[2].value,
  //           };
  //           conn.send(JSON.stringify(data));
  //         }
  //       }
  //     };
  //   })
  //   .catch(function (err) {
  //     /* handle the error */
  //     console.error(err);
  //   });

  document.addEventListener("click", async () => {
    if (!synth) {
      console.log("Init tone", Tone);

      await Tone.start();
      console.log("audio is ready");

      synth = new Tone.Synth().toDestination();

      osc1 = new Tone.Oscillator(101, "triangle").toDestination().start();
      osc1.volume.value = 0.0;

      osc2 = new Tone.Oscillator(102, "triangle").toDestination().start();
      osc2.volume.value = 0.0;
    }
  });

  setTimeout(closeFullscreenPopup, 5000);
}

window.addEventListener("load", init);
