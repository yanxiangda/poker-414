import React from 'react';
import { CARD_ORDER } from './game/deck.js';

/**
 * 卡牌组件
 */
export default function Card({ card, onClick, selected, disabled, small }) {
  if (!card) return null;
  
  const isRed = card.suit === '♥' || card.suit === '♦';
  const isKing = card.value === 'SJ' || card.value === 'BJ';
  
  const style = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: small ? '32px' : '60px',
    height: small ? '44px' : '84px',
    backgroundColor: 'white',
    border: '1px solid #333',
    borderRadius: '4px',
    margin: '1px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transform: selected ? 'translateY(-8px)' : 'none',
    boxShadow: selected ? '0 3px 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'all 0.15s',
    fontSize: small ? '12px' : '18px',
    fontWeight: 'bold',
    color: isRed ? '#c00' : '#333',
    userSelect: 'none'
  };
  
  const renderContent = () => {
    if (isKing) {
      return (
        <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
          <div style={{ fontSize: small ? '10px' : '14px' }}>{card.value === 'BJ' ? '👑' : '🤡'}</div>
          <div style={{ fontSize: small ? '8px' : '10px' }}>
            {card.value === 'BJ' ? '大王' : '小王'}
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div style={{ fontSize: small ? '8px' : '12px', lineHeight: '1' }}>{card.suit}</div>
        <div style={{ lineHeight: '1' }}>{card.value}</div>
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
    width: small ? '32px' : '60px',
    height: small ? '44px' : '84px',
    backgroundColor: '#1a5f7a',
    border: '1px solid #0d3d4d',
    borderRadius: '4px',
    margin: '1px',
    backgroundImage: 'repeating-linear-gradient(45deg, #1a5f7a 0, #1a5f7a 10px, #155065 10px, #155065 20px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  };
  
  return <div style={style} />;
}
