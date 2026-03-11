import React, { useState } from 'react';
import { analyzeHand, canPlay, getHandTypeName } from './game/rules.js';
import { calculateTableScore } from './game/scoring.js';
import Hand from './Hand.jsx';
import Card from './Card.jsx';

/**
 * 玩家头像组件
 */
function PlayerAvatar({ player, isYou, isCurrent, team, handCount }) {
  const teamColor = team === 0 ? '#4CAF50' : '#f44336';
  const bgColor = isCurrent ? '#FFD700' : '#1a4d8f';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      {/* 头像 */}
      <div style={{
        width: 'clamp(60px, 12vw, 80px)',
        height: 'clamp(60px, 12vw, 80px)',
        borderRadius: '50%',
        backgroundColor: bgColor,
        border: `3px solid ${teamColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(24px, 5vw, 36px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {isYou ? '🧑' : '🤖'}
        {isCurrent && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '24px',
            height: '24px',
            backgroundColor: '#FFD700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            animation: 'pulse 1s infinite'
          }}>
            ⏳
          </div>
        )}
      </div>
      
      {/* 信息 */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: '12px',
        padding: '6px 12px',
        textAlign: 'center',
        minWidth: '80px'
      }}>
        <div style={{ color: '#fff', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 'bold' }}>
          {isYou ? '你' : player?.name || `P${team + 1}`}
        </div>
        <div style={{ color: '#ffd700', fontSize: 'clamp(11px, 2vw, 13px)' }}>
          {handCount}张
        </div>
      </div>
    </div>
  );
}

/**
 * 玩家座位组件 - 响应式定位
 */
function PlayerSeat({ playerIdx, hand, tableCards, isCurrent, isYou, position = 'hex-bottom', team = 0 }) {
  // 位置样式 - 座位完全在灰色背景内部
  const positionStyles = {
    'hex-bottom': { bottom: '3%', left: '50%', transform: 'translateX(-50%)' },
    'hex-top': { top: '3%', left: '50%', transform: 'translateX(-50%)' },
    'hex-top-right': { top: '18%', right: '3%', transform: 'none' },
    'hex-bottom-right': { bottom: '18%', right: '3%', transform: 'none' },
    'hex-top-left': { top: '18%', left: '3%', transform: 'none' },
    'hex-bottom-left': { bottom: '18%', left: '3%', transform: 'none' }
  };
  
  const style = {
    position: 'absolute',
    ...positionStyles[position],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(1px, 0.3vh, 3px)',
    zIndex: 20,
    maxWidth: '11%'
  };
  
  // 队伍颜色：A 队绿色，B 队红色
  const teamColor = team === 0 ? '#4CAF50' : '#f44336';
  
  return (
    <div style={style}>
      {/* 玩家信息 */}
      <div style={{
        padding: 'clamp(2px, 0.5vh, 4px) clamp(6px, 1.5vw, 10px)',
        backgroundColor: isCurrent ? '#ffeb3b' : '#fff',
        borderRadius: '8px',
        fontSize: 'clamp(9px, 2.2vw, 11px)',
        fontWeight: 'bold',
        border: `2px solid ${isCurrent ? '#ff9800' : teamColor}`,
        minWidth: 'clamp(40px, 9vw, 55px)',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        whiteSpace: 'nowrap'
      }}>
        {isYou ? '你' : `P${playerIdx + 1}`}
        <div style={{ fontSize: 'clamp(7px, 1.8vw, 9px)', fontWeight: 'normal', color: teamColor }}>
          {hand.length}张
        </div>
      </div>
      
      {/* 玩家出的牌 - 显示在座位前方 */}
      {tableCards && tableCards.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1px',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          padding: '2px',
          borderRadius: '4px',
          border: `1px solid ${teamColor}40`
        }}>
          {tableCards.map(card => (
            <Card key={card.id} card={card} small />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Game({ socket, gameState, playerIndex, onLeave, roomId }) {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleLeaveGame = () => {
    if (window.confirm('确定要退出游戏返回主页吗？')) {
      socket.emit('leaveRoom');
      if (onLeave) onLeave();
    }
  };

  const isMyTurn = gameState.currentPlayer === playerIndex;
  const myTeam = playerIndex % 2;
  const myHand = gameState.hands[playerIndex] || [];
  
  // 计算剩余牌统计
  const remainingCards = {
    '大王': gameState.hands.flat().filter(c => c.value === 'BJ').length,
    '小王': gameState.hands.flat().filter(c => c.value === 'SJ').length,
    '2': gameState.hands.flat().filter(c => c.value === '2').length,
    'A': gameState.hands.flat().filter(c => c.value === 'A').length,
    'K': gameState.hands.flat().filter(c => c.value === 'K').length,
  };

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    
    // 使用 lastPlayedCards 判断需要管什么，而不是 tableCards
    const needToBeat = gameState.lastPlayedCards && gameState.lastPlayedCards.length > 0 
      ? gameState.lastPlayedCards 
      : [];
    
    if (needToBeat.length > 0 && !canPlay(needToBeat, selectedCards)) {
      alert('这牌管不上！');
      return;
    }
    
    socket.emit('playCards', { cards: selectedCards });
    setSelectedCards([]);
  };

  const handlePass = () => {
    socket.emit('pass');
    setSelectedCards([]);
  };

  const handleCardClick = (card) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  // 获取其他玩家
  const otherPlayers = gameState.players || [];
  
  // 找到对家（同队另一个玩家）
  const teammateIndex = otherPlayers.findIndex((p, i) => i % 2 === myTeam && i !== playerIndex);
  const teammate = teammateIndex >= 0 ? otherPlayers[teammateIndex] : null;
  
  // 找到两个对手
  const opponents = otherPlayers.filter((p, i) => i % 2 !== myTeam);

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a4d8f 0%, #0d2847 50%, #1a4d8f 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 顶部信息栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexShrink: 0
      }}>
        <button
          onClick={handleLeaveGame}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← 退出
        </button>
        
        {/* 剩余牌统计 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {Object.entries(remainingCards).map(([card, count]) => (
            <div key={card} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '4px 10px',
              borderRadius: '12px'
            }}>
              <span style={{ color: '#fff', fontSize: '12px' }}>{card}</span>
              <span style={{ color: count > 0 ? '#ffd700' : '#666', fontSize: '14px', fontWeight: 'bold' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
        
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          🏠 {roomId}
        </div>
      </div>

      {/* 比分板 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        padding: '10px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 20px',
          backgroundColor: 'rgba(76, 175, 80, 0.3)',
          borderRadius: '20px',
          border: '2px solid #4CAF50'
        }}>
          <span style={{ color: '#4CAF50', fontSize: '18px' }}>🅰️</span>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{gameState.teamScores[0]}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 20px',
          backgroundColor: 'rgba(244, 67, 54, 0.3)',
          borderRadius: '20px',
          border: '2px solid #f44336'
        }}>
          <span style={{ color: '#f44336', fontSize: '18px' }}>🅱️</span>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{gameState.teamScores[1]}</span>
        </div>
      </div>

      {/* 游戏主区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px 20px 20px'
      }}>
        {/* 上方 - 对手区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px 40px'
        }}>
          {opponents.slice(0, 2).map((player, idx) => {
            const pIdx = otherPlayers.findIndex(p => p.name === player.name);
            return (
              <PlayerAvatar
                key={idx}
                player={player}
                isYou={false}
                isCurrent={gameState.currentPlayer === pIdx}
                team={pIdx % 2}
                handCount={gameState.hands[pIdx]?.length || 0}
              />
            );
          })}
        </div>

        {/* 中央 - 出牌区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          {/* 游戏标题 */}
          <div style={{
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 'bold',
            color: 'rgba(255,255,255,0.3)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            🃏 东北抛幺 414
          </div>
          
          {/* 出牌区域 - 白色底板 */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minHeight: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {gameState.lastPlayedCards && gameState.lastPlayedCards.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {gameState.lastPlayedCards.map(card => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '16px' }}>等待出牌</div>
            )}
            
            {/* 借光提示 */}
            {gameState.messages?.[gameState.messages.length - 1]?.includes('借光') && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                backgroundColor: '#FFD700',
                color: '#000',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                ✨ 借光！
              </div>
            )}
          </div>
          
          {/* 消息区 */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '10px 20px',
            maxWidth: '600px',
            maxHeight: '80px',
            overflow: 'hidden'
          }}>
            {gameState.messages?.slice(-3).map((msg, i) => (
              <div key={i} style={{ color: '#fff', fontSize: '14px', margin: '4px 0' }}>{msg}</div>
            ))}
          </div>
        </div>

        {/* 下方 - 对家和自己的区域 */}
        <div>
          {/* 对家 */}
          {teammate && teammateIndex !== playerIndex && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px'
            }}>
              <PlayerAvatar
                player={teammate}
                isYou={false}
                isCurrent={gameState.currentPlayer === teammateIndex}
                team={myTeam}
                handCount={gameState.hands[teammateIndex]?.length || 0}
              />
            </div>
          )}
          
          {/* 手牌区域 */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '20px 20px 0 0',
            padding: '20px',
            paddingBottom: '10px'
          }}>
            {/* 提示信息 */}
            {isMyTurn && gameState.lastPlayedCards && gameState.lastPlayedCards.length > 0 && (
              <div style={{ 
                textAlign: 'center',
                marginBottom: '10px',
                color: '#ffd700',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                🎴 需要管上上面的牌
              </div>
            )}
            
            {isMyTurn && (!gameState.lastPlayedCards || gameState.lastPlayedCards.length === 0) && (
              <div style={{ 
                textAlign: 'center',
                marginBottom: '10px',
                color: '#4CAF50',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ✨ 你是先手，任意出牌
              </div>
            )}
            
            {/* 手牌 */}
            <Hand 
              cards={myHand} 
              selectedCards={selectedCards}
              onCardClick={(card) => {
                if (selectedCards.find(c => c.id === card.id)) {
                  setSelectedCards(selectedCards.filter(c => c.id !== card.id));
                } else {
                  setSelectedCards([...selectedCards, card]);
                }
              }}
              canPlay={isMyTurn}
              isPlayer={true}
            />
            
            {/* 操作按钮 */}
            {isMyTurn && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '10px'
              }}>
                <button 
                  onClick={() => {
                    socket.emit('playCards', { cards: selectedCards });
                    setSelectedCards([]);
                  }}
                  disabled={selectedCards.length === 0}
                  style={{ 
                    padding: '14px 40px', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                    backgroundColor: selectedCards.length > 0 ? 'linear-gradient(180deg, #4CAF50, #2E7D32)' : '#666',
                    backgroundImage: selectedCards.length > 0 ? 'linear-gradient(180deg, #4CAF50, #2E7D32)' : 'none',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    boxShadow: selectedCards.length > 0 ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none'
                  }}
                >
                  出牌 ({selectedCards.length}张)
                </button>
                <button 
                  onClick={() => socket.emit('pass')}
                  disabled={gameState.lastPlayedCards?.length === 0}
                  style={{ 
                    padding: '14px 40px', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    cursor: gameState.lastPlayedCards?.length > 0 ? 'pointer' : 'not-allowed',
                    backgroundColor: gameState.lastPlayedCards?.length > 0 ? '#ff9800' : '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    boxShadow: gameState.lastPlayedCards?.length > 0 ? '0 4px 15px rgba(255, 152, 0, 0.4)' : 'none'
                  }}
                >
                  过
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 游戏结束弹窗 */}
      {gameState.gameState === 'finished' && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>🏆 游戏结束</h2>
            <p style={{ fontSize: '20px', marginBottom: '20px' }}>
              {gameState.teamScores[0] > gameState.teamScores[1] ? 'A 队' : 'B 队'} 胜利！
            </p>
            <p style={{ fontSize: '16px', color: '#666' }}>
              比分：{gameState.teamScores[0]} - {gameState.teamScores[1]}
            </p>
          </div>
        </div>
      )}
      
      {/* 牌桌区 */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(35px, 7vh, 55px)',
        boxSizing: 'border-box'
      }}>
        {/* 六边形桌面 */}
        <div style={{
          width: 'min(40vw, 350px)',
          height: 'min(37vw, 320px)',
          backgroundColor: '#2d5016',
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* 当前出的牌（中央） */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2px',
            justifyContent: 'center',
            maxWidth: 'min(30vw, 150px)',
            zIndex: 10
          }}>
            {gameState.tableCards.length > 0 ? (
              gameState.tableCards.map(card => (
                <Card key={card.id} card={card} small />
              ))
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px, 2.5vw, 12px)', textAlign: 'center' }}>
                等待出牌
              </div>
            )}
          </div>
        </div>
        
        {/* 玩家座位 */}
        {gameState.players && gameState.players.map((player, idx) => (
          <PlayerSeat
            key={idx}
            playerIdx={idx}
            hand={gameState.hands[idx] || []}
            tableCards={[]}
            isCurrent={gameState.currentPlayer === idx}
            isYou={idx === playerIndex}
            position={playerPositions[idx]}
            team={player.team}
          />
        ))}
      </div>
      
      {/* 消息区 */}
      <div style={{ 
        padding: 'clamp(6px, 1.5vh, 10px) clamp(10px, 3vw, 15px)', 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        fontSize: 'clamp(11px, 2.5vw, 13px)',
        minHeight: 'clamp(30px, 6vh, 50px)',
        maxHeight: 'clamp(30px, 8vh, 60px)',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {gameState.messages.map((msg, i) => (
          <div key={i} style={{ margin: '2px 0' }}>{msg}</div>
        ))}
      </div>
      
      {/* 个人区 - 手牌 + 操作 */}
      <div style={{ 
        padding: 'clamp(8px, 2vh, 12px)', 
        backgroundColor: '#e8f5e9', 
        borderRadius: '10px',
        border: isMyTurn ? '2px solid #4CAF50' : '2px solid #ddd',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* 需要管上的牌提示 */}
        {isMyTurn && gameState.lastPlayedCards && gameState.lastPlayedCards.length > 0 && (
          <div style={{ 
            padding: 'clamp(6px, 1.5vh, 10px)', 
            backgroundColor: '#fff3e0', 
            borderRadius: '8px',
            marginBottom: 'clamp(6px, 1.5vh, 10px)',
            textAlign: 'center',
            border: '1px solid #ffb74d'
          }}>
            <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 'bold', color: '#e65100', marginBottom: '4px' }}>
              🎴 需要管上：
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
              {gameState.lastPlayedCards.map(card => (
                <Card key={card.id} card={card} small />
              ))}
            </div>
          </div>
        )}
        
        {/* 先手提示 */}
        {isMyTurn && (!gameState.lastPlayedCards || gameState.lastPlayedCards.length === 0) && (
          <div style={{ 
            padding: 'clamp(6px, 1.5vh, 10px)', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            marginBottom: 'clamp(6px, 1.5vh, 10px)',
            textAlign: 'center',
            border: '1px solid #64b5f6'
          }}>
            <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 'bold', color: '#1565c0' }}>
              ✨ 你是先手，任意出牌
            </div>
          </div>
        )}
        
        <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', marginBottom: 'clamp(6px, 1.5vh, 10px)', textAlign: 'center', fontWeight: 'bold' }}>
          你的手牌 ({myHand.length}张) {isMyTurn && <span style={{ color: '#4CAF50' }}>⏳ 请出牌</span>}
        </div>
        <Hand 
          cards={myHand} 
          selectedCards={selectedCards}
          onCardClick={handleCardClick}
          canPlay={isMyTurn}
          isPlayer={true}
        />
        
        {isMyTurn && (
          <div style={{ marginTop: 'clamp(8px, 2vh, 12px)', textAlign: 'center', display: 'flex', gap: 'clamp(10px, 3vw, 15px)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handlePlayCards}
              disabled={selectedCards.length === 0}
              style={{ 
                padding: 'clamp(8px, 2vh, 12px) clamp(20px, 5vw, 30px)', 
                fontSize: 'clamp(14px, 3.5vw, 16px)', 
                cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                backgroundColor: selectedCards.length > 0 ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                flex: '0 1 auto'
              }}
            >
              出牌 ({selectedCards.length}张)
            </button>
            <button 
              onClick={handlePass}
              disabled={gameState.tableCards.length === 0}
              style={{ 
                padding: 'clamp(8px, 2vh, 12px) clamp(20px, 5vw, 30px)', 
                fontSize: 'clamp(14px, 3.5vw, 16px)', 
                cursor: gameState.tableCards.length > 0 ? 'pointer' : 'not-allowed',
                backgroundColor: gameState.tableCards.length > 0 ? '#ff9800' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                flex: '0 1 auto'
              }}
            >
              过
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
