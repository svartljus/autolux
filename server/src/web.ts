import * as express from "express";
import * as expressWsModule from "express-ws";
import {
  createPlayerId,
  getNumberOfPlayers,
  getPlayerState,
  sendMapInfo,
  setPlayerThrottle,
  setShowMode,
  setUpdateSpeed,
  startPlayerBoost,
  touchPlayer,
} from "./game";

const app = express();
const expressWs = expressWsModule(app);

const PORT = process.env.PORT || 3000;

export function broadcast(payload) {
  // console.log("broadcast", JSON.stringify(payload));
  let wss = expressWs.getWss("/socket");
  wss.clients.forEach(function (client) {
    client.send(JSON.stringify(payload));
  });
}

export function initWeb() {
  app.use(express.static("public"));

  // app.use(function (req, res, next) {
  //   // console.log("middleware");
  //   req.testing = "testing";
  //   return next();
  // });

  app.get("/", function (req, res, next) {
    // console.log("get route", req.testing);
    res.end();
  });

  app.ws("/socket", function (ws, req) {
    ws.on("message", function (msg) {
      const data = JSON.parse(msg);
      if (data.type === "get-player-id") {
        const id = createPlayerId();
        ws.send(
          JSON.stringify({
            type: "player-id",
            id,
          })
        );
      } else if (data.type === "player-hello") {
        const index = touchPlayer(data.id);
        console.log("got hello from player", data, index);
        const state = getPlayerState(data.id);
        ws.send(
          JSON.stringify({
            type: "player-info",
            id: data.id,
            index: state.index,
            count: getNumberOfPlayers(),
            state,
          })
        );
      } else if (data.type === "input") {
        console.log("got player input", data);
        // setPlayerInput(data.player, data.throttle, data.brake);
        if (data.throttle !== undefined) {
          setPlayerThrottle(data.player, data.throttle);
        }
        if (data.fireBoost) {
          startPlayerBoost(data.player);
        }
      } else if (data.type === "admin-hello") {
        sendMapInfo();
      } else if (data.type === "set-show-mode") {
        setShowMode(data.mode as number);
      } else if (data.type === "set-update-speed") {
        setUpdateSpeed(data.speed as number);
      } else {
        console.log("Unhandled message", data);
      }
    });

    ws.send(
      JSON.stringify({
        type: "connected",
      })
    );

    ws.send(
      JSON.stringify({
        type: "player-count",
        players: getNumberOfPlayers(),
      })
    );

    console.log("socket connected");
  });

  console.log("Listening on port", PORT);
  app.listen(PORT, "0.0.0.0");
}
