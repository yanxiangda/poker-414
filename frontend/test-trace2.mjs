import { analyzeHand } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

const deck = createTripleDeck();

// 测试 3 张炸管顺子
console.log('=== 3 张炸管顺子 ===');
const straight = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
const bomb3 = createCards('3', 3);
const prev = analyzeHand(straight);
const next = analyzeHand(bomb3);
console.log('prev (顺子):', prev);
console.log('next (3 个 3):', next);
console.log('prev.count:', prev.count, 'next.count:', next.count);
console.log('张数不同:', prev.count !== next.count);
console.log('next.type === BOMB:', next.type === 'bomb');
console.log('prev.type === STRAIGHT:', prev.type === 'straight');
console.log('next.count >= 3:', next.count >= 3);

// 测试王组合管一对
console.log('\n=== 王组合管一对 ===');
const kingCombo = [...createCards('BJ', 1), ...createCards('SJ', 1)];
const pair = createCards('3', 2);
const prev2 = analyzeHand(pair);
const next2 = analyzeHand(kingCombo);
console.log('prev (一对):', prev2);
console.log('next (王组合):', next2);
console.log('prev.count:', prev2.count, 'next.count:', next2.count);
console.log('张数不同:', prev2.count !== next2.count);
console.log('next.type === KING_COMBO:', next2.type === 'king_combo');
console.log('next.count >= 2:', next2.count >= 2);
console.log('prev.type === PAIR:', prev2.type === 'pair');
