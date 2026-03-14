const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 游戏状态管理
const rooms = new Map(); // roomId -> Room
const players = new Map(); // socketId -> Player

class Room {
  constructor(id, name, hostId) {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.players = []; // [{socketId, name, team, ready, isBot}]
    this.maxPlayers = 6;
    this.gameState = 'waiting'; // waiting, playing, finished
    this.hands = [[], [], [], [], [], []];
    this.tableCards = []; // 桌上所有牌（用于计算分数）
    this.currentPlayer = 0;
    this.lastPlayer = null;
    this.passCount = 0;
    this.teamScores = [0, 0];
    this.firstFinishedTeam = null;
    this.messages = [];
    this.lastPlayedCards = []; // 最后一手牌（用于提示玩家需要管什么）
  }

  addPlayer(socketId, name, isBot = false) {
    if (this.players.length >= this.maxPlayers) return false;
    const team = this.players.length % 2; // 交替分队
    this.players.push({ socketId, name, team, ready: !isBot, isBot });
    return true;
  }

  addBot(name) {
    if (this.players.length >= this.maxPlayers) return false;
    const team = this.players.length % 2;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.players.push({ socketId: botId, name, team, ready: true, isBot: true });
    return botId;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  removeBot(botId) {
    const index = this.players.findIndex(p => p.socketId === botId && p.isBot);
    if (index !== -1) {
      this.players.splice(index, 1);
      return true;
    }
    return false;
  }

  getBots() {
    return this.players.filter(p => p.isBot);
  }

  getPlayer(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  getPlayerIndex(socketId) {
    return this.players.findIndex(p => p.socketId === socketId);
  }

  broadcast(event, data) {
    this.players.forEach(p => {
      if (!p.isBot) {
        io.to(p.socketId).emit(event, data);
      }
    });
  }

  toGameState() {
    return {
      gameState: this.gameState,
      hands: this.hands,
      tableCards: this.tableCards,
      lastPlayedCards: this.lastPlayedCards, // 最后一手牌（用于提示）
      currentPlayer: this.currentPlayer,
      lastPlayer: this.lastPlayer,
      passCount: this.passCount,
      teamScores: this.teamScores,
      firstFinishedTeam: this.firstFinishedTeam,
      messages: this.messages.slice(-5),
      players: this.players.map(p => ({ name: p.name, team: p.team, ready: p.ready, isBot: p.isBot }))
    };
  }
}

// 游戏逻辑
const { createTripleDeck, shuffle, dealCards, getCardScore, CARD_ORDER } = require('./game/deck.js');
const { analyzeHand, canPlay, getHandTypeName, HAND_TYPE } = require('./game/rules.js');
const { calculateTableScore, checkVictory } = require('./game/scoring.js');

// AI 逻辑
function groupCards(hand) {
  const groups = {};
  hand.forEach(card => {
    const key = card.value;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  return groups;
}

function aiChooseCards(hand, tableCards) {
  if (!tableCards || tableCards.length === 0) {
    // 先手，出最小的牌
    const sorted = [...hand].sort((a, b) => CARD_ORDER[a.value] - CARD_ORDER[b.value]);
    return [sorted[0]];
  }
  
  // 需要管牌
  const prevAnalysis = analyzeHand(tableCards);
  if (!prevAnalysis) return null;
  
  const groups = groupCards(hand);
  const prevCount = prevAnalysis.count;
  const prevType = prevAnalysis.type;
  const prevValue = prevAnalysis.value;
  
  // 1. 尝试同类型同张数管牌
  for (let value of Object.keys(groups)) {
    const cards = groups[value];
    if (cards.length !== prevCount) continue;
    
    const analysis = analyzeHand(cards);
    if (!analysis || analysis.type !== prevType) continue;
    
    if (analysis.value > prevValue) {
      return cards;
    }
  }
  
  // 2. 特殊规则：炸可以管对子
  if (prevType === HAND_TYPE.PAIR) {
    for (let value of Object.keys(groups)) {
      const cards = groups[value];
      if (cards.length >= 3 && value !== 'SJ' && value !== 'BJ') {
        // 找到最小的炸（3 张）
        return cards.slice(0, 3);
      }
    }
  }
  
  // 3. 特殊规则：炸可以管单张
  if (prevType === HAND_TYPE.SINGLE) {
    for (let value of Object.keys(groups)) {
      const cards = groups[value];
      if (cards.length >= 3 && value !== 'SJ' && value !== 'BJ') {
        return cards.slice(0, 3);
      }
    }
  }
  
  return null; // 过
}

app.use(express.static(path.join(__dirname, '../frontend/dist')));

io.on('connection', (socket) => {
  console.log('✅ 玩家连接:', socket.id);

  socket.on('error', (err) => {
    console.error('❌ Socket 错误:', err);
  });

  // 创建房间
  socket.on('createRoom', (data) => {
    console.log('📝 创建房间请求:', data);
    const roomId = uuidv4().slice(0, 6).toUpperCase(); // 统一大写
    const room = new Room(roomId, data.roomName || '游戏房间', socket.id);
    room.addPlayer(socket.id, data.playerName || '玩家');
    rooms.set(roomId, room);
    players.set(socket.id, { roomId, name: data.playerName || '玩家' });
    
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, playerIndex: 0 });
    io.to(roomId).emit('playerJoined', room.toGameState());
    
    console.log(`房间创建：${roomId}, 玩家：${data.playerName}`);
  });

  // 加入房间
  socket.on('joinRoom', (data) => {
    const roomId = (data.roomId || '').toUpperCase(); // 统一转大写
    const room = rooms.get(roomId);
    if (!room) {
      console.log('❌ 房间不存在:', roomId, '当前房间:', Array.from(rooms.keys()));
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    const playerIndex = room.players.length;
    if (playerIndex >= room.maxPlayers) {
      socket.emit('error', { message: '房间已满' });
      return;
    }
    
    room.addPlayer(socket.id, data.playerName || '玩家');
    players.set(socket.id, { roomId: data.roomId, name: data.playerName || '玩家' });
    
    socket.join(data.roomId);
    socket.emit('roomJoined', { roomId: data.roomId, playerIndex });
    io.to(data.roomId).emit('playerJoined', room.toGameState());
    
    console.log(`玩家加入：${data.roomId}, ${data.playerName}`);
  });

  // 准备/取消准备
  socket.on('ready', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'waiting') return;
    
    const player = room.getPlayer(socket.id);
    if (player) {
      player.ready = !player.ready; // 切换状态
      io.to(playerInfo.roomId).emit('playerReady', room.toGameState());
      // 不自动开始，等待房主点击开始游戏
    }
  });

  // 开始游戏（仅房主）
  socket.on('startGame', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'waiting') return;
    
    // 只有房主可以开始游戏
    if (socket.id !== room.hostId) {
      socket.emit('error', { message: '只有房主可以开始游戏' });
      return;
    }
    
    // 至少 1 个真人玩家才能开始
    const humanCount = room.players.filter(p => !p.isBot).length;
    if (humanCount < 1) {
      socket.emit('error', { message: '至少需要 1 个真人玩家' });
      return;
    }
    
    // 自动添加机器人到 6 人
    const botNames = ['机器人 1 号', '机器人 2 号', '机器人 3 号', '机器人 4 号', '机器人 5 号', '机器人 6 号'];
    while (room.players.length < room.maxPlayers) {
      const existingBots = room.getBots().length;
      const botName = botNames[existingBots] || `机器人${existingBots + 1}号`;
      room.addBot(botName);
      console.log(`🤖 自动添加机器人：${botName} 到房间 ${room.id}`);
    }
    
    // 通知所有客户端机器人已加入
    io.to(room.id).emit('playerJoined', room.toGameState());
    
    startGame(room);
  });

