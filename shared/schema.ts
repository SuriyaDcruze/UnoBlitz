import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull().unique(),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  totalCardsPlayed: integer("total_cards_played").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const matchHistory = pgTable("match_history", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  players: json("players").$type<Array<{ id: string; name: string; finalCardCount: number }>>().notNull(),
  winnerId: text("winner_id").notNull(),
  winnerName: text("winner_name").notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats);
export const insertMatchHistorySchema = createInsertSchema(matchHistory);

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertMatchHistory = z.infer<typeof insertMatchHistorySchema>;
export type MatchHistory = typeof matchHistory.$inferSelect;
