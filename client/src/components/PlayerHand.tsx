import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnoCard, CardColor, CardType } from '@/types/game';
import { Card } from './Card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface PlayerHandProps {
  cards: UnoCard[];
  currentColor: CardColor;
  isMyTurn: boolean;
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  canCallUno: boolean;
  hasCalledUno: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  currentColor,
  isMyTurn,
  onPlayCard,
  onDrawCard,
  onCallUno,
  canCallUno,
  hasCalledUno
}) => {
  const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const canPlayCard = (card: UnoCard): boolean => {
    if (!isMyTurn) return false;
    
    // Wild cards can always be played
    if (card.type === CardType.WILD || card.type === CardType.WILD_DRAW_FOUR) {
      return true;
    }
    
    // Must match color or value
    return card.color === currentColor || 
           (cards.some(c => c.color === currentColor) === false); // Can play any card if no matching color
  };

  const handleCardClick = (card: UnoCard) => {
    if (!canPlayCard(card)) return;
    
    setSelectedCard(card);
    
    // If it's a wild card, show color picker
    if (card.type === CardType.WILD || card.type === CardType.WILD_DRAW_FOUR) {
      setShowColorPicker(true);
    } else {
      onPlayCard(card.id);
      setSelectedCard(null);
    }
  };

  const handleColorChoice = (color: CardColor) => {
    if (selectedCard) {
      onPlayCard(selectedCard.id, color);
      setSelectedCard(null);
      setShowColorPicker(false);
    }
  };

  const playableCards = cards.filter(canPlayCard);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* UNO Button */}
      {canCallUno && !hasCalledUno && (
        <Button 
          onClick={onCallUno}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 text-lg animate-pulse"
        >
          UNO!
        </Button>
      )}

      {/* Turn indicator */}
      {isMyTurn && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
          Your Turn
        </div>
      )}

      {/* Player's hand */}
      <div className="flex flex-wrap gap-2 max-w-4xl justify-center">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -30, transition: { duration: 0.2 } }}
              transition={{ 
                delay: index * 0.03,
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
            >
              <Card
                card={card}
                isPlayable={canPlayCard(card)}
                isSelected={selectedCard?.id === card.id}
                onClick={() => handleCardClick(card)}
                size="medium"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {isMyTurn && playableCards.length === 0 && (
          <Button
            onClick={onDrawCard}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Draw Card
          </Button>
        )}
      </div>

      {/* Color picker dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a color</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE].map(color => (
              <Button
                key={color}
                onClick={() => handleColorChoice(color)}
                className={`h-16 text-white font-bold ${
                  color === CardColor.RED ? 'bg-red-500 hover:bg-red-600' :
                  color === CardColor.YELLOW ? 'bg-yellow-400 hover:bg-yellow-500' :
                  color === CardColor.GREEN ? 'bg-green-500 hover:bg-green-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {color.toUpperCase()}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
