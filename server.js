import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as WebSocket from "ws";
import * as http from "http";

import APIRouteIndex from "~/pages";

import crypto from "crypto";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";

const ENCRYPTION_ALGORITHM = "aes-256-ctr";

const decrypt = (hash, iv) => {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Environment.PUBSUB_SECRET,
    Buffer.from(iv, "hex")
  );

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, "hex")), decipher.final()]);

  return decrpyted.toString();
};

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
    connection.send(JSON.stringify({ data: `keep-alive::${connection.userId}` }));
    connection.isAlive = true;
  });

  connection.on("message", (message) => {
    let data;
    let type;
    let iv;

    try {
      const request = JSON.parse(message);
      data = request.data;
      type = request.type;
      iv = request.iv;
    } catch (e) {
      ScriptLogging.socketError("ERROR           ", e.message);
    }

    if (type === "SUBSCRIBE_HOST") {
      connection.userId = "SLATE";
      ScriptLogging.socketMessage("CONNECT         ", connection.userId);
      connection.send(JSON.stringify({ data: `connected::${connection.userId}` }));
      return;
    }

    if (type === "SUBSCRIBE_VIEWER") {
      connection.userId = data.id;
      ScriptLogging.socketMessage("CONNECT         ", connection.userId);
      connection.send(JSON.stringify({ data: `connected::${connection.userId}` }));
      return;
    }

    if (type === "UPDATE") {
      try {
        const decryptedData = decrypt(data, iv);
        const user = JSON.parse(decryptedData);
        broadcastByUserId(JSON.stringify({ type: "UPDATE", data: user }), user.id);
      } catch (e) {
        console.log(e);
      }
      return;
    }
  });

  connection.on("close", function close() {
    ScriptLogging.socketError("CLOSE           ", connection.userId);
    clearInterval(keepAliveInterval);
  });

  connection.send(JSON.stringify({ data: `connecting::` }));
});

const broadcastByUserId = (message, userId) => {
  socket.clients.forEach((c) => {
    if (c.userId === userId) {
      ScriptLogging.socketMessage("UPDATING USER   ", userId);
      return c.send(message);
    }
  });
};

const keepAliveInterval = setInterval(() => {
  socket.clients.forEach((c) => {
    if (c.isAlive === false) {
      // NOTE(jim): No longer connected.
      ScriptLogging.socketError("DEAD            ", c.userId);
      c.send(JSON.stringify({ data: `dead::${c.userId}` }));
      return c.terminate();
    }

    // NOTE(jim): Still alive
    ScriptLogging.socketMessage("OKAY            ", c.userId);
    c.send(JSON.stringify({ data: `still-alive::${c.userId}` }));
    c.isAlive = false;
    c.ping(() => {});
  });
}, SOCKET_KEEP_ALIVE);

server.listen(Environment.PORT, (e) => {
  if (e) throw e;

  ScriptLogging.socketMessage("SERVER START    ", `http://localhost:${Environment.PORT}`);
});
