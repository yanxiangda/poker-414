// 炸的比较规则测试
import { analyzeHand, canPlay } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

// 创建指定点数的牌
function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

console.log('='.repeat(60));
console.log('🧪 测试炸的比较规则 - 4 个 6 vs 3 个 2');
console.log('='.repeat(60));

// 测试 1: 4 个 6 vs 3 个 2
console.log('\n【测试 1】4 个 6 能否管上 3 个 2？');
const four6 = createCards('6', 4);
const three2 = createCards('2', 3);

const four6Analysis = analyzeHand(four6);
const three2Analysis = analyzeHand(three2);

console.log('4 个 6:', { type: four6Analysis.type, count: four6Analysis.count, value: four6Analysis.value, road: four6Analysis.road });
console.log('3 个 2:', { type: three2Analysis.type, count: three2Analysis.count, value: three2Analysis.value, road: three2Analysis.road });

const canFour6BeatThree2 = canPlay(three2, four6);
console.log(`\n结果：4 个 6 ${canFour6BeatThree2 ? '✅ 可以' : '❌ 不可以'} 管上 3 个 2`);
console.log(`原因：${four6Analysis.count}张 > ${three2Analysis.count}张，张数多直接赢！`);

// 测试 2: 3 个 2 vs 4 个 6
console.log('\n【测试 2】3 个 2 能否管上 4 个 6？');
const canThree2BeatFour6 = canPlay(four6, three2);
console.log(`结果：3 个 2 ${canThree2BeatFour6 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 6`);
console.log(`原因：${three2Analysis.count}张 < ${four6Analysis.count}张，张数少不能管！`);

// 测试 3: 4 个 2 vs 4 个 6
console.log('\n【测试 3】4 个 2 vs 4 个 6（张数相同，比点数）');
const four2 = createCards('2', 4);
const four2Analysis = analyzeHand(four2);
console.log('4 个 2:', { type: four2Analysis.type, count: four2Analysis.count, value: four2Analysis.value });
console.log('4 个 6:', { type: four6Analysis.type, count: four6Analysis.count, value: four6Analysis.value });

const canFour2BeatFour6 = canPlay(four6, four2);
console.log(`\n结果：4 个 2 ${canFour2BeatFour6 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 6`);
console.log(`原因：张数相同 (${four2Analysis.count}张)，2 的点数 (${four2Analysis.value}) > 6 的点数 (${four6Analysis.value})`);

// 测试 4: 4 个 6 vs 4 个 2
console.log('\n【测试 4】4 个 6 能否管上 4 个 2？');
const canFour6BeatFour2 = canPlay(four2, four6);
console.log(`结果：4 个 6 ${canFour6BeatFour2 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 2`);
console.log(`原因：张数相同 (${four6Analysis.count}张)，6 的点数 (${four6Analysis.value}) < 2 的点数 (${four2Analysis.value})`);

// 总结
console.log('\n' + '='.repeat(60));
console.log('📊 测试结果总结');
console.log('='.repeat(60));
console.log(`✅ 4 个 6 可以管 3 个 2：${canFour6BeatThree2 ? '通过' : '失败'}`);
console.log(`✅ 3 个 2 不能管 4 个 6：${!canThree2BeatFour6 ? '通过' : '失败'}`);
console.log(`✅ 4 个 2 可以管 4 个 6：${canFour2BeatFour6 ? '通过' : '失败'}`);
console.log(`✅ 4 个 6 不能管 4 个 2：${!canFour6BeatFour2 ? '通过' : '失败'}`);
console.log('='.repeat(60));

// 验证所有测试
const allPassed = canFour6BeatThree2 && !canThree2BeatFour6 && canFour2BeatFour6 && !canFour6BeatFour2;
console.log(`\n${allPassed ? '✅ 所有测试通过！' : '❌ 有测试失败！'}`);
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
