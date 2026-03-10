// 积分系统

import { getCardScore } from './deck.js';

/**
 * 计算桌上积分牌的总分
 */
export function calculateTableScore(tableCards) {
  return tableCards.reduce((sum, card) => sum + getCardScore(card), 0);
}

/**
 * 判断是否小雪（输方积分 ≤ 10）
 */
export function isXiaoXue(score) {
  return score <= 10;
}

/**
 * 判断是否大雪（输方积分 ≤ 40）
 */
export function isDaXue(score) {
  return score <= 40;
}

/**
 * 获取倍率
 */
export function getMultiplier(loserScore) {
  if (isXiaoXue(loserScore)) return 5;
  if (isDaXue(loserScore)) return 25;
  return 1;
}

/**
 * 获取倍率名称
 */
export function getMultiplierName(loserScore) {
  if (isXiaoXue(loserScore)) return '小雪';
  if (isDaXue(loserScore)) return '大雪';
  return '普通';
}

/**
 * 判定胜利
 */
export function checkVictory(teamScores, firstFinishedTeam) {
  // firstFinishedTeam: 先出完牌的团队索引 (0 或 1)
  // teamScores: [team0Score, team1Score]
  
  const firstTeamThreshold = 135;
  const secondTeamThreshold = 210;
  
  const firstTeamScore = teamScores[firstFinishedTeam];
  const secondTeamScore = teamScores[1 - firstFinishedTeam];
  
  // 检查先出完牌的团队是否胜利
  if (firstTeamScore >= firstTeamThreshold) {
    return {
      winner: firstFinishedTeam,
      type: 'first_finish',
      multiplier: getMultiplier(secondTeamScore),
      multiplierName: getMultiplierName(secondTeamScore)
    };
  }
  
  // 检查后出完牌的团队是否胜利
  if (secondTeamScore >= secondTeamThreshold) {
    return {
      winner: 1 - firstFinishedTeam,
      type: 'second_finish',
      multiplier: getMultiplier(firstTeamScore),
      multiplierName: getMultiplierName(firstTeamScore)
    };
  }
  
  return null; // 尚未分出胜负
}

/**
 * 计算最终得分
 */
export function calculateFinalScore(baseScore, multiplier) {
  return baseScore * multiplier;
}
