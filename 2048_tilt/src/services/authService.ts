import { supabase, UserProfile } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 认证服务 - 封装所有用户认证相关的操作
 */

/**
 * 注册新用户
 * @param email - 邮箱
 * @param password - 密码
 * @param username - 用户名
 * @returns 成功返回 user 和 profile，失败返回 error
 */
export const signUp = async (
  email: string,
  password: string,
  username: string
): Promise<{ user?: any; profile?: UserProfile; error?: string }> => {
  try {
    // 1. 检查用户名是否已存在
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      return { error: 'Username is already taken.' };
    }

    // 2. 在 Supabase Auth 中注册用户（将 username 传入 metadata）
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,  // 传入 metadata，触发器会自动创建 profile
        },
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || '注册失败' };
    }

    // 某些项目开启了“邮箱确认”，此时 signUp 不会返回 session。
    // 为了实现“注册后自动登录”的体验，我们尝试主动用密码登录一次。
    // 如果后台启用了“必须确认邮箱”，这里会报错，需要在 Supabase 控制台关闭该开关或走邮件确认流程。
    if (!authData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // 返回明确提示，便于前端给出指引
        return { error: `Registration successful, but automatic login failed.: ${signInError.message}. Please turn off "Confirm email" in your Supabase Auth settings or complete email verification before logging in.` };
      }
    }

    // 3. 等待触发器创建 profile（稍微延迟一下）
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. 获取自动创建的 profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Failed to retrieve user information:', profileError);
      // 如果获取失败，返回一个临时 profile 对象
      const tempProfile: UserProfile = {
        id: authData.user.id,
        username: username,
        avatar_url: null,
        best_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem('current_user', username);
      await AsyncStorage.setItem('user_id', authData.user.id);

      console.log(`User registration successful: ${username}`);
      return { user: authData.user, profile: tempProfile };
    }

  // 5. 保存到本地并清理访客标记
    await AsyncStorage.setItem('current_user', profileData.username);
    await AsyncStorage.setItem('user_id', authData.user.id);
  try { await AsyncStorage.removeItem('is_guest_mode'); } catch {}

    console.log(`User registration successful: ${profileData.username}`);
    return { user: authData.user, profile: profileData };
  } catch (error) {
    console.error('Register error:', error);
    return { error: 'Register failed, please try again' };
  }
};

/**
 * 登录用户
 * @param email - 邮箱
 * @param password - 密码
 * @returns 成功返回 user 和 profile，失败返回 error
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user?: any; profile?: UserProfile; error?: string }> => {
  try {
    // 1. 登录 Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Login failed' };
    }

    // 登录成功后，确保清理访客标记
    try { await AsyncStorage.removeItem('is_guest_mode'); } catch {}

    // 2. 获取用户资料
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Failed to retrieve user information:', profileError);
      return { error: 'Failed to retrieve user information' };
    }

    // 3. 保存到本地
    await AsyncStorage.setItem('current_user', profileData.username);
    await AsyncStorage.setItem('user_id', authData.user.id);

    console.log(`User login successful: ${profileData.username}`);
    return { user: authData.user, profile: profileData };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Login failed, please try again' };
  }
};

/**
 * 登出用户
 */
export const signOut = async (): Promise<{ error?: string }> => {
  try {
    // 1. 登出 Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('登出失败:', error);
      return { error: error.message };
    }

    // 2. 清除本地存储
    await AsyncStorage.removeItem('current_user');
    await AsyncStorage.removeItem('user_id');

    console.log('User successfully logged out.');
    return {};
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'Logout failed' };
  }
};

/**
 * 获取当前登录用户
 * @returns 返回用户资料，未登录返回 null
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    // 1. 获取当前会话
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    // 2. 获取用户资料
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData) {
      console.error('Failed to retrieve user information:', error);
      return null;
    }

    return profileData;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * 获取当前登录用户（包含邮箱）
 * @returns { profile, email } 或 null
 */
export const getCurrentUserWithEmail = async (): Promise<{ profile: UserProfile; email: string } | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData) return null;

    const email = session.user.email ?? '';
    return { profile: profileData, email };
  } catch (e) {
    console.error('Error retrieving current user (with email address):', e);
    return null;
  }
};

/**
 * 更新用户资料
 * @param userId - 用户 ID
 * @param updates - 要更新的字段
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ profile?: UserProfile; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User profile update failed:', error);
      return { error: error.message || 'Update failed' };
    }

    return { profile: data };
  } catch (error) {
    console.error('Error updating user information:', error);
    return { error: 'Update failed' };
  }
};

/**
 * 检查用户名是否可用
 * @param username - 要检查的用户名
 * @returns true 表示可用，false 表示已被占用
 */
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    return !data;  // 没有数据说明可用
  } catch (error) {
    console.error('Check username error:', error);
    return false;
  }
};
