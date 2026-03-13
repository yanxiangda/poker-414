import { analyzeHand, canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

const bomb2 = createCards('2', 4);
const bomb6 = createCards('6', 4);

const bomb2A = analyzeHand(bomb2);
const bomb6A = analyzeHand(bomb6);

console.log('4 个 2:', bomb2A);
console.log('4 个 6:', bomb6A);
console.log('CARD_ORDER[2]:', 11);
console.log('CARD_ORDER[6]:', 2);
console.log('2 > 6:', 11 > 2);
console.log('bomb2.value > bomb6.value:', bomb2A.value > bomb6A.value);

console.log('\n4 个 2 管 4 个 6:', canPlay(bomb6, bomb2));
console.log('4 个 6 管 4 个 2:', canPlay(bomb2, bomb6));
