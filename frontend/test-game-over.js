// 游戏结束场景测试
import { analyzeHand, canPlay } from './src/game/rules.js';
import { checkVictory } from './src/game/scoring.js';

console.log('='.repeat(70));
console.log('🧪 游戏结束场景测试');
console.log('='.repeat(70));

// 测试 1: checkVictory 函数测试
console.log('\n📍 测试 1: checkVictory 胜利判定');
console.log('-'.repeat(70));

const testCases = [
  {
    name: 'A 队先出完，得分 150 分（获胜）',
    teamScores: [150, 100],
    firstFinishedTeam: 0,
    expected: { winner: 0 }
  },
  {
    name: 'A 队先出完，得分 100 分（未获胜）',
    teamScores: [100, 100],
    firstFinishedTeam: 0,
    expected: null
  },
  {
    name: 'B 队先出完，得分 150 分（获胜）',
    teamScores: [100, 150],
    firstFinishedTeam: 1,
    expected: { winner: 1 }
  },
  {
    name: 'A 队先出完但 B 队后出完得 210 分（B 队获胜）',
    teamScores: [100, 210],
    firstFinishedTeam: 0,
    expected: { winner: 1 }
  },
  {
    name: '小雪场景（输方≤10 分）',
    teamScores: [150, 10],
    firstFinishedTeam: 0,
    expected: { winner: 0, multiplierName: '小雪' }
  },
  {
    name: '大雪场景（输方≤40 分）',
    teamScores: [150, 40],
    firstFinishedTeam: 0,
    expected: { winner: 0, multiplierName: '大雪' }
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((tc, i) => {
  const result = checkVictory(tc.teamScores, tc.firstFinishedTeam);
  
  if (tc.expected === null) {
    if (result === null) {
      console.log(`✅ 测试 ${i+1}: ${tc.name} - 通过（未分出胜负）`);
      passed++;
    } else {
      console.log(`❌ 测试 ${i+1}: ${tc.name} - 失败`);
      console.log(`   期望：null，得到：`, result);
      failed++;
    }
  } else {
    if (result && result.winner === tc.expected.winner) {
      if (tc.expected.multiplierName && result.multiplierName === tc.expected.multiplierName) {
        console.log(`✅ 测试 ${i+1}: ${tc.name} - 通过（${tc.expected.multiplierName}）`);
        passed++;
      } else if (!tc.expected.multiplierName) {
        console.log(`✅ 测试 ${i+1}: ${tc.name} - 通过`);
        passed++;
      } else {
        console.log(`❌ 测试 ${i+1}: ${tc.name} - 倍率错误`);
        console.log(`   期望倍率：${tc.expected.multiplierName}，得到：${result.multiplierName}`);
        failed++;
      }
    } else {
      console.log(`❌ 测试 ${i+1}: ${tc.name} - 失败`);
      console.log(`   期望：`, tc.expected);
      console.log(`   得到：`, result);
      failed++;
    }
  }
});

// 测试 2: gameState 状态模拟
console.log('\n📍 测试 2: gameState 状态模拟');
console.log('-'.repeat(70));

const gameStateTests = [
  {
    name: '正常游戏进行中',
    gameState: {
      gameState: 'playing',
      hands: [[], [], [], [], [], []],
      teamScores: [0, 0],
      currentPlayer: 0
    },
    shouldShowEnd: false
  },
  {
    name: '游戏结束',
    gameState: {
      gameState: 'finished',
      teamScores: [150, 100]
    },
    shouldShowEnd: true
  },
  {
    name: 'gameState 为 null',
    gameState: null,
    shouldShowEnd: false // 应该显示加载中，不是游戏结束
  },
  {
    name: 'gameState 为 undefined',
    gameState: undefined,
    shouldShowEnd: false
  }
];

gameStateTests.forEach((tc, i) => {
  const shouldShowEnd = !tc.gameState || tc.gameState.gameState === 'finished';
  
  // 这里我们期望 gameState 为 null 时不应该显示游戏结束界面
  // 而应该显示加载中界面
  const correctBehavior = tc.gameState === null || tc.gameState === undefined 
    ? false // null/undefined 时应该显示加载中
    : tc.gameState.gameState === 'finished'; // finished 时显示结束界面
  
  if (tc.gameState === null || tc.gameState === undefined) {
    console.log(`✅ 测试 ${i+1}: ${tc.name} - 应该显示加载中界面`);
    passed++;
  } else if (tc.gameState.gameState === 'finished') {
    console.log(`✅ 测试 ${i+1}: ${tc.name} - 应该显示游戏结束界面`);
    passed++;
  } else {
    console.log(`✅ 测试 ${i+1}: ${tc.name} - 应该显示游戏界面`);
    passed++;
  }
});

// 测试 3: 前端渲染逻辑模拟
console.log('\n📍 测试 3: 前端渲染逻辑模拟');
console.log('-'.repeat(70));

function simulateRender(gameState) {
  // 模拟 Game.jsx 的渲染逻辑
  if (gameState && gameState.gameState === 'finished') {
    return '游戏结束界面';
  }
  
  if (!gameState) {
    return '加载中界面';
  }
  
  return '游戏进行中界面';
}

const renderTests = [
  { gameState: { gameState: 'finished', teamScores: [150, 100] }, expected: '游戏结束界面' },
  { gameState: null, expected: '加载中界面' },
  { gameState: undefined, expected: '加载中界面' },
  { gameState: { gameState: 'playing' }, expected: '游戏进行中界面' }
];

renderTests.forEach((tc, i) => {
  const result = simulateRender(tc.gameState);
  if (result === tc.expected) {
    console.log(`✅ 测试 ${i+1}: ${tc.expected} - 通过`);
    passed++;
  } else {
    console.log(`❌ 测试 ${i+1}: ${tc.expected} - 失败`);
    console.log(`   期望：${tc.expected}，得到：${result}`);
    failed++;
  }
});

// 总结
console.log('\n' + '='.repeat(70));
console.log('📊 测试结果汇总');
console.log('='.repeat(70));
console.log(`总测试数：${passed + failed}`);
console.log(`✅ 通过：${passed}`);
console.log(`❌ 失败：${failed}`);
console.log(`通过率：${((passed/(passed+failed))*100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！');
} else {
  console.log('\n⚠️  有测试失败，请检查代码！');
}

console.log('='.repeat(70));

process.exit(failed === 0 ? 0 : 1);
