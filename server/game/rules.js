// 东北抛幺 414 规则引擎

import { CARD_ORDER } from './deck.js';

/**
 * 牌型类型
 */
export const HAND_TYPE = {
  SINGLE: 'single',
  PAIR: 'pair',
  TRIPLE: 'triple',
  BOMB: 'bomb',
  STRAIGHT: 'straight',
  DOUBLE_STRAIGHT: 'double_straight',
  YAO: 'yao',
  KING_COMBO: 'king_combo'
};

/**
 * 分析手牌的牌型
 */
export function analyzeHand(cards) {
  if (!cards || cards.length === 0) return null;
  
  const values = cards.map(c => c.value);
  const valueCount = {};
  const kings = { SJ: 0, BJ: 0 };
  
  values.forEach(v => {
    if (v === 'SJ') kings.SJ++;
    else if (v === 'BJ') kings.BJ++;
    else valueCount[v] = (valueCount[v] || 0) + 1;
  });
  
  const count = cards.length;
  
  // 王组合
  if (count >= 2 && values.every(v => v === 'SJ' || v === 'BJ')) {
    // 大王 2.5 路，小王 1.5 路
    const road = kings.SJ * 1.5 + kings.BJ * 2.5;
    return {
      type: HAND_TYPE.KING_COMBO,
      road,
      value: road,
      count
    };
  }
  
  // 幺牌（1 个 A + N 个 4）
  const aCount = valueCount['A'] || 0;
  const fourCount = valueCount['4'] || 0;
  if (aCount === 1 && fourCount >= 2 && Object.keys(valueCount).length === 2) {
    const road = 4 + (fourCount - 2) * 2;
    return {
      type: HAND_TYPE.YAO,
      road,
      value: road,
      count,
      fourCount
    };
  }
  
  // 单张
  if (count === 1) {
    return {
      type: HAND_TYPE.SINGLE,
      value: CARD_ORDER[values[0]],
      count: 1
    };
  }
  
  // 一对
  if (count === 2 && Object.keys(valueCount).length === 1) {
    const value = Object.keys(valueCount)[0];
    if (value !== 'SJ' && value !== 'BJ') {
      return {
        type: HAND_TYPE.PAIR,
        value: CARD_ORDER[value],
        count: 2
      };
    }
  }
  
  // 炸（3 张及以上相同）
  if (Object.keys(valueCount).length === 1) {
    const value = Object.keys(valueCount)[0];
    if (value !== 'SJ' && value !== 'BJ' && count >= 3) {
      // 炸的路数 = 张数（3 张=3 路，4 张=4 路，以此类推）
      return {
        type: HAND_TYPE.BOMB,
        value: CARD_ORDER[value],
        count,
        road: count
      };
    }
  }
  
  // 多张相同（3 张、4 张等，但不是炸因为可能混其他牌）
  const counts = Object.values(valueCount);
  const uniqueValues = Object.keys(valueCount);
  
  // 三张、四张等
  if (uniqueValues.length === 1 && count >= 3) {
    return {
      type: HAND_TYPE.TRIPLE,
      value: CARD_ORDER[uniqueValues[0]],
      count
    };
  }
  
  // 顺子（至少 3 张连续）
  if (count >= 3 && uniqueValues.length === count) {
    const sortedValues = uniqueValues
      .filter(v => v !== 'SJ' && v !== 'BJ')
      .map(v => CARD_ORDER[v])
      .sort((a, b) => a - b);
    
    if (sortedValues.length === count) {
      let isStraight = true;
      for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] !== sortedValues[i-1] + 1) {
          isStraight = false;
          break;
        }
      }
      
      if (isStraight && sortedValues[0] >= CARD_ORDER['4']) {
        return {
          type: HAND_TYPE.STRAIGHT,
          value: sortedValues[sortedValues.length - 1], // 最大牌
          count,
          road: 3 // 顺子算 3 路
        };
      }
    }
  }
  
  // 双龙（至少 3 对连续）
  const pairs = uniqueValues.filter(v => valueCount[v] === 2 && v !== 'SJ' && v !== 'BJ');
  if (pairs.length >= 3 && pairs.length * 2 === count) {
    const sortedPairs = pairs
      .map(v => CARD_ORDER[v])
      .sort((a, b) => a - b);
    
    let isDoubleStraight = true;
    for (let i = 1; i < sortedPairs.length; i++) {
      if (sortedPairs[i] !== sortedPairs[i-1] + 1) {
        isDoubleStraight = false;
        break;
      }
    }
    
    if (isDoubleStraight && sortedPairs[0] >= CARD_ORDER['4']) {
      return {
        type: HAND_TYPE.DOUBLE_STRAIGHT,
        value: sortedPairs[sortedPairs.length - 1],
        count,
        road: 4 // 双龙算 4 路
      };
    }
  }
  
  // 其他情况（无法识别的牌型）
  return {
    type: 'invalid',
    value: -1,
    count
  };
}

