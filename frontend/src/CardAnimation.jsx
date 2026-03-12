import React, { useEffect, useState } from 'react';
import Card from './Card.jsx';

/**
 * 出牌动画组件
 * 牌从底部手牌位置飞到桌面中央
 */
export default function CardAnimation({ cards, fromPosition, toPosition, onComplete, windowWidth }) {
  const [animationState, setAnimationState] = useState('flying'); // flying, landed, fading
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!cards || cards.length === 0) return;

    // 动画总时长：根据牌数量调整
    const duration = Math.min(800 + cards.length * 100, 1500);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数（ease-out）
      const easedProgress = 1 - Math.pow(1 - newProgress, 3);
      setProgress(easedProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimationState('landed');
        setTimeout(() => {
          setAnimationState('fading');
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 300);
        }, 200);
      }
    };

    requestAnimationFrame(animate);
  }, [cards, onComplete]);

  if (!cards || cards.length === 0) return null;

  const isMobile = windowWidth < 768;
  
  // 计算每张牌的偏移位置（扇形展开）
  const getCardOffset = (index, total) => {
    const spacing = isMobile ? 35 : 50;
    const start = -((total - 1) * spacing) / 2;
    return start + index * spacing;
  };

  // 起始位置（底部手牌区域）
  const fromY = fromPosition?.y || (window.innerHeight - 150);
  const fromX = fromPosition?.x || (window.innerWidth / 2);

  // 目标位置（桌面中央）
  const toY = toPosition?.y || (window.innerHeight * 0.4);
  const toX = toPosition?.x || (window.innerWidth / 2);

  // 当前进度下的位置
  const currentX = fromX + (toX - fromX) * progress;
  const currentY = fromY + (toY - fromY) * progress;

  // 旋转效果（飞行中轻微旋转）
  const rotation = animationState === 'flying' ? Math.sin(progress * Math.PI) * 15 : 0;
  
  // 缩放效果（从小到大）
  const scale = animationState === 'flying' ? 0.6 + progress * 0.4 : 1;

  // 透明度
  const opacity = animationState === 'fading' ? 1 - (progress - 0.7) / 0.3 : 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {cards.map((card, index) => {
        const offsetX = getCardOffset(index, cards.length);
        const delay = index * 50; // 每张牌延迟 50ms
        
        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `
                translate(
                  calc(${currentX - window.innerWidth / 2 + offsetX}px + ${offsetX}px),
                  calc(${currentY - window.innerHeight / 2}px)
                )
                rotate(${rotation}deg)
                scale(${scale})
              `,
              opacity: opacity,
              transition: animationState === 'fading' ? 'opacity 0.3s ease' : 'none',
              transformOrigin: 'center center'
            }}
          >
            <Card card={card} windowWidth={windowWidth} />
          </div>
        );
      })}
      
      {/* 落地特效 */}
      {animationState === 'landed' && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: toY,
          transform: 'translate(-50%, -50%)',
          width: cards.length * (isMobile ? 45 : 65),
          height: '100px',
          backgroundColor: 'rgba(255, 215, 0, 0.3)',
          borderRadius: '50%',
          filter: 'blur(20px)',
          animation: 'pulse 0.3s ease-out'
        }} />
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * 简单版出牌动画（性能更好）
 * 使用 CSS 动画而非 JS 驱动
 */
export function SimpleCardAnimation({ cards, onComplete, windowWidth }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [cards, onComplete]);

  if (!show || !cards || cards.length === 0) return null;

  const isMobile = windowWidth < 768;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none',
      display: 'flex',
      gap: '4px'
    }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          style={{
            animation: `flyUp 0.6s ease-out ${index * 0.05}s both`
          }}
        >
          <Card card={card} windowWidth={windowWidth} />
        </div>
      ))}
      
      <style>{`
        @keyframes flyUp {
          0% {
            opacity: 0;
            transform: translateY(100px) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translateY(-20px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
