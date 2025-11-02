import { Grid, Direction } from '../types/game';

/**
 * 游戏逻辑工具函数
 * 包含所有核心游戏逻辑：初始化、移动、合并、判断游戏结束等
 */

/**
 * 创建一个空的 4x4 网格
 */
export const createEmptyGrid = (): Grid => {
  return Array(4).fill(null).map(() => Array(4).fill(0));
};

/**
 * 深拷贝网格（用于保存历史记录）
 */
export const cloneGrid = (grid: Grid): Grid => {
  return grid.map(row => [...row]);
};

/**
 * 在网格中添加一个随机数字（2 或 4）
 * 80% 概率生成 2，20% 概率生成 4
 */
export const addRandomTile = (grid: Grid): Grid => {
  const newGrid = cloneGrid(grid);
  const emptyCells: { row: number; col: number }[] = [];

  // 找到所有空格子
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (newGrid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }

  // 如果没有空格子，直接返回
  if (emptyCells.length === 0) {
    return newGrid;
  }

  // 随机选择一个空格子
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // 80% 概率生成 2，20% 概率生成 4
  const value = Math.random() < 0.8 ? 2 : 4;

  newGrid[randomCell.row][randomCell.col] = value;

  return newGrid;
};

/**
 * 初始化游戏网格（添加两个随机数字）
 */
export const initializeGrid = (): Grid => {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

/**
 * 反转数组（用于向右和向下移动）
 */
const reverseArray = (arr: number[]): number[] => {
  return [...arr].reverse();
};

/**
 * 滑动并合并一行
 * 返回新的行和本次移动获得的分数
 */
const slideAndMergeRow = (row: number[]): { newRow: number[]; scoreGained: number } => {
  let scoreGained = 0;

  // 步骤1：移除所有 0，压缩数组
  let newRow = row.filter(val => val !== 0);

  // 步骤2：合并相同的相邻数字
  for (let i = 0; i < newRow.length - 1; i++) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;           // 合并
      scoreGained += newRow[i];  // 加分
      newRow[i + 1] = 0;         // 标记为已合并
      i++;                        // 跳过下一个（已合并的）
    }
  }

  // 步骤3：再次移除 0
  newRow = newRow.filter(val => val !== 0);

  // 步骤4：用 0 填充到长度为 4
  while (newRow.length < 4) {
    newRow.push(0);
  }

  return { newRow, scoreGained };
};

/**
 * 向左移动
 */
const moveLeft = (grid: Grid): { newGrid: Grid; scoreGained: number; moved: boolean } => {
  let newGrid = cloneGrid(grid);
  let totalScore = 0;
  let moved = false;

  for (let row = 0; row < 4; row++) {
    const { newRow, scoreGained } = slideAndMergeRow(newGrid[row]);

    // 检查是否发生了移动
    if (JSON.stringify(newRow) !== JSON.stringify(newGrid[row])) {
      moved = true;
    }

    newGrid[row] = newRow;
    totalScore += scoreGained;
  }

  return { newGrid, scoreGained: totalScore, moved };
};

/**
 * 向右移动
 */
const moveRight = (grid: Grid): { newGrid: Grid; scoreGained: number; moved: boolean } => {
  let newGrid = cloneGrid(grid);
  let totalScore = 0;
  let moved = false;

  for (let row = 0; row < 4; row++) {
    // 反转行，向左移动，再反转回来
    const reversedRow = reverseArray(newGrid[row]);
    const { newRow, scoreGained } = slideAndMergeRow(reversedRow);
    const finalRow = reverseArray(newRow);

    if (JSON.stringify(finalRow) !== JSON.stringify(newGrid[row])) {
      moved = true;
    }

    newGrid[row] = finalRow;
    totalScore += scoreGained;
  }

  return { newGrid, scoreGained: totalScore, moved };
};

/**
 * 转置网格（行列互换，用于上下移动）
 */
const transposeGrid = (grid: Grid): Grid => {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      newGrid[col][row] = grid[row][col];
    }
  }
  return newGrid;
};

/**
 * 向上移动
 */
const moveUp = (grid: Grid): { newGrid: Grid; scoreGained: number; moved: boolean } => {
  // 转置 -> 向左移动 -> 转置回来
  const transposed = transposeGrid(grid);
  const { newGrid: movedGrid, scoreGained, moved } = moveLeft(transposed);
  const finalGrid = transposeGrid(movedGrid);

  return { newGrid: finalGrid, scoreGained, moved };
};

/**
 * 向下移动
 */
const moveDown = (grid: Grid): { newGrid: Grid; scoreGained: number; moved: boolean } => {
  // 转置 -> 向右移动 -> 转置回来
  const transposed = transposeGrid(grid);
  const { newGrid: movedGrid, scoreGained, moved } = moveRight(transposed);
  const finalGrid = transposeGrid(movedGrid);

  return { newGrid: finalGrid, scoreGained, moved };
};

/**
 * 根据方向移动网格
 */
export const move = (
  grid: Grid,
  direction: Direction
): { newGrid: Grid; scoreGained: number; moved: boolean } => {
  switch (direction) {
    case Direction.UP:
      return moveUp(grid);
    case Direction.DOWN:
      return moveDown(grid);
    case Direction.LEFT:
      return moveLeft(grid);
    case Direction.RIGHT:
      return moveRight(grid);
    default:
      return { newGrid: grid, scoreGained: 0, moved: false };
  }
};

/**
 * 检查游戏是否结束
 * 游戏结束条件：
 * 1. 网格已满（没有空格）
 * 2. 没有可以合并的相邻方块
 */
export const isGameOver = (grid: Grid): boolean => {
  // 检查是否有空格
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === 0) {
        return false; // 有空格，游戏未结束
      }
    }
  }

  // 检查是否有可以合并的相邻方块
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const current = grid[row][col];

      // 检查上方
      if (row > 0 && grid[row - 1][col] === current) return false;

      // 检查下方
      if (row < 3 && grid[row + 1][col] === current) return false;

      // 检查左边
      if (col > 0 && grid[row][col - 1] === current) return false;

      // 检查右边
      if (col < 3 && grid[row][col + 1] === current) return false;
    }
  }

  // 没有空格且没有可合并的方块，游戏结束
  return true;
};

/**
 * 检查是否获胜（达到 2048）
 */
export const hasWon = (grid: Grid): boolean => {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === 2048) {
        return true;
      }
    }
  }
  return false;
};