  // 添加机器人（仅房主）
  socket.on('addBot', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'waiting') return;
    
    if (socket.id !== room.hostId) {
      socket.emit('error', { message: '只有房主可以添加机器人' });
      return;
    }
    
    const botNames = ['机器人 1 号', '机器人 2 号', '机器人 3 号', '机器人 4 号', '机器人 5 号', '机器人 6 号'];
    const existingBots = room.getBots().length;
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: '房间已满' });
      return;
    }
    
    const botName = botNames[existingBots] || `机器人${existingBots + 1}号`;
    const botId = room.addBot(botName);
    
    io.to(room.id).emit('playerJoined', room.toGameState());
    console.log(`🤖 添加机器人：${botName} 到房间 ${room.id}`);
  });

  // 移除机器人（仅房主）
  socket.on('removeBot', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'waiting') return;
    
    if (socket.id !== room.hostId) {
      socket.emit('error', { message: '只有房主可以移除机器人' });
      return;
    }
    
    const { botId } = data;
    if (!botId) {
      socket.emit('error', { message: '请指定要移除的机器人' });
      return;
    }
    
    if (room.removeBot(botId)) {
      io.to(room.id).emit('playerLeft', room.toGameState());
      console.log(`🤖 移除机器人：${botId} 从房间 ${room.id}`);
    } else {
      socket.emit('error', { message: '机器人不存在' });
    }
  });

  // 退出房间
  socket.on('leaveRoom', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (room && room.gameState === 'waiting') {
      // 如果是房主退出，销毁房间
      if (socket.id === room.hostId) {
        room.players.forEach(p => {
          io.to(p.socketId).emit('roomDestroyed', { message: '房主已退出，房间已解散' });
        });
        rooms.delete(playerInfo.roomId);
      } else {
        room.removePlayer(socket.id);
        io.to(playerInfo.roomId).emit('playerLeft', room.toGameState());
      }
      
      socket.leave(playerInfo.roomId);
    }
    players.delete(socket.id);
    
    socket.emit('roomLeft');
  });

  // 出牌
  socket.on('playCards', (data) => {
    console.log('📥 收到出牌请求:', socket.id, data);
    const playerInfo = players.get(socket.id);
    if (!playerInfo) {
      console.log('❌ 玩家信息不存在');
      return;
    }
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'playing') {
      console.log('❌ 房间不存在或游戏未进行中', room?.gameState);
      return;
    }
    
    const playerIndex = room.getPlayerIndex(socket.id);
    if (playerIndex !== room.currentPlayer) {
      console.log('❌ 不是你的回合', playerIndex, room.currentPlayer);
      socket.emit('error', { message: '还没轮到你出牌！' });
      return;
    }
    
    const cards = data.cards;
    if (!cards || cards.length === 0) return;
    
    // 验证是否能管上（使用 lastPlayedCards 而不是 tableCards）
    const needToBeat = room.lastPlayedCards && room.lastPlayedCards.length > 0 
      ? room.lastPlayedCards 
      : [];
    if (needToBeat.length > 0 && !canPlay(needToBeat, cards)) {
      socket.emit('error', { message: '这牌管不上！' });
      return;
    }
    
    // 出牌
    const chosenIds = cards.map(c => c.id);
    room.hands[playerIndex] = room.hands[playerIndex].filter(c => !chosenIds.includes(c.id));
    room.tableCards = [...room.tableCards, ...cards]; // 追加到桌上，不是替换
    room.lastPlayedCards = cards; // 记录最后一手牌
    room.lastPlayer = playerIndex;
    room.passCount = 0;
    
    const analysis = analyzeHand(cards);
    // 显示具体出的牌
    const cardsDetail = cards.map(c => {
      if (c.value === 'BJ') return '大王';
      if (c.value === 'SJ') return '小王';
      return `${c.suit}${c.value}`;
    }).join(' ');
    room.messages.push(`🎴 ${room.players[playerIndex].name}出牌：${getHandTypeName(analysis)} [${cardsDetail}]`);
    
    // 检查是否出完
    if (room.hands[playerIndex].length === 0) {
      room.messages.push(`✨ ${room.players[playerIndex].name}出完牌了！`);
      // 出完牌的玩家不再参与，currentPlayer 跳过该玩家
      room.currentPlayer = (playerIndex + 1) % room.players.length;
      while (room.hands[room.currentPlayer] && room.hands[room.currentPlayer].length === 0) {
        room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      }
      checkRoundEnd(room);
    } else {
      room.currentPlayer = (playerIndex + 1) % room.players.length;
      room.broadcast('gameUpdate', room.toGameState());
      checkBotTurn(room); // 检查下一个是否是机器人
    }
  });

  // 重排序手牌
  socket.on('reorderCards', (data) => {
    console.log('🔄 收到理牌请求:', socket.id, data.cards.map(c => c.value));
    const playerInfo = players.get(socket.id);
    if (!playerInfo) {
      console.log('❌ 玩家信息不存在');
      return;
    }
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'playing') {
      console.log('❌ 房间不存在或游戏未进行中，gameState:', room?.gameState);
      return;
    }
    
    const playerIndex = room.getPlayerIndex(socket.id);
    console.log('👤 玩家索引:', playerIndex, '当前手牌:', room.hands[playerIndex].map(c => c.value));
    
    // 更新手牌顺序
    room.hands[playerIndex] = data.cards;
    console.log('✅ 手牌顺序已更新:', room.hands[playerIndex].map(c => c.value));
    
    // 返回 gameState 让客户端更新显示
    const gameState = room.toGameState();
    console.log('📤 返回 gameState，手牌:', gameState.hands[playerIndex].map(c => c.value));
    socket.emit('gameUpdate', gameState);
  });

  // 过
  socket.on('pass', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'playing') return;
    
    const playerIndex = room.getPlayerIndex(socket.id);
    if (playerIndex !== room.currentPlayer) return;
    
    if (room.tableCards.length === 0) {
      socket.emit('error', { message: '你是先手，不能过！' });
      return;
    }
    
    room.passCount++;
    room.messages.push(`✋ ${room.players[playerIndex].name}过`);
    
    if (room.passCount >= room.players.length - 1) {
      // 一轮结束，上轮赢家（lastPlayer）先出牌
      const score = calculateTableScore(room.tableCards);
      const winnerTeam = room.lastPlayer % 2 === 0 ? 0 : 1;
      room.teamScores[winnerTeam] += score;
      room.messages.push(`💰 ${room.players[room.lastPlayer].name}获得 ${score}分`);
      
      room.tableCards = [];
      room.lastPlayedCards = []; // 清空最后一手牌
      room.passCount = 0;
      room.currentPlayer = room.lastPlayer; // 上轮赢家先出牌
      
      // 检查胜利
      const victory = checkVictory(room.teamScores, room.firstFinishedTeam);
      if (victory) {
        room.gameState = 'finished';
        room.messages.push(`🏆 ${victory.winner === 0 ? 'A 队' : 'B 队'}胜利！`);
      }
      
      room.broadcast('gameUpdate', room.toGameState());
      checkBotTurn(room); // 检查下一个是否是机器人（上轮赢家可能是机器人）
    } else {
      room.currentPlayer = (playerIndex + 1) % room.players.length;
      room.broadcast('gameUpdate', room.toGameState());
      checkBotTurn(room); // 检查下一个是否是机器人
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('玩家断开:', socket.id);
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomId);
      if (room) {
        room.removePlayer(socket.id);
        io.to(playerInfo.roomId).emit('playerLeft', room.toGameState());
        
        if (room.players.length === 0) {
          rooms.delete(playerInfo.roomId);
        }
      }
      players.delete(socket.id);
    }
  });
});

