import React, { useState, useRef, useEffect } from 'react';
import Card from './Card.jsx';

/**
 * 手牌组件 - 支持自由拖拽排序（不自动排序）
 */
export default function Hand({ cards, onCardClick, selectedCards, canPlay, isPlayer, windowWidth, onReorder }) {
  const [localSelected, setLocalSelected] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSliding, setIsSliding] = useState(false); // 是否正在滑动选牌
  const [slideDirection, setSlideDirection] = useState(null); // 'select' or 'deselect'
  const slidCardsRef = useRef(new Set()); // 记录已经处理过的牌，避免重复触发
  // 使用用户自定义的顺序，如果没有则用原始顺序
  const [cardOrder, setCardOrder] = useState(cards.map(c => c.id));
  const handRef = useRef(null);
  const dragOffsetRef = useRef(0); // 鼠标相对于手牌容器的位置
  const slideStartYRef = useRef(0); // 滑动起始 Y 坐标
  const windowW = windowWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // 当外部 cards 变化时，更新 cardOrder（添加新牌或移除不存在的牌）
  useEffect(() => {
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
      // 检查牌的 ID 是否完全匹配（判断是否是理牌操作）
      const currentIdsSet = new Set(cardOrder);
      const newIdsSet = new Set(newCardIds);
      const sameCards = cardOrder.length === newCardIds.length && 
                        cardOrder.every(id => newIdsSet.has(id));
      
      if (sameCards) {
        // 牌相同但顺序可能变了（理牌），按 cards 数组的新顺序更新
        setCardOrder(newCardIds);
        console.log('🎴 理牌，更新顺序:', newCardIds.length, '张');
      } else {
        // 牌有变化（添加/移除）
        let newOrder = cardOrder.filter(id => newIdsSet.has(id));
        
        // 添加新牌到末尾
        newCardIds.forEach(id => {
          if (!currentIdsSet.has(id)) {
            newOrder.push(id);
          }
        });
        
        setCardOrder(newOrder);
      }
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
  const overlapCss = isSmallMobile ? '-8px' : isMobile ? '-12px' : '-18px';
  
  // 拖拽移动（使用 ref 保存当前手牌顺序）
  const cardOrderRef = useRef(cardOrder);
  
  useEffect(() => {
    cardOrderRef.current = cardOrder;
  }, [cardOrder]);
  
  // 开始拖拽或滑动选牌
  const handleMouseDown = (e, index) => {
    if (!isPlayer) return;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const handRect = handRef.current.getBoundingClientRect();
    
    // 记录鼠标相对于手牌容器的位置
    const startX = clientX - handRect.left;
    dragOffsetRef.current = startX;
    slideStartYRef.current = clientY;
    
    // 检测点击位置：上半部分（卡牌高度 50% 以上）触发滑动选牌
    const cardRect = e.currentTarget.getBoundingClientRect();
    const clickY = clientY - cardRect.top;
    const isInTopHalf = clickY < cardRect.height / 2;
    
    if (isInTopHalf && canPlay) {
      // 滑动选牌模式 - 阻止默认和冒泡
      e.preventDefault();
      e.stopPropagation();
      
      setIsSliding(true);
      slidCardsRef.current.clear(); // 清空已处理记录
      
      const card = orderedCards[index];
      const currentlySelected = isSelected(card);
      
      // 决定是选中还是取消选中
      setSlideDirection(currentlySelected ? 'deselect' : 'select');
      
      // 不立即切换状态，等 onClick 或滑动处理
    } else {
      // 普通拖拽模式
      setDraggedIndex(index);
    }
  };
  
  // 滑动选牌 - 批量选中/取消选中
  const handleSlideMove = (e) => {
    if (!isSliding || !handRef.current) return;
    
    const clientX = e.type.includes('touch') ? (e.touches[0]?.clientX || 0) : e.clientX;
    const clientY = e.type.includes('touch') ? (e.touches[0]?.clientY || 0) : e.clientY;
    
    // 精确检测：遍历所有卡牌，检查鼠标是否在卡牌实际渲染区域内
    const cardContainers = handRef.current.querySelectorAll('[data-card-index]');
    
    for (const container of cardContainers) {
      const rect = container.getBoundingClientRect();
      
      // 检查鼠标是否在这张牌的范围内
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        
        const index = parseInt(container.getAttribute('data-card-index'));
        const card = orderedCards[index];
        
        if (card && !slidCardsRef.current.has(card.id)) {
          // 记录已处理的牌，避免重复触发
          slidCardsRef.current.add(card.id);
          
          const currentlySelected = isSelected(card);
          const shouldSelect = slideDirection === 'select';
          
          // 根据滑动方向选中或取消选中
          if (shouldSelect && !currentlySelected) {
            setLocalSelected(prev => [...prev, card.id]);
            if (onCardClick) onCardClick(card);
          } else if (!shouldSelect && currentlySelected) {
            setLocalSelected(prev => prev.filter(id => id !== card.id));
            if (onCardClick) onCardClick(card);
          }
        }
      }
    }
  };
  
  // 拖拽移动 - 直接在事件处理中使用最新值
  const handleMouseMove = (e) => {
    // 如果是滑动选牌模式
    if (isSliding) {
      handleSlideMove(e);
      return;
    }
    
    const currentIndex = draggedIndex;
    if (currentIndex === null || !handRef.current) return;
    
    const clientX = e.type.includes('touch') ? (e.touches[0]?.clientX || 0) : e.clientX;
    const handRect = handRef.current.getBoundingClientRect();
    
    // 计算鼠标移动的距离
    const currentX = clientX - handRect.left;
    const deltaX = currentX - dragOffsetRef.current;
    
    // 使用实际的牌宽度和重叠计算
    const currentCardWidth = isSmallMobile ? 42 : isMobile ? 48 : 60;
    const currentOverlap = isSmallMobile ? 8 : isMobile ? 12 : 18;
    const stepWidth = currentCardWidth - currentOverlap;
    
    // 计算移动了多少个位置（至少移动半个牌宽才交换）
    const steps = Math.floor(Math.abs(deltaX) / stepWidth);
    if (steps === 0) return;
    
    // 确定移动方向
    const direction = deltaX > 0 ? 1 : -1;
    const newIndex = currentIndex + direction * steps;
    const clampedIndex = Math.max(0, Math.min(newIndex, cardOrderRef.current.length - 1));
    
    if (clampedIndex !== currentIndex) {
      // 交换卡片顺序
      const newOrder = [...cardOrderRef.current];
      const temp = newOrder[currentIndex];
      newOrder[currentIndex] = newOrder[clampedIndex];
      newOrder[clampedIndex] = temp;
      
      setCardOrder(newOrder);
      setDraggedIndex(clampedIndex);
      
      // 重置偏移量，避免连续交换
      dragOffsetRef.current = currentX;
    }
  };
  
  // 结束拖拽或滑动
  const handleMouseUp = () => {
    if (draggedIndex !== null) {
      console.log('✅ 拖拽结束，发送新顺序到服务器');
      if (onReorder) {
        const newCards = cardOrderRef.current.map(id => cards.find(c => c.id === id)).filter(Boolean);
        onReorder(newCards);
      }
    }
    if (isSliding) {
      console.log('✅ 滑动选牌结束');
      // 如果滑动过程中没有选中任何牌（单击），在 onClick 中处理
      // 如果滑动选中了牌，已经在 handleSlideMove 中处理了
      setIsSliding(false);
      setSlideDirection(null);
      slidCardsRef.current.clear();
    }
    setDraggedIndex(null);
  };
  
  // 全局事件监听
  useEffect(() => {
    if (draggedIndex !== null || isSliding) {
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
  }, [draggedIndex, isSliding]);
  
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
        padding: isMobile ? '25px 8px 0' : '30px 15px 0', // 增加顶部 padding 给选中浮起留空间
        minHeight: isSmallMobile ? '95px' : isMobile ? '105px' : '120px', // 增加 minHeight
        overflowX: 'auto',
        overflowY: 'visible',
        gap: '0',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
        userSelect: 'none',
        touchAction: 'none',
        position: 'relative',
        zIndex: 1
      }}
    >
      {orderedCards.map((card, index) => {
        const selected = isSelected(card);
        const isDragging = draggedIndex === index;
        
        return (
          <div
            key={card.id}
            data-card-index={index}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onTouchStart={(e) => handleMouseDown(e, index)}
            onClick={(e) => {
              // 只在可以出牌时允许点击选牌
              if (canPlay && isPlayer) {
                // 如果是滑动模式且已经滑动过，不处理（由滑动处理）
                if (isSliding && slidCardsRef.current.size > 0) {
                  return;
                }
                // 单击上半边：切换选中状态
                handleClick(card);
              }
            }}
            style={{
              marginLeft: index === 0 ? 0 : overlapCss,
              transition: isDragging || isSliding ? 'none' : 'transform 0.2s ease',
              transform: selected ? 'translateY(-20px)' : isDragging ? 'translateY(-30px) scale(1.05)' : 'translateY(0)',
              zIndex: selected || isDragging ? 100 : index,
              flexShrink: 0,
              opacity: isDragging ? 0.7 : 1,
              cursor: isPlayer ? (isSliding ? 'crosshair' : 'grab') : 'default',
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            <Card
              card={card}
              selected={selected}
              onClick={() => {}}
              disabled={!canPlay && isPlayer && !isSliding}
              small={false}
              windowWidth={windowW}
            />
          </div>
        );
      })}
    </div>
  );
}
