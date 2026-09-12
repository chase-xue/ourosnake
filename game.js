// 微信小游戏 & Web - 极简赛博·自噬蜕变贪吃蛇 (动态全屏自适应版)
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 6阶形态配置（超长硬核成长线：幼蛇 ➔ 灵蟒 ➔ 狂蛟 ➔ 冥螭 ➔ 应龙 ➔ 灭世神龙）
const STAGES = [
  { level: 1, name: '幼蛇', tag: 'LV1 试炼', grid: 18, minLen: 1 },
  { level: 2, name: '灵蟒', tag: 'LV2 觉醒', grid: 24, minLen: 30 },
  { level: 3, name: '狂蛟', tag: 'LV3 翻海', grid: 30, minLen: 80 },
  { level: 4, name: '冥螭', tag: 'LV4 蔽日', grid: 38, minLen: 150 },
  { level: 5, name: '应龙', tag: 'LV5 巡天', grid: 44, minLen: 230 },
  { level: 6, name: '神龙', tag: 'LV6 灭世', grid: 52, minLen: 300 }
];

// 5大自选难度体系：简单、普通、困难、噩梦、地狱
const DIFFICULTY_CONFIGS = {
  EASY: {
    id: 'EASY',
    name: '简单',
    tag: '休闲',
    color: '#36d7c6',
    baseSpeed: 125,
    minSpeed: 68,
    mineStartLen: 60,
    mineStep: 30,
    maxMines: 2,
    accelRate: 0.18,
    scoreMult: 1.0,
    desc: '平缓舒适，休闲放松与新手练习'
  },
  NORMAL: {
    id: 'NORMAL',
    name: '普通',
    tag: '标准',
    color: '#8dfc72',
    baseSpeed: 88,
    minSpeed: 46,
    mineStartLen: 35,
    mineStep: 22,
    maxMines: 3,
    accelRate: 0.28,
    scoreMult: 1.5,
    desc: '经典原版手感，平衡适中'
  },
  HARD: {
    id: 'HARD',
    name: '困难',
    tag: '进阶',
    color: '#ffb703',
    baseSpeed: 60,
    minSpeed: 32,
    mineStartLen: 20,
    mineStep: 16,
    maxMines: 4,
    accelRate: 0.35,
    scoreMult: 2.2,
    desc: '电竞级响应，雷区密集考验'
  },
  NIGHTMARE: {
    id: 'NIGHTMARE',
    name: '噩梦',
    tag: '高玩',
    color: '#fb8500',
    baseSpeed: 44,
    minSpeed: 24,
    mineStartLen: 12,
    mineStep: 12,
    maxMines: 5,
    accelRate: 0.42,
    scoreMult: 3.2,
    desc: '毫秒闪避，高频暗礁压迫'
  },
  HELL: {
    id: 'HELL',
    name: '地狱',
    tag: '极限',
    color: '#ff4d6d',
    baseSpeed: 30,
    minSpeed: 16,
    mineStartLen: 8,
    mineStep: 10,
    maxMines: 6,
    accelRate: 0.48,
    scoreMult: 5.0,
    desc: '瞬息万变，人类神经反射极限！'
  }
};

let snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
let dir = 'RIGHT';
let nextDir = 'RIGHT';
let food = { x: 8, y: 8 };
let specialItem = null;
let mines = []; // 致命赛博红雷暗礁
let stageIdx = 0;
let difficulty = 'NORMAL';
try {
  const savedDiff = wx.getStorageSync('SNAKE_DIFFICULTY');
  if (savedDiff && DIFFICULTY_CONFIGS[savedDiff]) difficulty = savedDiff;
} catch (e) {}

let isDifficultyModalOpen = false;
let gameState = 'RUNNING'; // RUNNING | PAUSED
let toast = '';
let toastTime = 0;
let flashEvo = 0;
let flashCut = 0;
let maxLen = 3;
try { maxLen = wx.getStorageSync('SNAKE_MAX_LEN') || 3; } catch (e) {}

let lastMoveTime = Date.now();
let lastItemTime = Date.now();
let animTick = 0;

// 交互状态
let touchStartX = 0, touchStartY = 0;
let activeDpadKey = ''; // 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

// 动态响应式尺寸与安全区参数
let dpr = 2;
let W = 375;
let H = 667;
let safeTop = 0;
let safeBottom = 0;
let padX = 16;
let topH = 104;
let botH = 164;
let arenaW = 343;
let arenaH = 399;

// 动态操作区热区参数
let ctrl = {
  cx: 187.5,
  dpadY: 595,
  hubR: 46,
  diffBadge: { x: 0, y: 0, w: 0, h: 0 },
  modalCards: [],
  modalCloseBtn: { x: 0, y: 0, w: 0, h: 0 }
};

