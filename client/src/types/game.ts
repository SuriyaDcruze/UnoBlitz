export enum CardColor {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
  BLUE = 'blue',
  WILD = 'wild'
}

export enum CardType {
  NUMBER = 'number',
  SKIP = 'skip',
  REVERSE = 'reverse',
  DRAW_TWO = 'draw_two',
  WILD = 'wild',
  WILD_DRAW_FOUR = 'wild_draw_four'
}

export interface UnoCard {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  hand: UnoCard[];
  handCount?: number;
  hasCalledUno: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  currentColor: CardColor;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
  mustDrawCount: number;
}
