import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { RankScreen } from './src/screens/RankScreen';
import { SavedGameState } from './src/utils/storageUtils';
import { getCurrentUser } from './src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from './src/constants/colors';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

/**
 * App 主入口组件
 * 实现屏幕导航：登录 -> 主菜单 <-> 游戏界面 <-> 用户资料 <-> 关于 <-> 排行榜
 */

type ScreenType = 'login' | 'home' | 'game' | 'profile' | 'about' | 'rank';

const LoadingScreen = () => {
  const { backgroundColor } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor }]}>
      <ActivityIndicator size="large" color={COLORS.orange} />
    </View>
  );
};

export default function App() {
  // 当前显示的屏幕
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  // 传递给 GameScreen 的初始游戏状态（用于 Resume 功能）
  const [initialGameState, setInitialGameState] = useState<SavedGameState | null>(null);
  // 是否正在检查登录状态
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * App 启动时检查是否已登录
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 检查是否有登录用户
        const user = await getCurrentUser();

        if (user) {
          console.log('Logged-in users:', user.username);
          // 确保清理访客标记
          try { await AsyncStorage.removeItem('is_guest_mode'); } catch { }
          setCurrentScreen('home');
        } else {
          // 检查是否使用访客模式
          const isGuest = await AsyncStorage.getItem('is_guest_mode');
          if (isGuest === 'true') {
            console.log('Guest Mode');
            setCurrentScreen('home');
          } else {
            setCurrentScreen('login');
          }
        }
      } catch (error) {
        console.error('Failed to check login status:', error);
        setCurrentScreen('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * 登录成功处理
   */
  const handleLoginSuccess = () => {
    AsyncStorage.removeItem('is_guest_mode').catch(() => { });
    setCurrentScreen('home');
  };

  /**
   * 访客模式处理
   */
  const handleGuestMode = async () => {
    await AsyncStorage.setItem('is_guest_mode', 'true');
    await AsyncStorage.setItem('current_user', 'guest');
    setCurrentScreen('home');
  };

  /**
   * 导航到游戏界面（新游戏）
   */
  const handleNewGame = () => {
    setInitialGameState(null);  // 清空初始状态，开始新游戏
    setCurrentScreen('game');
  };

  /**
   * 导航到游戏界面（Resume）
   */
  const handleResumeGame = (savedState: SavedGameState) => {
    setInitialGameState(savedState);  // 传入已保存的状态
    setCurrentScreen('game');
  };

  /**
   * 导航到用户资料界面
   */
  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
  };

  /**
   * 导航到关于界面
   */
  const handleNavigateToAbout = () => {
    setCurrentScreen('about');
  };

  /**
   * 导航到排行榜界面
   */
  const handleNavigateToRank = () => {
    setCurrentScreen('rank');
  };

  /**
   * 登出处理
   */
  const handleLogout = async () => {
    await AsyncStorage.removeItem('is_guest_mode');
    setCurrentScreen('login');
  };

  // 显示加载界面
  if (isCheckingAuth) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <LoadingScreen />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onGuestMode={handleGuestMode}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onNavigateToGame={handleNewGame}
            onResumeGame={handleResumeGame}
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToAbout={handleNavigateToAbout}
            onNavigateToRank={handleNavigateToRank}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            onBack={() => setCurrentScreen('home')}
            initialGameState={initialGameState}
          />
        )}

        {currentScreen === 'profile' && (
          <UserProfileScreen
            onBack={() => setCurrentScreen('home')}
            onLogout={handleLogout}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'about' && (
          <AboutScreen
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'rank' && (
          <RankScreen
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {/* StatusBar 控制顶部状态栏样式 */}
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
