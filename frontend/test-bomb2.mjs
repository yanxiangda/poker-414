import { canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

const bomb2 = createCards('2', 4);
const bomb6 = createCards('6', 4);

console.log('canPlay(bomb6, bomb2):', canPlay(bomb6, bomb2)); // 4 个 2 管 4 个 6
console.log('canPlay(bomb2, bomb6):', canPlay(bomb2, bomb6)); // 4 个 6 管 4 个 2
