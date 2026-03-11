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
            fontSize: '14px'
          }}>
            ⏳
          </div>
        )}
      </div>
      
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
  
  const otherPlayers = gameState.players || [];
  const teammateIndex = otherPlayers.findIndex((p, i) => i % 2 === myTeam && i !== playerIndex);
  const teammate = teammateIndex >= 0 ? otherPlayers[teammateIndex] : null;
  const opponents = otherPlayers.filter((p, i) => i % 2 !== myTeam);

  // 游戏结束
  if (gameState.gameState === 'finished') {
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
            {gameState.teamScores[myTeam] > gameState.teamScores[1 - myTeam] ? '🎉 你赢了！' : '😢 你输了'}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
            <span style={{ color: '#4CAF50' }}>A 队 {gameState.teamScores[0]}</span>
            {' vs '}
            <span style={{ color: '#f44336' }}>B 队 {gameState.teamScores[1]}</span>
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

  // 移动端检测
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div style={{ 
      minHeight: '100vh',
      height: isMobile ? '100dvh' : '100vh', // 移动端使用动态视口高度
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
            cursor: 'pointer'
          }}
        >
          ← 退出
        </button>
        
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
          <div style={{
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 'bold',
            color: 'rgba(255,255,255,0.3)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            🃏 东北抛幺 414
          </div>
          
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: isMobile ? '12px 20px' : '20px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minHeight: isMobile ? '90px' : '120px',
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

        {/* 下方 - 自己的手牌区域 */}
        <div>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: isMobile ? '12px 12px 0 0' : '20px 20px 0 0',
            padding: isMobile ? '10px' : '20px',
            paddingBottom: isMobile ? '5px' : '10px'
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
            />
            
            {isMyTurn && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: isMobile ? '10px' : '20px',
                marginTop: isMobile ? '10px' : '20px',
                marginBottom: isMobile ? '5px' : '10px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => {
                    console.log('出牌:', selectedCards);
                    if (socket) {
                      socket.emit('playCards', { cards: selectedCards });
                      setSelectedCards([]);
                    } else {
                      alert('Socket 未连接！');
                    }
                  }}
                  disabled={selectedCards.length === 0}
                  style={{ 
                    padding: isMobile ? '10px 24px' : '14px 40px', 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: 'bold',
                    cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                    backgroundColor: selectedCards.length > 0 ? '#4CAF50' : '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    boxShadow: selectedCards.length > 0 ? '0 4px 15px rgba(76, 175, 80, 0.4)' : 'none',
                    minWidth: '100px'
                  }}
                >
                  出牌 ({selectedCards.length}张)
                </button>
                <button 
                  onClick={() => {
                    console.log('过');
                    if (socket) socket.emit('pass');
                  }}
                  disabled={gameState.lastPlayedCards?.length === 0}
                  style={{ 
                    padding: isMobile ? '10px 24px' : '14px 40px', 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: 'bold',
                    cursor: gameState.lastPlayedCards?.length > 0 ? 'pointer' : 'not-allowed',
                    backgroundColor: gameState.lastPlayedCards?.length > 0 ? '#ff9800' : '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    boxShadow: gameState.lastPlayedCards?.length > 0 ? '0 4px 15px rgba(255, 152, 0, 0.4)' : 'none',
                    minWidth: '80px'
                  }}
                >
                  过
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
