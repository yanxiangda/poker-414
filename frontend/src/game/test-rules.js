// 东北抛幺 414 规则测试
import { analyzeHand, canPlay } from './rules.js';
import { createTripleDeck } from './deck.js';

// 测试辅助函数：创建指定点数的牌
function createCards(value, count) {
  const deck = createTripleDeck();
  const cards = deck.filter(card => card.value === value).slice(0, count);
  console.log(`创建 ${count} 个 ${value}:`, cards.map(c => c.id));
  return cards;
}

// 测试用例
console.log('='.repeat(50));
console.log('🧪 测试炸的比较规则');
console.log('='.repeat(50));

// 测试 1: 4 个 6 vs 3 个 2
console.log('\n【测试 1】4 个 6 能否管上 3 个 2？');
const four6 = createCards('6', 4);
const three2 = createCards('2', 3);

const four6Analysis = analyzeHand(four6);
const three2Analysis = analyzeHand(three2);

console.log('4 个 6 分析:', four6Analysis);
console.log('3 个 2 分析:', three2Analysis);

const canFour6BeatThree2 = canPlay(three2, four6);
console.log(`结果：4 个 6 ${canFour6BeatThree2 ? '✅ 可以' : '❌ 不可以'} 管上 3 个 2`);
console.log(`原因：${four6Analysis.count}张 > ${three2Analysis.count}张，张数多直接赢！`);

// 测试 2: 3 个 2 vs 4 个 6
console.log('\n【测试 2】3 个 2 能否管上 4 个 6？');
const canThree2BeatFour6 = canPlay(four6, three2);
console.log(`结果：3 个 2 ${canThree2BeatFour6 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 6`);
console.log(`原因：${three2Analysis.count}张 < ${four6Analysis.count}张，张数少不能管！`);

// 测试 3: 4 个 2 vs 4 个 6（张数相同，比点数）
console.log('\n【测试 3】4 个 2 vs 4 个 6（张数相同，比点数）');
const four2 = createCards('2', 4);
const four2Analysis = analyzeHand(four2);

const canFour2BeatFour6 = canPlay(four6, four2);
console.log(`结果：4 个 2 ${canFour2BeatFour6 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 6`);
console.log(`原因：张数相同 (${four2Analysis.count}张)，2 的点数 > 6 的点数`);

// 测试 4: 4 个 6 vs 4 个 2
console.log('\n【测试 4】4 个 6 能否管上 4 个 2？');
const canFour6BeatFour2 = canPlay(four2, four6);
console.log(`结果：4 个 6 ${canFour6BeatFour2 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 2`);
console.log(`原因：张数相同 (${four6Analysis.count}张)，6 的点数 < 2 的点数，不能管！`);

// 测试 5: 5 个 4 vs 4 个 3
console.log('\n【测试 5】5 个 4 vs 4 个 3');
const five4 = createCards('4', 5);
const four3 = createCards('3', 4);
const five4Analysis = analyzeHand(five4);
const four3Analysis = analyzeHand(four3);

const canFive4BeatFour3 = canPlay(four3, five4);
console.log(`结果：5 个 4 ${canFive4BeatFour3 ? '✅ 可以' : '❌ 不可以'} 管上 4 个 3`);
console.log(`原因：${five4Analysis.count}张 > ${four3Analysis.count}张，张数多直接赢！`);

console.log('\n' + '='.repeat(50));
console.log('📊 测试结果总结');
console.log('='.repeat(50));
console.log('✅ 4 个 6 可以管 3 个 2（张数多直接赢）');
console.log('❌ 3 个 2 不能管 4 个 6（张数少）');
console.log('✅ 4 个 2 可以管 4 个 6（张数同，点数大）');
console.log('❌ 4 个 6 不能管 4 个 2（张数同，点数小）');
console.log('✅ 5 个 4 可以管 4 个 3（张数多直接赢）');
console.log('='.repeat(50));

// 导出测试函数供其他测试使用
export function runBombTests() {
  console.log('\n🧪 运行炸的比较测试...');
  
  const tests = [
    {
      name: '4 个 6 vs 3 个 2',
      prev: three2,
      next: four6,
      expected: true
    },
    {
      name: '3 个 2 vs 4 个 6',
      prev: four6,
      next: three2,
      expected: false
    },
    {
      name: '4 个 2 vs 4 个 6',
      prev: four6,
      next: four2,
      expected: true
    },
    {
      name: '4 个 6 vs 4 个 2',
      prev: four2,
      next: four6,
      expected: false
    },
    {
      name: '5 个 4 vs 4 个 3',
      prev: four3,
      next: five4,
      expected: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    const result = canPlay(test.prev, test.next);
    if (result === test.expected) {
      console.log(`✅ ${test.name}: 通过`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: 失败 (期望 ${test.expected}, 得到 ${result})`);
      failed++;
    }
  });
  
  console.log(`\n总计：${passed} 通过，${failed} 失败`);
  return { passed, failed, total: tests.length };
}
