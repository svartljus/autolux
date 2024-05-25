import * as express from "express";
import * as expressWsModule from "express-ws";
import * as artnetModule from "artnet";

const ARTNET_OPTIONS = {
  host: "192.168.8.116",
};

const app = express();
const expressWs = expressWsModule(app);
const artnet = artnetModule(ARTNET_OPTIONS);

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

app.ws("/", function (ws, req) {
  ws.on("message", function (msg) {
    console.log(msg);
  });
  console.log("socket", req.testing);
});

app.listen(3000);

setInterval(() => {
  // set channel 1 to 255 and disconnect afterwards.
  try {
    artnet.set(
      0,
      // 0,
      Math.floor(Math.random() * 100) * 3,
      Math.floor(Math.random() * 255),
      function (err, res) {
        console.log("result", err, res);
        // artnet.close();
      }
    );
  } catch (e) {
    console.warn("artnet failed", e);
  }
}, 100);
