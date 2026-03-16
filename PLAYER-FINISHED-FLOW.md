# 🎮 东北抛幺 414 - 玩家出完牌后的完整判定流程

> 本文档详细描述玩家打出最后手牌后的完整判定流程，包括借光规则、计分逻辑和胜利判定。

---

## 📋 目录

1. [核心规则](#核心规则)
2. [完整流程图](#完整流程图)
3. [分步详解](#分步详解)
4. [借光规则](#借光规则)
5. [计分规则](#计分规则)
6. [胜利判定](#胜利判定)
7. [代码实现位置](#代码实现位置)
8. [示例场景](#示例场景)

---

## 🎯 核心规则

### 基本原则

1. **出完牌的玩家不再参与出牌** - 被跳过
2. **出完牌不立即结束** - 该轮继续，其他玩家仍可出牌
3. **所有人都过后才触发借光** - 不是立即借光
4. **借光只给队友** - 同队优先获得先手
5. **先出完牌的队伍需要 ≥135 分** - 后出完的需要 ≥210 分

---

## 🔄 完整流程图

```
┌─────────────────────────────────────────────────────────┐
│                    玩家打出最后手牌                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  1. 系统检测到手牌 = 0                                   │
│     - 消息提示：✨ XXX 出完牌了！                          │
│     - 记录该玩家已出完                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  2. currentPlayer 移到下一家                              │
│     - 跳过已出完牌的玩家                                 │
│     - 找到下一个有手牌的玩家                             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  3. 游戏继续，该轮未结束                                  │
│     - 其他玩家按顺序出牌或过                             │
│     - passCount 计数                                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  其他玩家是否能管上？    │
         └───────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │ 能管  │   │ 不能管│   │ 不能管│
    │ 出牌  │   │  过   │   │  过   │
    └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │
        │           ▼           │
        │    passCount++        │
        │           │           │
        │           ▼           │
        │   检查 passCount      │
        │   >= 人数 -1 ?        │
        │           │           │
        │      ┌────┴────┐      │
        │      │   否    │      │
        │      │  继续   │      │
        │      └─────────┘      │
        │                       │
        └───────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   所有人都过了          │
         │   (passCount >= n-1)   │
         └───────────┬────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │   检查是否有玩家        │
         │   刚出完牌？            │
         └───────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │  有   │   │  有   │   │  没有 │
    │借光逻辑│   │借光逻辑│   │正常计分│
    └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │
        ▼           │           ▼
   ┌─────────┐      │      ┌──────────┐
   │找有手牌的│      │      │lastPlayer│
   │  队友   │      │      │获得先手  │
   └────┬────┘      │      └──────────┘
        │           │
        ▼           │
   ┌─────────┐      │
   │找到了？ │      │
   └────┬────┘      │
        │           │
   ┌────┴────┐      │
   │    是   │      │
   └────┬────┘      │
        │           │
        ▼           │
   ┌─────────────────┴──────────┐
   │   触发借光                  │
   │   - 队友获得先手            │
   │   - 桌面牌清空              │
   │   - passCount 重置          │
   │   - 消息：✨ 借光！XXX 获得出牌权│
   └─────────────┬──────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │   检查是否有队伍出完牌       │
   │   - A 队有人出完 → firstFinishedTeam=0│
   │   - B 队有人出完 → firstFinishedTeam=1│
   └─────────────┬───────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │   检查胜利条件               │
   │   - 先出完的队伍 ≥135 分？    │
   │   - 后出完的队伍 ≥210 分？    │
   └─────────────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ┌─────────┐       ┌─────────┐
   │  胜利   │       │  继续   │
   │ 游戏结束│       │ 游戏继续│
   └─────────┘       └─────────┘
```

---

## 📖 分步详解

### 步骤 1：玩家打出最后手牌

**触发条件：**
```javascript
if (room.hands[playerIndex].length === 0) {
  room.messages.push(`✨ ${room.players[playerIndex].name}出完牌了！`);
}
```

**系统动作：**
- ✅ 检测到手牌数量为 0
- ✅ 发送系统消息提示
- ✅ 记录该玩家状态为"已出完"

---

### 步骤 2：移动 currentPlayer

**代码逻辑：**
```javascript
// 出完牌的玩家不再参与，currentPlayer 移到下一家
room.currentPlayer = (playerIndex + 1) % room.players.length;

// 跳过已出完牌的玩家
while (room.hands[room.currentPlayer] && room.hands[room.currentPlayer].length === 0) {
  room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
}
```

**关键点：**
- ⚠️ **不立即触发借光**
- ⚠️ **不立即结束该轮**
- ✅ 只是移到下一个有手牌的玩家

---

### 步骤 3：游戏继续

**该轮状态：**
- `room.tableCards` - 桌上的牌（包括最后出的那手）
- `room.lastPlayedCards` - 最后一手牌（需要被管上的牌）
- `room.passCount` - 过牌计数（从 0 开始）
- `room.lastPlayer` - 最后出牌的玩家（出完牌的那位）

**其他玩家的选择：**
1. **能管上** → 出牌，`passCount` 重置为 0
2. **管不上** → 过，`passCount++`

---

### 步骤 4：所有人都过后的判定

**触发条件：**
```javascript
if (room.passCount >= room.players.length - 1) {
  // 所有人都过了
}
```

**检查是否有玩家刚出完牌：**
```javascript
const finishedPlayerIndex = room.hands.findIndex((h, i) => h.length === 0);
const hasFinishedPlayer = finishedPlayerIndex !== -1;
```

---

## 🔄 借光规则（详细）

### 借光触发条件

1. ✅ 有玩家刚出完牌（`hasFinishedPlayer === true`）
2. ✅ 所有其他玩家都选择了"过"（`passCount >= players.length - 1`）
3. ✅ 出完牌玩家还有队友持有手牌

### 借光逻辑

**查找队友：**
```javascript
const finishedTeam = finishedPlayerIndex % 2; // 0=A 队，1=B 队
let nextTeammate = (finishedPlayerIndex + 1) % room.players.length;
let foundTeammate = -1;

// 从下一家开始顺时针找，只找队友
for (let i = 0; i < room.players.length; i++) {
  // 检查是否是队友且有手牌
  if (nextTeammate % 2 === finishedTeam && 
      room.hands[nextTeammate] && 
      room.hands[nextTeammate].length > 0) {
    foundTeammate = nextTeammate;
    break;
  }
  nextTeammate = (nextTeammate + 1) % room.players.length;
}
```

### 借光成功

**如果找到有手牌的队友：**
```javascript
if (foundTeammate !== -1) {
  room.currentPlayer = foundTeammate;  // 队友获得先手
  room.tableCards = [];                // 桌面牌清空
  room.lastPlayedCards = [];           // 最后一手牌清空
  room.passCount = 0;                  // 过牌计数重置
  room.messages.push(`✨ 借光！${room.players[foundTeammate].name}获得出牌权`);
}
```

**效果：**
- 🎴 桌面清空，可以任意出牌（先手）
- 🔄 过牌计数重置
- ✨ 系统提示借光消息

### 借光失败

**如果没找到有手牌的队友：**
- 所有队友都出完牌了
- 按正常流程计分，`lastPlayer` 所在队伍获得桌上分数
- `lastPlayer` 获得先手（但可能也出完了，继续找下一个）

---

## 💰 计分规则

### 触发计分的场景

**场景 1：正常一轮结束（没有人出完牌）**
```javascript
const score = calculateTableScore(room.tableCards);
const winnerTeam = room.lastPlayer % 2 === 0 ? 0 : 1;
room.teamScores[winnerTeam] += score;
room.messages.push(`💰 ${room.players[room.lastPlayer].name}获得 ${score}分`);
```

**场景 2：有人出完牌但借光失败**
- 同上，按 `lastPlayer` 计分

### 分数牌

| 牌 | 分数 |
|----|------|
| K  | 10 分 |
| 10 | 10 分 |
| 5  | 5 分 |
| 其他 | 0 分 |

### 计分公式

```javascript
function calculateTableScore(cards) {
  let score = 0;
  cards.forEach(card => {
    if (card.value === 'K' || card.value === '10') score += 10;
    if (card.value === '5') score += 5;
  });
  return score;
}
```

---

## 🏆 胜利判定

### 检查队伍是否出完牌

```javascript
const team0Finished = room.hands.some((h, i) => i % 2 === 0 && h.length === 0);
const team1Finished = room.hands.some((h, i) => i % 2 === 1 && h.length === 0);

// 记录首个出完牌的队伍
if (team0Finished && !room.firstFinishedTeam) {
  room.firstFinishedTeam = 0;
  room.messages.push('🎉 A 队先出完牌！需要 135 分获胜');
} else if (team1Finished && !room.firstFinishedTeam) {
  room.firstFinishedTeam = 1;
  room.messages.push('🎉 B 队先出完牌！需要 135 分获胜');
}
```

### 胜利条件

```javascript
function checkVictory(teamScores, firstFinishedTeam) {
  const team0Finished = /* 检查 A 队是否所有人都出完 */;
  const team1Finished = /* 检查 B 队是否所有人都出完 */;
  
  if (team0Finished && team1Finished) {
    // 两队都出完了，比分数
    if (teamScores[0] > teamScores[1]) return { winner: 0 };
    else return { winner: 1 };
  }
  
  if (firstFinishedTeam === 0 && team0Finished) {
    // A 队先出完，需要 ≥135 分
    if (teamScores[0] >= 135) return { winner: 0 };
  }
  
  if (firstFinishedTeam === 1 && team1Finished) {
    // B 队先出完，需要 ≥135 分
    if (teamScores[1] >= 135) return { winner: 1 };
  }
  
  // 后出完的队伍需要 ≥210 分
  if (firstFinishedTeam === 0 && team1Finished && teamScores[1] >= 210) {
    return { winner: 1 };
  }
  
  if (firstFinishedTeam === 1 && team0Finished && teamScores[0] >= 210) {
    return { winner: 0 };
  }
  
  return null; // 还未分出胜负
}
```

### 胜利消息

```javascript
if (victory) {
  room.gameState = 'finished';
  room.messages.push(`🏆 ${victory.winner === 0 ? 'A 队' : 'B 队'}胜利！`);
}
```

---

## 💻 代码实现位置

### 文件：`server/server.js`

| 功能 | 行号范围 | 说明 |
|------|---------|------|
| 玩家出牌处理 | ~380-430 | `socket.on('playCard')` |
| 玩家过牌处理 | ~460-520 | `socket.on('pass')` |
| 机器人出牌处理 | ~650-750 | `checkBotTurn()` |
| 借光逻辑 | ~490-540 | 在 `pass` 处理中 |
| 计分逻辑 | ~500-510 | `calculateTableScore()` |
| 胜利判定 | ~520-530 | `checkVictory()` |

### 关键函数

```javascript
// 出完牌后的处理（在 playCard 和 checkBotTurn 中）
if (room.hands[playerIndex].length === 0) {
  room.messages.push(`✨ ${room.players[playerIndex].name}出完牌了！`);
  room.currentPlayer = (playerIndex + 1) % room.players.length;
  while (room.hands[room.currentPlayer] && room.hands[room.currentPlayer].length === 0) {
    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
  }
  room.broadcast('gameUpdate', room.toGameState());
  checkBotTurn(room); // 继续游戏，不立即借光
}

// 借光逻辑（在 pass 处理中）
if (room.passCount >= room.players.length - 1) {
  const finishedPlayerIndex = room.hands.findIndex((h, i) => h.length === 0);
  const hasFinishedPlayer = finishedPlayerIndex !== -1;
  
  if (hasFinishedPlayer) {
    // 触发借光...
  } else {
    // 正常计分...
  }
}
```

---

## 🎲 示例场景

### 场景 1：正常借光

**6 人局，玩家 0（A 队）出完牌：**

```
初始状态：
- 玩家 0（A 队）：出完牌 ✨
- 玩家 1（B 队）：有手牌
- 玩家 2（A 队）：有手牌 ← 队友
- 玩家 3（B 队）：有手牌
- 玩家 4（A 队）：有手牌
- 玩家 5（B 队）：有手牌

流程：
1. 玩家 0 出完牌 → ✨ 玩家 0 出完牌了！
2. currentPlayer → 玩家 1
3. 玩家 1 过 → passCount=1
4. 玩家 2 过 → passCount=2
5. 玩家 3 过 → passCount=3
6. 玩家 4 过 → passCount=4
7. 玩家 5 过 → passCount=5（所有人都过了）
8. 触发借光 → 找玩家 0 的队友（A 队）
9. 找到玩家 2 → ✨ 借光！玩家 2 获得出牌权
10. 桌面清空，玩家 2 先手出牌
```

### 场景 2：有人能管上

**玩家 0 出完牌后，玩家 1 能管上：**

```
1. 玩家 0 出完牌 → ✨ 玩家 0 出完牌了！
2. currentPlayer → 玩家 1
3. 玩家 1 出牌（能管上）→ passCount=0
4. 游戏继续，按正常流程
5. 不触发借光
```

### 场景 3：借光失败（队友都出完了）

**A 队所有人都出完牌：**

```
1. 玩家 4（A 队）出完牌 → ✨ 玩家 4 出完牌了！
2. currentPlayer → 玩家 5
3. 玩家 5 过 → passCount=1
4. 玩家 1 过 → passCount=2
5. 玩家 3 过 → passCount=3（所有人都过了）
6. 触发借光 → 找玩家 4 的队友（A 队）
7. 玩家 0、2、4 都出完了 → 没找到
8. 借光失败 → 正常计分
9. lastPlayer（玩家 4）所在队伍（A 队）获得桌上分数
10. 检查胜利条件
```

---

## 📌 关键要点总结

1. **出完牌 ≠ 立即借光** - 必须等所有人都过后才触发
2. **借光只给队友** - 同队优先，找不到才正常计分
3. **借光 = 先手** - 桌面清空，可以任意出牌
4. **先出完需要 ≥135 分** - 后出完需要 ≥210 分
5. **出完牌的玩家被跳过** - 不再参与出牌
6. **passCount 从 0 开始** - 有人出牌就重置

---

## 🔗 相关文档

- [游戏规则详解](./README.md#游戏规则详细版)
- [计分规则](./README.md#计分规则)
- [部署指南](./DEPLOY.md)

---

**最后更新：** 2026-03-17  
**版本：** v1.2.0
