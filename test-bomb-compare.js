// 测试用例：验证 4 张炸 vs 3 张炸的比较逻辑
// 规则：张数多的炸直接赢，不需要比点数

const { analyzeHand, canPlay, HAND_TYPE } = require('./server/game/rules.js');
const { createDeck } = require('./server/game/deck.js');

console.log('🧪 测试：4 张炸 vs 3 张炸\n');

// 测试用例 1: 4 个 6 vs 3 个 2
console.log('📋 测试 1: 4 个 6 (6666) vs 3 个 2 (222)');
const bomb4x6 = [{value: '6'}, {value: '6'}, {value: '6'}, {value: '6'}];
const bomb3x2 = [{value: '2'}, {value: '2'}, {value: '2'}];

const analysis4x6 = analyzeHand(bomb4x6);
const analysis3x2 = analyzeHand(bomb3x2);

console.log('  4 个 6 分析:', JSON.stringify(analysis4x6, null, 2));
console.log('  3 个 2 分析:', JSON.stringify(analysis3x2, null, 2));

const can4x6Beat3x2 = canPlay(bomb3x2, bomb4x6);
console.log(`  ✅ 4 个 6 能管 3 个 2 吗？ ${can4x6Beat3x2 ? '能 ✅' : '不能 ❌'}`);
console.log(`  预期：能（4 张 > 3 张，张数多直接赢）`);
console.log(`  结果：${can4x6Beat3x2 === true ? '通过 ✅' : '失败 ❌'}\n`);

// 测试用例 2: 3 个 2 vs 4 个 6（反过来）
console.log('📋 测试 2: 3 个 2 (222) vs 4 个 6 (6666)');
const can3x2Beat4x6 = canPlay(bomb4x6, bomb3x2);
console.log(`  ✅ 3 个 2 能管 4 个 6 吗？ ${can3x2Beat4x6 ? '能 ✅' : '不能 ❌'}`);
console.log(`  预期：不能（3 张 < 4 张）`);
console.log(`  结果：${can3x2Beat4x6 === false ? '通过 ✅' : '失败 ❌'}\n`);

// 测试用例 3: 4 个 2 vs 4 个 6（同张数比点数）
console.log('📋 测试 3: 4 个 2 (2222) vs 4 个 6 (6666)');
const bomb4x2 = [{value: '2'}, {value: '2'}, {value: '2'}, {value: '2'}];
const analysis4x2 = analyzeHand(bomb4x2);
console.log('  4 个 2 分析:', JSON.stringify(analysis4x2, null, 2));

const can4x2Beat4x6 = canPlay(bomb4x6, bomb4x2);
console.log(`  ✅ 4 个 2 能管 4 个 6 吗？ ${can4x2Beat4x6 ? '能 ✅' : '不能 ❌'}`);
console.log(`  预期：能（张数相同，2 > 6）`);
console.log(`  结果：${can4x2Beat4x6 === true ? '通过 ✅' : '失败 ❌'}\n`);

// 测试用例 4: 5 个 3 vs 4 个 2（5 张炸 vs 4 张炸）
console.log('📋 测试 4: 5 个 3 (33333) vs 4 个 2 (2222)');
const bomb5x3 = [{value: '3'}, {value: '3'}, {value: '3'}, {value: '3'}, {value: '3'}];
const analysis5x3 = analyzeHand(bomb5x3);
console.log('  5 个 3 分析:', JSON.stringify(analysis5x3, null, 2));

const can5x3Beat4x2 = canPlay(bomb4x2, bomb5x3);
console.log(`  ✅ 5 个 3 能管 4 个 2 吗？ ${can5x3Beat4x2 ? '能 ✅' : '不能 ❌'}`);
console.log(`  预期：能（5 张 > 4 张，张数多直接赢）`);
console.log(`  结果：${can5x3Beat4x2 === true ? '通过 ✅' : '失败 ❌'}\n`);

// 总结
console.log('='.repeat(50));
console.log('📊 测试结果总结:');
const allPassed = can4x6Beat3x2 === true && 
                  can3x2Beat4x6 === false && 
                  can4x2Beat4x6 === true && 
                  can5x3Beat4x2 === true;
console.log(`  总结果：${allPassed ? '全部通过 ✅' : '有失败 ❌'}`);
console.log('='.repeat(50));

// 规则总结
console.log('\n📖 炸的比较规则:');
console.log('  1. 张数多直接赢（不需要比点数）');
console.log('  2. 张数相同时才比点数');
console.log('  3. 示例：4 个 6 > 3 个 2（张数多），4 个 2 > 4 个 6（点数大）');