// 核心自适应布局计算引擎
function updateLayout() {
  let sys = { windowWidth: 375, windowHeight: 667, pixelRatio: 2 };
  try {
    sys = wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : sys);
  } catch (e) {}

  dpr = Math.min(3, Math.max(1, sys.pixelRatio || (typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2)));
  W = Math.max(280, Math.round(sys.windowWidth || 375));
  H = Math.max(460, Math.round(sys.windowHeight || 667));

  safeTop = sys.safeArea ? Math.max(0, sys.safeArea.top || 0) : 0;
  safeBottom = sys.safeArea && sys.safeArea.bottom ? Math.max(0, H - sys.safeArea.bottom) : 0;

  // 保证 Canvas 物理像素尺寸与 CSS 逻辑尺寸严格 1:1 视网膜映射，消除任何模糊与拉伸
  const targetW = Math.floor(W * dpr);
  const targetH = Math.floor(H * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  // 边距与头部区域（完美避开刘海/灵动岛）
  padX = Math.max(12, Math.min(22, Math.floor(W * 0.042)));
  topH = Math.max(104, safeTop + 96);

  // ★★★ 核心重构：自底向上物理锚定，完全移除原速度按键，给棋盘留出最大垂直空间 ★★★
  ctrl.cx = W / 2;

  // 1. 罗盘尺寸与位置（底部保留充足手势避让区）
  ctrl.hubR = Math.min(48, Math.max(38, Math.floor(H * 0.062)));
  const bottomMargin = Math.max(14, safeBottom + 8);
  ctrl.dpadY = H - bottomMargin - ctrl.hubR;

  // 2. 战场棋盘区域（在 HUD 与罗盘之间的全部空间中最大化展开）
  arenaW = W - padX * 2;
  const gapDpadArena = Math.max(12, Math.min(22, Math.floor(H * 0.022)));
  const maxArenaBottom = (ctrl.dpadY - ctrl.hubR) - gapDpadArena;
  const availableArenaH = Math.max(180, maxArenaBottom - topH);

  // 严格根据可用空间计算行数，保证绝不向下挤压控制区
  const cols = STAGES[stageIdx].grid;
  const cellSize = arenaW / cols;
  const rows = Math.max(8, Math.floor(availableArenaH / cellSize));
  const actualArenaH = rows * cellSize;
  arenaH = actualArenaH;

  // 若存在微小余量，让棋盘在上下居中分布
  const extraSpace = Math.max(0, availableArenaH - actualArenaH);
  topH = topH + Math.floor(extraSpace * 0.4);

  // 避免屏幕旋转或变小后蛇或食物越界
  if (snake && snake.length) {
    snake.forEach(seg => {
      if (seg.x >= cols) seg.x = cols - 1;
      if (seg.y >= rows) seg.y = rows - 1;
    });
  }
  if (food) {
    if (food.x >= cols) food.x = cols - 1;
    if (food.y >= rows) food.y = rows - 1;
  }
}

const UI = {
  bg: '#080b12',
  panel: '#111722',
  panel2: '#151d2a',
  line: 'rgba(255,255,255,0.08)',
  text: '#f4f7fb',
  muted: '#778397',
  accent: '#8dfc72',
  accent2: '#36d7c6',
  danger: '#ff6178'
};

function getCols() {
  return STAGES[stageIdx].grid;
}

function getGrid() {
  const cols = getCols();
  const cellSize = arenaW / cols;
  const rows = Math.floor(arenaH / cellSize);
  const actualArenaH = rows * cellSize;
  return { cols, rows, cellSize, actualArenaH };
}

function spawnFood() {
  const { cols, rows } = getGrid();
  let empty = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (!snake.some(s => s.x === x && s.y === y)) empty.push({ x, y });
    }
  }
  if (empty.length > 0) food = empty[Math.floor(Math.random() * empty.length)];
}

function spawnSpecial() {
  const { cols, rows } = getGrid();
  let empty = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if ((x !== food.x || y !== food.y) &&
          !snake.some(s => s.x === x && s.y === y) &&
          !mines.some(m => m.x === x && m.y === y)) {
        empty.push({ x, y });
      }
    }
  }
  if (empty.length > 0) {
    specialItem = {
      ...empty[Math.floor(Math.random() * empty.length)],
      type: Math.random() < 0.6 ? 'SHRINK' : 'EXPAND',
      expire: Date.now() + 12000
    };
  }
}

// 致命赛博红雷暗礁生成与维护引擎（根据难度动态配置）
function updateMines() {
  const { cols, rows } = getGrid();
  const cfg = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  let targetCount = 0;
  if (snake.length >= cfg.mineStartLen) {
    targetCount = Math.min(
      cfg.maxMines,
      Math.floor((snake.length - cfg.mineStartLen) / cfg.mineStep) + 1
    );
  }

  while (mines.length > targetCount) mines.pop();

  while (mines.length < targetCount) {
    let empty = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if ((x !== food.x || y !== food.y) &&
            (!specialItem || x !== specialItem.x || y !== specialItem.y) &&
            !snake.some(s => s.x === x && s.y === y) &&
            !mines.some(m => m.x === x && m.y === y)) {
          empty.push({ x, y });
        }
      }
    }
    if (empty.length > 0) {
      mines.push(empty[Math.floor(Math.random() * empty.length)]);
    } else {
      break;
    }
  }
}

