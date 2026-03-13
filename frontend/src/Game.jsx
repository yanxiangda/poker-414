import React, { useState, useEffect } from 'react';
import { analyzeHand, canPlay, getHandTypeName } from './game/rules.js';
import { calculateTableScore } from './game/scoring.js';
import Hand from './Hand.jsx';
import Card from './Card.jsx';
import { SimpleCardAnimation } from './CardAnimation.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 玩家头像组件
 */
function PlayerAvatar({ player, isYou, isCurrent, team, handCount, windowWidth }) {
  const teamColor = team === 0 ? '#4CAF50' : '#f44336';
  const bgColor = isCurrent ? '#FFD700' : '#1a4d8f';
  
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 400;
  
  const avatarSize = isSmallMobile ? '50px' : isMobile ? '60px' : '80px';
  const fontSize = isSmallMobile ? '20px' : isMobile ? '24px' : '36px';
  const infoFontSize = isSmallMobile ? '11px' : isMobile ? '12px' : '14px';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px'
    }}>
      <div style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        backgroundColor: bgColor,
        border: `3px solid ${teamColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        position: 'relative',
        flexShrink: 0
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
            fontSize: '14px'
          }}>
            ⏳
          </div>
        )}
      </div>
      
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: '12px',
        padding: isMobile ? '4px 8px' : '6px 12px',
        textAlign: 'center',
        minWidth: isSmallMobile ? '60px' : '80px'
      }}>
        <div style={{ color: '#fff', fontSize: infoFontSize, fontWeight: 'bold' }}>
          {isYou ? '你' : player?.name || `P${team + 1}`}
        </div>
        <div style={{ color: '#ffd700', fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '13px' }}>
          {handCount}张
        </div>
      </div>
    </div>
  );
}

export default function Game({ socket, gameState, playerIndex, onLeave, roomId }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1024, height: typeof window !== 'undefined' ? window.innerHeight : 768 });
  const [animatingCards, setAnimatingCards] = useState(null); // 正在动画的牌
  
  // 监听窗口大小变化，实时适配屏幕
  React.useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleLeaveGame = () => {
    if (window.confirm('确定要退出游戏返回主页吗？')) {
      socket.emit('leaveRoom');
      if (onLeave) onLeave();
    }
  };

  // 游戏结束检查（优先判断，避免后续代码崩溃）
  if (gameState && gameState.gameState === 'finished') {
    const myTeam = playerIndex % 2;
    const teamScores = gameState.teamScores || [0, 0];
    
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a4d8f 0%, #0d2847 50%, #1a4d8f 100%)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#1a4d8f' }}>🏆 游戏结束</h1>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>
            {teamScores[myTeam] > teamScores[1 - myTeam] ? '🎉 你赢了！' : '😢 你输了'}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
            <span style={{ color: '#4CAF50' }}>A 队 {teamScores[0]}</span>
            {' vs '}
            <span style={{ color: '#f44336' }}>B 队 {teamScores[1]}</span>
          </p>
          <button
            onClick={handleLeaveGame}
            style={{
              padding: '14px 40px',
              fontSize: '18px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer'
            }}
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }
  
  // gameState 为 null 时的保护
  if (!gameState) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a4d8f 0%, #0d2847 50%, #1a4d8f 100%)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#1a4d8f' }}>⏳ 加载中...</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>正在等待游戏数据</p>
        </div>
      </div>
    );
  }

  const isMyTurn = gameState?.currentPlayer === playerIndex;
  const myTeam = playerIndex % 2;
  const myHand = gameState?.hands?.[playerIndex] || [];
  
  // 检查选中的牌能否管上
  const canBeatLastCards = () => {
    if (!isMyTurn || selectedCards.length === 0) return false;
    if (!gameState?.lastPlayedCards || gameState.lastPlayedCards.length === 0) return true; // 先手
    return canPlay(gameState.lastPlayedCards, selectedCards);
  };
  
  const canPlayCards = canBeatLastCards();
  
  // 响应式尺寸计算
  const isMobile = windowSize.width < 768;
  const isSmallMobile = windowSize.width < 400;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  
  const otherPlayers = gameState?.players || [];
  const teammateIndex = otherPlayers.findIndex((p, i) => i % 2 === myTeam && i !== playerIndex);
  const teammate = teammateIndex >= 0 ? otherPlayers[teammateIndex] : null;
  const opponents = otherPlayers.filter((p, i) => i % 2 !== myTeam);
  
  return (
    <div style={{ 
      minHeight: '100vh',
      minHeight: isMobile ? '100dvh' : '100vh', // 移动端使用动态视口高度
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a4d8f 0%, #0d2847 50%, #1a4d8f 100%)',
      position: 'relative',
      overflowY: 'auto', // 允许垂直滚动
      overflowX: 'hidden'
    }}>
      {/* 顶部信息栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
        position: 'relative'
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
            zIndex: 10
          }}
        >
          ← 退出
        </button>
        
        {/* 标题居中 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(16px, 3vw, 24px)',
          fontWeight: 'bold',
          color: 'rgba(255,255,255,0.6)',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}>
          🃏 东北抛幺 414
        </div>
        
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 10
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
        {/* 上方 - 所有其他玩家（环绕布局） */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: isMobile ? '5px 10px' : '10px 20px',
          flexWrap: 'wrap',
          gap: isMobile ? '10px' : '20px'
        }}>
          {otherPlayers.map((player, idx) => {
            if (idx === playerIndex) return null; // 跳过自己
            const isTeammate = idx % 2 === myTeam;
            return (
              <PlayerAvatar
                key={idx}
                player={player}
                isYou={false}
                isCurrent={gameState.currentPlayer === idx}
                team={idx % 2}
                handCount={gameState.hands[idx]?.length || 0}
                windowWidth={windowSize.width}
              />
            );
          })}
        </div>

        {/* 中央 - 出牌区 */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '40%' : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          padding: '20px',
          zIndex: 5
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: isMobile ? '10px 15px' : '15px 30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            width: isMobile ? '80%' : '60%',
            maxWidth: '400px',
            minHeight: isMobile ? '80px' : '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {gameState.lastPlayedCards && gameState.lastPlayedCards.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                {gameState.lastPlayedCards.map(card => (
                  <Card key={card.id} card={card} windowWidth={windowSize.width} />
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '16px' }}>等待出牌</div>
            )}
            
            {gameState.messages?.[gameState.messages.length - 1]?.includes('借光') && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#FFD700',
                color: '#000',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}>
                ✨ 借光！
              </div>
            )}
          </div>
          
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '8px 15px',
            width: '100%',
            maxWidth: '600px',
            height: '60px', // 固定高度
            overflowY: 'auto', // 内部滚动
            fontSize: '12px',
            flexShrink: 0 // 不被压缩
          }}>
            {gameState.messages?.slice(-10).reverse().map((msg, i) => (
              <div key={i} style={{ color: '#fff', margin: '2px 0', opacity: i === 0 ? 1 : 0.7 }}>
                {msg}
              </div>
            ))}
          </div>
        </div>

        {/* 下方 - 自己的手牌区域 */}
        <div style={{
          paddingBottom: isMobile ? '10px' : '20px' // 确保底部有空间
        }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: isMobile ? '12px 12px 0 0' : '20px 20px 0 0',
            padding: isMobile ? '5px 8px' : '10px 15px',
            paddingBottom: '0'
          }}>
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
              windowWidth={windowSize.width}
              onReorder={(newOrder) => {
                console.log('📤 发送手牌顺序到服务器:', newOrder.length, '张');
                socket.emit('reorderCards', { cards: newOrder });
              }}
            />
          </div>
          
          {/* 出牌按钮和理牌按钮 - 放在手牌区域外面，确保可见 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '8px' : '15px',
            padding: isMobile ? '6px 8px' : '10px 15px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            flexWrap: 'wrap',
            flexShrink: 0,
            alignItems: 'center'
          }}>
            {/* 理牌按钮 - 始终可用 */}
            <button
              onClick={() => {
                // 按牌面大小排序
                const order = {'4':0,'5':1,'6':2,'7':3,'8':4,'9':5,'10':6,'J':7,'Q':8,'K':9,'A':10,'2':11,'3':12,'SJ':13,'BJ':14};
                const sorted = [...myHand].sort((a, b) => {
                  const orderA = order[a.value] !== undefined ? order[a.value] : 0;
                  const orderB = order[b.value] !== undefined ? order[b.value] : 0;
                  return orderB - orderA;
                });
                console.log('🎴 理牌：按大小排序', sorted.map(c => c.value));
                // 立即更新本地顺序（视觉反馈）
                socket.emit('reorderCards', { cards: sorted });
                // 清空选中状态
                setSelectedCards([]);
              }}
              style={{
                padding: isMobile ? '10px 24px' : '14px 40px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
                minWidth: '100px'
              }}
            >
              🎴 理牌
            </button>
            
            {/* 出牌按钮 - 自己的回合才可用 */}
            <button 
              onClick={() => {
                console.log('出牌:', selectedCards);
                if (socket) {
                  // 触发动画
                  if (selectedCards.length > 0) {
                    setAnimatingCards([...selectedCards]);
                  }
                  socket.emit('playCards', { cards: selectedCards });
                  setSelectedCards([]);
                } else {
                  alert('Socket 未连接！');
                }
              }}
              disabled={!isMyTurn || selectedCards.length === 0 || !canPlayCards}
              style={{ 
                padding: isMobile ? '10px 24px' : '14px 40px', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: 'bold',
                cursor: (isMyTurn && selectedCards.length > 0 && canPlayCards) ? 'pointer' : 'not-allowed',
                backgroundColor: (isMyTurn && selectedCards.length > 0 && canPlayCards) ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                boxShadow: (isMyTurn && selectedCards.length > 0 && canPlayCards) ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none',
                minWidth: '120px',
                opacity: !isMyTurn ? 0.5 : 1
              }}
            >
              {!isMyTurn ? '等待中...' : (selectedCards.length === 0 ? '选牌' : (canPlayCards ? `出牌 (${selectedCards.length}张)` : '❌ 管不起'))}
            </button>
            
            {/* 过按钮 - 自己的回合才可用 */}
            <button 
              onClick={() => {
                console.log('过');
                if (socket) socket.emit('pass');
              }}
              disabled={!isMyTurn || gameState.lastPlayedCards?.length === 0}
              style={{ 
                padding: isMobile ? '10px 24px' : '14px 40px', 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: 'bold',
                cursor: (isMyTurn && gameState.lastPlayedCards?.length > 0) ? 'pointer' : 'not-allowed',
                backgroundColor: (isMyTurn && gameState.lastPlayedCards?.length > 0) ? '#ff9800' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                boxShadow: (isMyTurn && gameState.lastPlayedCards?.length > 0) ? '0 4px 15px rgba(255, 152, 0, 0.4)' : 'none',
                minWidth: '80px',
                opacity: !isMyTurn ? 0.5 : 1
              }}
            >
              {!isMyTurn ? '等待中...' : '过'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 出牌动画 */}
      {animatingCards && (
        <SimpleCardAnimation 
          cards={animatingCards} 
          windowWidth={windowSize.width}
          onComplete={() => setAnimatingCards(null)}
        />
      )}
    </div>
  );
}
