import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  GestureResponderEvent,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GameGrid } from '../components/GameGrid';
import { COLORS } from '../constants/colors';
import { Grid, Direction, GameHistory } from '../types/game';
import {
  initializeGrid,
  move,
  addRandomTile,
  isGameOver,
  hasWon,
  cloneGrid,
} from '../utils/gameLogic';
import {
  saveGameState,
  clearGameState,
  getCurrentUser,
  SavedGameState,
  saveBestScore,
} from '../utils/storageUtils';
import { getCurrentUser as getSupabaseUser } from '../services/authService';
import { uploadScore, updateBestScore } from '../services/scoreService';

/**
 * GameScreen - 游戏主界面
 * 包含游戏网格、分数显示、控制按钮和手势识别
 */

interface GameScreenProps {
  onBack: () => void;  // 返回主菜单的回调
  initialGameState?: SavedGameState | null;  // 可选：加载已保存的游戏状态
}

export const GameScreen: React.FC<GameScreenProps> = ({ onBack, initialGameState }) => {
  // 游戏状态（如果有初始状态则使用，否则新建游戏）
  const [grid, setGrid] = useState<Grid>(
    initialGameState?.grid || initializeGrid()
  );
  const [score, setScore] = useState<number>(initialGameState?.score || 0);
  const [bestScore, setBestScore] = useState<number>(initialGameState?.bestScore || 0);
  const [history, setHistory] = useState<GameHistory | null>(null);
  const [hasWonGame, setHasWonGame] = useState<boolean>(false);

  // 当前用户名（用于保存游戏状态）
  const [currentUsername, setCurrentUsername] = useState<string>('guest');

  // 陀螺仪模式状态（暂时不实现，预留架构）
  const [isGyroMode, setIsGyroMode] = useState<boolean>(false);

  // 手势识别相关状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // 动画相关
  const scorePopAnim = useRef(new Animated.Value(1)).current;

  // 防抖：防止连续滑动
  const [isMoving, setIsMoving] = useState<boolean>(false);

  // 初始化：获取当前用户名
  useEffect(() => {
    const initUser = async () => {
      const username = await getCurrentUser();
      setCurrentUsername(username || 'guest');
    };
    initUser();
  }, []);

  // 自动保存游戏状态（每次 grid 或 score 变化时）
  useEffect(() => {
    const autoSave = async () => {
      if (currentUsername) {
        await saveGameState(currentUsername, {
          grid,
          score,
          bestScore,
          timestamp: new Date().toISOString(),
        });
      }
    };
    autoSave();
  }, [grid, score, bestScore, currentUsername]);

  /**
   * 开始新游戏
   */
  const startNewGame = async () => {
    setGrid(initializeGrid());
    setScore(0);
    setHistory(null);
    setHasWonGame(false);
    // 清空旧的游戏状态
    if (currentUsername) {
      await clearGameState(currentUsername);
    }
  };

  /**
   * 撤销上一步操作
   */
  const undo = () => {
    if (history) {
      setGrid(history.grid);
      setScore(history.score);
      setHistory(null);  // 只能撤销一次
      console.log('Undo done');
    } else {
      Alert.alert('Undo Failed', 'You can only undo one time');
    }
  };


  /**
   * 播放分数增加动画
   */
  const playScoreAnimation = () => {
    Animated.sequence([
      Animated.timing(scorePopAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scorePopAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * 处理移动操作
   */
  const handleMove = (direction: Direction) => {
    // 如果正在移动中，忽略新的滑动
    if (isMoving) return;

    // 保存当前状态（用于撤销）
    setHistory({
      grid: cloneGrid(grid),
      score: score,
    });

    // 执行移动
    const { newGrid, scoreGained, moved } = move(grid, direction);

    if (!moved) {
      console.log('无法移动到该方向');
      return;  // 如果没有移动，不做任何操作
    }

    // 设置移动状态，防止连续滑动
    setIsMoving(true);

    // 延迟添加新方块，让移动动画先完成
    setTimeout(() => {
      // 添加新的随机方块
      const gridWithNewTile = addRandomTile(newGrid);

      // 更新状态
      setGrid(gridWithNewTile);
      const newScore = score + scoreGained;
      setScore(newScore);

      // 播放分数动画
      if (scoreGained > 0) {
        playScoreAnimation();
      }

      // 更新最高分
      if (newScore > bestScore) {
        setBestScore(newScore);
      }

      // 重置移动状态
      setIsMoving(false);

      // 检查是否获胜
      if (!hasWonGame && hasWon(gridWithNewTile)) {
        setHasWonGame(true);
        setTimeout(() => {
          Alert.alert(
            'Congratulation!',
            'You achnieve 2048!',
            [{ text: 'Continue game', style: 'cancel' }]
          );
        }, 300);
      }

      // 检查游戏是否结束
      if (isGameOver(gridWithNewTile)) {
        // 游戏结束时的处理
        const handleGameOver = async () => {
          // 保存最高分（本地）
          if (newScore > bestScore) {
            await saveBestScore(currentUsername, newScore);
          }

          // 清空游戏状态（游戏已结束）
          await clearGameState(currentUsername);

          // 上传分数到 Supabase（如果已登录）
          const supabaseUser = await getSupabaseUser();
          if (supabaseUser) {
            // 更新 Supabase 中的最高分
            await updateBestScore(supabaseUser.id, newScore);

            // 上传本次游戏分数
            // TODO: 后续添加 GPS 位置信息
            const { score: uploadedScore, error } = await uploadScore(
              supabaseUser.id,
              supabaseUser.username,
              newScore
              // location: { latitude, longitude, city, country }  // 后续添加
            );

            if (error) {
              console.error('Upload your score failed:', error);
            } else {
              console.log('Upload your score successful:', uploadedScore);
            }
          }

          // 显示游戏结束对话框
          Alert.alert(
            'Game Over',
            `Final score: ${newScore}`,
            [
              { text: 'Return to main screen', onPress: onBack },
              { text: 'Start new game', onPress: startNewGame },
            ]
          );
        };

        setTimeout(handleGameOver, 300);
      }
    }, 150); 
  };

  /**
   * 手势识别 - 触摸开始
   */
  const onTouchStart = (event: GestureResponderEvent) => {
    if (isGyroMode) return;  // 陀螺仪模式下禁用手势

    const { locationX, locationY } = event.nativeEvent;
    setTouchStart({ x: locationX, y: locationY });
  };

  /**
   * 手势识别 - 触摸结束（判断滑动方向）
   */
  const onTouchEnd = (event: GestureResponderEvent) => {
    if (isGyroMode || !touchStart || isMoving) return;

    const { locationX, locationY } = event.nativeEvent;
    const diffX = locationX - touchStart.x;
    const diffY = locationY - touchStart.y;

    const SWIPE_THRESHOLD = 20;  // 滑动阈值

    // 判断滑动方向（横向或纵向）
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 横向滑动
      if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) {
          handleMove(Direction.RIGHT);
        } else {
          handleMove(Direction.LEFT);
        }
      }
    } else {
      // 纵向滑动
      if (Math.abs(diffY) > SWIPE_THRESHOLD) {
        if (diffY > 0) {
          handleMove(Direction.DOWN);
        } else {
          handleMove(Direction.UP);
        }
      }
    }

    setTouchStart(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        {/* 返回按钮 */}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.gray} />
        </TouchableOpacity>

        {/* 标题 */}
        <Text style={styles.title}>2048 Tilt</Text>

        {/* 占位符（保持布局对称） */}
        <View style={styles.backButton} />
      </View>

      {/* 分数显示区域 - 添加动画效果 */}
      <View style={styles.scoreContainer}>
        <Animated.View
          style={[
            styles.scoreBox,
            { transform: [{ scale: scorePopAnim }] }
          ]}
        >
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </Animated.View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>BEST</Text>
          <Text style={styles.scoreValue}>{bestScore}</Text>
        </View>
      </View>

      {/* 按钮区域 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={startNewGame}
          disabled={isMoving}
        >
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={undo}
          disabled={isMoving}
        >
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
      </View>

      {/* 游戏网格 - 添加手势识别 */}
      <View
        style={styles.gridWrapper}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <GameGrid grid={grid} />
      </View>

      {/* 陀螺仪开关（暂时禁用） */}
      <View style={styles.gyroContainer}>
        <Text style={styles.gyroText}>
          陀螺仪控制 {isGyroMode ? '(已开启)' : '(未开启)'}
        </Text>
        <Text style={styles.gyroHint}>
          (功能开发中，敬请期待)
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightYellow,
    paddingHorizontal: 16,
  },

  // 顶部栏样式
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#776E65',
  },

  // 分数区域样式
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  scoreBox: {
    backgroundColor: '#BBADA0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EEE4DA',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },

  // 按钮区域样式
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  gameButton: {
    backgroundColor: '#8F7A66',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 游戏网格样式
  gridWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },

  // 陀螺仪区域样式
  gyroContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  gyroText: {
    fontSize: 16,
    color: '#776E65',
    fontWeight: '600',
  },
  gyroHint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
});