function relocateMine(index) {
  const { cols, rows } = getGrid();
  let empty = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if ((x !== food.x || y !== food.y) &&
          (!specialItem || x !== specialItem.x || y !== specialItem.y) &&
          !snake.some(s => s.x === x && s.y === y) &&
          !mines.some(m => m.x === x && m.y === y)) {
        empty.push({ x, y });
      }
    }
  }
  if (empty.length > 0 && mines[index]) {
    mines[index] = empty[Math.floor(Math.random() * empty.length)];
  }
}

function showTip(msg) {
  toast = msg;
  toastTime = Date.now() + 1600;
}

function vibrate(type) {
  try { if (wx.vibrateShort) wx.vibrateShort({ type: type || 'light', fail: () => {} }); } catch (e) {}
}

function tick() {
  if (gameState !== 'RUNNING') return;

  const { cols, rows } = getGrid();
  dir = nextDir;
  const head = { ...snake[0] };

  if (dir === 'UP') head.y -= 1;
  else if (dir === 'DOWN') head.y += 1;
  else if (dir === 'LEFT') head.x -= 1;
  else if (dir === 'RIGHT') head.x += 1;

  // 穿墙无限循环
  if (head.x < 0) head.x = cols - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y < 0) head.y = rows - 1;
  if (head.y >= rows) head.y = 0;

  // 自噬断尾
  let hitIdx = -1;
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      hitIdx = i;
      break;
    }
  }

  if (hitIdx !== -1) {
    const cut = snake.length - hitIdx;
    snake = snake.slice(0, Math.max(1, hitIdx));
    flashCut = 8;
    showTip('✂️ 断尾自噬！切除 ' + cut + ' 节身体');
    vibrate('heavy');
    updateMines();
  }

  // 致命赛博红雷暗礁碰撞检测
  let hitMineIdx = -1;
  for (let m = 0; m < mines.length; m++) {
    if (mines[m].x === head.x && mines[m].y === head.y) {
      hitMineIdx = m;
      break;
    }
  }

  if (hitMineIdx !== -1) {
    const cut = Math.max(2, Math.floor(snake.length * 0.45));
    snake = snake.slice(0, Math.max(2, snake.length - cut));
    flashCut = 12;
    showTip('💥 触碰赛博红雷！重创截断 -' + cut + ' 节！');
    vibrate('heavy');
    relocateMine(hitMineIdx);
    updateMines();
  }

  snake.unshift(head);
  let popTail = true;

  // 吃食物
  if (head.x === food.x && head.y === food.y) {
    popTail = false;
    vibrate('light');
    spawnFood();
    updateMines();
  }

  // 吃道具
  if (specialItem && head.x === specialItem.x && head.y === specialItem.y) {
    const type = specialItem.type;
    specialItem = null;
    if (type === 'SHRINK') {
      const cut = Math.min(2, Math.max(0, snake.length - 2));
      for (let k = 0; k < cut; k++) if (snake.length > 2) snake.pop();
      showTip('✨ 瘦身药水！长度 -' + cut);
    } else {
      const tail = snake[snake.length - 1];
      for (let k = 0; k < 3; k++) snake.push({ ...tail });
      showTip('⚡ 狂暴生长！长度 +3');
    }
    vibrate('medium');
  }

  if (popTail && snake.length > 1) snake.pop();

  if (snake.length > maxLen) {
    maxLen = snake.length;
    try { wx.setStorageSync('SNAKE_MAX_LEN', maxLen); } catch (e) {}
  }

  // 蜕变检查
  let target = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (snake.length >= STAGES[i].minLen) { target = i; break; }
  }

  if (target !== stageIdx) {
    const isUp = target > stageIdx;
    stageIdx = target;
    specialItem = null;
    if (isUp) {
      flashEvo = 10;
      showTip('🎉 蜕皮进化！' + STAGES[target].tag);
      vibrate('heavy');
    } else {
      showTip('⚠️ 恢复萌态身材');
      vibrate('medium');
    }
    spawnFood();
  }

  if (specialItem && Date.now() > specialItem.expire) {
    specialItem = null;
  }
}

