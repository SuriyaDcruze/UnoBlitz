import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupSocketHandlers } from "./socketHandler";
import { db } from "./db";
import { playerStats, matchHistory } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get player stats
  app.get("/api/stats/:playerName", async (req, res) => {
    try {
      const { playerName } = req.params;
      const stats = await db.select()
        .from(playerStats)
        .where(eq(playerStats.playerName, playerName))
        .limit(1);
      
      if (stats.length === 0) {
        return res.json({
          playerName,
          gamesPlayed: 0,
          gamesWon: 0,
          totalCardsPlayed: 0,
          winRate: 0
        });
      }

      const playerData = stats[0];
      res.json({
        ...playerData,
        winRate: playerData.gamesPlayed > 0 
          ? (playerData.gamesWon / playerData.gamesPlayed * 100).toFixed(1) 
          : 0
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ error: "Failed to fetch player stats" });
    }
  });

  // Get match history (last 10 games)
  app.get("/api/match-history", async (req, res) => {
    try {
      const history = await db.select()
        .from(matchHistory)
        .orderBy(desc(matchHistory.createdAt))
        .limit(10);
      
      res.json(history);
    } catch (error) {
      console.error('Error fetching match history:', error);
      res.status(500).json({ error: "Failed to fetch match history" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await db.select()
        .from(playerStats)
        .orderBy(desc(playerStats.gamesWon))
        .limit(10);
      
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
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
