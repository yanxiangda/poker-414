import React from 'react';
import { CARD_ORDER } from './game/deck.js';

/**
 * 卡牌组件 - 参考斗地主风格，移动端适配
 */
export default function Card({ card, onClick, selected, disabled, small }) {
  if (!card) return null;
  
  const isRed = card.suit === '♥' || card.suit === '♦';
  const isKing = card.value === 'SJ' || card.value === 'BJ';
  
  // 响应式尺寸：手机端更大，桌面端适中
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const width = small ? (isMobile ? '45px' : '40px') : (isMobile ? '55px' : '70px');
  const height = small ? (isMobile ? '65px' : '56px') : (isMobile ? '80px' : '100px');
  const fontSize = small ? (isMobile ? '15px' : '14px') : (isMobile ? '18px' : '20px');
  const suitSize = small ? (isMobile ? '13px' : '12px') : (isMobile ? '15px' : '16px');
  
  const style = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width,
    height,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    margin: '2px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transform: selected ? 'translateY(-15px)' : 'none',
    boxShadow: selected 
      ? '0 -5px 15px rgba(0,0,0,0.3), 0 0 0 2px #ffd700' 
      : '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    fontSize,
    fontWeight: 'bold',
    color: isRed ? '#d32f2f' : '#1a1a1a',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden'
  };
  
  const renderContent = () => {
    if (isKing) {
      return (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          <div style={{ fontSize: small ? '16px' : '24px' }}>
            {card.value === 'BJ' ? '👑' : '🌟'}
          </div>
          <div style={{ fontSize: small ? '10px' : '12px', color: isRed ? '#d32f2f' : '#1a1a1a' }}>
            {card.value === 'BJ' ? '大王' : '小王'}
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div style={{ fontSize: suitSize, lineHeight: '1', color: isRed ? '#d32f2f' : '#1a1a1a' }}>
          {card.suit}
        </div>
        <div style={{ lineHeight: '1.1', fontSize: small ? '16px' : '22px' }}>
          {card.value}
        </div>
      </>
    );
  };
  
  return (
    <div style={style} onClick={() => !disabled && onClick && onClick(card)}>
      {renderContent()}
    </div>
  );
}

/**
 * 卡牌背面
 */
export function CardBack({ small }) {
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: small ? '40px' : '70px',
    height: small ? '56px' : '100px',
    backgroundColor: '#1a5f7a',
    border: '1px solid #0d3d4d',
    borderRadius: '8px',
    margin: '2px',
    backgroundImage: 'repeating-linear-gradient(45deg, #1a5f7a 0, #1a5f7a 10px, #155065 10px, #155065 20px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  };
  
  return <div style={style} />;
}