// 辅助：绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawPanel(x, y, width, height, radius, fill) {
  ctx.fillStyle = fill || UI.panel;
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 渲染主界面
function render() {
  animTick++;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { cols, rows, cellSize, actualArenaH } = getGrid();

  // 1. 克制的深色背景，顶部保留一层柔和极光
  ctx.fillStyle = UI.bg;
  ctx.fillRect(0, 0, W, H);
  const ambient = ctx.createRadialGradient(W * 0.72, -20, 0, W * 0.72, -20, W * 0.9);
  ambient.addColorStop(0, 'rgba(54, 215, 198, 0.14)');
  ambient.addColorStop(0.48, 'rgba(141, 252, 114, 0.035)');
  ambient.addColorStop(1, 'rgba(8, 11, 18, 0)');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, W, topH + 120);

  // 2. 顶部优雅 HUD 看板
  renderHUD(W, topH);

  // 3. 游戏核心战场（精致圆角玻璃舱体）
  ctx.save();
  ctx.translate(padX, topH);

  // 战场背景
  const arenaGrad = ctx.createLinearGradient(0, 0, arenaW, actualArenaH);
  arenaGrad.addColorStop(0, '#101722');
  arenaGrad.addColorStop(1, '#0c111a');
  ctx.fillStyle = arenaGrad;
  drawRoundedRect(ctx, 0, 0, arenaW, actualArenaH, 18);
  ctx.fill();

  // 战场发光边框
  ctx.strokeStyle = 'rgba(141, 252, 114, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 裁剪为圆角内部以防止绘制溢出
  ctx.clip();

  // 精致点阵/微网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, actualArenaH); ctx.stroke();
  }
  for (let j = 1; j < rows; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * cellSize); ctx.lineTo(arenaW, j * cellSize); ctx.stroke();
  }

  // 绘制 3D 霓虹发光食物
  const fx = food.x * cellSize + cellSize / 2;
  const fy = food.y * cellSize + cellSize / 2;
  const foodR = Math.max(3.5, cellSize / 2 - 1.2);

  // 呼吸外晕
  const pulse = 1 + Math.sin(animTick * 0.09) * 0.18;
  ctx.fillStyle = 'rgba(255, 0, 110, 0.22)';
  ctx.beginPath();
  ctx.arc(fx, fy, foodR * 1.6 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // 核心球体
  const foodGrad = ctx.createRadialGradient(fx - foodR * 0.28, fy - foodR * 0.28, foodR * 0.1, fx, fy, foodR);
  foodGrad.addColorStop(0, '#ff70a6');
  foodGrad.addColorStop(0.65, '#ff006e');
  foodGrad.addColorStop(1, '#c7004c');
  ctx.fillStyle = foodGrad;
  ctx.beginPath();
  ctx.arc(fx, fy, foodR, 0, Math.PI * 2);
  ctx.fill();

  // 道具绘制
  if (specialItem) {
    const sx = specialItem.x * cellSize + cellSize / 2;
    const sy = specialItem.y * cellSize + cellSize / 2;
    const isShrink = specialItem.type === 'SHRINK';
    const sR = Math.max(3.5, cellSize / 2 - 1.2);

    ctx.fillStyle = isShrink ? 'rgba(155, 93, 229, 0.35)' : 'rgba(254, 228, 64, 0.35)';
    ctx.beginPath();
    ctx.arc(sx, sy, sR * 1.5 + Math.sin(animTick * 0.15) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isShrink ? '#9b5de5' : '#fee440';
    ctx.beginPath();
    ctx.arc(sx, sy, sR, 0, Math.PI * 2);
    ctx.fill();

    if (cellSize >= 11) {
      ctx.fillStyle = '#090b16';
      ctx.font = 'bold ' + Math.floor(cellSize * 0.6) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isShrink ? '✂' : '★', sx, sy);
    }
  }

  // 绘制致命赛博红雷暗礁 (Cyber Mines)
  mines.forEach((mine, mIdx) => {
    const mx = mine.x * cellSize + cellSize / 2;
    const my = mine.y * cellSize + cellSize / 2;
    const mR = Math.max(3.5, cellSize / 2 - 1.2);
    const minePulse = 1 + Math.sin(animTick * 0.16 + mIdx) * 0.22;

    // 危险外晕红光脉冲
    ctx.fillStyle = 'rgba(255, 30, 60, 0.28)';
    ctx.beginPath();
    ctx.arc(mx, my, mR * 1.65 * minePulse, 0, Math.PI * 2);
    ctx.fill();

    // 核心暗核地雷
    const mineGrad = ctx.createRadialGradient(mx - mR * 0.3, my - mR * 0.3, mR * 0.1, mx, my, mR);
    mineGrad.addColorStop(0, '#ff597b');
    mineGrad.addColorStop(0.65, '#d90429');
    mineGrad.addColorStop(1, '#590d22');
    ctx.fillStyle = mineGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mR, 0, Math.PI * 2);
    ctx.fill();

    if (cellSize >= 9) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.max(8, Math.floor(cellSize * 0.6)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', mx, my);
    }
  });

  // 绘制翡翠流光蛇身
  const cornerR = Math.max(2, Math.floor(cellSize * 0.36));
  const snakeLen = snake.length;

  for (let idx = snakeLen - 1; idx >= 0; idx--) {
    const seg = snake[idx];
    const pad = Math.max(0.6, cellSize * 0.08);
    const x = seg.x * cellSize + pad;
    const y = seg.y * cellSize + pad;
    const size = cellSize - pad * 2;

    if (idx === 0) {
      // 🐍 蛇头：高光翡翠绿
      const headGrad = ctx.createLinearGradient(x, y, x + size, y + size);
      headGrad.addColorStop(0, UI.accent);
      headGrad.addColorStop(1, UI.accent2);
      ctx.fillStyle = headGrad;
      drawRoundedRect(ctx, x, y, size, size, cornerR + 2);
      ctx.fill();

      // 灵动大眼睛
      drawSnakeEyes(ctx, x, y, size, dir);
    } else {
      // 身体：极光蓝渐变
      const t = idx / Math.max(1, snakeLen);
      const r = Math.round(54 + t * 35);
      const g = Math.round(215 - t * 55);
      const b = Math.round(198 - t * 70);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      drawRoundedRect(ctx, x, y, size, size, cornerR);
      ctx.fill();
    }
  }

  ctx.restore();

  // 4. 底部现代化人体工学操作区
  renderModernControls(W, H, actualArenaH);

  // 5. 提示 Toast
  if (toast && Date.now() < toastTime) {
    ctx.fillStyle = 'rgba(19, 27, 38, 0.96)';
    ctx.strokeStyle = UI.accent;
    ctx.lineWidth = 1.2;
    const tw = ctx.measureText(toast).width + 36;
    const tx = (W - tw) / 2;
    const ty = topH + 18;
    drawRoundedRect(ctx, tx, ty, tw, 34, 17);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = UI.text;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast, W / 2, ty + 17);
  }

  // 6. 蜕变 & 断尾全屏微波纹
  if (flashEvo > 0) {
    ctx.strokeStyle = `rgba(0, 245, 212, ${flashEvo / 10})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, W, H);
    flashEvo--;
  }
  if (flashCut > 0) {
    ctx.strokeStyle = `rgba(255, 0, 110, ${flashCut / 8})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, W, H);
    flashCut--;
  }

  if (gameState === 'PAUSED') renderPauseOverlay(actualArenaH);
  if (isDifficultyModalOpen) renderDifficultyModal(W, H);
}

