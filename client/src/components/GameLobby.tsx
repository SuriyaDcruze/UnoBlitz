import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { GameState } from '@/types/game';

interface GameLobbyProps {
  gameState: GameState | null;
  currentPlayerId: string | null;
  onCreateRoom: (playerName: string, roomId: string) => void;
  onJoinRoom: (playerName: string, roomId: string) => void;
  onStartGame: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  gameState,
  currentPlayerId,
  onCreateRoom,
  onJoinRoom,
  onStartGame
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreateRoom = () => {
    if (playerName.trim() && roomId.trim()) {
      onCreateRoom(playerName.trim(), roomId.trim());
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(playerName.trim(), roomId.trim());
    }
  };

  const generateRandomRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(result);
  };

  // If in a game room, show lobby
  if (gameState && !gameState.gameStarted) {
    const isHost = gameState.players[0]?.id === currentPlayerId;
    const canStart = gameState.players.length >= 2 && isHost;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Game Lobby</CardTitle>
            <p className="text-gray-600">Room ID: <span className="font-mono font-bold">{gameState.id}</span></p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Players ({gameState.players.length}/4)</h3>
              {gameState.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className={player.id === currentPlayerId ? 'font-bold' : ''}>
                    {player.name} {player.id === currentPlayerId ? '(You)' : ''}
                  </span>
                  {index === 0 && <Badge variant="outline">Host</Badge>}
                </div>
              ))}
            </div>

            {canStart && (
              <Button 
                onClick={onStartGame}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Start Game
              </Button>
            )}

            {!isHost && (
              <p className="text-center text-gray-600">
                Waiting for host to start the game...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main menu
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-center mb-2">UNO</CardTitle>
            <p className="text-gray-600">Multiplayer Card Game</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode('create')}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Create Room
            </Button>
            <Button
              onClick={() => setMode('join')}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create or join room form
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <Input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Room ID</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID"
                maxLength={10}
              />
              {mode === 'create' && (
                <Button
                  type="button"
                  onClick={generateRandomRoomId}
                  variant="outline"
                >
                  Random
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setMode('menu')}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!playerName.trim() || !roomId.trim()}
            >
              {mode === 'create' ? 'Create' : 'Join'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
