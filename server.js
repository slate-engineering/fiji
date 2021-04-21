import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as WebSocket from "ws";
import * as http from "http";

import APIRouteIndex from "~/pages";

import crypto from "crypto";
import express from "express";
import cors from "cors";
import compression from "compression";

const ENCRYPTION_ALGORITHM = "aes-256-ctr";
const SERVER_START = "SERVER START    ";
const KEEP_ALIVE = "KEEP ALIVE      ";
const ERROR = "ERROR           ";
const CONNECT = "CONNECT         ";
const CLOSE = "CLOSE           ";
const UPDATING_USER = "UPDATING USER   ";
const DEAD = "DEAD            ";

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
app.get("/favicon.ico", (req, res) => res.status(204));
app.get("/", APIRouteIndex);

const server = http.createServer(app);
const socket = new WebSocket.Server({ server, clientTracking: true });

const SOCKET_KEEP_ALIVE = 30000;

// NOTE(daniel): I am maintaining all active users in this object
const users = new Set();

socket.on("connection", (connection, req) => {
  connection.isAlive = true;
  connection.userId = null;

  connection.on("pong", () => {
    ScriptLogging.message(KEEP_ALIVE, connection.userId);
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
      ScriptLogging.error(ERROR, e.message);
    }

    if (type === "UPDATE") {
      try {
        const decryptedData = decrypt(data, iv);
        const user = JSON.parse(decryptedData);
        broadcastByUserId(JSON.stringify({ type: "UPDATE", data: user }), user.id);
      } catch (e) {
        ScriptLogging.error(ERROR, e.message);
      }
      return;
    }

    if (type === "SHOVEL_SUBSCRIBE_HOST") {
      connection.userId = "SHOVEL";
      ScriptLogging.message(CONNECT, connection.userId);
      connection.send(JSON.stringify({ data: `connected::${connection.userId}` }));
      return;
    }

    if (type === "LENS_SUBSCRIBE_HOST") {
      connection.userId = "LENS";
      ScriptLogging.message(CONNECT, connection.userId);
      connection.send(JSON.stringify({ data: `connected::${connection.userId}` }));
      return;
    }

    if (type === "SUBSCRIBE_HOST") {
      connection.userId = "SLATE";
      ScriptLogging.message(CONNECT, connection.userId);
      connection.send(JSON.stringify({ data: `connected::${connection.userId}` }));
      return;
    }

    if (type === "SUBSCRIBE_VIEWER") {
      connection.userId = data.id;
      ScriptLogging.message(CONNECT, connection.userId);
      users.add(connection.userId);
      connection.send(JSON.stringify({ type: "UPDATE_USERS_ONLINE", data: Array.from(users) }));

      return;
    }

    if (type === "UNSUBSCRIBE_VIEWER") {
      socket.clients.forEach((c) => {
        if (c.userId === data.id) {
          c.close(4000, "SIGN_OUT");
        }
      });
    }
  });

  connection.on("close", function close() {
    ScriptLogging.error(CLOSE, connection.userId);

    users.delete(connection.userId);
    connection.send(
      JSON.stringify({
        type: "UPDATE_USERS_ONLINE",
        data: Array.from(users),
      })
    );

    clearInterval(keepAliveInterval);
  });

  connection.send(JSON.stringify({ data: `connecting::` }));
});

const broadcastByUserId = (message, userId) => {
  socket.clients.forEach((c) => {
    if (c.userId === userId) {
      ScriptLogging.message(UPDATING_USER, userId);
      return c.send(message);
    }
  });
};

const keepAliveInterval = setInterval(() => {
  socket.clients.forEach((c) => {
    if (c.isAlive === false) {
      ScriptLogging.error(DEAD, c.userId);
      c.send(JSON.stringify({ data: `dead::${c.userId}` }));
      return c.terminate();
    }

    ScriptLogging.message(KEEP_ALIVE, c.userId);
    c.send(JSON.stringify({ data: `still-alive::${c.userId}` }));
    c.isAlive = false;
    c.ping(() => {});
  });
}, SOCKET_KEEP_ALIVE);

server.listen(Environment.PORT, (e) => {
  if (e) throw e;

  ScriptLogging.log(SERVER_START, `http://localhost:${Environment.PORT}`);
});
