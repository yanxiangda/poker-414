// 扑克牌数据结构

// 牌的点数定义
export const CARD_VALUES = [
  '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3',
  'SJ', 'BJ' // 小王、大王
];

// 牌的大小顺序（索引越大越大）
export const CARD_ORDER = {
  '4': 0, '5': 1, '6': 2, '7': 3, '8': 4, '9': 5, '10': 6,
  'J': 7, 'Q': 8, 'K': 9, 'A': 10, '2': 11, '3': 12,
  'SJ': 13, 'BJ': 14
};

// 花色
export const SUITS = ['♠', '♥', '♣', '♦'];

/**
 * 创建一副牌（54 张）
 */
export function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let value of CARD_VALUES.slice(0, -2)) {
      deck.push({ suit, value, id: `${suit}${value}` });
    }
  }
  // 大小王各 4 张（3 副牌）
  for (let i = 0; i < 4; i++) {
    deck.push({ suit: '', value: 'SJ', id: `SJ${i}` });
    deck.push({ suit: '', value: 'BJ', id: `BJ${i}` });
  }
  return deck;
}

/**
 * 创建 3 副牌（162 张）
 */
export function createTripleDeck() {
  const deck = [];
  for (let d = 0; d < 3; d++) {
    for (let suit of SUITS) {
      for (let value of CARD_VALUES.slice(0, -2)) {
        deck.push({ suit, value, id: `${suit}${value}-${d}` });
      }
    }
    // 每副牌大小王各 2 张
    deck.push({ suit: '', value: 'SJ', id: `SJ-${d}-0` });
    deck.push({ suit: '', value: 'SJ', id: `SJ-${d}-1` });
    deck.push({ suit: '', value: 'BJ', id: `BJ-${d}-0` });
    deck.push({ suit: '', value: 'BJ', id: `BJ-${d}-1` });
  }
  return deck;
}

/**
 * 洗牌
 */
export function shuffle(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 发牌（6 人，每人 27 张）
 */
export function dealCards(deck) {
  const hands = [[], [], [], [], [], []];
  let playerIndex = 0;
  
  for (let card of deck) {
    hands[playerIndex].push(card);
    playerIndex = (playerIndex + 1) % 6;
  }
  
  return hands;
}

/**
 * 获取牌的积分
 * 东北 414 规则：K=10 分，10=10 分，5=5 分
 */
export function getCardScore(card) {
  if (card.value === 'K') return 10;
  if (card.value === '10') return 10;
  if (card.value === '5') return 5;
  return 0;
}

/**
 * 计算手牌总积分
 */
export function calculateHandScore(cards) {
  return cards.reduce((sum, card) => sum + getCardScore(card), 0);
}
