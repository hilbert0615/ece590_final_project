import { supabase, GameScore } from './supabase';

/**
 * 分数服务 - 封装所有分数相关的操作
 */

/**
 * 上传游戏分数到 Supabase
 * @param userId - 用户 ID
 * @param username - 用户名
 * @param score - 分数
 * @param location - 可选：位置信息
 * @returns 成功返回 score 记录，失败返回 error
 */
export const uploadScore = async (
  userId: string,
  username: string,
  score: number,
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }
): Promise<{ score?: GameScore; error?: string; skipped?: boolean }> => {
  try {
    // 检查用户最近一次上传的分数是否相同（避免重复上传）
    const { data: recentScores } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentScores && recentScores.length > 0 && recentScores[0].score === score) {
      console.log(`跳过重复分数上传: ${username} - ${score}`);
      return { skipped: true };
    }

    const { data, error } = await supabase
      .from('game_scores')
      .insert({
        user_id: userId,
        username,
        score,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        city: location?.city || null,
        country: location?.country || null,
      })
      .select()
      .single();

    if (error) {
      console.error('上传分数失败:', error);
      return { error: '上传分数失败' };
    }

    console.log(`分数上传成功: ${username} - ${score}`);
    return { score: data };
  } catch (error) {
    console.error('上传分数错误:', error);
    return { error: '上传分数失败' };
  }
};

/**
 * 获取全球排行榜（前 100 名，每个用户只显示最高分）
 * @returns 排行榜数据
 */
export const getGlobalLeaderboard = async (): Promise<{
  leaderboard?: GameScore[];
  error?: string;
}> => {
  try {
    // 获取所有分数，然后在客户端去重（因为 Supabase 的 DISTINCT ON 有限制）
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error('获取排行榜失败:', error);
      return { error: '获取排行榜失败' };
    }

    // 去重：每个用户只保留最高分
    const userBestScores = new Map<string, GameScore>();
    data?.forEach(score => {
      const existing = userBestScores.get(score.user_id);
      if (!existing || score.score > existing.score) {
        userBestScores.set(score.user_id, score);
      }
    });

    // 转为数组并按分数排序，取前100名
    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    return { leaderboard };
  } catch (error) {
    console.error('获取排行榜错误:', error);
    return { error: '获取排行榜失败' };
  }
};

/**
 * 获取某个城市的排行榜（前 50 名，每个用户只显示最高分）
 * @param city - 城市名称
 * @returns 排行榜数据
 */
export const getCityLeaderboard = async (
  city: string
): Promise<{
  leaderboard?: GameScore[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('city', city)
      .order('score', { ascending: false });

    if (error) {
      console.error('获取城市排行榜失败:', error);
      return { error: '获取城市排行榜失败' };
    }

    // 去重：每个用户只保留最高分
    const userBestScores = new Map<string, GameScore>();
    data?.forEach(score => {
      const existing = userBestScores.get(score.user_id);
      if (!existing || score.score > existing.score) {
        userBestScores.set(score.user_id, score);
      }
    });

    // 转为数组并按分数排序，取前50名
    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return { leaderboard };
  } catch (error) {
    console.error('获取城市排行榜错误:', error);
    return { error: '获取城市排行榜失败' };
  }
};

/**
 * 获取某个用户的历史分数（最近 20 条）
 * @param userId - 用户 ID
 * @returns 历史分数数据
 */
export const getUserScoreHistory = async (
  userId: string
): Promise<{
  scores?: GameScore[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('获取用户历史分数失败:', error);
      return { error: '获取历史分数失败' };
    }

    return { scores: data };
  } catch (error) {
    console.error('获取用户历史分数错误:', error);
    return { error: '获取历史分数失败' };
  }
};

/**
 * 更新用户的最高分（如果新分数更高）
 * @param userId - 用户 ID
 * @param newScore - 新分数
 */
export const updateBestScore = async (
  userId: string,
  newScore: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. 获取当前最高分
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('best_score')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('获取最高分失败:', fetchError);
      return { success: false, error: '获取最高分失败' };
    }

    // 2. 如果新分数更高，则更新
    if (!profile || newScore > profile.best_score) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          best_score: newScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('更新最高分失败:', updateError);
        return { success: false, error: '更新最高分失败' };
      }

      console.log(`最高分已更新: ${newScore}`);
    }

    return { success: true };
  } catch (error) {
    console.error('更新最高分错误:', error);
    return { success: false, error: '更新最高分失败' };
  }
};
