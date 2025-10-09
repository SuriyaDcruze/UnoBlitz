import React from 'react';
import { motion } from 'framer-motion';
import { UnoCard, CardColor, CardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface CardProps {
  card: UnoCard;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const colorClasses = {
  [CardColor.RED]: 'bg-red-500 border-red-600',
  [CardColor.YELLOW]: 'bg-yellow-400 border-yellow-500',
  [CardColor.GREEN]: 'bg-green-500 border-green-600',
  [CardColor.BLUE]: 'bg-blue-500 border-blue-600',
  [CardColor.WILD]: 'bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500 border-gray-700'
};

const sizeClasses = {
  small: 'w-12 h-16 text-xs',
  medium: 'w-16 h-24 text-sm',
  large: 'w-20 h-32 text-base'
};

export const Card: React.FC<CardProps> = ({ 
  card, 
  isPlayable = false, 
  isSelected = false, 
  onClick, 
  size = 'medium' 
}) => {
  const getCardContent = () => {
    switch (card.type) {
      case CardType.NUMBER:
        return card.value?.toString();
      case CardType.SKIP:
        return '⊘';
      case CardType.REVERSE:
        return '↺';
      case CardType.DRAW_TWO:
        return '+2';
      case CardType.WILD:
        return 'W';
      case CardType.WILD_DRAW_FOUR:
        return '+4';
      default:
        return '?';
    }
  };

  const getCardSymbol = () => {
    if (card.type === CardType.WILD || card.type === CardType.WILD_DRAW_FOUR) {
      return (
        <div className="flex flex-wrap justify-center items-center gap-0.5">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { scale: 1.05, y: -5 } : {}}
      whileTap={isPlayable ? { scale: 0.98 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.5
      }}
      className={cn(
        'relative rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center font-bold text-white shadow-lg',
        colorClasses[card.color] || 'bg-gray-500 border-gray-600',
        sizeClasses[size],
        isPlayable && 'hover:shadow-xl ring-2 ring-white ring-opacity-50',
        isSelected && 'ring-4 ring-blue-300',
        !isPlayable && onClick && 'opacity-60 cursor-not-allowed'
      )}
      onClick={onClick}
    >
      {/* Card content */}
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center mb-1">
          {getCardContent()}
        </div>
        {getCardSymbol()}
      </div>

      {/* Card corner indicators */}
      <div className="absolute top-1 left-1 text-xs opacity-70">
        {card.type === CardType.NUMBER ? card.value : getCardContent()}
      </div>
      <div className="absolute bottom-1 right-1 text-xs opacity-70 rotate-180">
        {card.type === CardType.NUMBER ? card.value : getCardContent()}
      </div>
    </motion.div>
  );
};
