import { db } from "./db";
import { playerStats, matchHistory, type InsertMatchHistory } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface MatchResult {
  roomId: string;
  players: Array<{
    id: string;
    name: string;
    finalCardCount: number;
  }>;
  winnerId: string;
  winnerName: string;
  duration: number;
}

export async function saveMatchResult(result: MatchResult) {
  try {
    // Save match to history
    await db.insert(matchHistory).values({
      roomId: result.roomId,
      players: result.players,
      winnerId: result.winnerId,
      winnerName: result.winnerName,
      duration: result.duration,
    });

    // Update player stats for all players
    for (const player of result.players) {
      const existingStats = await db.select()
        .from(playerStats)
        .where(eq(playerStats.playerName, player.name))
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        await db.update(playerStats)
          .set({
            gamesPlayed: sql`${playerStats.gamesPlayed} + 1`,
            gamesWon: player.id === result.winnerId 
              ? sql`${playerStats.gamesWon} + 1` 
              : playerStats.gamesWon,
            updatedAt: new Date(),
          })
          .where(eq(playerStats.playerName, player.name));
      } else {
        // Create new stats
        await db.insert(playerStats).values({
          playerName: player.name,
          gamesPlayed: 1,
          gamesWon: player.id === result.winnerId ? 1 : 0,
          totalCardsPlayed: 0,
        });
      }
    }

    console.log(`Match result saved for room ${result.roomId}`);
  } catch (error) {
    console.error('Error saving match result:', error);
  }
}

export async function updateCardsPlayed(playerName: string, cardsCount: number) {
  try {
    const existingStats = await db.select()
      .from(playerStats)
      .where(eq(playerStats.playerName, playerName))
      .limit(1);

    if (existingStats.length > 0) {
      await db.update(playerStats)
        .set({
          totalCardsPlayed: sql`${playerStats.totalCardsPlayed} + ${cardsCount}`,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.playerName, playerName));
    }
  } catch (error) {
    console.error('Error updating cards played:', error);
  }
}
