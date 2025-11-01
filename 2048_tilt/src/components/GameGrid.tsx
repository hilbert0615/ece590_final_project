import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tile } from './Tile';
import { Grid } from '../types/game';

/**
 * GameGrid 组件 - 4x4 游戏网格
 * @param grid - 当前游戏网格数据
 */
interface GameGridProps {
  grid: Grid;
}

export const GameGrid: React.FC<GameGridProps> = ({ grid }) => {
  return (
    <View style={styles.gridContainer}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value, colIndex) => (
            <Tile key={`${rowIndex}-${colIndex}`} value={value} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    backgroundColor: '#BBADA0',  // 网格背景色（棕灰色）
    padding: 8,
    borderRadius: 12,
    // 阴影效果 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // 阴影效果 (Android)
    elevation: 8,
  },
  row: {
    flexDirection: 'row',  // 横向排列方块
  },
});
