import React, { useState, useRef } from 'react';
import Card from './Card.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 手牌组件 - 斗地主风格横向展开，响应式适配，支持拖拽排序
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer, windowWidth, onReorder }) {
  const [localSelected, setLocalSelected] = React.useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const handRef = useRef(null);
  const windowW = windowWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  
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
  
  // 拖拽开始
  const handleDragStart = (e, card, index) => {
    if (!isPlayer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDraggedCard({ card, index });
    e.target.style.opacity = '0.5';
  };
  
  // 拖拽结束
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedCard(null);
    setDragOverIndex(null);
  };
  
  // 拖拽经过
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };
  
  // 拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  // 放下卡片
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedCard) {
      setDragOverIndex(null);
      return;
    }
    
    // 在排序后的数组中找到源位置和目标位置
    const sourceIndex = sortedCards.findIndex(c => c.id === draggedCard.card.id);
    if (sourceIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }
    
    // 在原始 cards 数组中交换位置
    const newCards = [...cards];
    const sourceRealIndex = newCards.findIndex(c => c.id === draggedCard.card.id);
    const targetCard = sortedCards[targetIndex];
    const targetRealIndex = newCards.findIndex(c => c.id === targetCard.id);
    
    // 交换两张牌的位置
    [newCards[sourceRealIndex], newCards[targetRealIndex]] = [newCards[targetRealIndex], newCards[sourceRealIndex]];
    
    // 通知父组件重新排序
    if (onReorder) {
      onReorder(newCards);
    }
    
    setDraggedCard(null);
    setDragOverIndex(null);
  };
  
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
  
  // 响应式重叠：屏幕越小，重叠越少
  const isMobile = windowW < 768;
  const isSmallMobile = windowW < 400;
  const overlap = isSmallMobile ? '-15px' : isMobile ? '-25px' : '-35px';
  
  // 斗地主风格：手牌横向展开，有重叠效果，移动端适配
  return (
    <div 
      ref={handRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: isMobile ? '3px 8px 0' : '5px 15px 0',
        minHeight: isSmallMobile ? '70px' : isMobile ? '77px' : '90px',
        overflowX: 'auto',
        gap: '0',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {sortedCards.map((card, index) => {
        const selected = isSelected(card);
        const isDragging = draggedCard && draggedCard.card.id === card.id;
        const isDragOver = dragOverIndex === index;
        
        return (
          <div
            key={card.id}
            draggable={isPlayer}
            onDragStart={(e) => handleDragStart(e, card, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            style={{
              marginLeft: index === 0 ? 0 : overlap,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              transform: selected ? 'translateY(-20px)' : isDragging ? 'translateY(-30px) scale(1.05)' : 'translateY(0)',
              zIndex: selected || isDragging ? 100 : index,
              flexShrink: 0,
              opacity: isDragging ? 0.5 : 1,
              cursor: isPlayer ? 'grab' : 'default'
            }}
          >
            <Card
              card={card}
              selected={selected}
              onClick={() => handleClick(card)}
              disabled={!canPlay && isPlayer}
              small={false}
              windowWidth={windowW}
            />
            {isDragOver && !isDragging && (
              <div style={{
                position: 'absolute',
                left: index === 0 ? '0' : overlap,
                top: '0',
                bottom: '0',
                width: '4px',
                backgroundColor: '#4CAF50',
                borderRadius: '2px',
                zIndex: 101
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
