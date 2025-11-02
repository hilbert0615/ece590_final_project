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
    console.error('保存当前用户失败:', error);
  }
};

/**
 * 获取当前登录用户名
 */
export const getCurrentUser = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('获取当前用户失败:', error);
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
    console.error('清除当前用户失败:', error);
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
    console.log(`游戏状态已保存 [${username}]`);
  } catch (error) {
    console.error('保存游戏状态失败:', error);
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
      console.log(`没有找到 [${username}] 的游戏状态`);
      return null;
    }

    const gameState = JSON.parse(data) as SavedGameState;
    console.log(`加载游戏状态成功 [${username}]`);
    return gameState;
  } catch (error) {
    console.error('加载游戏状态失败:', error);
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
    console.log(`游戏状态已清空 [${username}]`);
  } catch (error) {
    console.error('清空游戏状态失败:', error);
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
    console.error('检查未完成游戏失败:', error);
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
    console.error('保存最高分失败:', error);
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
    console.error('获取最高分失败:', error);
    return 0;
  }
};