/**
 * 判断牌 B 能否管上牌 A
 */
export function canPlay(prevHand, newHand) {
  if (!prevHand) return true; // 先手可以任意出
  
  const prev = analyzeHand(prevHand);
  const newHandAnalysis = analyzeHand(newHand);
  
  if (!prev || !newHandAnalysis) return false;
  if (newHandAnalysis.type === 'invalid') return false;
  
  // 张数不同，检查特殊规则
  if (prev.count !== newHandAnalysis.count) {
    // 炸可以管单张（包括单王）
    if (prev.type === HAND_TYPE.SINGLE && 
        newHandAnalysis.type === HAND_TYPE.BOMB) {
      return true;
    }
    
    // 炸可以管对子
    if (prev.type === HAND_TYPE.PAIR && 
        newHandAnalysis.type === HAND_TYPE.BOMB) {
      return true;
    }
    
    // 幺牌可以管单张
    if (prev.type === HAND_TYPE.SINGLE && 
        newHandAnalysis.type === HAND_TYPE.YAO) {
      return true;
    }
    
    // 幺牌可以管对子
    if (prev.type === HAND_TYPE.PAIR && 
        newHandAnalysis.type === HAND_TYPE.YAO) {
      return true;
    }
    
    // 幺牌可以管炸（幺牌路数 >= 炸的路数，幺牌是同路数最大的）
    if (prev.type === HAND_TYPE.BOMB && 
        newHandAnalysis.type === HAND_TYPE.YAO && 
        newHandAnalysis.road >= prev.road) {
      return true;
    }
    
    // 王组合可以管炸（王组合路数 > 炸的路数）
    if (prev.type === HAND_TYPE.BOMB && 
        newHandAnalysis.type === HAND_TYPE.KING_COMBO && 
        newHandAnalysis.road > prev.road) {
      return true;
    }
    
    // 3 路以上的炸可以管王组合（大小王）
    if (prev.type === HAND_TYPE.KING_COMBO && 
        newHandAnalysis.type === HAND_TYPE.BOMB && 
        newHandAnalysis.road >= 3) {
      return true;
    }
    
    // 3 张炸可以管顺子
    if (prev.type === HAND_TYPE.STRAIGHT && 
        newHandAnalysis.type === HAND_TYPE.BOMB && 
        newHandAnalysis.count >= 3) {
      return true;
    }
    
    // 4 张炸可以管双龙
    if (prev.type === HAND_TYPE.DOUBLE_STRAIGHT && 
        newHandAnalysis.type === HAND_TYPE.BOMB && 
        newHandAnalysis.count >= 4) {
      return true;
    }
    
    // 双龙可以管顺子（数量相同）
    if (prev.type === HAND_TYPE.STRAIGHT && 
        newHandAnalysis.type === HAND_TYPE.DOUBLE_STRAIGHT &&
        prev.count === newHandAnalysis.count / 2) {
      return newHandAnalysis.value > prev.value;
    }
    
    // 张数多的炸可以管张数少的炸
    if (prev.type === HAND_TYPE.BOMB && newHandAnalysis.type === HAND_TYPE.BOMB) {
      if (newHandAnalysis.count > prev.count) return true;
      if (newHandAnalysis.count === prev.count) {
        return newHandAnalysis.value > prev.value;
      }
    }
    
    return false; // 张数不同一般不能管
  }
  
  // 张数相同，按类型比较
  if (prev.type !== newHandAnalysis.type) {
    // 同张数不同类型，比较路数
    if (prev.road !== undefined && newHandAnalysis.road !== undefined) {
      return newHandAnalysis.road > prev.road;
    }
    return false;
  }
  
  // 同类型同张数，比大小
  return newHandAnalysis.value > prev.value;
}

/**
 * 获取牌型的路数
 */
export function getRoad(cards) {
  const analysis = analyzeHand(cards);
  if (!analysis) return 0;
  return analysis.road || 0;
}

/**
 * 获取牌型的显示名称
 */
export function getHandTypeName(analysis) {
  if (!analysis) return '未知';
  
  switch (analysis.type) {
    case HAND_TYPE.SINGLE: return '单张';
    case HAND_TYPE.PAIR: return '一对';
    case HAND_TYPE.TRIPLE: return '三张';
    case HAND_TYPE.BOMB: return `炸 (${analysis.count}张)`;
    case HAND_TYPE.STRAIGHT: return `顺子 (${analysis.count}张)`;
    case HAND_TYPE.DOUBLE_STRAIGHT: return `双龙 (${analysis.count/2}对)`;
    case HAND_TYPE.YAO: return `幺牌 (${analysis.fourCount}个 4)`;
    case HAND_TYPE.KING_COMBO: return `王组合 (${analysis.road}路)`;
    default: return '未知';
  }
}
