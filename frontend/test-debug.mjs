import { analyzeHand, canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

// 测试 4 个 2 vs 4 个 6
const bomb2 = createCards('2', 4);
const bomb6 = createCards('6', 4);
console.log('4 个 2:', analyzeHand(bomb2));
console.log('4 个 6:', analyzeHand(bomb6));
console.log('canPlay(4 个 6, 4 个 2):', canPlay(bomb6, bomb2)); // 4 个 2 管 4 个 6
console.log('canPlay(4 个 2, 4 个 6):', canPlay(bomb2, bomb6)); // 4 个 6 管 4 个 2

// 测试双龙管顺子
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
console.log('\n顺子 567:', analyzeHand(straight567));
console.log('双龙 556677:', analyzeHand(ds_filtered));
console.log('canPlay(顺子 567, 双龙 556677):', canPlay(straight567, ds_filtered));

// 测试 3 张炸管顺子
const bomb3 = createCards('3', 3);
console.log('\n3 个 3:', analyzeHand(bomb3));
console.log('canPlay(顺子 567, 3 个 3):', canPlay(straight567, bomb3));

// 测试王组合管一对
const kingCombo = [...createCards('BJ', 1), ...createCards('SJ', 1)];
const pair = createCards('3', 2);
console.log('\n王组合:', analyzeHand(kingCombo));
console.log('一对:', analyzeHand(pair));
console.log('canPlay(一对，王组合):', canPlay(pair, kingCombo));
