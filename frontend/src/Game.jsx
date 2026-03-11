import React, { useState } from 'react';
import { analyzeHand, canPlay, getHandTypeName } from './game/rules.js';
import { calculateTableScore } from './game/scoring.js';
import Hand from './Hand.jsx';
import Card from './Card.jsx';

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

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    
    if (gameState.tableCards.length > 0 && !canPlay(gameState.tableCards, selectedCards)) {
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

  const isMyTurn = gameState.currentPlayer === playerIndex;
  const myTeam = playerIndex % 2;
  const myHand = gameState.hands[playerIndex] || [];

  // 获取每个玩家的位置（按顺时针）
  const playerPositions = ['hex-bottom', 'hex-bottom-right', 'hex-top-right', 'hex-top', 'hex-top-left', 'hex-bottom-left'];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      padding: 'clamp(8px, 2vw, 15px)',
      boxSizing: 'border-box',
      maxWidth: '1200px',
      margin: '0 auto',
      gap: 'clamp(6px, 1.5vh, 10px)',
      backgroundColor: '#f0f0f0'
    }}>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleLeaveGame}
            style={{
              padding: 'clamp(6px, 1.5vh, 10px) clamp(12px, 3vw, 20px)',
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: 'clamp(12px, 3vw, 14px)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← 返回主页
          </button>
          <h1 style={{ fontSize: 'clamp(16px, 4vw, 24px)', margin: 0 }}>🃏 东北抛幺 414</h1>
          <div style={{ 
            padding: 'clamp(4px, 1vh, 8px) clamp(10px, 3vw, 15px)', 
            backgroundColor: '#e3f2fd', 
            color: '#1976D2',
            borderRadius: '6px',
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: 'bold'
          }}>
            🏠 {roomId || '---'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'clamp(10px, 3vw, 15px)', flexWrap: 'wrap' }}>
          <div style={{ padding: 'clamp(4px, 1vh, 6px) clamp(10px, 3vw, 15px)', backgroundColor: '#4CAF50', color: 'white', borderRadius: '6px', fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 'bold' }}>
            A 队：{gameState.teamScores[0]}
          </div>
          <div style={{ padding: 'clamp(4px, 1vh, 6px) clamp(10px, 3vw, 15px)', backgroundColor: '#f44336', color: 'white', borderRadius: '6px', fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 'bold' }}>
            B 队：{gameState.teamScores[1]}
          </div>
        </div>
      </div>

      {/* 游戏结束 */}
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
