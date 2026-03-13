import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Game from './Game.jsx';

// 自动检测：如果是局域网访问，使用服务器 IP
const getSocketUrl = () => {
  // 优先使用环境变量
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  // 如果是局域网 IP 访问，使用相同的 IP
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export default function App() {
  // 立即从 localStorage 读取状态（在组件渲染前）
  const savedState = (() => {
    try {
      const saved = localStorage.getItem('poker414_lastRoom');
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📖 页面加载时读取 localStorage:', data);
        return data;
      }
    } catch (e) {
      console.error('读取 localStorage 失败:', e);
    }
    return null;
  })();
  
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState(savedState?.screen || 'menu');
  const [playerName, setPlayerName] = useState(savedState?.playerName || '');
  const [roomId, setRoomId] = useState(savedState?.roomId || '');
  const [roomName, setRoomName] = useState('');
  const [gameState, setGameState] = useState(savedState?.gameState || null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [lastRoomId, setLastRoomId] = useState(savedState?.roomId || '');

  useEffect(() => {
    // 如果有保存的房间，自动连接并加入
    if (savedState?.roomId && savedState?.playerName) {
      console.log('🔄 自动连接房间:', savedState.roomId, savedState.playerName);
    }
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    newSocket.on('connect', () => {
      console.log('Socket 连接成功');
      setConnected(true);
      
      // 自动加入保存的房间
      if (savedState?.roomId && savedState?.playerName) {
        console.log('🔌 自动加入房间:', savedState.roomId, savedState.playerName);
        setTimeout(() => {
          newSocket.emit('joinRoom', { playerName: savedState.playerName, roomId: savedState.roomId.toUpperCase() });
        }, 500);
      }
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket 连接失败:', err.message);
      setError('无法连接服务器，正在重试...');
      setConnected(false);
    });
    
    setSocket(newSocket);

    newSocket.on('roomCreated', (data) => {
      setRoomId(data.roomId);
      setPlayerIndex(data.playerIndex);
      setScreen('lobby');
      // 保存状态
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId: data.roomId,
        playerName: savedState?.playerName || playerName,
        screen: 'lobby',
        gameState: null
      }));
    });

    newSocket.on('roomJoined', (data) => {
      console.log('=== 加入房间 ===', data);
      setRoomId(data.roomId);
      setPlayerIndex(data.playerIndex);
      setLastRoomId(data.roomId);
      setScreen('lobby'); // ✅ 切换到准备页面
      
      console.log('🏠 已加入房间，切换到 lobby 页面');
      
      // 更新 localStorage
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId: data.roomId,
        playerName: savedState?.playerName || playerName,
        screen: 'lobby',
        gameState: gameState
      }));
    });

    newSocket.on('playerJoined', (state) => {
      console.log('📥 收到 playerJoined:', state.gameState);
      setGameState(state);
      // 更新 localStorage
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId: roomId,
        playerName: savedState?.playerName || playerName,
        screen: screen,  // 保持当前 screen
        gameState: state
      }));
    });

    newSocket.on('playerReady', (state) => {
      console.log('✅ 玩家准备状态更新');
      setGameState(state);
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId,
        playerName: savedState?.playerName || playerName,
        screen,
        gameState: state
      }));
    });

    newSocket.on('gameStart', (state) => {
      console.log('🎮 游戏开始');
      setGameState(state);
      setScreen('game');
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId,
        playerName: savedState?.playerName || playerName,
        screen: 'game',
        gameState: state
      }));
    });

    newSocket.on('gameUpdate', (state) => {
      console.log('🔄 游戏更新:', state?.gameState);
      setGameState(state);
      localStorage.setItem('poker414_lastRoom', JSON.stringify({
        roomId,
        playerName: savedState?.playerName || playerName,
        screen,
        gameState: state
      }));
    });

    newSocket.on('playerLeft', (state) => {
      setGameState(state);
    });

    newSocket.on('roomLeft', () => {
      console.log('🚪 已离开房间');
      setScreen('menu');
      setRoomId('');
      setGameState(null);
      localStorage.removeItem('poker414_lastRoom');
    });

    newSocket.on('roomDestroyed', (data) => {
      console.log('💥 房间被销毁:', data.message);
      setError(data.message);
      setScreen('menu');
      setRoomId('');
      setGameState(null);
      localStorage.removeItem('poker414_lastRoom');
    });

    newSocket.on('error', (data) => {
      console.error('Socket 错误:', data);
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });
    
    newSocket.on('disconnect', () => {
      console.log('⚠️ Socket 断开连接，正在重连...');
      setConnected(false);
      // 不断开页面，保持当前状态等待重连
      if (screen === 'game' && gameState) {
        console.log('保持游戏页面显示，等待重连');
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // 每次 screen 变化时更新 localStorage
  useEffect(() => {
    if (roomId && playerName && (screen === 'lobby' || screen === 'game')) {
      const saved = localStorage.getItem('poker414_lastRoom');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.roomId === roomId) {
            data.screen = screen;
            localStorage.setItem('poker414_lastRoom', JSON.stringify(data));
            console.log('📝 更新页面状态:', screen);
          }
        } catch (e) {
          console.error('更新失败:', e);
        }
      }
    }
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!socket) {
      setError('正在连接服务器...');
      return;
    }
    console.log('创建房间:', { playerName, roomName });
    socket.emit('createRoom', { playerName, roomName });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomId.trim()) {
      setError('请输入房间号');
      return;
    }
    // 手动加入时，先保存到 localStorage，然后加入房间
    localStorage.setItem('poker414_lastRoom', JSON.stringify({
      roomId: roomId.toUpperCase(),
      playerName,
      screen: 'lobby',
      gameState: null
    }));
    socket.emit('joinRoom', { playerName, roomId: roomId.toUpperCase() });
  };

  const ready = () => {
    socket.emit('ready');
  };

  // 渲染游戏页面 - 只要 screen 是 game 就显示，gameState 为 null 时显示加载中
  if (screen === 'game') {
    if (!gameState) {
      // 正在加载游戏状态
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ fontSize: '24px' }}>🃏 东北抛幺 414</div>
          <div style={{ fontSize: '16px', color: '#666' }}>正在加载游戏...</div>
          <div style={{ fontSize: '12px', color: '#999' }}>房间：{roomId || '???'}</div>
        </div>
      );
    }
    return <Game socket={socket} gameState={gameState} playerIndex={playerIndex} onLeave={() => {
      localStorage.removeItem('poker414_lastRoom');
      setScreen('menu');
    }} roomId={roomId} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 'clamp(20px, 5vw, 40px)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: 'clamp(20px, 5vw, 28px)' }}>
          🃏 东北抛幺 414
        </h1>
        
        {screen === 'menu' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>昵称</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>创建房间</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="房间名称（可选）"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={createRoom}
                disabled={!connected}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: connected ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: connected ? 'pointer' : 'not-allowed',
                  marginTop: '10px'
                }}
              >
                {connected ? '创建房间' : '连接中...'}
              </button>
            </div>
            
            {/* 快速返回房间 */}
            {lastRoomId && (
              <>
                <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }} />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>🏠 快速返回</label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>上次房间：</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '3px' }}>{lastRoomId}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!playerName.trim()) {
                        setError('请先输入昵称');
                        return;
                      }
                      socket.emit('joinRoom', { playerName, roomId: lastRoomId.toUpperCase() });
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: '#9C27B0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    返回房间
                  </button>
                </div>
              </>
            )}
            
            <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }} />
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>加入房间</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="输入 6 位房间号"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={joinRoom}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                加入房间
              </button>
            </div>
          </>
        )}
        
        {screen === 'lobby' && gameState && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>🏠 房间号</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '5px', color: '#2196F3' }}>{roomId}</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>分享给朋友，邀请他们加入</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>玩家列表</h3>
              {gameState.players.map((player, i) => (
                <div key={i} style={{
                  padding: '10px',
                  backgroundColor: player.ready ? '#e8f5e9' : '#f5f5f5',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{player.name} {i === playerIndex && '(你)'}</span>
                  <span style={{ 
                    padding: '2px 8px', 
                    backgroundColor: player.team === 0 ? '#4CAF50' : '#f44336',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {player.team === 0 ? 'A 队' : 'B 队'}
                  </span>
                  {player.ready && <span>✅</span>}
                </div>
              ))}
            </div>
            
            {/* 房主开始游戏按钮 */}
            {playerIndex === 0 && (
              <>
                {/* 机器人管理 */}
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🤖 机器人管理</span>
                    <button
                      onClick={() => socket.emit('addBot')}
                      disabled={gameState.players.length >= 6}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: gameState.players.length >= 6 ? '#ccc' : '#8BC34A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: gameState.players.length >= 6 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      + 添加机器人
                    </button>
                  </div>
                  {gameState.players.filter(p => p.isBot).map((bot, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px'
                    }}>
                      <span>🤖 {bot.name}</span>
                      <button
                        onClick={() => socket.emit('removeBot', { botId: gameState.players.find(p => p.name === bot.name && p.isBot)?.socketId })}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        移除
                      </button>
                    </div>
                  ))}
                  {gameState.players.filter(p => p.isBot).length === 0 && (
                    <p style={{ fontSize: '12px', color: '#999', margin: '5px 0' }}>点击添加机器人，单人也能玩</p>
                  )}
                </div>
                
                <button
                  onClick={() => socket.emit('startGame')}
                  disabled={gameState.gameState !== 'waiting' || gameState.players.length < 1 || !gameState.players.every(p => p.ready)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: gameState.players.length >= 1 && gameState.players.every(p => p.ready) ? '#2196F3' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: gameState.players.length >= 1 && gameState.players.every(p => p.ready) ? 'pointer' : 'not-allowed',
                    marginBottom: '10px'
                  }}
                >
                  {gameState.players.every(p => p.ready) ? `开始游戏 (${gameState.players.length}/6)` : `等待准备 (${gameState.players.filter(p => p.ready).length}/${gameState.players.length})`}
                </button>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => socket.emit('ready')}
                disabled={gameState.gameState !== 'waiting'}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: gameState.players[playerIndex]?.ready ? '#ff9800' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: gameState.gameState !== 'waiting' ? 'not-allowed' : 'pointer'
                }}
              >
                {gameState.players[playerIndex]?.ready ? '取消准备' : '准备'}
              </button>
              <button
                onClick={() => socket.emit('leaveRoom')}
                disabled={gameState.gameState !== 'waiting'}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: gameState.gameState !== 'waiting' ? 'not-allowed' : 'pointer'
                }}
              >
                退出房间
              </button>
            </div>
            
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#666' }}>
              等待 {6 - gameState.players.length} 名玩家...
            </p>
          </>
        )}
        
        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f44336',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
