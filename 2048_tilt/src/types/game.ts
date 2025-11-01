/**
 * 游戏相关的 TypeScript 类型定义
 */

// 游戏网格类型：4x4 的二维数组
export type Grid = number[][];

// 方向枚举
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// 游戏状态接口
export interface GameState {
  grid: Grid;           // 当前游戏网格
  score: number;        // 当前分数
  bestScore: number;    // 最高分数
  isGameOver: boolean;  // 游戏是否结束
}

// 方块位置
export interface Position {
  row: number;
  col: number;
}

// 移动历史记录（用于撤销功能）
export interface GameHistory {
  grid: Grid;
  score: number;
}
