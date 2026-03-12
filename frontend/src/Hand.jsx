import React, { useState, useRef, useEffect } from 'react';
import Card from './Card.jsx';

/**
 * 手牌组件 - 支持自由拖拽排序（不自动排序）
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer, windowWidth, onReorder }) {
  const [localSelected, setLocalSelected] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  // 使用用户自定义的顺序，如果没有则用原始顺序
  const [cardOrder, setCardOrder] = useState(cards.map(c => c.id));
  const handRef = useRef(null);
  const windowW = windowWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // 当外部 cards 变化时，更新 cardOrder（添加新牌或移除不存在的牌）
  useEffect(() => {
    const currentIds = new Set(cardOrder);
    const newCardIds = cards.map(c => c.id);
    
    // 如果是新发牌（cardOrder 为空或牌数变化），按大小排序
    if (cardOrder.length === 0 || cardOrder.length !== cards.length) {
      // 按牌面大小排序的辅助函数
      const cardOrderValue = {4:0,5:1,6:2,7:3,8:4,9:5,10:6,J:7,Q:8,K:9,A:10,2:11,3:12,SJ:13,BJ:14};
      const sortedIds = [...cards]
        .sort((a, b) => (cardOrderValue[b.value] || 0) - (cardOrderValue[a.value] || 0))
        .map(c => c.id);
      setCardOrder(sortedIds);
      console.log('🎴 新发牌，自动排序:', sortedIds.length, '张');
    } else {
      // 否则只更新变化的牌
      let newOrder = cardOrder.filter(id => newCardIds.includes(id));
      
      // 添加新牌到末尾
      newCardIds.forEach(id => {
        if (!currentIds.has(id)) {
          newOrder.push(id);
        }
      });
      
      setCardOrder(newOrder);
    }
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
  
  // 根据 cardOrder 排序手牌
  const orderedCards = cardOrder.map(id => cards.find(c => c.id === id)).filter(Boolean);
  
  const isMobile = windowW < 768;
  const isSmallMobile = windowW < 400;
  const overlapCss = isSmallMobile ? '-15px' : isMobile ? '-25px' : '-35px';
  
  // 开始拖拽
  const handleMouseDown = (e, index) => {
    if (!isPlayer) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(index);
    console.log('🃏 开始拖拽索引:', index, '牌:', orderedCards[index].value);
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
    const overlap = isSmallMobile ? 15 : isMobile ? 25 : 35;
    const stepWidth = cardWidth - overlap;
    const newIndex = Math.round(relativeX / stepWidth);
    const clampedIndex = Math.max(0, Math.min(newIndex, orderedCards.length - 1));
    
    if (clampedIndex !== draggedIndex && clampedIndex >= 0) {
      // 交换卡片顺序
      const newOrder = [...cardOrder];
      const temp = newOrder[draggedIndex];
      newOrder[draggedIndex] = newOrder[clampedIndex];
      newOrder[clampedIndex] = temp;
      
      setCardOrder(newOrder);
      setDraggedIndex(clampedIndex);
      
      console.log('🔄 交换位置:', draggedIndex, '->', clampedIndex, '新顺序:', newOrder.length);
    }
  };
  
  // 结束拖拽
  const handleMouseUp = () => {
    if (draggedIndex !== null) {
      console.log('✅ 拖拽结束，发送新顺序到服务器');
      if (onReorder) {
        // 发送完整的牌顺序给服务器
        const newCards = cardOrder.map(id => cards.find(c => c.id === id)).filter(Boolean);
        onReorder(newCards);
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
  }, [draggedIndex, cardOrder]);
  
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
      {orderedCards.map((card, index) => {
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
