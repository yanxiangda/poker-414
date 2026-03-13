import { analyzeHand, canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

const single = createCards('A', 1);
const pair = createCards('A', 2);
const bomb3 = createCards('3', 3);
const bomb4 = createCards('4', 4);

const deck = createTripleDeck();
const straight = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
const ds = deck.filter(c => ['5','6','7'].includes(c.value));
const ds_filtered = [];
const count = {5:0, 6:0, 7:0};
for (const card of ds) {
  if (count[card.value] < 2) {
    ds_filtered.push(card);
    count[card.value]++;
  }
}

console.log('straight:', analyzeHand(straight));
console.log('bomb3:', analyzeHand(bomb3));
console.log('canPlay(straight, bomb3):', canPlay(straight, bomb3));
