import React from 'react';
import { GameState, CardColor, UnoCard } from '@/types/game';
import { Card } from './Card';
import { Badge } from './ui/badge';

interface GameUIProps {
  gameState: GameState;
  currentPlayerId: string;
}

export const GameUI: React.FC<GameUIProps> = ({ gameState, currentPlayerId }) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const getColorIndicator = (color: CardColor) => {
    const colorClasses = {
      [CardColor.RED]: 'bg-red-500',
      [CardColor.YELLOW]: 'bg-yellow-400',
      [CardColor.GREEN]: 'bg-green-500',
      [CardColor.BLUE]: 'bg-blue-500',
      [CardColor.WILD]: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 to-blue-500'
    };
    
    return (
      <div className={`w-8 h-8 rounded-full ${colorClasses[color]} border-2 border-white shadow-lg`} />
    );
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
      {/* Game info */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg pointer-events-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Current Color:</span>
            {getColorIndicator(gameState.currentColor)}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold">Cards in Deck:</span>
            <Badge variant="secondary">{gameState.drawPile.length}</Badge>
          </div>
          
          {gameState.mustDrawCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-600">Must Draw:</span>
              <Badge variant="destructive">{gameState.mustDrawCount}</Badge>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="font-semibold">Turn:</span>
            <Badge variant="default">
              {currentPlayer?.name} {currentPlayer?.id === currentPlayerId ? '(You)' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Top card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="text-center mb-2">
          <span className="font-semibold">Top Card</span>
        </div>
        {topCard && <Card card={topCard} size="medium" />}
      </div>

      {/* Other players info */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg pointer-events-auto max-w-xs">
        <div className="space-y-2">
          <h3 className="font-semibold text-center">Players</h3>
          {gameState.players.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between">
              <span className={`text-sm ${player.id === currentPlayerId ? 'font-bold' : ''}`}>
                {player.name} {player.id === currentPlayerId ? '(You)' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={index === gameState.currentPlayerIndex ? 'default' : 'secondary'}>
                  {player.handCount || player.hand?.length || 0}
                </Badge>
                {player.hasCalledUno && (
                  <Badge variant="destructive" className="text-xs">UNO!</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
