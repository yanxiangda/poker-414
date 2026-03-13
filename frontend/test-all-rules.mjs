// 东北抛幺 414 - 完整规则测试
import { analyzeHand, canPlay, HAND_TYPE } from './src/game/rules.js';
import { createTripleDeck } from './src/game/deck.js';

// 创建指定点数的牌
function createCards(value, count) {
  const deck = createTripleDeck();
  return deck.filter(card => card.value === value).slice(0, count);
}

// 测试计数器
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedCases = [];

// 测试辅助函数
function test(name, prevCards, nextCards, expected, reason) {
  totalTests++;
  const result = canPlay(prevCards, nextCards);
  const passed = result === expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ ${name}`);
  } else {
    failedTests++;
    failedCases.push({ name, expected, actual: result, reason });
    console.log(`❌ ${name} - 期望 ${expected}, 得到 ${result}`);
    console.log(`   原因：${reason}`);
  }
}

console.log('='.repeat(70));
console.log('🧪 东北抛幺 414 - 完整规则测试');
console.log('='.repeat(70));

// ==================== 1. 单张 vs 单张 ====================
console.log('\n📍 1. 单张 vs 单张');
console.log('-'.repeat(70));
{
  const A = createCards('A', 1);
  const K = createCards('K', 1);
  const BJ = createCards('BJ', 1); // 大王
  const SJ = createCards('SJ', 1); // 小王
  const card3 = createCards('3', 1);
  const card4 = createCards('4', 1);
  
  test('大王 > 小王', SJ, BJ, true, '大王点数 > 小王');
  test('小王 < 大王', BJ, SJ, false, '小王点数 < 大王');
  test('3 > A', A, card3, true, '3 是最大的数字牌');
  test('A > K', K, A, true, 'A > K');
  test('4 最小', card4, A, true, '4 是最小的牌，A>4');
}

// ==================== 2. 一对 vs 一对 ====================
console.log('\n📍 2. 一对 vs 一对');
console.log('-'.repeat(70));
{
  const pair3 = createCards('3', 2);
  const pair2 = createCards('2', 2);
  const pairA = createCards('A', 2);
  const pairK = createCards('K', 2);
  const pair4 = createCards('4', 2);
  
  test('对 3 > 对 2', pair2, pair3, true, '对 3 最大');
  test('对 2 > 对 A', pairA, pair2, true, '对 2 > 对 A');
  test('对 A > 对 K', pairK, pairA, true, '对 A > 对 K');
  test('对 4 最小', pair4, pairK, true, '对 4 最小，对 K>对 4');
}

// ==================== 3. 顺子 vs 顺子 ====================
console.log('\n📍 3. 顺子 vs 顺子');
console.log('-'.repeat(70));
{
  // 创建顺子：456, 567, 678
  const deck = createTripleDeck();
  const straight456 = deck.filter(c => ['4','5','6'].includes(c.value)).slice(0, 3);
  const straight567 = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
  const straight678 = deck.filter(c => ['6','7','8'].includes(c.value)).slice(0, 3);
  const straight4567 = deck.filter(c => ['4','5','6','7'].includes(c.value)).slice(0, 4);
  
  test('678 > 567', straight567, straight678, true, '最大牌 8 > 7');
  test('567 > 456', straight456, straight567, true, '最大牌 7 > 6');
  test('张数不同不能管', straight456, straight4567, false, '顺子必须张数相同');
}

// ==================== 4. 双龙 vs 双龙 ====================
console.log('\n📍 4. 双龙 vs 双龙');
console.log('-'.repeat(70));
{
  const deck = createTripleDeck();
  // 创建双龙：445566, 556677, 667788
  const ds445566 = deck.filter(c => ['4','5','6'].includes(c.value) && !['BJ','SJ'].includes(c.value));
  const ds445566_filtered = [];
  const count445566 = {4:0, 5:0, 6:0};
  for (const card of ds445566) {
    if (count445566[card.value] < 2) {
      ds445566_filtered.push(card);
      count445566[card.value]++;
    }
  }
  
  const ds556677 = deck.filter(c => ['5','6','7'].includes(c.value) && !['BJ','SJ'].includes(c.value));
  const ds556677_filtered = [];
  const count556677 = {5:0, 6:0, 7:0};
  for (const card of ds556677) {
    if (count556677[card.value] < 2) {
      ds556677_filtered.push(card);
      count556677[card.value]++;
    }
  }
  
  const ds667788 = deck.filter(c => ['6','7','8'].includes(c.value) && !['BJ','SJ'].includes(c.value));
  const ds667788_filtered = [];
  const count667788 = {6:0, 7:0, 8:0};
  for (const card of ds667788) {
    if (count667788[card.value] < 2) {
      ds667788_filtered.push(card);
      count667788[card.value]++;
    }
  }
  
  test('667788 > 556677', ds556677_filtered, ds667788_filtered, true, '最大对 88 > 77');
  test('556677 > 445566', ds445566_filtered, ds556677_filtered, true, '最大对 77 > 66');
}

// ==================== 5. 双龙 vs 顺子 ====================
console.log('\n📍 5. 双龙 vs 顺子（特殊规则）');
console.log('-'.repeat(70));
{
  const deck = createTripleDeck();
  // 顺子 567（3 张）
  const straight567 = deck.filter(c => ['5','6','7'].includes(c.value)).slice(0, 3);
  // 双龙 556677（6 张，长度 3）
  const ds556677 = deck.filter(c => ['5','6','7'].includes(c.value));
  const ds556677_filtered = [];
  const count = {5:0, 6:0, 7:0};
  for (const card of ds556677) {
    if (count[card.value] < 2) {
      ds556677_filtered.push(card);
      count[card.value]++;
    }
  }
  // 顺子 678（3 张）
  const straight678 = deck.filter(c => ['6','7','8'].includes(c.value)).slice(0, 3);
  // 双龙 667788（6 张，长度 3）
  const ds667788 = deck.filter(c => ['6','7','8'].includes(c.value));
  const ds667788_filtered = [];
  const count667788 = {6:0, 7:0, 8:0};
  for (const card of ds667788) {
    if (count667788[card.value] < 2) {
      ds667788_filtered.push(card);
      count667788[card.value]++;
    }
  }
  
  test('双龙 556677 管不了顺子 567', straight567, ds556677_filtered, false, '双龙最大对 77 = 顺子最大牌 7，平局不能管');
  test('双龙 667788 管顺子 567', straight567, ds667788_filtered, true, '双龙长度=顺子张数，最大对 88>7');
  test('双龙 556677 管不了顺子 678', straight678, ds556677_filtered, false, '双龙最大对 77 < 顺子最大牌 8');
}

// ==================== 6. 炸 vs 炸 ====================
console.log('\n📍 6. 炸 vs 炸');
console.log('-'.repeat(70));
{
  const bomb4 = createCards('4', 4);
  const bomb3 = createCards('3', 3);
  const bomb6 = createCards('6', 4);
  const bomb2_4 = createCards('2', 4); // 4 个 2
  const bomb2_3 = createCards('2', 3); // 3 个 2
  const bomb5_4 = createCards('4', 5);
  
  test('4 个 6 > 3 个 2', bomb2_3, bomb6, true, '张数多直接赢（4>3）');
  test('3 个 2 < 4 个 6', bomb6, bomb3, false, '张数少不能管（3<4）');
  test('4 个 2 > 4 个 6', bomb6, bomb2_4, true, '张数相同，点数大（2>6）');
  test('4 个 6 < 4 个 2', bomb2_4, bomb6, false, '张数相同，点数小（6<2）');
  // 注意：上面两个测试的 prev/next 顺序
  // bomb6, bomb2 表示：4 个 2 能否管上 4 个 6（prev=4 个 6，next=4 个 2）→ 应该 true
  // bomb2, bomb6 表示：4 个 6 能否管上 4 个 2（prev=4 个 2，next=4 个 6）→ 应该 false
  test('5 个 4 > 4 个 3', bomb3, bomb5_4, true, '张数多直接赢（5>4）');
}

// ==================== 7. 炸管普通牌型 ====================
console.log('\n📍 7. 炸管普通牌型');
console.log('-'.repeat(70));
{
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
  
  test('炸管单张', single, bomb3, true, '炸可以管单张');
  test('炸管一对', pair, bomb3, true, '炸可以管一对');
  test('3 张炸管顺子', straight, bomb3, true, '3 张炸可以管顺子');
  test('4 张炸管双龙', ds_filtered, bomb4, true, '4 张炸可以管双龙');
}

// ==================== 8. 幺牌管所有普通牌型 ====================
console.log('\n📍 8. 幺牌管所有普通牌型');
console.log('-'.repeat(70));
{
  const deck = createTripleDeck();
  // 幺牌：A+44
  const yao = [...createCards('A', 1), ...createCards('4', 2)];
  
  const single = createCards('3', 1);
  const pair = createCards('3', 2);
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
  
  test('幺牌管单张', single, yao, true, '幺牌可以管单张');
  test('幺牌管一对', pair, yao, true, '幺牌可以管一对');
  test('幺牌管顺子', straight, yao, true, '幺牌可以管顺子');
  test('幺牌管双龙', ds_filtered, yao, true, '幺牌可以管双龙');
}

// ==================== 9. 王组合管普通牌型 ====================
console.log('\n📍 9. 王组合管普通牌型');
console.log('-'.repeat(70));
{
  const deck = createTripleDeck();
  // 王组合：1 大王 +1 小王（4 路）
  const kingCombo = [...createCards('BJ', 1), ...createCards('SJ', 1)];
  // 王组合：2 小王（3 路）
  const kingCombo2 = createCards('SJ', 2);
  
  const single = createCards('3', 1);
  const pair = createCards('3', 2);
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
  
  test('王组合 (2 张) 管单张', single, kingCombo, true, '王组合≥2 张可以管单张');
  test('王组合 (2 张) 管一对', pair, kingCombo, true, '王组合≥2 张可以管一对');
  test('王组合 (2 张) 管顺子', straight, kingCombo, true, '王组合≥2 张可以管顺子');
  test('王组合 (4 路) 管双龙', ds_filtered, kingCombo, true, '王组合路数≥4 可以管双龙');
  test('王组合 (3 路) 管不了双龙', ds_filtered, kingCombo2, false, '王组合路数<4 不能管双龙');
}

// ==================== 10. 幺牌/王组合 vs 炸 ====================
console.log('\n📍 10. 幺牌/王组合 vs 炸');
console.log('-'.repeat(70));
{
  // 幺牌：A+444（6 路）
  const yao6 = [...createCards('A', 1), ...createCards('4', 3)];
  // 幺牌：A+44（4 路）
  const yao4 = [...createCards('A', 1), ...createCards('4', 2)];
  // 炸：3 个 6（3 路）
  const bomb3 = createCards('6', 3);
  // 炸：4 个 6（4 路）
  const bomb4 = createCards('6', 4);
  // 王组合：1 大王 +1 小王（4 路）
  const kingCombo4 = [...createCards('BJ', 1), ...createCards('SJ', 1)];
  // 王组合：2 大王（5 路）
  const kingCombo5 = createCards('BJ', 2);
  
  test('幺牌 (6 路) 管炸 (4 路)', bomb4, yao6, true, '幺牌路数≥炸路数');
  test('幺牌 (4 路) 管炸 (4 路)', bomb4, yao4, true, '幺牌路数=炸路数');
  test('幺牌 (4 路) 管不了炸 (5 路)', createCards('6',5), yao4, false, '幺牌路数<炸路数');
  test('王组合 (5 路) 管炸 (4 路)', bomb4, kingCombo5, true, '王组合路数>炸路数');
  test('王组合 (4 路) 管不了炸 (4 路)', bomb4, kingCombo4, false, '王组合路数=炸路数，需要>');
}

// ==================== 11. 炸管王组合 ====================
console.log('\n📍 11. 炸管王组合');
console.log('-'.repeat(70));
{
  // 王组合：1 大王 +1 小王（4 路）
  const kingCombo4 = [...createCards('BJ', 1), ...createCards('SJ', 1)];
  // 炸：3 个 6
  const bomb3 = createCards('6', 3);
  
  test('3 张炸管王组合', kingCombo4, bomb3, true, '3 张以上炸可以管王组合');
}

// ==================== 测试结果汇总 ====================
console.log('\n' + '='.repeat(70));
console.log('📊 测试结果汇总');
console.log('='.repeat(70));
console.log(`总测试数：${totalTests}`);
console.log(`✅ 通过：${passedTests}`);
console.log(`❌ 失败：${failedTests}`);
console.log(`通过率：${((passedTests/totalTests)*100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log('\n❌ 失败的测试用例：');
  failedCases.forEach((tc, i) => {
    console.log(`${i+1}. ${tc.name}`);
    console.log(`   期望：${tc.expected}, 实际：${tc.actual}`);
    console.log(`   原因：${tc.reason}`);
  });
} else {
  console.log('\n🎉 所有测试通过！');
}

console.log('='.repeat(70));

// 导出结果
export const testResults = {
  total: totalTests,
  passed: passedTests,
  failed: failedTests,
  failedCases
};

// 退出码
process.exit(failedTests === 0 ? 0 : 1);
