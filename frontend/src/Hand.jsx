import React, { useState, useRef, useEffect } from 'react';
import Card from './Card.jsx';
import { CARD_ORDER } from './game/deck.js';

/**
 * 手牌组件 - 支持拖拽排序
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer, windowWidth, onReorder }) {
  const [localSelected, setLocalSelected] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [currentCards, setCurrentCards] = useState([...cards]);
  const handRef = useRef(null);
  const windowW = windowWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // 同步外部 cards 变化
  useEffect(() => {
    setCurrentCards([...cards]);
  }, [cards]);
  
  // 当外部 selectedCards 清空时，同步清空本地选中状态
  useEffect(() => {
    if (!selectedCards || selectedCards.length === 0) {
      setLocalSelected([]);
    }
  }, [selectedCards]);
  
  if (!cards || cards.length === 0) {
    return <div style={{ padding: '20px', color: '#999', textAlign: 'center' }}>手牌为空</div>;
  }
  
  // 按大小排序显示
  const sortedCards = [...currentCards].sort((a, b) => CARD_ORDER[b.value] - CARD_ORDER[a.value]);
  
  const isMobile = windowW < 768;
  const isSmallMobile = windowW < 400;
  const overlapCss = isSmallMobile ? '-15px' : isMobile ? '-25px' : '-35px';
  const cardDisplayWidth = isSmallMobile ? 27 : isMobile ? 23 : 25; // 像素
  
  // 开始拖拽
  const handleMouseDown = (e, index) => {
    if (!isPlayer) return;
    e.preventDefault();
    setDraggedIndex(index);
    console.log('🃏 开始拖拽索引:', index, '牌:', sortedCards[index].id);
  };
  
  // 拖拽移动
  const handleMouseMove = (e) => {
    if (draggedIndex === null || !handRef.current) return;
    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const handRect = handRef.current.getBoundingClientRect();
    const scrollLeft = handRef.current.scrollLeft || 0;
    const relativeX = clientX - handRect.left + scrollLeft;
    
    // 计算目标索引
    const cardWidth = isSmallMobile ? 42 : isMobile ? 48 : 60;
    const newIndex = Math.floor(relativeX / (cardWidth - Math.abs(parseInt(overlapCss))));
    const clampedIndex = Math.max(0, Math.min(newIndex, sortedCards.length - 1));
    
    if (clampedIndex !== draggedIndex && clampedIndex >= 0) {
      // 交换卡片
      const newCards = [...currentCards];
      const sourceCard = sortedCards[draggedIndex];
      const targetCard = sortedCards[clampedIndex];
      
      const sourceRealIndex = newCards.findIndex(c => c.id === sourceCard.id);
      const targetRealIndex = newCards.findIndex(c => c.id === targetCard.id);
      
      [newCards[sourceRealIndex], newCards[targetRealIndex]] = [newCards[targetRealIndex], newCards[sourceRealIndex]];
      
      setCurrentCards(newCards);
      setDraggedIndex(clampedIndex);
      
      console.log('🔄 交换位置:', draggedIndex, '->', clampedIndex);
    }
  };
  
  // 结束拖拽
  const handleMouseUp = () => {
    if (draggedIndex !== null) {
      console.log('✅ 拖拽结束，发送新顺序到服务器');
      if (onReorder) {
        onReorder(currentCards);
      }
    }
    setDraggedIndex(null);
  };
  
  // 全局事件监听
  useEffect(() => {
    if (draggedIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [draggedIndex, currentCards]);
  
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
        const isDragging = draggedIndex === index;
        
        return (
          <div
            key={card.id}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onTouchStart={(e) => handleMouseDown(e, index)}
            style={{
              marginLeft: index === 0 ? 0 : overlapCss,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              transform: selected ? 'translateY(-20px)' : isDragging ? 'translateY(-30px) scale(1.05)' : 'translateY(0)',
              zIndex: selected || isDragging ? 100 : index,
              flexShrink: 0,
              opacity: isDragging ? 0.7 : 1,
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
          </div>
        );
      })}
    </div>
  );
}
