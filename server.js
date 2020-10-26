import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as WebSocket from "ws";
import * as http from "http";

import APIRouteIndex from "~/pages";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";

const app = express();

app.use(cors());
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
app.get("/favicon.ico", (req, res) => res.status(204));
app.get("/", APIRouteIndex);

const server = http.createServer(app);
const socket = new WebSocket.Server({ server });

const SOCKET_KEEP_ALIVE = 30000;

socket.on("connection", (connection, req) => {
  connection.isAlive = true;
  connection.userId = null;

  connection.on("pong", () => {
    // NOTE(jim): Send keep alive updates.
    ScriptLogging.socketMessage("KEEP ALIVE      ", connection.userId);
    connection.send(`keep-alive::${connection.userId}`);
    connection.isAlive = true;
  });

  connection.on("message", (message) => {
    let data;
    let type;

    try {
      const request = JSON.parse(message);
      data = request.data;
      type = request.type;
    } catch (e) {
      ScriptLogging.socketError("ERROR           ", e.message);
    }

    if (type === "SUBSCRIBE_VIEWER") {
      connection.userId = data.id;
      // NOTE(jim): Subscription.
      ScriptLogging.socketMessage("SUBSCRIBE_VIEWER", connection.userId);
      connection.send(`connected::${connection.userId}`);
      return;
    }

    if (type === "VERIFIED_UPDATE") {
      // TODO(jim): Subscription.
      // update the viewer.
      return;
    }
  });

  connection.on("close", function close() {
    ScriptLogging.socketError("CLOSE           ", connection.userId);
    clearInterval(interval);
  });

  connection.send(`connecting::`);
});

const interval = setInterval(() => {
  socket.clients.forEach((c) => {
    if (c.isAlive === false) {
      // NOTE(jim): No longer connected.
      ScriptLogging.socketError("DEAD            ", c.userId);
      c.send(`dead::${c.userId}`);
      return c.terminate();
    }

    // NOTE(jim): Still alive
    ScriptLogging.socketMessage("OKAY            ", c.userId);
    c.send(`still-alive::${c.userId}`);
    c.isAlive = false;
    c.ping(() => {});
  });
}, SOCKET_KEEP_ALIVE);

server.listen(Environment.PORT, (e) => {
  if (e) throw e;

  ScriptLogging.socketMessage("SERVER START    ", `http://localhost:${Environment.PORT}`);
});
