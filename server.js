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
    connection.send(`-- keep-alive -- CLIENT|${connection.userId}`);
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
      // NOTE(jim): Not sure what kind of errors we really get here.
      console.log("-- error", e);
    }

    if (type === "SUBSCRIBE_VIEWER") {
      connection.userId = data.id;
      // NOTE(jim): Subscription.
      console.log(`-- connected -- CLIENT|${connection.userId}`);
      connection.send(`-- connected -- CLIENT|${connection.userId}`);
      return;
    }

    if (type === "VERIFIED_UPDATE") {
      // TODO(jim): Subscription.
      // update the viewer.
      return;
    }
  });

  connection.on("close", function close() {
    console.log(`-- close -- CLIENT|${connection.userId}`);
    clearInterval(interval);
  });

  connection.send(`-- established connection ...`);
});

const interval = setInterval(() => {
  socket.clients.forEach((c) => {
    console.log(`-- checking -- CLIENT|${c.userId}`);
    if (c.isAlive === false) {
      // NOTE(jim): No longer connected.
      c.send(`-- dead -- CLIENT|${c.userId}`);
      return c.terminate();
    }

    // NOTE(jim): Still alive
    c.send(`-- kept-alive -- CLIENT|${c.userId}`);
    c.isAlive = false;
    c.ping(() => {});
  });
}, SOCKET_KEEP_ALIVE);

server.listen(Environment.PORT, (e) => {
  if (e) throw e;

  ScriptLogging.taskTimeless(`http://localhost:${Environment.PORT}`);
});
