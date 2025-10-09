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
  value?: number; // For number cards (0-9)
}

export interface Player {
  id: string;
  name: string;
  hand: UnoCard[];
  hasCalledUno: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 for clockwise, -1 for counterclockwise
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  currentColor: CardColor;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
  mustDrawCount: number; // For stacking draw cards
  createdAt: number;
}

export class UnoGame {
  private state: GameState;

  constructor(gameId: string) {
    this.state = {
      id: gameId,
      players: [],
      currentPlayerIndex: 0,
      direction: 1,
      drawPile: [],
      discardPile: [],
      currentColor: CardColor.RED,
      gameStarted: false,
      gameEnded: false,
      mustDrawCount: 0,
      createdAt: Date.now()
    };
  }

  // Create a full Uno deck
  private createDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    const colors = [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE];
    
    // Number cards (0-9)
    colors.forEach(color => {
      // One 0 card per color
      deck.push({
        id: `${color}-0-${Math.random()}`,
        color,
        type: CardType.NUMBER,
        value: 0
      });
      
      // Two of each 1-9 card per color
      for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 2; j++) {
          deck.push({
            id: `${color}-${i}-${j}-${Math.random()}`,
            color,
            type: CardType.NUMBER,
            value: i
          });
        }
      }
      
      // Two action cards per color
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: `${color}-skip-${i}-${Math.random()}`,
          color,
          type: CardType.SKIP
        });
        deck.push({
          id: `${color}-reverse-${i}-${Math.random()}`,
          color,
          type: CardType.REVERSE
        });
        deck.push({
          id: `${color}-draw_two-${i}-${Math.random()}`,
          color,
          type: CardType.DRAW_TWO
        });
      }
    });
    
    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `wild-${i}-${Math.random()}`,
        color: CardColor.WILD,
        type: CardType.WILD
      });
      deck.push({
        id: `wild_draw_four-${i}-${Math.random()}`,
        color: CardColor.WILD,
        type: CardType.WILD_DRAW_FOUR
      });
    }
    
    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: UnoCard[]): UnoCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  addPlayer(playerId: string, playerName: string): boolean {
    if (this.state.players.length >= 4 || this.state.gameStarted) {
      return false;
    }
    
    this.state.players.push({
      id: playerId,
      name: playerName,
      hand: [],
      hasCalledUno: false
    });
    
    return true;
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    if (this.state.players.length < 2 && this.state.gameStarted) {
      this.state.gameEnded = true;
    }
  }

  startGame(): boolean {
    if (this.state.players.length < 2 || this.state.gameStarted) {
      return false;
    }

    // Create and shuffle deck
    this.state.drawPile = this.createDeck();
    
    // Deal 7 cards to each player
    this.state.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        const card = this.state.drawPile.pop();
        if (card) {
          player.hand.push(card);
        }
      }
    });

    // Place first card on discard pile
    let firstCard = this.state.drawPile.pop();
    while (firstCard && (firstCard.type === CardType.WILD || firstCard.type === CardType.WILD_DRAW_FOUR)) {
      this.state.drawPile.unshift(firstCard);
      this.state.drawPile = this.shuffleDeck(this.state.drawPile);
      firstCard = this.state.drawPile.pop();
    }

    if (firstCard) {
      this.state.discardPile.push(firstCard);
      this.state.currentColor = firstCard.color;
    }

    this.state.gameStarted = true;
    this.state.currentPlayerIndex = 0;

    return true;
  }

  canPlayCard(playerId: string, cardId: string): boolean {
    if (!this.state.gameStarted || this.state.gameEnded) return false;
    
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return false;

    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card) return false;

    const topCard = this.state.discardPile[this.state.discardPile.length - 1];
    
    // Wild cards can always be played
    if (card.type === CardType.WILD || card.type === CardType.WILD_DRAW_FOUR) {
      return true;
    }
    
    // Must match color or number/type
    return card.color === this.state.currentColor || 
           (topCard.type === CardType.NUMBER && card.type === CardType.NUMBER && card.value === topCard.value) ||
           (topCard.type !== CardType.NUMBER && card.type === topCard.type);
  }

  playCard(playerId: string, cardId: string, chosenColor?: CardColor): { success: boolean; message?: string } {
    if (!this.canPlayCard(playerId, cardId)) {
      return { success: false, message: "Cannot play this card" };
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    const card = currentPlayer.hand[cardIndex];

    // Remove card from player's hand
    currentPlayer.hand.splice(cardIndex, 1);
    
    // Add to discard pile
    this.state.discardPile.push(card);

    // Handle card effects
    this.handleCardEffect(card, chosenColor);

    // Check for win condition
    if (currentPlayer.hand.length === 0) {
      this.state.gameEnded = true;
      this.state.winner = playerId;
      return { success: true, message: "Game won!" };
    }

    // Reset UNO call status if player has more than 1 card
    if (currentPlayer.hand.length > 1) {
      currentPlayer.hasCalledUno = false;
    }

    return { success: true };
  }

  private handleCardEffect(card: UnoCard, chosenColor?: CardColor): void {
    switch (card.type) {
      case CardType.SKIP:
        this.nextPlayer();
        break;
      case CardType.REVERSE:
        if (this.state.players.length === 2) {
          // In 2-player game, reverse acts like skip
          this.nextPlayer();
        } else {
          this.state.direction *= -1;
        }
        break;
      case CardType.DRAW_TWO:
        this.state.mustDrawCount += 2;
        this.nextPlayer();
        break;
      case CardType.WILD:
        if (chosenColor && chosenColor !== CardColor.WILD) {
          this.state.currentColor = chosenColor;
        }
        break;
      case CardType.WILD_DRAW_FOUR:
        this.state.mustDrawCount += 4;
        if (chosenColor && chosenColor !== CardColor.WILD) {
          this.state.currentColor = chosenColor;
        }
        this.nextPlayer();
        break;
      default:
        // Number cards
        this.state.currentColor = card.color;
        break;
    }
    
    if (card.type !== CardType.SKIP && card.type !== CardType.REVERSE && 
        card.type !== CardType.DRAW_TWO && card.type !== CardType.WILD_DRAW_FOUR) {
      this.nextPlayer();
    }
  }

  private nextPlayer(): void {
    const playerCount = this.state.players.length;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + this.state.direction + playerCount) % playerCount;
  }

  drawCard(playerId: string): { success: boolean; cards?: UnoCard[] } {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { success: false };
    }

    const cardsToDraw = Math.max(1, this.state.mustDrawCount);
    const drawnCards: UnoCard[] = [];

    for (let i = 0; i < cardsToDraw; i++) {
      if (this.state.drawPile.length === 0) {
        this.reshuffleDiscardPile();
      }
      
      const card = this.state.drawPile.pop();
      if (card) {
        currentPlayer.hand.push(card);
        drawnCards.push(card);
      }
    }

    this.state.mustDrawCount = 0;
    this.nextPlayer();

    return { success: true, cards: drawnCards };
  }

  private reshuffleDiscardPile(): void {
    if (this.state.discardPile.length <= 1) return;
    
    const topCard = this.state.discardPile.pop()!;
    this.state.drawPile = this.shuffleDeck(this.state.discardPile);
    this.state.discardPile = [topCard];
  }

  callUno(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.hand.length !== 1) return false;
    
    player.hasCalledUno = true;
    return true;
  }

  getGameState(): GameState {
    return { ...this.state };
  }

  getPlayerGameState(playerId: string): any {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;

    return {
      ...this.state,
      players: this.state.players.map((player, index) => ({
        id: player.id,
        name: player.name,
        handCount: player.hand.length,
        hand: index === playerIndex ? player.hand : [], // Only show own cards
        hasCalledUno: player.hasCalledUno
      }))
    };
  }
}
