/**
 * 方块颜色配置
 * 根据方块的数值返回对应的背景色和文字颜色
 */

export interface TileStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

// 方块颜色映射表 - 基于经典 2048 游戏的配色方案
export const TILE_COLORS: Record<number, TileStyle> = {
  0: {
    backgroundColor: '#CDC1B4',  // 空方块 - 浅棕色
    textColor: '#776E65',
    fontSize: 32,
  },
  2: {
    backgroundColor: '#EEE4DA',  // 2 - 浅米色
    textColor: '#776E65',        // 深灰色文字
    fontSize: 55,
  },
  4: {
    backgroundColor: '#EDE0C8',  // 4 - 浅黄色
    textColor: '#776E65',
    fontSize: 55,
  },
  8: {
    backgroundColor: '#F2B179',  // 8 - 橙色
    textColor: '#F9F6F2',        // 从 8 开始使用白色文字
    fontSize: 55,
  },
  16: {
    backgroundColor: '#F59563',  // 16 - 深橙色
    textColor: '#F9F6F2',
    fontSize: 50,
  },
  32: {
    backgroundColor: '#F67C5F',  // 32 - 橙红色
    textColor: '#F9F6F2',
    fontSize: 50,
  },
  64: {
    backgroundColor: '#F65E3B',  // 64 - 红色
    textColor: '#F9F6F2',
    fontSize: 50,
  },
  128: {
    backgroundColor: '#EDCF72',  // 128 - 金黄色
    textColor: '#F9F6F2',
    fontSize: 45,
  },
  256: {
    backgroundColor: '#EDCC61',  // 256 - 深金黄色
    textColor: '#F9F6F2',
    fontSize: 45,
  },
  512: {
    backgroundColor: '#EDC850',  // 512 - 更深的金黄色
    textColor: '#F9F6F2',
    fontSize: 45,
  },
  1024: {
    backgroundColor: '#EDC53F',  // 1024 - 深黄色
    textColor: '#F9F6F2',
    fontSize: 35,
  },
  2048: {
    backgroundColor: '#EDC22E',  // 2048 - 胜利金色
    textColor: '#F9F6F2',
    fontSize: 35,
  },
};

/**
 * 获取方块样式
 * @param value - 方块的数值
 * @returns 对应的样式对象
 */
export const getTileStyle = (value: number): TileStyle => {
  return TILE_COLORS[value] || TILE_COLORS[0];
};
