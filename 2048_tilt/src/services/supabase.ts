import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase 配置和客户端初始化
 */

const SUPABASE_URL = 'https://mrhdgtdxfvpczcfvmnzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaGRndGR4ZnZwY3pjZnZtbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTEwMjAsImV4cCI6MjA3NzU4NzAyMH0.6hl14HJcCgfEHGlVvVSgkhDa_I170NbuA8liVnyqCqI';

/**
 * Supabase 客户端实例
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // React Native 环境需要显式指定存储与 URL polyfill
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * 数据库类型定义
 */

// 用户资料
export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  best_score: number;
  created_at: string;
  updated_at: string;
}

// 游戏分数记录
export interface GameScore {
  id: string;
  user_id: string;
  username: string;
  score: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  created_at: string;
}