function renderPauseOverlay(arenaHeight) {
  ctx.fillStyle = 'rgba(8, 11, 18, 0.62)';
  drawRoundedRect(ctx, padX, topH, arenaW, arenaHeight, 18);
  ctx.fill();
  ctx.fillStyle = UI.text;
  ctx.font = 'bold 25px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('游戏暂停', W / 2, topH + arenaHeight / 2 - 9);
  ctx.fillStyle = UI.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText('点击右上角继续', W / 2, topH + arenaHeight / 2 + 22);
}

// 蛇眼朝向
function drawSnakeEyes(ctx, x, y, size, curDir) {
  const eyeR = Math.max(1.3, size * 0.15);
  const pupilR = Math.max(0.6, eyeR * 0.55);
  let e1 = { x: 0, y: 0 }, e2 = { x: 0, y: 0 };
  let offX = 0, offY = 0;

  if (curDir === 'RIGHT') {
    e1 = { x: x + size * 0.74, y: y + size * 0.28 };
    e2 = { x: x + size * 0.74, y: y + size * 0.72 };
    offX = 0.5;
  } else if (curDir === 'LEFT') {
    e1 = { x: x + size * 0.26, y: y + size * 0.28 };
    e2 = { x: x + size * 0.26, y: y + size * 0.72 };
    offX = -0.5;
  } else if (curDir === 'UP') {
    e1 = { x: x + size * 0.28, y: y + size * 0.26 };
    e2 = { x: x + size * 0.72, y: y + size * 0.26 };
    offY = -0.5;
  } else if (curDir === 'DOWN') {
    e1 = { x: x + size * 0.28, y: y + size * 0.74 };
    e2 = { x: x + size * 0.72, y: y + size * 0.74 };
    offY = 0.5;
  }

  // 灵动大白眼底
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(e1.x, e1.y, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2.x, e2.y, eyeR, 0, Math.PI * 2); ctx.fill();

  // 深瞳
  ctx.fillStyle = '#090b16';
  ctx.beginPath(); ctx.arc(e1.x + offX, e1.y + offY, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2.x + offX, e2.y + offY, pupilR, 0, Math.PI * 2); ctx.fill();
}