function startGame(room) {
  const deck = shuffle(createTripleDeck());
  room.hands = dealCards(deck);
  room.tableCards = [];
  room.lastPlayedCards = [];
  room.currentPlayer = 0;
  room.lastPlayer = null;
  room.passCount = 0;
  room.teamScores = [0, 0];
  room.firstFinishedTeam = null;
  room.messages = ['游戏开始！'];
  room.gameState = 'playing';
  
  room.broadcast('gameStart', room.toGameState());
  console.log(`游戏开始：${room.id}`);
  
  // 如果第一个出牌的是机器人，触发 AI 出牌
  setTimeout(() => {
    checkBotTurn(room);
  }, 1000);
}

function checkRoundEnd(room) {
  const playerIndex = room.currentPlayer;
  const team = playerIndex % 2;
  
  // 检查是否有队伍出完牌
  const team0Finished = room.hands.some((h, i) => i % 2 === 0 && h.length === 0);
  const team1Finished = room.hands.some((h, i) => i % 2 === 1 && h.length === 0);
  
  if (team0Finished && !room.firstFinishedTeam) {
    room.firstFinishedTeam = 0;
    room.messages.push('🎉 A 队先出完牌！需要 135 分获胜');
  } else if (team1Finished && !room.firstFinishedTeam) {
    room.firstFinishedTeam = 1;
    room.messages.push('🎉 B 队先出完牌！需要 135 分获胜');
  }
  
  const victory = checkVictory(room.teamScores, room.firstFinishedTeam);
  if (victory) {
    room.gameState = 'finished';
    room.messages.push(`🏆 ${victory.winner === 0 ? 'A 队' : 'B 队'}胜利！`);
    // 游戏结束，广播最终状态
    room.broadcast('gameUpdate', room.toGameState());
    return; // 直接返回，不再执行后续逻辑
  }
  
  // 借光规则：出完牌的玩家，按出牌顺序找第一个还持有手牌的队友
  // 从下一家开始按顺序找，只找队友（team 相同），找到第一个有手牌的
  let nextTeammate = (playerIndex + 1) % room.players.length;
  let foundTeammate = -1;
  
  // 最多遍历一圈
  for (let i = 0; i < room.players.length; i++) {
    // 检查是否是队友且有手牌
    if (nextTeammate % 2 === team && room.hands[nextTeammate] && room.hands[nextTeammate].length > 0) {
      foundTeammate = nextTeammate;
      break;
    }
    nextTeammate = (nextTeammate + 1) % room.players.length;
  }
  
  // 如果找到有手牌的队友，借光给他（成为先手）
  if (foundTeammate !== -1) {
    room.currentPlayer = foundTeammate;
    room.tableCards = [];
    room.lastPlayedCards = []; // 清空，成为先手
    room.passCount = 0;
    room.messages.push(`✨ 借光！${room.players[foundTeammate].name}获得出牌权`);
  } else {
    // 没有队友有手牌了，按正常顺序找下一个有手牌的玩家（可能是对手）
    let nextPlayer = (playerIndex + 1) % room.players.length;
    while (room.hands[nextPlayer] && room.hands[nextPlayer].length === 0) {
      nextPlayer = (nextPlayer + 1) % room.players.length;
    }
    room.currentPlayer = nextPlayer;
  }
  
  room.broadcast('gameUpdate', room.toGameState());
  
  // 检查下一个是否是机器人出牌
  checkBotTurn(room);
}

