import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';

/**
 * App 主入口组件
 * 渲染主屏幕 (HomeScreen)
 */
export default function App() {
  return (
    <SafeAreaProvider>
      {/* 主屏幕组件 */}
      <HomeScreen />
      {/* StatusBar 控制顶部状态栏样式 */}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
