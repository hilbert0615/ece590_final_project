import AsyncStorage from '@react-native-async-storage/async-storage';
import { Grid } from '../types/game';

/**
 * 游戏存储工具函数
 * 用于在本地保存和加载游戏状态
 */

// 存储键名前缀
const GAME_STATE_PREFIX = 'game_state_';
const CURRENT_USER_KEY = 'current_user';
const BEST_SCORE_PREFIX = 'best_score_';

// 游戏状态接口
export interface SavedGameState {
  grid: Grid;
  score: number;
  bestScore: number;
  timestamp: string;
}

/**
 * 保存当前登录用户名
 */
export const saveCurrentUser = async (username: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, username);
  } catch (error) {
    console.error('Failed to save the current user:', error);
  }
};

/**
 * 获取当前登录用户名
 */
export const getCurrentUser = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Failed to retrieve current user:', error);
    return null;
  }
};

/**
 * 清除当前登录用户（登出时调用）
 */
export const clearCurrentUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Failed to delete the current user:', error);
  }
};

/**
 * 保存游戏状态到本地
 * @param username - 用户名
 * @param gameState - 游戏状态
 */
export const saveGameState = async (
  username: string,
  gameState: SavedGameState
): Promise<void> => {
  try {
    const key = `${GAME_STATE_PREFIX}${username}`;
    const data = JSON.stringify(gameState);
    await AsyncStorage.setItem(key, data);
    console.log(`Game state saved [${username}]`);
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

/**
 * 加载游戏状态
 * @param username - 用户名
 * @returns 游戏状态或 null（如果不存在）
 */
export const loadGameState = async (
  username: string
): Promise<SavedGameState | null> => {
  try {
    const key = `${GAME_STATE_PREFIX}${username}`;
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      console.log(`Cannot find [${username}] game status`);
      return null;
    }

    const gameState = JSON.parse(data) as SavedGameState;
    console.log(`Game state loaded successfully [${username}]`);
    return gameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};

/**
 * 清空游戏状态（游戏结束时调用）
 * @param username - 用户名
 */
export const clearGameState = async (username: string): Promise<void> => {
  try {
    const key = `${GAME_STATE_PREFIX}${username}`;
    await AsyncStorage.removeItem(key);
    console.log(`Game state has been cleared [${username}]`);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
};

/**
 * 检查是否有未完成的游戏
 * @param username - 用户名
 * @returns true 如果有未完成的游戏
 */
export const hasUnfinishedGame = async (username: string): Promise<boolean> => {
  try {
    const gameState = await loadGameState(username);
    return gameState !== null;
  } catch (error) {
    console.error('Check failed for unfinished game:', error);
    return false;
  }
};

/**
 * 保存最高分（本地缓存）
 * @param username - 用户名
 * @param bestScore - 最高分
 */
export const saveBestScore = async (
  username: string,
  bestScore: number
): Promise<void> => {
  try {
    const key = `${BEST_SCORE_PREFIX}${username}`;
    await AsyncStorage.setItem(key, bestScore.toString());
  } catch (error) {
    console.error('Failed to save the highest score:', error);
  }
};

/**
 * 获取最高分
 * @param username - 用户名
 * @returns 最高分或 0
 */
export const getBestScore = async (username: string): Promise<number> => {
  try {
    const key = `${BEST_SCORE_PREFIX}${username}`;
    const data = await AsyncStorage.getItem(key);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Failed to obtain the highest score:', error);
    return 0;
  }
};
