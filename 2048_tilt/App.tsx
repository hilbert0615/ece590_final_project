import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';

/**
 * App 主入口组件
 * 实现简单的屏幕导航：主菜单 <-> 游戏界面
 */
export default function App() {
  // 当前显示的屏幕：'home' 或 'game'
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game'>('home');

  return (
    <SafeAreaProvider>
      {currentScreen === 'home' ? (
        // 主菜单界面
        <HomeScreen onNavigateToGame={() => setCurrentScreen('game')} />
      ) : (
        // 游戏界面
        <GameScreen onBack={() => setCurrentScreen('home')} />
      )}
      {/* StatusBar 控制顶部状态栏样式 */}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
