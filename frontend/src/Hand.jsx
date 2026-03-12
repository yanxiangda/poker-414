import React, { useState, useRef } from 'react';
import Card from './Card.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 手牌组件 - 斗地主风格横向展开，响应式适配，支持拖拽排序
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer, windowWidth, onReorder }) {
  const [localSelected, setLocalSelected] = React.useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
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
  
  // 获取牌的显示宽度（考虑重叠）
  const isMobile = windowW < 768;
  const isSmallMobile = windowW < 400;
  const cardWidth = isSmallMobile ? 42 : isMobile ? 48 : 60;
  const overlap = isSmallMobile ? 15 : isMobile ? 25 : 35;
  const displayWidth = cardWidth - overlap;
  
  // 开始拖拽（鼠标/触摸）
  const handleDragStart = (e, card, index) => {
    if (!isPlayer) return;
    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const cardElement = e.currentTarget;
    const rect = cardElement.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    
    setDraggedCard({ card, index, startX: clientX, offsetX });
    console.log('🃏 开始拖拽:', card.id, '位置:', index);
  };
  
  // 拖拽移动
  const handleDragMove = (e) => {
    if (!draggedCard || !handRef.current) return;
    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const handRect = handRef.current.getBoundingClientRect();
    const relativeX = clientX - handRect.left - draggedCard.offsetX;
    
    // 计算目标索引
    const newIndex = Math.round(relativeX / displayWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, sortedCards.length - 1));
    
    if (clampedIndex !== draggedCard.index) {
      // 交换卡片
      const newCards = [...sortedCards];
      const temp = newCards[draggedCard.index];
      newCards[draggedCard.index] = newCards[clampedIndex];
      newCards[clampedIndex] = temp;
      
      setDraggedCard({ ...draggedCard, index: clampedIndex });
      
      // 立即通知重排序（视觉反馈）
      if (onReorder) {
        onReorder(newCards);
      }
      console.log('🔄 拖拽到新位置:', clampedIndex);
    }
  };
  
  // 结束拖拽
  const handleDragEnd = () => {
    if (draggedCard) {
      console.log('✅ 拖拽结束，最终位置:', draggedCard.index);
    }
    setDraggedCard(null);
  };
  
  // 全局事件监听
  React.useEffect(() => {
    if (draggedCard) {
      const moveEvent = draggedCard.startX !== undefined ? 
        (typeof window !== 'undefined' && 'ontouchmove' in window ? 'touchmove' : 'mousemove') : 
        'mousemove';
      const endEvent = draggedCard.startX !== undefined ? 
        (typeof window !== 'undefined' && 'ontouchend' in window ? 'touchend' : 'mouseup') : 
        'mouseup';
      
      window.addEventListener(moveEvent, handleDragMove, { passive: false });
      window.addEventListener(endEvent, handleDragEnd);
      
      return () => {
        window.removeEventListener(moveEvent, handleDragMove);
        window.removeEventListener(endEvent, handleDragEnd);
      };
    }
  }, [draggedCard]);
  
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
  const overlapCss = isSmallMobile ? '-15px' : isMobile ? '-25px' : '-35px';
  
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
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {sortedCards.map((card, index) => {
        const selected = isSelected(card);
        const isDragging = draggedCard && draggedCard.card.id === card.id;
        
        return (
          <div
            key={card.id}
            onMouseDown={(e) => handleDragStart(e, card, index)}
            onTouchStart={(e) => handleDragStart(e, card, index)}
            style={{
              marginLeft: index === 0 ? 0 : overlapCss,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              transform: selected ? 'translateY(-20px)' : isDragging ? 'translateY(-30px) scale(1.05)' : 'translateY(0)',
              zIndex: selected || isDragging ? 100 : index,
              flexShrink: 0,
              opacity: isDragging ? 0.7 : 1,
              cursor: isPlayer ? 'grab' : 'default',
              touchAction: 'none'
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
          </div>
        );
      })}
    </div>
  );
}
