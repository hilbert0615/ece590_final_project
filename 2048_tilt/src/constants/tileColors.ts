/**
 * 方块颜色配置
 * 根据方块的数值返回对应的背景色和文字颜色
 */

export interface TileStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

// 方块颜色映射表
export const TILE_COLORS: Record<number, TileStyle> = {
  0: {
    backgroundColor: '#CDC1B4',  // 空方块 - 浅棕色
    textColor: '#776E65',
    fontSize: 32,
  },
  2: {
    backgroundColor: '#EEE4DA',  // 2 - 浅米色
    textColor: '#776E65',        // 深灰色文字
    fontSize: 44,
  },
  4: {
    backgroundColor: '#EDE0C8',  // 4 - 浅黄色
    textColor: '#776E65',
    fontSize: 44,
  },
  8: {
    backgroundColor: '#F2B179',  // 8 - 橙色
    textColor: '#F9F6F2',        // 从 8 开始使用白色文字
    fontSize: 44,
  },
  16: {
    backgroundColor: '#F59563',  // 16 - 深橙色
    textColor: '#F9F6F2',
    fontSize: 40,
  },
  32: {
    backgroundColor: '#F67C5F',  // 32 - 橙红色
    textColor: '#F9F6F2',
    fontSize: 40,
  },
  64: {
    backgroundColor: '#F65E3B',  // 64 - 红色
    textColor: '#F9F6F2',
    fontSize: 40,
  },
  128: {
    backgroundColor: '#EDCF72',  // 128 - 金黄色
    textColor: '#F9F6F2',
    fontSize: 32,
  },
  256: {
    backgroundColor: '#EDCC61',  // 256 - 深金黄色
    textColor: '#F9F6F2',
    fontSize: 32,
  },
  512: {
    backgroundColor: '#EDC850',  // 512 - 更深的金黄色
    textColor: '#F9F6F2',
    fontSize: 32,
  },
  1024: {
    backgroundColor: '#EDC53F',  // 1024 - 深黄色
    textColor: '#F9F6F2',
    fontSize: 26,
  },
  2048: {
    backgroundColor: '#EDC22E',  // 2048 - 胜利金色
    textColor: '#F9F6F2',
    fontSize: 26,
  },
  4096: {
    backgroundColor: '#3C3A32',  // 4096 - 深灰色
    textColor: '#F9F6F2',
    fontSize: 24,
  },
  8192: {
    backgroundColor: '#3C3A32',  // 8192 - 深灰色
    textColor: '#F9F6F2',
    fontSize: 24,
  },
  16384: {
    backgroundColor: '#3C3A32',  // 16384 - 深灰色
    textColor: '#F9F6F2',
    fontSize: 20,
  },
  32768: {
    backgroundColor: '#3C3A32',  // 32768 - 深灰色
    textColor: '#F9F6F2',
    fontSize: 20,
  },
  65536: {
    backgroundColor: '#3C3A32',  // 65536 - 深灰色
    textColor: '#F9F6F2',
    fontSize: 18,
  },
};

/**
 * 获取方块样式（带自适应字体大小）
 * @param value - 方块的数值
 * @returns 对应的样式对象
 */
export const getTileStyle = (value: number): TileStyle => {
  // 如果有预定义的样式，直接返回
  if (TILE_COLORS[value]) {
    return TILE_COLORS[value];
  }

  // 对于超大数字，根据位数自动计算字体大小
  if (value > 0) {
    const digits = value.toString().length;  // 数字位数

    // 根据位数递减字体大小
    let fontSize: number;
    if (digits <= 2) {
      fontSize = 44;  // 1-2 位数 (2, 4, 8 等)
    } else if (digits === 3) {
      fontSize = 32;  // 3 位数 (128, 256, 512)
    } else if (digits === 4) {
      fontSize = 26;  // 4 位数 (1024, 2048, 4096, 8192)
    } else if (digits === 5) {
      fontSize = 20;  // 5 位数 (16384, 32768, 65536)
    } else if (digits === 6) {
      fontSize = 18;  // 6 位数 (131072)
    } else {
      fontSize = 16;  // 7+ 位数
    }

    return {
      backgroundColor: '#3C3A32',  // 超大数字使用深灰色
      textColor: '#F9F6F2',
      fontSize: fontSize,
    };
  }

  // 默认返回空方块样式
  return TILE_COLORS[0];
};
