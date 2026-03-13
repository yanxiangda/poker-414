import { analyzeHand, canPlay, HAND_TYPE } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

const deck = createTripleDeck();
const straight = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
const bomb3 = deck.filter(c => c.value === '3').slice(0, 3);

const prev = analyzeHand(straight);
const next = analyzeHand(bomb3);

console.log('prev:', prev);
console.log('next:', next);
console.log('prev.type:', prev.type, '=== HAND_TYPE.STRAIGHT:', prev.type === HAND_TYPE.STRAIGHT);
console.log('next.type:', next.type, '=== HAND_TYPE.BOMB:', next.type === HAND_TYPE.BOMB);
console.log('prev.count:', prev.count, 'next.count:', next.count);
console.log('prev.count === next.count:', prev.count === next.count);
console.log('next.count >= 3:', next.count >= 3);
console.log('条件满足:', prev.type === HAND_TYPE.STRAIGHT && next.type === HAND_TYPE.BOMB && next.count >= 3);
console.log('canPlay:', canPlay(straight, bomb3));
