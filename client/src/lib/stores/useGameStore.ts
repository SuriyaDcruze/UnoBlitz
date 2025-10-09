import { create } from 'zustand';
import { GameState, UnoCard, CardColor } from '@/types/game';
import { socketService } from '@/lib/socket';

interface GameStore {
  gameState: GameState | null;
  currentRoomId: string | null;
  playerName: string | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  setGameState: (state: GameState) => void;
  setCurrentRoomId: (roomId: string | null) => void;
  setPlayerName: (name: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  createRoom: (playerName: string, roomId: string) => void;
  joinRoom: (playerName: string, roomId: string) => void;
  startGame: () => void;
  playCard: (cardId: string, chosenColor?: CardColor) => void;
  drawCard: () => void;
  callUno: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  currentRoomId: null,
  playerName: null,
  isConnected: false,
  error: null,

  setGameState: (state) => set({ gameState: state }),
  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
  setPlayerName: (name) => set({ playerName: name }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),

  createRoom: (playerName, roomId) => {
    const socket = socketService.getSocket();
    if (socket) {
      set({ playerName });
      socket.emit('create_room', { playerName, roomId });
    }
  },

  joinRoom: (playerName, roomId) => {
    const socket = socketService.getSocket();
    if (socket) {
      set({ playerName });
      socket.emit('join_room', { playerName, roomId });
    }
  },

  startGame: () => {
    const { currentRoomId } = get();
    const socket = socketService.getSocket();
    if (socket && currentRoomId) {
      socket.emit('start_game', { roomId: currentRoomId });
    }
  },

  playCard: (cardId, chosenColor) => {
    const { currentRoomId } = get();
    const socket = socketService.getSocket();
    if (socket && currentRoomId) {
      socket.emit('play_card', { roomId: currentRoomId, cardId, chosenColor });
    }
  },

  drawCard: () => {
    const { currentRoomId } = get();
    const socket = socketService.getSocket();
    if (socket && currentRoomId) {
      socket.emit('draw_card', { roomId: currentRoomId });
    }
  },

  callUno: () => {
    const { currentRoomId } = get();
    const socket = socketService.getSocket();
    if (socket && currentRoomId) {
      socket.emit('call_uno', { roomId: currentRoomId });
    }
  },
}));