// 检查是否是机器人回合
function checkBotTurn(room) {
  console.log('🤖 checkBotTurn 检查:', {
    gameState: room.gameState,
    currentPlayer: room.currentPlayer,
    players: room.players.map(p => ({ name: p.name, isBot: p.isBot }))
  });
  
  if (room.gameState !== 'playing') {
    console.log('🤖 游戏未进行中');
    return;
  }
  
  const currentPlayer = room.players[room.currentPlayer];
  if (!currentPlayer || !currentPlayer.isBot) {
    console.log('🤖 当前玩家不是机器人:', currentPlayer?.name);
    return;
  }
  
  console.log('🤖 轮到机器人出牌:', currentPlayer.name);
  
  // 机器人出牌延迟
  setTimeout(() => {
    if (room.gameState !== 'playing') return;
    
    const botIndex = room.currentPlayer;
    const botHand = room.hands[botIndex];
    console.log('🤖 机器人手牌:', botHand.length, '张');
    
    const chosenCards = aiChooseCards(botHand, room.tableCards);
    console.log('🤖 AI 选择:', chosenCards ? chosenCards.length + '张' : '过');
    
    if (chosenCards && chosenCards.length > 0) {
      // 机器人出牌
      const chosenIds = chosenCards.map(c => c.id);
      room.hands[botIndex] = botHand.filter(c => !chosenIds.includes(c.id));
      room.tableCards = [...room.tableCards, ...chosenCards]; // 追加到桌上，不是替换
      room.lastPlayedCards = chosenCards; // 记录最后一手牌
      room.lastPlayer = botIndex;
      room.passCount = 0;
      
      const analysis = analyzeHand(chosenCards);
      // 显示具体出的牌
      const cardsDetail = chosenCards.map(c => {
        if (c.value === 'BJ') return '大王';
        if (c.value === 'SJ') return '小王';
        return `${c.suit}${c.value}`;
      }).join(' ');
      room.messages.push(`🤖 ${currentPlayer.name}出牌：${getHandTypeName(analysis)} [${cardsDetail}]`);
      console.log(`🤖 ${currentPlayer.name}出牌：${getHandTypeName(analysis)} [${cardsDetail}]`);
      
      if (room.hands[botIndex].length === 0) {
        room.messages.push(`✨ ${currentPlayer.name}出完牌了！`);
        // 出完牌的玩家不再参与，currentPlayer 跳过该玩家
        room.currentPlayer = (botIndex + 1) % room.players.length;
        while (room.hands[room.currentPlayer] && room.hands[room.currentPlayer].length === 0) {
          room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        }
        checkRoundEnd(room);
      } else {
        room.currentPlayer = (botIndex + 1) % room.players.length;
        room.broadcast('gameUpdate', room.toGameState());
        checkBotTurn(room); // 检查下一个是否是机器人
      }
    } else {
      // 机器人过
      room.passCount++;
      room.messages.push(`✋ ${currentPlayer.name}过`);
      console.log(`✋ ${currentPlayer.name}过`);
      
      if (room.passCount >= room.players.length - 1) {
        const score = calculateTableScore(room.tableCards);
        const winnerTeam = room.lastPlayer % 2 === 0 ? 0 : 1;
        room.teamScores[winnerTeam] += score;
        room.messages.push(`💰 ${room.players[room.lastPlayer].name}获得 ${score}分`);
        
        room.tableCards = [];
        room.lastPlayedCards = []; // 清空最后一手牌
        room.passCount = 0;
        room.currentPlayer = room.lastPlayer;
        
        const victory = checkVictory(room.teamScores, room.firstFinishedTeam);
        if (victory) {
          room.gameState = 'finished';
          room.messages.push(`🏆 ${victory.winner === 0 ? 'A 队' : 'B 队'}胜利！`);
        }
        
        room.broadcast('gameUpdate', room.toGameState());
        checkBotTurn(room);
      } else {
        room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        room.broadcast('gameUpdate', room.toGameState());
        checkBotTurn(room);
      }
    }
  }, 1000 + Math.random() * 1000); // 1-2 秒延迟
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`局域网访问地址：http://${getLocalIP()}:${PORT}`);
});

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
