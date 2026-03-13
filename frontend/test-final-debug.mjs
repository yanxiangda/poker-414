import { analyzeHand, canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

console.log('=== 测试 1: 4 个 2 vs 4 个 6 ===');
const bomb2 = createCards('2', 4);
const bomb6 = createCards('6', 4);
console.log('canPlay(4 个 6, 4 个 2):', canPlay(bomb6, bomb2));
console.log('期望：true (4 个 2 可以管 4 个 6)');

console.log('\n=== 测试 2: 3 张炸管顺子 ===');
const deck = createTripleDeck();
const straight = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
const bomb3 = createCards('3', 3);
console.log('canPlay(顺子，3 个 3):', canPlay(straight, bomb3));
console.log('期望：true (3 张炸可以管顺子)');

console.log('\n=== 测试 3: 王组合管一对 ===');
const kingCombo = [...createCards('BJ', 1), ...createCards('SJ', 1)];
const pair = createCards('3', 2);
console.log('canPlay(一对，王组合):', canPlay(pair, kingCombo));
console.log('期望：true (王组合≥2 张可以管一对)');
