import React, { useState, useEffect } from 'react';
import Card from './Card.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 手牌组件
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer }) {
  const [localSelected, setLocalSelected] = useState([]);
  
  // 当外部 selectedCards 清空时，同步清空本地选中状态
  useEffect(() => {
    if (!selectedCards || selectedCards.length === 0) {
      setLocalSelected([]);
    }
  }, [selectedCards]);
  
  if (!cards || cards.length === 0) {
    return <div style={{ padding: '20px', color: '#999' }}>手牌为空</div>;
  }
  
  // 按大小排序
  const sortedCards = [...cards].sort((a, b) => CARD_ORDER[b.value] - CARD_ORDER[a.value]);
  
  const handleClick = (card) => {
    if (!isPlayer) return;
    
    if (localSelected.includes(card.id)) {
      setLocalSelected(localSelected.filter(id => id !== card.id));
    } else {
      setLocalSelected([...localSelected, card.id]);
    }
    
    if (onCardClick) {
      onCardClick(card);
    }
  };
  
  const isSelected = (card) => {
    return selectedCards?.some(c => c.id === card.id) || localSelected.includes(card.id);
  };
  
  // 计算行数：每行最多 15 张牌，最多 3 行
  const cardsPerRow = Math.ceil(sortedCards.length / 3);
  const maxPerRow = 15;
  const actualPerRow = Math.min(cardsPerRow, maxPerRow);
  const rows = [];
  for (let i = 0; i < sortedCards.length; i += actualPerRow) {
    rows.push(sortedCards.slice(i, i + actualPerRow));
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
      gap: '4px'
    }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '2px'
        }}>
          {row.map(card => (
            <Card
              key={card.id}
              card={card}
              selected={isSelected(card)}
              onClick={() => handleClick(card)}
              disabled={!canPlay && isPlayer}
              small
            />
          ))}
        </div>
      ))}
    </div>
  );
}
