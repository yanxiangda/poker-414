import React from 'react';
import Card from './Card.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 手牌组件 - 斗地主风格横向展开
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer }) {
  const [localSelected, setLocalSelected] = React.useState([]);
  
  // 当外部 selectedCards 清空时，同步清空本地选中状态
  React.useEffect(() => {
    if (!selectedCards || selectedCards.length === 0) {
      setLocalSelected([]);
    }
  }, [selectedCards]);
  
  if (!cards || cards.length === 0) {
    return <div style={{ padding: '20px', color: '#999', textAlign: 'center' }}>手牌为空</div>;
  }
  
  // 按大小排序
  const sortedCards = [...cards].sort((a, b) => CARD_ORDER[b.value] - CARD_ORDER[a.value]);
  
  const handleClick = (card) => {
    if (!isPlayer || !canPlay) return;
    
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
  
  // 斗地主风格：手牌横向展开，有重叠效果，移动端适配
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const overlap = isMobile ? '-25px' : '-35px'; // 移动端重叠少一些，牌更分散
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      padding: isMobile ? '5px 10px' : '10px 20px',
      minHeight: isMobile ? '100px' : '120px',
      overflowX: 'auto',
      gap: '0',
      WebkitOverflowScrolling: 'touch' // iOS 平滑滚动
    }}>
      {sortedCards.map((card, index) => {
        const selected = isSelected(card);
        
        return (
          <div
            key={card.id}
            style={{
              marginLeft: index === 0 ? 0 : overlap,
              transition: 'transform 0.2s ease',
              transform: selected ? 'translateY(-20px)' : 'translateY(0)',
              zIndex: selected ? 100 : index,
              flexShrink: 0 // 防止牌被压缩
            }}
          >
            <Card
              card={card}
              selected={selected}
              onClick={() => handleClick(card)}
              disabled={!canPlay && isPlayer}
              small={false}
            />
          </div>
        );
      })}
    </div>
  );
}
