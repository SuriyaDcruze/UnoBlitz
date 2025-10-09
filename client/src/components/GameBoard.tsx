import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/stores/useGameStore';
import { useAudio } from '@/lib/stores/useAudio';
import { socketService } from '@/lib/socket';
import { GameLobby } from './GameLobby';
import { PlayerHand } from './PlayerHand';
import { GameUI } from './GameUI';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export const GameBoard: React.FC = () => {
  const {
    gameState,
    currentRoomId,
    playerName,
    isConnected,
    error,
    setGameState,
    setCurrentRoomId,
    setConnected,
    setError,
    createRoom,
    joinRoom,
    startGame,
    playCard,
    drawCard,
    callUno
  } = useGameStore();

  const {
    setHitSound,
    setSuccessSound,
    playHit,
    playSuccess,
    toggleMute,
    isMuted
  } = useAudio();

  // Initialize audio
  useEffect(() => {
    const hitAudio = new Audio('/sounds/hit.mp3');
    const successAudio = new Audio('/sounds/success.mp3');
    
    setHitSound(hitAudio);
    setSuccessSound(successAudio);
  }, [setHitSound, setSuccessSound]);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('room_created', ({ roomId, gameState: newGameState }) => {
      console.log('Room created:', roomId);
      setCurrentRoomId(roomId);
      setGameState(newGameState);
      setError(null);
      playSuccess();
      toast.success('Room created successfully!');
    });

    socket.on('room_joined', ({ roomId, gameState: newGameState }) => {
      console.log('Room joined:', roomId);
      setCurrentRoomId(roomId);
      setGameState(newGameState);
      setError(null);
      playHit();
      toast.success('Joined room successfully!');
    });

    socket.on('game_started', ({ gameState: newGameState }) => {
      console.log('Game started');
      setGameState(newGameState);
      playSuccess();
      toast.success('Game started!');
    });

    socket.on('game_updated', ({ gameState: newGameState }) => {
      console.log('Game updated');
      const previousState = gameState;
      setGameState(newGameState);
      
      // Play sound if a card was played (discard pile changed)
      if (previousState && newGameState.discardPile.length > previousState.discardPile.length) {
        playHit();
      }
    });

    socket.on('game_ended', ({ winner, gameState: newGameState }) => {
      console.log('Game ended, winner:', winner);
      setGameState(newGameState);
      const winnerName = newGameState.players.find((p: any) => p.id === winner)?.name || 'Unknown';
      playSuccess();
      toast.success(`Game Over! ${winnerName} wins!`);
    });

    socket.on('uno_called', ({ playerId }) => {
      const player = gameState?.players.find((p: any) => p.id === playerId);
      if (player) {
        playSuccess();
        toast.info(`${player.name} called UNO!`);
      }
    });

    socket.on('cards_drawn', ({ cards }) => {
      playHit();
      toast.info(`Drew ${cards.length} card${cards.length > 1 ? 's' : ''}`);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
      toast.error(message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('game_started');
      socket.off('game_updated');
      socket.off('game_ended');
      socket.off('uno_called');
      socket.off('cards_drawn');
      socket.off('error');
    };
  }, [setGameState, setCurrentRoomId, setConnected, setError, gameState, playHit, playSuccess]);

  const currentPlayerId = socketService.getSocket()?.id || null;
  const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId);
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  // Connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Show lobby if not in game
  if (!gameState || !gameState.gameStarted) {
    return (
      <GameLobby
        gameState={gameState}
        currentPlayerId={currentPlayerId}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onStartGame={startGame}
      />
    );
  }

  // Game ended
  if (gameState.gameEnded) {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    const isWinner = gameState.winner === currentPlayerId;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg p-8 shadow-2xl">
          <h1 className="text-4xl font-bold mb-4">
            {isWinner ? '🎉 You Won! 🎉' : 'Game Over'}
          </h1>
          <p className="text-xl mb-6">
            {winner?.name || 'Unknown'} is the winner!
          </p>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  // Main game view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-700 relative">
      {/* Game UI */}
      <GameUI gameState={gameState} currentPlayerId={currentPlayerId!} />

      {/* Player's hand */}
      <div className="absolute bottom-4 left-4 right-4">
        {currentPlayer && (
          <PlayerHand
            cards={currentPlayer.hand}
            currentColor={gameState.currentColor}
            isMyTurn={isMyTurn}
            onPlayCard={playCard}
            onDrawCard={drawCard}
            onCallUno={callUno}
            canCallUno={currentPlayer.hand.length === 1 && isMyTurn}
            hasCalledUno={currentPlayer.hasCalledUno}
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};