// 顶部高质感 HUD 设计
function renderHUD(w, h) {
  const stage = STAGES[stageIdx];
  const top = safeTop + 8;
  const cfg = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SNAKE / 自噬蜕变', padX, top);

  ctx.fillStyle = UI.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(String(snake.length).padStart(2, '0'), padX, top + 17);
  ctx.fillStyle = UI.muted;
  ctx.font = '11px sans-serif';
  ctx.fillText('当前长度', padX + 40, top + 28);

  // 中央形态信息
  const infoX = padX + 96;
  ctx.fillStyle = UI.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(stage.name, infoX, top + 18);
  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.fillText(stage.tag, infoX, top + 38);

  // 右侧操作按钮区域
  const rightW = 26;
  const rightX = w - padX - rightW;

  // 1. 暂停按钮
  const isPause = gameState === 'PAUSED';
  ctx.fillStyle = isPause ? UI.accent : UI.panel2;
  drawRoundedRect(ctx, rightX, top + 10, rightW, 26, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.stroke();
  ctx.fillStyle = isPause ? UI.bg : UI.text;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isPause ? '▶' : 'Ⅱ', rightX + rightW / 2, top + 23);

  // 2. 重新开始按钮
  ctx.fillStyle = UI.panel2;
  drawRoundedRect(ctx, rightX, top + 42, rightW, 26, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 110, 0.35)';
  ctx.stroke();
  ctx.fillStyle = UI.danger;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('↻', rightX + rightW / 2, top + 55);

  // 3. 难度选择胶囊 (位于暂停按钮左侧，可点击展开选择面板)
  const badgeW = 76;
  const badgeH = 26;
  const badgeX = rightX - badgeW - 8;
  const badgeY = top + 10;
  ctrl.diffBadge = { x: badgeX, y: badgeY, w: badgeW, h: badgeH };

  ctx.fillStyle = UI.panel2;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fill();
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 发光状态小圆点
  ctx.fillStyle = cfg.color;
  ctx.beginPath();
  ctx.arc(badgeX + 11, badgeY + 13, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = UI.text;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.name, badgeX + 20, badgeY + 13);

  ctx.fillStyle = UI.muted;
  ctx.font = '9px sans-serif';
  ctx.fillText('▾', badgeX + badgeW - 12, badgeY + 13);

  // 4. 最高记录徽章 (位于重新开始按钮左侧)
  ctx.fillStyle = UI.panel2;
  drawRoundedRect(ctx, badgeX, top + 42, badgeW, 26, 8);
  ctx.fill();
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffb703';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👑 ' + maxLen + '节', badgeX + badgeW / 2, top + 55);

  // 5. 进化经验进度条
  const nextStage = STAGES[Math.min(stageIdx + 1, STAGES.length - 1)];
  const rangeStart = stage.minLen;
  const rangeEnd = stageIdx === STAGES.length - 1 ? Math.max(snake.length, stage.minLen) : nextStage.minLen;
  const progress = stageIdx === STAGES.length - 1 ? 1 : Math.max(0, Math.min(1, (snake.length - rangeStart) / (rangeEnd - rangeStart)));
  const barY = top + 74;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  drawRoundedRect(ctx, padX, barY, w - padX * 2, 5, 2.5);
  ctx.fill();
  if (progress > 0) {
    ctx.fillStyle = cfg.color;
    drawRoundedRect(ctx, padX, barY, (w - padX * 2) * progress, 5, 2.5);
    ctx.fill();
  }
  ctx.fillStyle = UI.muted;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(stageIdx === STAGES.length - 1 ? '已达灭世神龙绝巅形态' : `距离「${nextStage.name}」还差 ${Math.max(0, nextStage.minLen - snake.length)} 节`, padX, barY + 12);
}

