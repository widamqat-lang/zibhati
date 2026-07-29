import { createServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { presenceManager } from "./websocket/manager";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server from Express app
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: "/ws/presence" });

// Track connected clients count
let connectedClients = 0;

wss.on("connection", (ws: WebSocket, req) => {
  connectedClients++;
  
  // Extract session ID and visitor ID from query string
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId") || `anon-${Date.now()}`;
  const visitorId = url.searchParams.get("visitorId") || "";

  logger.info({ sessionId, visitorId, totalClients: connectedClients }, "WebSocket client connected");

  // Register client with visitorId
  presenceManager.register(sessionId, visitorId, ws);

  // Send initial presence data
  const initialClients = presenceManager.getClients().map((c) => ({
    sessionId: c.sessionId,
    visitorId: c.visitorId,
    currentPage: c.currentPage,
    customerName: c.customerName,
    orderId: c.orderId,
    lastSeenAt: c.lastSeenAt.toISOString(),
    isOnline: true,
  }));

  ws.send(JSON.stringify({
    type: "connected",
    sessionId,
    visitorId,
    clients: initialClients,
  }));

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "presence_update":
          presenceManager.updatePresence(sessionId, {
            page: message.page,
            customerName: message.customerName,
            orderId: message.orderId ? Number(message.orderId) : null,
            visitorId: message.visitorId || visitorId,
          });
          
          // Broadcast to all clients
          presenceManager.broadcastPresenceUpdate();
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
      }
    } catch (error) {
      logger.error({ error }, "Error parsing WebSocket message");
    }
  });

  // Handle disconnect
  ws.on("close", () => {
    connectedClients--;
    logger.info({ sessionId, visitorId, totalClients: connectedClients }, "WebSocket client disconnected");
    
    presenceManager.unregister(sessionId);
    
    // Broadcast updated presence to remaining clients
    presenceManager.broadcastPresenceUpdate();
  });

  // Handle errors
  ws.on("error", (error) => {
    connectedClients--;
    logger.error({ error, sessionId, visitorId }, "WebSocket error");
    presenceManager.unregister(sessionId);
  });
});

server.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening on port");
});
