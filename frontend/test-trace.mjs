import { analyzeHand } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

// 双龙 556677 vs 顺子 567
const deck = createTripleDeck();
const straight567 = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
const ds556677 = deck.filter(c => ['5','6','7'].includes(c.value));
const ds_filtered = [];
const count = {5:0, 6:0, 7:0};
for (const card of ds556677) {
  if (count[card.value] < 2) {
    ds_filtered.push(card);
    count[card.value]++;
  }
}

const prev = analyzeHand(straight567);
const next = analyzeHand(ds_filtered);

console.log('prev (顺子 567):', prev);
console.log('next (双龙 556677):', next);
console.log('prev.count:', prev.count, 'next.count:', next.count);
console.log('prev.count === next.count / 2:', prev.count === next.count / 2);
console.log('next.value > prev.value:', next.value > prev.value);
console.log('应该返回:', next.value > prev.value);
