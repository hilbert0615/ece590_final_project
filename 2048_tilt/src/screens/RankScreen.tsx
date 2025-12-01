import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { GameScore } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { getGlobalLeaderboard, getCityLeaderboard } from '../services/scoreService';
import { getCurrentLocation } from '../services/locationService';

/**
 * RankScreen - 排行榜界面
 */
interface RankScreenProps {
  onBack: () => void;
}

type TabType = 'global' | 'city';

export const RankScreen: React.FC<RankScreenProps> = ({ onBack }) => {
  const { backgroundColor, textColor, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化：获取用户城市
  useEffect(() => {
    detectUserCity();
  }, []);

  // 加载排行榜数据
  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, userCity]);

  /**
   * 检测用户所在城市
   */
  const detectUserCity = async () => {
    try {
      const result = await getCurrentLocation();
      if (result.location?.city) {
        setUserCity(result.location.city);
        console.log(`User's city: ${result.location.city}`);
      }
    } catch (error) {
      // 静默失败，不影响全球榜
      console.log('Unable to retrieve city information; only the global ranking will be displayed.');
    }
  };

  /**
   * 加载排行榜数据
   */
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'global') {
        const result = await getGlobalLeaderboard();
        if (result.error) {
          setError(result.error);
        } else {
          setLeaderboard(result.leaderboard || []);
        }
      } else {
        // 城市榜
        if (!userCity) {
          setError('Unable to detect your city. Please enable location.');
          setLeaderboard([]);
        } else {
          const result = await getCityLeaderboard(userCity);
          if (result.error) {
            setError(result.error);
          } else {
            setLeaderboard(result.leaderboard || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load the leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 下拉刷新
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  /**
   * 切换标签页
   */
  const switchTab = (tab: TabType) => {
    if (tab === 'city' && !userCity) {
      // 如果没有城市信息，提示用户
      detectUserCity();
    }
    setActiveTab(tab);
  };

  /**
   * 渲染排行榜项
   */
  const renderLeaderboardItem = (item: GameScore, index: number) => {
    const rank = index + 1;
    const isTopThree = rank <= 3;

    // 前三名的奖牌颜色
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // 金、银、铜
    const medalColor = isTopThree ? medalColors[rank - 1] : COLORS.gray;

    return (
      <View
        key={item.id}
        style={[styles.leaderboardItem, isTopThree && styles.topThreeItem]}
      >
        {/* 排名 */}
        <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          {item.city && (
            <Text style={styles.cityText} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} color={COLORS.gray} />
              {' '}
              {item.city}, {item.country || ''}
            </Text>
          )}
        </View>

        {/* 分数 */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </View>
    );
  };

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (leaderboard.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            {activeTab === 'city'
              ? 'No scores in your city yet.\nBe the first!'
              : 'No scores yet.\nStart playing to compete!'}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {leaderboard.map((item, index) => renderLeaderboardItem(item, index))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'right', 'bottom', 'left']}>
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          <View style={styles.landscapeLeftPanel}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color={isDarkMode ? textColor : COLORS.darkOrange} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDarkMode ? textColor : COLORS.darkOrange }]}>Leaderboard</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.tabContainerLandscape}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'global' && styles.activeTab]}
                onPress={() => switchTab('global')}
              >
                <Ionicons
                  name="earth"
                  size={20}
                  color={activeTab === 'global' ? COLORS.darkOrange : COLORS.gray}
                />
                <Text
                  style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}
                >
                  Global
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'city' && styles.activeTab]}
                onPress={() => switchTab('city')}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={activeTab === 'city' ? COLORS.darkOrange : COLORS.gray}
                />
                <Text style={[styles.tabText, activeTab === 'city' && styles.activeTabText]}>
                  {userCity || 'My City'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.landscapeRightPanel}>
            {renderContent()}
          </View>
        </View>
      ) : (
        <>
          {/* 顶部导航栏 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color={isDarkMode ? textColor : COLORS.darkOrange} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDarkMode ? textColor : COLORS.darkOrange }]}>Leaderboard</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 标签页切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'global' && styles.activeTab]}
              onPress={() => switchTab('global')}
            >
              <Ionicons
                name="earth"
                size={20}
                color={activeTab === 'global' ? COLORS.darkOrange : COLORS.gray}
              />
              <Text
                style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}
              >
                Global
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'city' && styles.activeTab]}
              onPress={() => switchTab('city')}
            >
              <Ionicons
                name="location"
                size={20}
                color={activeTab === 'city' ? COLORS.darkOrange : COLORS.gray}
              />
              <Text style={[styles.tabText, activeTab === 'city' && styles.activeTabText]}>
                {userCity || 'My City'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 排行榜内容 */}
          {renderContent()}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // 头部样式
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },

  // 标签页样式
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: COLORS.orange,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // 排行榜列表
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: COLORS.orange,
  },

  // 排名徽章
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 用户信息
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.gray,
  },

  // 分数
  scoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightYellow,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkOrange,
  },

  // 加载状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 错误状态
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.orange,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },

  // 横屏模式样式
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeLeftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  landscapeRightPanel: {
    flex: 2,
  },
  tabContainerLandscape: {
    padding: 16,
    gap: 12,
  },
});