// 底部现代操作区（纯粹罗盘，完全移除原3档速度按键）
function renderModernControls(w, h, arenaHeight) {
  const cx = ctrl.cx;
  const dpadY = ctrl.dpadY;
  const hubR = ctrl.hubR;
  const arrowDist = Math.floor(hubR * 0.62);

  // 外圈底盘
  ctx.fillStyle = '#0e141e';
  ctx.beginPath();
  ctx.arc(cx, dpadY, hubR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 中心装饰圆
  ctx.fillStyle = UI.panel2;
  ctx.beginPath();
  ctx.arc(cx, dpadY, Math.max(10, Math.floor(hubR * 0.3)), 0, Math.PI * 2);
  ctx.fill();

  // 四方向发光按键 (扇形/微浮雕)
  drawHubArrow(ctx, cx, dpadY - arrowDist, '▲', activeDpadKey === 'UP', hubR);
  drawHubArrow(ctx, cx, dpadY + arrowDist, '▼', activeDpadKey === 'DOWN', hubR);
  drawHubArrow(ctx, cx - arrowDist, dpadY, '◀', activeDpadKey === 'LEFT', hubR);
  drawHubArrow(ctx, cx + arrowDist, dpadY, '▶', activeDpadKey === 'RIGHT', hubR);

  // 两侧微提示
  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('也可在棋盘滑动', padX, dpadY + 4);

  ctx.textAlign = 'right';
  ctx.fillText('自噬断尾 · 穿墙', w - padX, dpadY + 4);
}

// 自选难度悬浮选择面板 (5大级别)
function renderDifficultyModal(w, h) {
  // 深色毛玻璃遮罩
  ctx.fillStyle = 'rgba(5, 7, 12, 0.85)';
  ctx.fillRect(0, 0, w, h);

  const modalW = Math.min(340, w - 24);
  const modalH = 406;
  const mx = Math.floor((w - modalW) / 2);
  const my = Math.max(safeTop + 14, Math.floor((h - modalH) / 2));

  // 弹窗主体面板
  drawPanel(mx, my, modalW, modalH, 20, '#101622');
  ctx.strokeStyle = 'rgba(141, 252, 114, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 标题
  ctx.fillStyle = UI.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('⚡ 选择游戏难度 (DIFFICULTY)', mx + 18, my + 16);

  ctx.fillStyle = UI.muted;
  ctx.font = '11px sans-serif';
  ctx.fillText('不同难度具备独立移速曲线、暗礁地雷与得分倍率', mx + 18, my + 38);

  // 5个难度卡片
  const diffKeys = ['EASY', 'NORMAL', 'HARD', 'NIGHTMARE', 'HELL'];
  const cardH = 52;
  const startY = my + 62;

  ctrl.modalCards = [];

  diffKeys.forEach((k, idx) => {
    const cfg = DIFFICULTY_CONFIGS[k];
    const cy = startY + idx * (cardH + 8);
    const isCur = difficulty === k;

    ctrl.modalCards.push({ key: k, x: mx + 14, y: cy, w: modalW - 28, h: cardH });

    // 卡片背景与高亮边框
    ctx.fillStyle = isCur ? 'rgba(21, 30, 44, 0.96)' : '#0d131d';
    drawRoundedRect(ctx, mx + 14, cy, modalW - 28, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = isCur ? cfg.color : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = isCur ? 1.8 : 1;
    ctx.stroke();

    // 难度颜色竖条
    ctx.fillStyle = cfg.color;
    drawRoundedRect(ctx, mx + 18, cy + 10, 4, cardH - 20, 2);
    ctx.fill();

    // 难度名称
    ctx.fillStyle = isCur ? cfg.color : UI.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.name, mx + 29, cy + 19);

    // 得分加权倍率胶囊
    const tagW = 44;
    ctx.fillStyle = isCur ? cfg.color : 'rgba(255, 255, 255, 0.1)';
    drawRoundedRect(ctx, mx + 68, cy + 11, tagW, 16, 8);
    ctx.fill();
    ctx.fillStyle = isCur ? UI.bg : UI.text;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.scoreMult + 'x分', mx + 68 + tagW / 2, cy + 19);

    // 移速与暗雷指标
    ctx.fillStyle = isCur ? '#ffffff' : UI.muted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${cfg.baseSpeed}ms ➔ ${cfg.minSpeed}ms`, mx + modalW - 24, cy + 19);

    // 描述
    ctx.fillStyle = UI.muted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cfg.desc, mx + 29, cy + 37);

    // 选中勾选标记
    if (isCur) {
      ctx.fillStyle = cfg.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓ 当前', mx + modalW - 24, cy + 37);
    }
  });

  // 底部完成按钮
  const btnY = my + modalH - 42;
  const btnW = modalW - 28;
  ctrl.modalCloseBtn = { x: mx + 14, y: btnY, w: btnW, h: 32 };
  ctx.fillStyle = UI.panel2;
  drawRoundedRect(ctx, mx + 14, btnY, btnW, 32, 10);
  ctx.fill();
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = UI.text;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('完成 / 返回游戏', mx + modalW / 2, btnY + 16);
}

function drawHubArrow(ctx, x, y, arrow, isPressed, hubR) {
  const r = hubR ? Math.max(12, Math.floor(hubR * 0.32)) : 15;
  if (isPressed) {
    ctx.fillStyle = 'rgba(141, 252, 114, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isPressed ? UI.accent : '#8290a4';
  ctx.font = 'bold ' + Math.max(12, Math.min(16, Math.floor(r * 0.95))) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(arrow, x, y);
}

// 动态速度计算：根据当前自选难度的基础速度与加速曲线，随蛇身成长提速
function getMoveInterval() {
  const cfg = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.NORMAL;
  const base = cfg.baseSpeed;
  const accel = Math.min(
    Math.floor(base - cfg.minSpeed),
    Math.floor((snake.length - 3) * cfg.accelRate)
  );
  return Math.max(cfg.minSpeed, base - accel);
}

// 主循环驱动
function loop() {
  const now = Date.now();
  const interval = getMoveInterval();

  if (now - lastMoveTime >= interval) {
    lastMoveTime = now;
    tick();
  }

  // 道具生成节奏放缓（从 9s 调至 15s），让走位吃食物与规避自身成为核心技巧
  if (now - lastItemTime >= 15000) {
    lastItemTime = now;
    if (gameState === 'RUNNING' && !specialItem && Math.random() < 0.5) {
      spawnSpecial();
    }
  }

  render();
  requestAnimationFrame(loop);
}

// 触摸交互：全面支持「自选难度面板」、「中央罗盘点击」与「全屏流畅滑动」
wx.onTouchStart((e) => {
  if (!e.touches || !e.touches[0]) return;
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;

  const x = t.clientX, y = t.clientY;
  const cx = ctrl.cx;
  const dpadY = ctrl.dpadY;

  // 0. 自选难度弹窗开启时的专属事件拦截
  if (isDifficultyModalOpen) {
    // 检查是否点击了某个难度卡片
    for (const card of (ctrl.modalCards || [])) {
      if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
        difficulty = card.key;
        try { wx.setStorageSync('SNAKE_DIFFICULTY', difficulty); } catch (err) {}
        updateMines();
        const cfg = DIFFICULTY_CONFIGS[difficulty];
        showTip('已切换为「' + cfg.name + '」难度 (' + cfg.scoreMult + 'x得分)');
        vibrate('medium');
        isDifficultyModalOpen = false;
        return;
      }
    }
    // 点击关闭按钮或弹窗外部均关闭弹窗
    isDifficultyModalOpen = false;
    vibrate('light');
    return;
  }

  // 1. 顶部右上角按钮响应
  const top = safeTop + 8;
  const rightW = 28;
  const rightX = W - padX - rightW;

  // 暂停
  if (x >= rightX - 8 && x <= rightX + rightW + 8 && y >= top && y <= top + 38) {
    gameState = gameState === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    vibrate('light');
    return;
  }
  // 重来
  if (x >= rightX - 8 && x <= rightX + rightW + 8 && y >= top + 38 && y <= top + 76) {
    snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
    dir = 'RIGHT';
    nextDir = 'RIGHT';
    stageIdx = 0;
    specialItem = null;
    mines = [];
    gameState = 'RUNNING';
    spawnFood();
    updateMines();
    showTip('新的旅程开始了');
    vibrate('medium');
    return;
  }

  // 2. 顶部难度选择徽章点击响应
  if (ctrl.diffBadge && x >= ctrl.diffBadge.x - 6 && x <= ctrl.diffBadge.x + ctrl.diffBadge.w + 6 &&
      y >= ctrl.diffBadge.y - 6 && y <= ctrl.diffBadge.y + ctrl.diffBadge.h + 6) {
    isDifficultyModalOpen = true;
    vibrate('light');
    return;
  }

  // 3. 圆形罗盘触控（根据 hubR 动态适配触发区域）
  const dist = Math.hypot(x - cx, y - dpadY);
  if (dist <= ctrl.hubR * 1.35) {
    const angle = Math.atan2(y - dpadY, x - cx) * (180 / Math.PI); // -180 ~ 180
    if (angle >= -135 && angle < -45) {
      if (dir !== 'DOWN') nextDir = 'UP';
      activeDpadKey = 'UP';
    } else if (angle >= 45 && angle < 135) {
      if (dir !== 'UP') nextDir = 'DOWN';
      activeDpadKey = 'DOWN';
    } else if (angle >= -45 && angle < 45) {
      if (dir !== 'LEFT') nextDir = 'RIGHT';
      activeDpadKey = 'RIGHT';
    } else {
      if (dir !== 'RIGHT') nextDir = 'LEFT';
      activeDpadKey = 'LEFT';
    }
    vibrate('light');
  }
});

wx.onTouchEnd((e) => {
  activeDpadKey = '';
  if (isDifficultyModalOpen) return;
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dist = Math.hypot(dx, dy);

  // 全屏任意位置极速滑动响应 (滑动 > 15px 即生效)
  if (dist > 15) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && dir !== 'LEFT') nextDir = 'RIGHT';
      else if (dx < 0 && dir !== 'RIGHT') nextDir = 'LEFT';
    } else {
      if (dy > 0 && dir !== 'UP') nextDir = 'DOWN';
      else if (dy < 0 && dir !== 'DOWN') nextDir = 'UP';
    }
  }
});

// 键盘交互支持 (Web 在线预览 / PC 调试)
try {
  const handleKey = (code) => {
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'w' || code === 'W') {
      if (dir !== 'DOWN') nextDir = 'UP';
    } else if (code === 'ArrowDown' || code === 'KeyS' || code === 's' || code === 'S') {
      if (dir !== 'UP') nextDir = 'DOWN';
    } else if (code === 'ArrowLeft' || code === 'KeyA' || code === 'a' || code === 'A') {
      if (dir !== 'RIGHT') nextDir = 'LEFT';
    } else if (code === 'ArrowRight' || code === 'KeyD' || code === 'd' || code === 'D') {
      if (dir !== 'LEFT') nextDir = 'RIGHT';
    } else if (code === 'Space' || code === ' ') {
      gameState = gameState === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    } else if (code === 'KeyR' || code === 'r' || code === 'R') {
      snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
      dir = 'RIGHT';
      nextDir = 'RIGHT';
      stageIdx = 0;
      specialItem = null;
      mines = [];
      gameState = 'RUNNING';
      spawnFood();
      updateMines();
      showTip('新的旅程开始了');
    } else if (code === 'Escape') {
      isDifficultyModalOpen = false;
    } else if (code === 'Digit1' || code === '1') {
      difficulty = 'EASY';
      updateMines();
      showTip('已切换为「简单」难度');
    } else if (code === 'Digit2' || code === '2') {
      difficulty = 'NORMAL';
      updateMines();
      showTip('已切换为「普通」难度');
    } else if (code === 'Digit3' || code === '3') {
      difficulty = 'HARD';
      updateMines();
      showTip('已切换为「困难」难度');
    } else if (code === 'Digit4' || code === '4') {
      difficulty = 'NIGHTMARE';
      updateMines();
      showTip('已切换为「噩梦」难度');
    } else if (code === 'Digit5' || code === '5') {
      difficulty = 'HELL';
      updateMines();
      showTip('已切换为「地狱」极限难度！');
    }
  };

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('keydown', (e) => {
      const code = e.code || e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(code)) {
        e.preventDefault();
      }
      handleKey(code);
    });
  } else if (typeof wx !== 'undefined' && wx.onKeyDown) {
    wx.onKeyDown((res) => {
      handleKey(res.code || res.key);
    });
  }
} catch (e) {}

// 监听窗口尺寸动态变化（移动端横竖屏切换、键盘弹出、桌面端浏览器缩放）
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('resize', updateLayout);
  window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateLayout);
  }
}
if (typeof wx !== 'undefined' && wx.onWindowResize) {
  wx.onWindowResize(updateLayout);
}

// 初始化启动
updateLayout();
spawnFood();
updateMines();
requestAnimationFrame(loop);

