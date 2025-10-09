import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupSocketHandlers } from "./socketHandler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Game rooms endpoint
  app.get("/api/rooms", (req, res) => {
    // This will be handled by Socket.io in real implementation
    res.json({ message: "Use WebSocket connection for game rooms" });
  });

  const httpServer = createServer(app);

  // Setup Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Setup socket event handlers
  setupSocketHandlers(io);

  return httpServer;
}
