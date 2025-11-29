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
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { GameGrid } from '../components/GameGrid';
import { COLORS } from '../constants/colors';
import { Grid, Direction, GameHistory } from '../types/game';
import { useTheme } from '../contexts/ThemeContext';
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
  const { backgroundColor, textColor, isDarkMode } = useTheme();
  
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

  // 陀螺仪模式状态
  const [isGyroMode, setIsGyroMode] = useState<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const canMoveRef = useRef(true);
  // 使用 useRef 延迟绑定 handleMove，避免声明顺序问题
  const handleMoveRef = useRef<((direction: Direction) => void) | null>(null);
  const lastMoveTimeRef = useRef<number>(0); // 记录上次移动时间

  // 帮助弹窗状态
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  // 手势识别相关状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // 动画相关
  const scorePopAnim = useRef(new Animated.Value(1)).current;

  // 防抖：防止连续滑动
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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

            // 尝试获取位置信息（静默失败）
            let location = undefined;
            try {
              const { getCurrentLocation } = await import('../services/locationService');
              const result = await getCurrentLocation();
              if (result.location && !result.error) {
                location = result.location;
                console.log(`位置信息: ${location.city}, ${location.country}`);
              }
            } catch (error) {
              // 静默失败，不影响分数提交
              console.log('未能获取位置信息，将不附带位置数据');
            }

            // 上传本次游戏分数（带位置信息）
            const { score: uploadedScore, error } = await uploadScore(
              supabaseUser.id,
              supabaseUser.username,
              newScore,
              location  // 如果有位置信息则上传
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

  // 更新 handleMoveRef
  useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  // 陀螺仪控制逻辑
  useEffect(() => {
    if (isGyroMode) {
      Accelerometer.setUpdateInterval(100);

      // 确保先移除旧的（如果有）
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      subscriptionRef.current = Accelerometer.addListener(data => {
        const { x, y } = data;
        const THRESHOLD = 0.55; // 触发阈值
        const MOVE_INTERVAL = 500; // 两次移动之间的最小间隔 (毫秒)

        const now = Date.now();
        // 如果距离上次移动时间太短，则忽略
        if (now - lastMoveTimeRef.current < MOVE_INTERVAL) {
          return;
        }

        // 检测倾斜
        if (Math.abs(x) > THRESHOLD || Math.abs(y) > THRESHOLD) {
          if (handleMoveRef.current) {
            if (Math.abs(x) > Math.abs(y)) {
              // 水平移动
              if (x > THRESHOLD) {
                // 向左倾斜 -> 右移 (修正：反转左右)
                handleMoveRef.current(Direction.RIGHT);
              } else {
                // 向右倾斜 -> 左移 (修正：反转左右)
                handleMoveRef.current(Direction.LEFT);
              }
            } else {
              // 垂直移动
              if (y > THRESHOLD) {
                // 向下倾斜 -> 上移 (修正：y > 0 是向下倾斜，对应上移)
                handleMoveRef.current(Direction.UP);
              } else {
                // 向上倾斜 -> 下移 (修正：y < 0 是向上倾斜，对应下移)
                handleMoveRef.current(Direction.DOWN);
              }
            }
            // 更新上次移动时间
            lastMoveTimeRef.current = now;
          }
        }
      });
    } else {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [isGyroMode]);

  /**
   * 手势识别 - 触摸开始
   */
  const onTouchStart = (event: GestureResponderEvent) => {
    // 允许同时使用手势和陀螺仪
    const { locationX, locationY } = event.nativeEvent;
    setTouchStart({ x: locationX, y: locationY });
  };

  /**
   * 手势识别 - 触摸结束（判断滑动方向）
   */
  const onTouchEnd = (event: GestureResponderEvent) => {
    if (!touchStart || isMoving) return;

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
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right', 'bottom']}>
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          {/* Left Column: Title, Back, Score */}
          <View style={styles.landscapeLeftColumn}>
            <TouchableOpacity
              onPress={() => {
                setIsGyroMode(false);
                if (subscriptionRef.current) {
                  subscriptionRef.current.remove();
                  subscriptionRef.current = null;
                }
                onBack();
              }}
              style={styles.backButtonLandscape}
            >
              <Ionicons name="arrow-back" size={28} color={isDarkMode ? textColor : COLORS.gray} />
            </TouchableOpacity>

            <Text style={[styles.titleLandscape, { color: isDarkMode ? textColor : '#776E65' }]}>2048 Tilt</Text>

            <View style={styles.scoreContainerLandscape}>
              <Animated.View
                style={[
                  styles.scoreBox,
                  { transform: [{ scale: scorePopAnim }] }
                ]}
              >
                <Text style={styles.scoreLabel}>SCORE</Text>
                <Text style={styles.scoreValue}>{score}</Text>
              </Animated.View>
              <View style={[styles.scoreBox, { marginTop: 10 }]}>
                <Text style={styles.scoreLabel}>BEST</Text>
                <Text style={styles.scoreValue}>{bestScore}</Text>
              </View>
            </View>
          </View>

          {/* Center Column: Grid */}
          <View style={styles.landscapeCenterColumn}>
            <View
              style={styles.gridWrapperLandscape}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <GameGrid grid={grid} />
            </View>
          </View>

          {/* Right Column: Controls */}
          <View style={styles.landscapeRightColumn}>
            <TouchableOpacity
              style={styles.gameButtonLandscape}
              onPress={startNewGame}
              disabled={isMoving}
            >
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gameButtonLandscape}
              onPress={undo}
              disabled={isMoving}
            >
              <Text style={styles.buttonText}>Undo</Text>
            </TouchableOpacity>

            <View style={styles.landscapeControlButtons}>
              <View style={styles.controlButtonWrapper}>
                <Text style={[styles.gyroLabel, { color: isDarkMode ? textColor : COLORS.gray }]}>Help</Text>
                <TouchableOpacity
                  style={styles.helpButtonLandscape}
                  onPress={() => setIsHelpModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="help" size={32} color={isDarkMode ? textColor : COLORS.gray} />
                </TouchableOpacity>
              </View>

              <View style={styles.controlButtonWrapper}>
                <Text style={[styles.gyroLabel, { color: isDarkMode ? textColor : COLORS.gray }]}>Tilt</Text>
                <TouchableOpacity
                  style={[styles.gyroButtonLandscape, isGyroMode && styles.gyroButtonActive]}
                  onPress={() => setIsGyroMode(!isGyroMode)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isGyroMode ? "hardware-chip" : "hardware-chip-outline"}
                    size={32}
                    color={isGyroMode ? "#FFFFFF" : (isDarkMode ? textColor : COLORS.gray)}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* 顶部栏 */}
          <View style={styles.header}>
            {/* 返回按钮 */}
            <TouchableOpacity
              onPress={() => {
                // 确保离开时关闭陀螺仪
                setIsGyroMode(false);
                if (subscriptionRef.current) {
                  subscriptionRef.current.remove();
                  subscriptionRef.current = null;
                }
                onBack();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color={isDarkMode ? textColor : COLORS.gray} />
            </TouchableOpacity>

            {/* 标题 */}
            <Text style={[styles.title, { color: isDarkMode ? textColor : '#776E65' }]}>2048 Tilt</Text>

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

          {/* 左下角帮助按钮 */}
          <View style={styles.helpButtonContainer}>
            <Text style={[styles.gyroLabel, { color: isDarkMode ? textColor : COLORS.gray }]}>Help</Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setIsHelpModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="help" size={32} color={isDarkMode ? textColor : COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* 陀螺仪控制区域 */}
          <View style={styles.gyroControlContainer}>
            <Text style={[styles.gyroLabel, { color: isDarkMode ? textColor : COLORS.gray }]}>Tilt Control</Text>
            <TouchableOpacity
              style={[styles.gyroButton, isGyroMode && styles.gyroButtonActive]}
              onPress={() => setIsGyroMode(!isGyroMode)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isGyroMode ? "hardware-chip" : "hardware-chip-outline"}
                size={32}
                color={isGyroMode ? "#FFFFFF" : (isDarkMode ? textColor : COLORS.gray)}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 帮助弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isHelpModalVisible}
        onRequestClose={() => setIsHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How to Play</Text>
              <TouchableOpacity
                onPress={() => setIsHelpModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? textColor : COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Game Rules</Text>
              <Text style={styles.modalText}>
                Swipe (Up, Down, Left, Right) to move the tiles. When two tiles with the same number touch, they merge into one. Join the numbers and get to the 2048 tile!
              </Text>

              <Text style={styles.sectionTitle}>Tilt Control Mode</Text>
              <Text style={styles.modalText}>
                Toggle the button in the bottom right to enable Tilt Control. Tilt your device to move tiles:
              </Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.modalText}>• Tilt Left/Right → Move Left/Right</Text>
                <Text style={styles.modalText}>• Tilt Forward (Away) → Move Up</Text>
                <Text style={styles.modalText}>• Tilt Backward (Towards you) → Move Down</Text>
              </View>
              <Text style={styles.noteText}>
                Note: You can use both touch gestures and tilt control at the same time.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsHelpModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}; const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  // 陀螺仪控制区域样式
  gyroControlContainer: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    alignItems: 'center',
    zIndex: 100,
  },
  gyroLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gyroButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gyroButtonActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },

  // 帮助按钮样式
  helpButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    alignItems: 'center',
    zIndex: 100,
  },
  helpButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // 横屏模式样式
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  landscapeLeftColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  landscapeCenterColumn: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeRightColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 16,
  },
  backButtonLandscape: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleLandscape: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainerLandscape: {
    alignItems: 'center',
    gap: 10,
  },
  gridWrapperLandscape: {
    transform: [{ scale: 0.8 }], // 稍微缩小网格以适应横屏高度
  },
  gameButtonLandscape: {
    backgroundColor: '#8F7A66',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  landscapeControlButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  controlButtonWrapper: {
    alignItems: 'center',
  },
  helpButtonLandscape: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gyroButtonLandscape: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  // Modal 样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#FAF8EF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#776E65',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#776E65',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    marginLeft: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 12,
  },
  modalButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

});
