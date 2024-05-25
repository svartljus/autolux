import * as express from "express";
import * as expressWsModule from "express-ws";
import { setPlayerInput } from "./game";

const app = express();
const expressWs = expressWsModule(app);

export function broadcast(payload) {
  console.log("broadcast", JSON.stringify(payload));
  let wss = expressWs.getWss("/socket");
  wss.clients.forEach(function (client) {
    client.send(JSON.stringify(payload));
  });
}

export function initWeb() {
  app.use(express.static("public"));

  app.use(function (req, res, next) {
    console.log("middleware");
    req.testing = "testing";
    return next();
  });

  app.get("/", function (req, res, next) {
    console.log("get route", req.testing);
    res.end();
  });

  app.ws("/socket", function (ws, req) {
    ws.on("message", function (msg) {
      const data = JSON.parse(msg);
      // console.log("got message", data);
      if (data.type === "input") {
        // console.log("input", data);
        setPlayerInput(data.player, data.throttle, data.brake);
      } else {
        console.log("Unhandled message", data);
      }
    });

    console.log("socket", req.testing);
  });

  app.listen(3000);
}
