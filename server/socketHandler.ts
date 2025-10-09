import { Server as SocketIOServer, Socket } from "socket.io";
import { UnoGame, CardColor } from "./gameLogic";

interface GameRoom {
  game: UnoGame;
  players: Set<string>;
  spectators: Set<string>;
}

const gameRooms = new Map<string, GameRoom>();

export function setupSocketHandlers(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("create_room", ({ playerName, roomId }) => {
      try {
        if (gameRooms.has(roomId)) {
          socket.emit("error", { message: "Room already exists" });
          return;
        }

        const game = new UnoGame(roomId);
        const room: GameRoom = {
          game,
          players: new Set([socket.id]),
          spectators: new Set()
        };

        if (!game.addPlayer(socket.id, playerName)) {
          socket.emit("error", { message: "Failed to add player" });
          return;
        }

        gameRooms.set(roomId, room);
        socket.join(roomId);

        socket.emit("room_created", { roomId, gameState: game.getPlayerGameState(socket.id) });
        io.to(roomId).emit("game_updated", { 
          gameState: game.getPlayerGameState(socket.id),
          players: Array.from(room.players)
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to create room" });
      }
    });

    socket.on("join_room", ({ playerName, roomId }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.players.size >= 4) {
          socket.emit("error", { message: "Room is full" });
          return;
        }

        if (!room.game.addPlayer(socket.id, playerName)) {
          socket.emit("error", { message: "Failed to join game" });
          return;
        }

        room.players.add(socket.id);
        socket.join(roomId);

        socket.emit("room_joined", { roomId, gameState: room.game.getPlayerGameState(socket.id) });
        io.to(roomId).emit("game_updated", { 
          gameState: room.game.getGameState(),
          players: Array.from(room.players)
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("start_game", ({ roomId }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (!room.game.startGame()) {
          socket.emit("error", { message: "Cannot start game" });
          return;
        }

        // Send personalized game state to each player
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.emit("game_started", { 
              gameState: room.game.getPlayerGameState(playerId) 
            });
          }
        });

        io.to(roomId).emit("game_updated", { 
          gameState: room.game.getGameState() 
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    socket.on("play_card", ({ roomId, cardId, chosenColor }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const result = room.game.playCard(socket.id, cardId, chosenColor);
        if (!result.success) {
          socket.emit("error", { message: result.message || "Cannot play card" });
          return;
        }

        // Send personalized updates to all players
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.emit("game_updated", { 
              gameState: room.game.getPlayerGameState(playerId) 
            });
          }
        });

        if (result.message === "Game won!") {
          io.to(roomId).emit("game_ended", { 
            winner: socket.id,
            gameState: room.game.getGameState() 
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to play card" });
      }
    });

    socket.on("draw_card", ({ roomId }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const result = room.game.drawCard(socket.id);
        if (!result.success) {
          socket.emit("error", { message: "Cannot draw card" });
          return;
        }

        // Send personalized updates to all players
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.emit("game_updated", { 
              gameState: room.game.getPlayerGameState(playerId) 
            });
          }
        });

        socket.emit("cards_drawn", { cards: result.cards });
      } catch (error) {
        socket.emit("error", { message: "Failed to draw card" });
      }
    });

    socket.on("call_uno", ({ roomId }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (!room.game.callUno(socket.id)) {
          socket.emit("error", { message: "Cannot call UNO" });
          return;
        }

        io.to(roomId).emit("uno_called", { playerId: socket.id });
        
        // Update game state
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.emit("game_updated", { 
              gameState: room.game.getPlayerGameState(playerId) 
            });
          }
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to call UNO" });
      }
    });

    socket.on("send_chat_message", ({ roomId, message }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const gameState = room.game.getGameState();
        const player = gameState.players.find(p => p.id === socket.id);
        const isSpectator = room.spectators.has(socket.id);
        
        if (!player && !isSpectator) {
          socket.emit("error", { message: "Not in room" });
          return;
        }

        // Broadcast chat message to all players and spectators in the room
        io.to(roomId).emit("chat_message", {
          playerId: socket.id,
          playerName: player?.name || "Spectator",
          message: message.trim(),
          timestamp: Date.now()
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send chat message" });
      }
    });

    socket.on("join_as_spectator", ({ roomId }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        room.spectators.add(socket.id);
        socket.join(roomId);

        // Send current game state to spectator (without revealing hands)
        const spectatorGameState = {
          ...room.game.getGameState(),
          players: room.game.getGameState().players.map(p => ({
            ...p,
            hand: [] // Hide cards from spectators
          }))
        };

        socket.emit("spectator_joined", { 
          roomId, 
          gameState: spectatorGameState 
        });

        // Notify others that a spectator joined
        io.to(roomId).emit("spectator_update", { 
          spectatorCount: room.spectators.size 
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to join as spectator" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Remove player/spectator from all rooms
      gameRooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          room.game.removePlayer(socket.id);
          
          if (room.players.size === 0) {
            gameRooms.delete(roomId);
          } else {
            // Update remaining players
            room.players.forEach(playerId => {
              const playerSocket = io.sockets.sockets.get(playerId);
              if (playerSocket) {
                playerSocket.emit("game_updated", { 
                  gameState: room.game.getPlayerGameState(playerId) 
                });
              }
            });
          }
        }

        if (room.spectators.has(socket.id)) {
          room.spectators.delete(socket.id);
          io.to(roomId).emit("spectator_update", { 
            spectatorCount: room.spectators.size 
          });
        }
      });
    });
  });
}
