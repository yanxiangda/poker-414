// AI 对手逻辑

import { analyzeHand, canPlay, HAND_TYPE } from './rules.js';
import { CARD_ORDER } from './deck.js';

/**
 * AI 选择要出的牌
 * @param {Array} hand - AI 的手牌
 * @param {Array} tableCards - 桌上最后的牌（需要管的牌）
 * @returns {Array|null} 要出的牌，null 表示过
 */
export function aiChooseCards(hand, tableCards) {
  if (!tableCards || tableCards.length === 0) {
    // 先手，出最小的牌
    return aiPlayFirst(hand);
  }
  
  // 需要管牌
  return aiPlayToBeat(hand, tableCards);
}

/**
 * AI 先手出牌（出最小的）
 */
function aiPlayFirst(hand) {
  // 按点数排序
  const sorted = [...hand].sort((a, b) => CARD_ORDER[a.value] - CARD_ORDER[b.value]);
  
  // 尝试出单张
  if (sorted.length >= 1) {
    return [sorted[0]];
  }
  
  return [sorted[0]];
}

/**
 * AI 尝试管牌
 */
function aiPlayToBeat(hand, tableCards) {
  const prevAnalysis = analyzeHand(tableCards);
  if (!prevAnalysis) return null;
  
  // 分组手牌
  const groups = groupCards(hand);
  
  // 尝试找到能管上的牌
  const playable = findPlayableCards(hand, tableCards, groups, prevAnalysis);
  
  if (playable) {
    return playable;
  }
  
  return null; // 过
}

/**
 * 分组手牌
 */
function groupCards(hand) {
  const groups = {};
  hand.forEach(card => {
    const key = card.value;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  return groups;
}

/**
 * 找到可以管上的牌
 */
function findPlayableCards(hand, tableCards, groups, prevAnalysis) {
  const prevCount = prevAnalysis.count;
  const prevType = prevAnalysis.type;
  const prevValue = prevAnalysis.value;
  
  // 尝试同类型管牌
  for (let value of Object.keys(groups)) {
    const cards = groups[value];
    if (cards.length !== prevCount) continue;
    
    const analysis = analyzeHand(cards);
    if (!analysis || analysis.type !== prevType) continue;
    
    if (analysis.value > prevValue) {
      return cards;
    }
  }
  
  // 尝试炸
  if (prevType !== HAND_TYPE.BOMB) {
    for (let value of Object.keys(groups)) {
      const cards = groups[value];
      if (cards.length >= 3 && value !== 'SJ' && value !== 'BJ') {
        // 3 张炸可以管顺子
        if (prevType === HAND_TYPE.STRAIGHT && cards.length >= 3) {
          return cards;
        }
        // 4 张炸可以管双龙
        if (prevType === HAND_TYPE.DOUBLE_STRAIGHT && cards.length >= 4) {
          return cards;
        }
      }
    }
  }
  
  // 尝试更多张的炸
  if (prevType === HAND_TYPE.BOMB) {
    for (let value of Object.keys(groups)) {
      const cards = groups[value];
      if (cards.length > prevCount && value !== 'SJ' && value !== 'BJ') {
        return cards;
      }
    }
  }
  
  return null;
}

/**
 * AI 智能出牌（更高级的策略）
 */
export function aiSmartPlay(hand, tableCards, playerIndex, teamIndex) {
  // 基础版本：随机出能管的牌
  return aiChooseCards(hand, tableCards);
}
