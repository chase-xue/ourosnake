// 微信小游戏 & Web - 极简赛博·自噬蜕变贪吃蛇 (动态全屏自适应版)
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 6阶形态配置（超长硬核成长线：幼蛇 ➔ 灵蟒 ➔ 狂蛟 ➔ 冥螭 ➔ 应龙 ➔ 灭世神龙）
const STAGES = [
  {
    level: 1,
    name: '幼蛇',
    tag: 'LV1 试炼',
    grid: 18,
    minLen: 1,
    themeColor: '#52b788',
    headColors: ['#8dfc72', '#36d7c6'],
    bodyGrad: (t) => `rgb(${Math.round(54 + t * 35)}, ${Math.round(215 - t * 55)}, ${Math.round(198 - t * 70)})`,
    eyeType: 'CUTE_ROUND',
    features: { horns: false, wings: false, whiskers: false, cosmic: false }
  },
  {
    level: 2,
    name: '灵蟒',
    tag: 'LV2 觉醒',
    grid: 24,
    minLen: 30,
    themeColor: '#00b4d8',
    headColors: ['#00b4d8', '#90e0ef'],
    bodyGrad: (t) => `rgb(${Math.round(10 + t * 20)}, ${Math.round(160 - t * 70)}, ${Math.round(230 - t * 60)})`,
    eyeType: 'SLIT_PUPIL',
    features: { horns: false, wings: false, whiskers: true, cosmic: false }
  },
  {
    level: 3,
    name: '狂蛟',
    tag: 'LV3 翻海',
    grid: 30,
    minLen: 80,
    themeColor: '#ffb703',
    headColors: ['#ffb703', '#0077b6'],
    bodyGrad: (t) => `rgb(${Math.round(20 + t * 180)}, ${Math.round(80 + t * 90)}, ${Math.round(140 - t * 90)})`,
    eyeType: 'FEROCIOUS_GOLD',
    features: { horns: true, hornColor: '#ffb703', wings: false, whiskers: true, cosmic: false }
  },
  {
    level: 4,
    name: '冥螭',
    tag: 'LV4 蔽日',
    grid: 38,
    minLen: 150,
    themeColor: '#9d4edd',
    headColors: ['#c77dff', '#7b2cbf'],
    bodyGrad: (t) => `rgb(${Math.round(110 - t * 70)}, ${Math.round(30 + t * 20)}, ${Math.round(180 - t * 80)})`,
    eyeType: 'VOID_PURPLE',
    features: { horns: true, hornColor: '#e0aaff', wings: false, whiskers: true, cosmic: false }
  },
  {
    level: 5,
    name: '应龙',
    tag: 'LV5 巡天',
    grid: 44,
    minLen: 230,
    themeColor: '#fb8500',
    headColors: ['#ffb703', '#d00000'],
    bodyGrad: (t) => `rgb(${Math.round(230 - t * 60)}, ${Math.round(140 - t * 90)}, ${Math.round(20 + t * 30)})`,
    eyeType: 'SOLAR_BURST',
    features: { horns: true, hornColor: '#ffd166', wings: true, wingColor: 'rgba(255, 183, 3, 0.45)', whiskers: true, cosmic: false }
  },
  {
    level: 6,
    name: '神龙',
    tag: 'LV6 灭世',
    grid: 52,
    minLen: 300,
    themeColor: '#ff4d6d',
    headColors: ['#f72585', '#4cc9f0'],
    bodyGrad: (t, tick) => {
      const hue = Math.floor((tick * 3 + t * 180) % 360);
      return `hsl(${hue}, 85%, 60%)`;
    },
    eyeType: 'DUAL_STARS',
    features: { horns: true, hornColor: '#4cc9f0', wings: true, wingColor: 'rgba(247, 37, 133, 0.55)', whiskers: true, cosmic: true }
  }
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
  checkEvolution();

  if (specialItem && Date.now() > specialItem.expire) {
    specialItem = null;
  }
}

// 检查并触发神龙形态阶段进阶 (Stage Evolution)
function checkEvolution() {
  let target = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (snake.length >= STAGES[i].minLen) { target = i; break; }
  }

  if (target !== stageIdx) {
    const isUp = target > stageIdx;
    stageIdx = target;
    specialItem = null;
    updateLayout();
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

  // 绘制 6 阶神化进阶蛇/龙身
  const cornerR = Math.max(2, Math.floor(cellSize * 0.36));
  const snakeLen = snake.length;
  const stage = STAGES[stageIdx];

  for (let idx = snakeLen - 1; idx >= 0; idx--) {
    const seg = snake[idx];
    const cx = (seg.x + 0.5) * cellSize;
    const cy = (seg.y + 0.5) * cellSize;

    if (idx === 0) {
      // 🐉 龙头：根据 6 阶成长阶段调用专属真·神龙头部渲染引擎
      drawEpicDragonHead(ctx, cx, cy, cellSize, dir, stageIdx, animTick);
    } else if (idx === snakeLen - 1 && snakeLen > 2) {
      // 🐉 龙尾：根据 6 阶成长阶段调用专属真·神龙尾翼渲染引擎
      drawEpicDragonTail(ctx, cx, cy, cellSize, idx, snake, stageIdx, animTick);
    } else {
      // 🐉 龙躯：根据 6 阶成长阶段调用专属真·神龙体节渲染引擎
      drawEpicDragonBodySegment(ctx, cx, cy, cellSize, idx, snakeLen, snake, stageIdx, animTick);
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

// // ★★★ 核心引擎：6 阶形态专属真·龙头渲染引擎 (Epic Dragon Heads) ★★★
function drawEpicDragonHead(ctx, cx, cy, cellSize, curDir, stageIdx, animTick) {
  ctx.save();
  ctx.translate(cx, cy);

  // 1. 根据当前行进方向旋转龙头，确保龙首永远霸气朝向移动方向
  let angle = 0;
  if (curDir === 'RIGHT') angle = 0;
  else if (curDir === 'DOWN') angle = Math.PI / 2;
  else if (curDir === 'LEFT') angle = Math.PI;
  else if (curDir === 'UP') angle = -Math.PI / 2;
  ctx.rotate(angle);

  // 局部坐标系：+X为前方(龙吻)，-X为后方(脖颈)，-Y为左侧，+Y为右侧
  const R = Math.max(6, cellSize * 0.62);

  if (stageIdx === 0) {
    // ══════════════════════════════════════════════════
    // 【LV1 幼蛇 · 萌态小青蛇首】
    // ══════════════════════════════════════════════════
    // 萌蛇小舌头（周期性轻微吐信）
    const tongueFlick = Math.sin(animTick * 0.25);
    if (tongueFlick > 0.3) {
      const tLen = R * 0.4 * (tongueFlick - 0.3) * 1.5;
      ctx.strokeStyle = '#ff4d6d';
      ctx.lineWidth = Math.max(1, R * 0.12);
      ctx.beginPath();
      ctx.moveTo(R * 0.85, 0);
      ctx.lineTo(R * 0.85 + tLen, 0);
      ctx.lineTo(R * 0.85 + tLen + R * 0.15, -R * 0.12);
      ctx.moveTo(R * 0.85 + tLen, 0);
      ctx.lineTo(R * 0.85 + tLen + R * 0.15, R * 0.12);
      ctx.stroke();
    }

    // 翡翠小圆蛇头
    const babyGrad = ctx.createRadialGradient(R * 0.2, 0, 0, 0, 0, R * 1.1);
    babyGrad.addColorStop(0, '#8dfc72');
    babyGrad.addColorStop(0.7, '#52b788');
    babyGrad.addColorStop(1, '#2d6a4f');
    ctx.fillStyle = babyGrad;
    ctx.beginPath();
    ctx.ellipse(R * 0.1, 0, R * 0.95, R * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 腮红
    ctx.fillStyle = 'rgba(255, 120, 160, 0.45)';
    ctx.beginPath(); ctx.arc(R * 0.1, -R * 0.55, R * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(R * 0.1, R * 0.55, R * 0.22, 0, Math.PI * 2); ctx.fill();

    // 呆萌大圆眼
    drawCuteEyes(ctx, R * 0.3, R * 0.38, R * 0.28);

  } else if (stageIdx === 1) {
    // ══════════════════════════════════════════════════
    // 【LV2 灵蟒 · 冰晶琉璃灵蛇首】
    // ══════════════════════════════════════════════════
    // 飘逸青蓝灵蛇触须
    ctx.strokeStyle = '#90e0ef';
    ctx.lineWidth = Math.max(1, R * 0.09);
    const wave = Math.sin(animTick * 0.18) * R * 0.18;
    ctx.beginPath();
    ctx.moveTo(R * 0.8, -R * 0.2);
    ctx.quadraticCurveTo(R * 1.3, -R * 0.5 + wave, R * 1.8, -R * 0.2);
    ctx.moveTo(R * 0.8, R * 0.2);
    ctx.quadraticCurveTo(R * 1.3, R * 0.5 - wave, R * 1.8, R * 0.2);
    ctx.stroke();

    // 菱形流线型灵蟒头部
    const pythonGrad = ctx.createLinearGradient(-R * 0.8, 0, R * 1.1, 0);
    pythonGrad.addColorStop(0, '#03045e');
    pythonGrad.addColorStop(0.5, '#0077b6');
    pythonGrad.addColorStop(1, '#90e0ef');
    ctx.fillStyle = pythonGrad;
    ctx.beginPath();
    ctx.moveTo(R * 1.1, 0); // 蛇吻
    ctx.lineTo(R * 0.2, -R * 0.85); // 左侧颊骨
    ctx.lineTo(-R * 0.8, -R * 0.55); // 颈部左
    ctx.lineTo(-R * 0.8, R * 0.55); // 颈部右
    ctx.lineTo(R * 0.2, R * 0.85); // 右侧颊骨
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(144, 224, 239, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 额头灵动晶石
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.moveTo(R * 0.1, -R * 0.18);
    ctx.lineTo(R * 0.35, 0);
    ctx.lineTo(R * 0.1, R * 0.18);
    ctx.lineTo(-R * 0.15, 0);
    ctx.closePath();
    ctx.fill();

    // 冷冽青蓝竖瞳
    drawSlitEyes(ctx, R * 0.3, R * 0.42, R * 0.24, '#90e0ef', '#03045e');

  } else if (stageIdx === 2) {
    // ══════════════════════════════════════════════════
    // 【LV3 狂蛟 · 峥嵘雷蛟龙首】
    // ══════════════════════════════════════════════════
    // 1. 狂暴破骨金色蛟角 (双角向后延伸)
    ctx.fillStyle = '#ffb703';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8;
    drawHorn(ctx, -R * 0.2, -R * 0.45, -R * 1.4, -R * 0.95, R * 0.2);
    drawHorn(ctx, -R * 0.2, R * 0.45, -R * 1.4, R * 0.95, R * 0.2);

    // 2. 蛟首龙须（雷光摆动）
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(1.2, R * 0.1);
    const jiaoWave = Math.sin(animTick * 0.22) * R * 0.25;
    ctx.beginPath();
    ctx.moveTo(R * 0.9, -R * 0.3);
    ctx.quadraticCurveTo(R * 1.5, -R * 0.8 + jiaoWave, R * 2.1, -R * 0.4);
    ctx.moveTo(R * 0.9, R * 0.3);
    ctx.quadraticCurveTo(R * 1.5, R * 0.8 - jiaoWave, R * 2.1, R * 0.4);
    ctx.stroke();

    // 3. 狂蛟坚韧战甲龙头
    const jiaoGrad = ctx.createLinearGradient(-R * 0.8, 0, R * 1.2, 0);
    jiaoGrad.addColorStop(0, '#14213d');
    jiaoGrad.addColorStop(0.6, '#023e8a');
    jiaoGrad.addColorStop(1, '#ffb703');
    ctx.fillStyle = jiaoGrad;
    ctx.beginPath();
    ctx.moveTo(R * 1.25, 0); // 突出龙吻
    ctx.lineTo(R * 0.7, -R * 0.65);
    ctx.lineTo(0, -R * 0.85); // 腮甲
    ctx.lineTo(-R * 0.8, -R * 0.6);
    ctx.lineTo(-R * 0.8, R * 0.6);
    ctx.lineTo(0, R * 0.85);
    ctx.lineTo(R * 0.7, R * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 尖锐龙獠牙
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(R * 0.75, -R * 0.4); ctx.lineTo(R * 1.05, -R * 0.2); ctx.lineTo(R * 0.85, -R * 0.1); ctx.fill();
    ctx.moveTo(R * 0.75, R * 0.4); ctx.lineTo(R * 1.05, R * 0.2); ctx.lineTo(R * 0.85, R * 0.1); ctx.fill();

    // 金焰怒目龙瞳
    drawFierceEyes(ctx, R * 0.35, R * 0.42, R * 0.26, '#ffb703', '#780000');

  } else if (stageIdx === 3) {
    // ══════════════════════════════════════════════════
    // 【LV4 冥螭 · 幽冥紫霄龙首】
    // ══════════════════════════════════════════════════
    // 1. 三叉黑曜石龙冠 (Obsidian Crown)
    ctx.fillStyle = '#7209b7';
    ctx.strokeStyle = '#e0aaff';
    ctx.lineWidth = 1;
    drawHorn(ctx, -R * 0.3, -R * 0.45, -R * 1.35, -R * 0.8, R * 0.18);
    drawHorn(ctx, -R * 0.5, 0, -R * 1.6, 0, R * 0.22); // 中央大角
    drawHorn(ctx, -R * 0.3, R * 0.45, -R * 1.35, R * 0.8, R * 0.18);

    // 2. 幽冥紫电龙须
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = Math.max(1.2, R * 0.1);
    const voidWave = Math.sin(animTick * 0.16) * R * 0.22;
    ctx.beginPath();
    ctx.moveTo(R * 0.95, -R * 0.25);
    ctx.quadraticCurveTo(R * 1.5, -R * 0.7 + voidWave, R * 2.2, -R * 0.2);
    ctx.moveTo(R * 0.95, R * 0.25);
    ctx.quadraticCurveTo(R * 1.5, R * 0.7 - voidWave, R * 2.2, R * 0.2);
    ctx.stroke();

    // 3. 冥螭黑曜石骨甲龙头
    const netherGrad = ctx.createLinearGradient(-R * 0.9, 0, R * 1.25, 0);
    netherGrad.addColorStop(0, '#10002b');
    netherGrad.addColorStop(0.5, '#3a0ca3');
    netherGrad.addColorStop(1, '#7209b7');
    ctx.fillStyle = netherGrad;
    ctx.beginPath();
    ctx.moveTo(R * 1.3, 0);
    ctx.lineTo(R * 0.8, -R * 0.7);
    ctx.lineTo(0, -R * 0.9);
    ctx.lineTo(-R * 0.9, -R * 0.65);
    ctx.lineTo(-R * 0.9, R * 0.65);
    ctx.lineTo(0, R * 0.9);
    ctx.lineTo(R * 0.8, R * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e0aaff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 额头幽冥符文
    ctx.fillStyle = '#f72585';
    ctx.beginPath();
    ctx.arc(R * 0.25, 0, R * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 虚空紫炎瞳
    drawFierceEyes(ctx, R * 0.4, R * 0.45, R * 0.25, '#e0aaff', '#240046');

  } else if (stageIdx === 4) {
    // ══════════════════════════════════════════════════
    // 【LV5 应龙 · 苍茫金羽神龙首】
    // ══════════════════════════════════════════════════
    // 1. 神圣光能羽翼振翅 (Celestial Wings)
    const wingFlap = Math.sin(animTick * 0.2) * R * 0.35;
    ctx.fillStyle = 'rgba(255, 183, 3, 0.65)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    // 左翼
    ctx.beginPath();
    ctx.moveTo(-R * 0.4, -R * 0.5);
    ctx.quadraticCurveTo(-R * 0.8, -R * 1.8 + wingFlap, -R * 0.1, -R * 1.5 + wingFlap);
    ctx.lineTo(-R * 0.3, -R * 0.6);
    ctx.fill(); ctx.stroke();
    // 右翼
    ctx.beginPath();
    ctx.moveTo(-R * 0.4, R * 0.5);
    ctx.quadraticCurveTo(-R * 0.8, R * 1.8 - wingFlap, -R * 0.1, R * 1.5 - wingFlap);
    ctx.lineTo(-R * 0.3, R * 0.6);
    ctx.fill(); ctx.stroke();

    // 2. 皇家鹿角状金冠龙角
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    drawAntlerHorn(ctx, -R * 0.2, -R * 0.5, -R * 1.5, -R * 1.1);
    drawAntlerHorn(ctx, -R * 0.2, R * 0.5, -R * 1.5, R * 1.1);

    // 3. 金焰飘动龙须
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(1.5, R * 0.12);
    const yingWave = Math.sin(animTick * 0.18) * R * 0.28;
    ctx.beginPath();
    ctx.moveTo(R * 1.05, -R * 0.3);
    ctx.quadraticCurveTo(R * 1.7, -R * 0.85 + yingWave, R * 2.4, -R * 0.4);
    ctx.moveTo(R * 1.05, R * 0.3);
    ctx.quadraticCurveTo(R * 1.7, R * 0.85 - yingWave, R * 2.4, R * 0.4);
    ctx.stroke();

    // 4. 应龙赤金尊贵神首
    const yingGrad = ctx.createLinearGradient(-R * 0.9, 0, R * 1.35, 0);
    yingGrad.addColorStop(0, '#d00000');
    yingGrad.addColorStop(0.5, '#f48c06');
    yingGrad.addColorStop(1, '#ffba08');
    ctx.fillStyle = yingGrad;
    ctx.beginPath();
    ctx.moveTo(R * 1.4, 0); // 威武龙吻
    ctx.lineTo(R * 0.9, -R * 0.7);
    ctx.lineTo(R * 0.1, -R * 0.95); // 龙鬓
    ctx.lineTo(-R * 0.9, -R * 0.65);
    ctx.lineTo(-R * 0.9, R * 0.65);
    ctx.lineTo(R * 0.1, R * 0.95);
    ctx.lineTo(R * 0.9, R * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffe49e';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 耀阳赤金龙瞳
    drawFierceEyes(ctx, R * 0.42, R * 0.48, R * 0.27, '#ffffff', '#d00000');

  } else {
    // ══════════════════════════════════════════════════
    // 【LV6 灭世神龙 · 至尊星穹神龙首】
    // ══════════════════════════════════════════════════
    // 1. 旋转天道星云神环 (Cosmic Halo Ring)
    const haloR = R * 1.6 + Math.sin(animTick * 0.15) * R * 0.1;
    ctx.save();
    ctx.strokeStyle = `hsl(${(animTick * 4) % 360}, 95%, 70%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();
    // 环绕星辰粒子
    for (let p = 0; p < 4; p++) {
      const pAngle = animTick * 0.08 + (p * Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(pAngle) * haloR, Math.sin(pAngle) * haloR, Math.max(1.5, R * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. 晶莹珊瑚星晶神角
    ctx.fillStyle = `hsl(${(animTick * 3 + 180) % 360}, 90%, 65%)`;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    drawAntlerHorn(ctx, -R * 0.3, -R * 0.55, -R * 1.65, -R * 1.25);
    drawAntlerHorn(ctx, -R * 0.3, R * 0.55, -R * 1.65, R * 1.25);

    // 3. 璀璨星河龙须
    ctx.strokeStyle = `hsl(${(animTick * 3) % 360}, 90%, 75%)`;
    ctx.lineWidth = Math.max(1.6, R * 0.14);
    const godWave = Math.sin(animTick * 0.2) * R * 0.32;
    ctx.beginPath();
    ctx.moveTo(R * 1.15, -R * 0.35);
    ctx.quadraticCurveTo(R * 1.8, -R * 0.95 + godWave, R * 2.6, -R * 0.45);
    ctx.moveTo(R * 1.15, R * 0.35);
    ctx.quadraticCurveTo(R * 1.8, R * 0.95 - godWave, R * 2.6, R * 0.45);
    ctx.stroke();

    // 4. 灭世神龙星云霓虹龙头
    const godGrad = ctx.createRadialGradient(R * 0.3, 0, 0, 0, 0, R * 1.4);
    godGrad.addColorStop(0, '#ffffff');
    godGrad.addColorStop(0.3, `hsl(${(animTick * 3) % 360}, 90%, 60%)`);
    godGrad.addColorStop(0.8, `hsl(${(animTick * 3 + 120) % 360}, 85%, 45%)`);
    godGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = godGrad;
    ctx.beginPath();
    ctx.moveTo(R * 1.45, 0); // 威严至尊龙吻
    ctx.lineTo(R * 0.95, -R * 0.75);
    ctx.lineTo(R * 0.1, -R * 1.05); // 霸气龙角基座
    ctx.lineTo(-R * 0.95, -R * 0.7);
    ctx.lineTo(-R * 0.95, R * 0.7);
    ctx.lineTo(R * 0.1, R * 1.05);
    ctx.lineTo(R * 0.95, R * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 5. 日月星辰异色神瞳 (左蓝星河，右金恒星)
    drawDualStarEyes(ctx, R * 0.45, R * 0.52, R * 0.3);
  }

  ctx.restore();
}

// 辅助绘图：呆萌大圆眼
function drawCuteEyes(ctx, ex, ey, er) {
  [-ey, ey].forEach(yPos => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, yPos, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#090b16';
    ctx.beginPath(); ctx.arc(ex + er * 0.25, yPos, er * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex + er * 0.15, yPos - er * 0.25, er * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + er * 0.45, yPos + er * 0.25, er * 0.16, 0, Math.PI * 2); ctx.fill();
  });
}

// 辅助绘图：冷冽竖瞳
function drawSlitEyes(ctx, ex, ey, er, eyeColor, pupilColor) {
  [-ey, ey].forEach(yPos => {
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(ex, yPos, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupilColor;
    ctx.fillRect(ex - er * 0.18, yPos - er * 0.8, er * 0.36, er * 1.6);
  });
}

// 辅助绘图：凶猛掠食者龙瞳
function drawFierceEyes(ctx, ex, ey, er, eyeColor, pupilColor) {
  [-ey, ey].forEach(yPos => {
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(ex, yPos, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupilColor;
    ctx.beginPath(); ctx.arc(ex + er * 0.2, yPos, er * 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex + er * 0.3, yPos - er * 0.2, er * 0.2, 0, Math.PI * 2); ctx.fill();
  });
}

// 辅助绘图：日月星辰异色神瞳 (左眼天蓝星河，右眼炽阳金星)
function drawDualStarEyes(ctx, ex, ey, er) {
  // 左眼 (星河蓝)
  ctx.fillStyle = '#4cc9f0';
  ctx.beginPath(); ctx.arc(ex, -ey, er, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ex + er * 0.2, -ey, er * 0.45, 0, Math.PI * 2); ctx.fill();
  // 右眼 (炽金恒星)
  ctx.fillStyle = '#ffb703';
  ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ex + er * 0.2, ey, er * 0.45, 0, Math.PI * 2); ctx.fill();
}

// 辅助绘图：锐利独角/蛟角
function drawHorn(ctx, bx, by, tx, ty, baseW) {
  ctx.beginPath();
  ctx.moveTo(bx, by - baseW / 2);
  ctx.quadraticCurveTo(bx + (tx - bx) * 0.5, by + (ty - by) * 0.2, tx, ty);
  ctx.quadraticCurveTo(bx + (tx - bx) * 0.6, by + (ty - by) * 0.8, bx, by + baseW / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// 辅助绘图：皇家鹿角状龙角
function drawAntlerHorn(ctx, bx, by, tx, ty) {
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + (tx - bx) * 0.5, by + (ty - by) * 0.3, tx, ty);
  // 侧分叉
  const midX = bx + (tx - bx) * 0.55;
  const midY = by + (ty - by) * 0.45;
  ctx.moveTo(midX, midY);
  ctx.lineTo(midX - (tx - bx) * 0.3, midY + (ty - by) * 0.2);
}

// // ★★★ 核心引擎：6 阶形态专属真·神龙体节渲染引擎 (Epic Dragon Body Segments) ★★★
function drawEpicDragonBodySegment(ctx, cx, cy, cellSize, idx, totalLen, snake, stageIdx, animTick) {
  const prev = snake[idx - 1] || snake[idx];
  const { cols, rows } = getGrid();

  // 计算身体前后走向与局部旋转角 (沿身体脊椎流动方向，+X指向后方/蛇尾，-X指向前方/龙头，±Y为身体两侧)
  let dx = snake[idx].x - prev.x;
  let dy = snake[idx].y - prev.y;
  if (dx > cols / 2) dx -= cols;
  else if (dx < -cols / 2) dx += cols;
  if (dy > rows / 2) dy -= rows;
  else if (dy < -rows / 2) dy += rows;

  const segAngle = Math.atan2(dy, dx);
  const R = Math.max(5, cellSize * 0.52);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(segAngle);

  if (stageIdx === 0) {
    // ══════════════════════════════════════════════════
    // 【LV1 幼蛇 · 萌润水玉青露珠】
    // ══════════════════════════════════════════════════
    const grad = ctx.createRadialGradient(-R * 0.2, -R * 0.2, R * 0.1, 0, 0, R * 0.95);
    grad.addColorStop(0, '#a7f3d0');
    grad.addColorStop(0.5, '#34d399');
    grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // 晶莹白斑高光 (Q弹果冻质感)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(-R * 0.32, -R * 0.32, R * 0.26, 0, Math.PI * 2);
    ctx.fill();

    // 腹部柔润弧线
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.88, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();

  } else if (stageIdx === 1) {
    // ══════════════════════════════════════════════════
    // 【LV2 灵蟒 · 菱形寒冰晶鳞】
    // ══════════════════════════════════════════════════
    const scaleL = R * 1.05;
    const scaleW = R * 0.82;

    ctx.beginPath();
    ctx.moveTo(-scaleL, 0); // 龙头方向
    ctx.lineTo(0, -scaleW);  // 左晶角
    ctx.lineTo(scaleL, 0);  // 龙尾方向
    ctx.lineTo(0, scaleW);   // 右晶角
    ctx.closePath();

    const iceGrad = ctx.createLinearGradient(-scaleL, 0, scaleL, 0);
    iceGrad.addColorStop(0, '#0077b6');
    iceGrad.addColorStop(0.5, '#00b4d8');
    iceGrad.addColorStop(1, '#90e0ef');
    ctx.fillStyle = iceGrad;
    ctx.fill();

    // 晶体中轴切割棱线与冰蓝高光
    ctx.strokeStyle = '#caf0f8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-scaleL, 0);
    ctx.lineTo(scaleL, 0);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -scaleW);
    ctx.lineTo(0, scaleW);
    ctx.stroke();

    // 晶核侧反光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-scaleL * 0.6, 0);
    ctx.lineTo(0, -scaleW * 0.6);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

  } else if (stageIdx === 2) {
    // ══════════════════════════════════════════════════
    // 【LV3 狂蛟 · 金雷重铠 + 龙脊雷刺】
    // ══════════════════════════════════════════════════
    // 1. 龙背雷棘刺 (每两节向外张合延伸一对锋锐雷鳍)
    if (idx % 2 === 1) {
      const spineSpike = R * 0.65;
      ctx.fillStyle = '#ffb703';
      // 左侧龙脊雷刺
      ctx.beginPath();
      ctx.moveTo(-R * 0.3, -R * 0.7);
      ctx.lineTo(R * 0.2, -R * 0.7 - spineSpike);
      ctx.lineTo(R * 0.45, -R * 0.6);
      ctx.closePath();
      ctx.fill();
      // 右侧龙脊雷刺
      ctx.beginPath();
      ctx.moveTo(-R * 0.3, R * 0.7);
      ctx.lineTo(R * 0.2, R * 0.7 + spineSpike);
      ctx.lineTo(R * 0.45, R * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // 2. 六边形重装雷鳞胸甲
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, 0);
    ctx.lineTo(-R * 0.4, -R * 0.82);
    ctx.lineTo(R * 0.4, -R * 0.82);
    ctx.lineTo(R * 0.85, 0);
    ctx.lineTo(R * 0.4, R * 0.82);
    ctx.lineTo(-R * 0.4, R * 0.82);
    ctx.closePath();

    const stormGrad = ctx.createLinearGradient(-R, 0, R, 0);
    stormGrad.addColorStop(0, '#102a43');
    stormGrad.addColorStop(0.5, '#1e3a8a');
    stormGrad.addColorStop(1, '#ffb703');
    ctx.fillStyle = stormGrad;
    ctx.fill();

    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 3. 脊背金色闪电纹脉
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.6, 0);
    ctx.lineTo(-R * 0.1, -R * 0.25);
    ctx.lineTo(R * 0.15, R * 0.25);
    ctx.lineTo(R * 0.6, 0);
    ctx.stroke();

  } else if (stageIdx === 3) {
    // ══════════════════════════════════════════════════
    // 【LV4 冥螭 · 幽冥黑曜骨铠 + 紫焰灵核】
    // ══════════════════════════════════════════════════
    // 1. 黑曜重装倒钩鳞甲
    ctx.beginPath();
    ctx.moveTo(-R * 0.9, 0);
    ctx.lineTo(-R * 0.3, -R * 0.85);
    ctx.lineTo(R * 0.85, -R * 0.75);
    ctx.lineTo(R * 0.5, 0);
    ctx.lineTo(R * 0.85, R * 0.75);
    ctx.lineTo(-R * 0.3, R * 0.85);
    ctx.closePath();

    const darkGrad = ctx.createLinearGradient(-R, 0, R, 0);
    darkGrad.addColorStop(0, '#13091f');
    darkGrad.addColorStop(0.7, '#240046');
    darkGrad.addColorStop(1, '#3c096c');
    ctx.fillStyle = darkGrad;
    ctx.fill();

    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. 体节中心脉动的幽冥紫焰灵核
    const pulse = Math.sin(animTick * 0.18 + idx * 0.4) * 0.3 + 0.7;
    const coreR = R * 0.32 * pulse;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, coreR * 1.6));
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#e0aaff');
    coreGrad.addColorStop(0.8, '#7b2cbf');
    coreGrad.addColorStop(1, 'rgba(123, 44, 191, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, coreR * 1.4), 0, Math.PI * 2);
    ctx.fill();

    // 幽冥古印十字微刻
    ctx.strokeStyle = 'rgba(224, 170, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-R * 0.35, 0); ctx.lineTo(R * 0.35, 0);
    ctx.moveTo(0, -R * 0.35); ctx.lineTo(0, R * 0.35);
    ctx.stroke();

  } else if (stageIdx === 4) {
    // ══════════════════════════════════════════════════
    // 【LV5 应龙 · 太古赤金龙鳞 + 舒展飞羽龙翼】
    // ══════════════════════════════════════════════════
    // 1. 紧随龙头的关键体节展开飘逸神化金翼 (前3节及每隔5节的龙鬃)
    if (idx <= 3 || idx % 5 === 2) {
      const wingWave = Math.sin(animTick * 0.25 + idx * 0.8) * R * 0.35;
      const wingSpan = R * 1.55;
      // 左侧飞羽
      ctx.fillStyle = 'rgba(255, 183, 3, 0.65)';
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.6);
      ctx.quadraticCurveTo(-R * 0.1, -R * 0.6 - wingSpan + wingWave, R * 0.5, -R * 0.6 - wingSpan * 0.8);
      ctx.quadraticCurveTo(R * 0.3, -R * 0.6, R * 0.4, -R * 0.4);
      ctx.closePath();
      ctx.fill();
      // 右侧飞羽
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, R * 0.6);
      ctx.quadraticCurveTo(-R * 0.1, R * 0.6 + wingSpan - wingWave, R * 0.5, R * 0.6 + wingSpan * 0.8);
      ctx.quadraticCurveTo(R * 0.3, R * 0.6, R * 0.4, R * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    // 2. 皇家赤金层叠龙鳞甲
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.86, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.lineTo(-R * 0.86, 0);
    ctx.closePath();

    const goldGrad = ctx.createLinearGradient(-R, 0, R, 0);
    goldGrad.addColorStop(0, '#d00000');
    goldGrad.addColorStop(0.3, '#dc2f02');
    goldGrad.addColorStop(0.7, '#ffba08');
    goldGrad.addColorStop(1, '#fff3b0');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // 金色鳞弧雕纹
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-R * 0.2, 0, R * 0.55, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

  } else if (stageIdx === 5) {
    // ══════════════════════════════════════════════════
    // 【LV6 灭世神龙 · 创世星海霓虹 + 超新星耀斑】
    // ══════════════════════════════════════════════════
    const baseHue = (animTick * 3.5 + idx * 8) % 360;

    // 1. 虚空星云粒子辉光
    const nebulaGrad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.35);
    nebulaGrad.addColorStop(0, `hsla(${baseHue}, 100%, 75%, 0.95)`);
    nebulaGrad.addColorStop(0.6, `hsla(${(baseHue + 60) % 360}, 90%, 55%, 0.85)`);
    nebulaGrad.addColorStop(1, `hsla(${(baseHue + 140) % 360}, 90%, 40%, 0)`);
    ctx.fillStyle = nebulaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // 2. 星体核心圆
    ctx.fillStyle = '#05070c';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // 3. 旋转超新星四角星芒 (Supernova Flare)
    const starRot = animTick * 0.05 + idx * 0.2;
    const starLen = R * (0.65 + 0.25 * Math.sin(animTick * 0.25 + idx));
    ctx.save();
    ctx.rotate(starRot);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -starLen);
    ctx.lineTo(starLen * 0.25, 0);
    ctx.lineTo(0, starLen);
    ctx.lineTo(-starLen * 0.25, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-starLen, 0);
    ctx.lineTo(0, starLen * 0.25);
    ctx.lineTo(starLen, 0);
    ctx.lineTo(0, -starLen * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. 环绕轨道星子微粒
    const orbitAngle = animTick * 0.15 + idx * 0.5;
    const ox = Math.cos(orbitAngle) * R * 0.95;
    const oy = Math.sin(orbitAngle) * R * 0.95;
    ctx.fillStyle = `hsl(${(baseHue + 180) % 360}, 100%, 75%)`;
    ctx.beginPath();
    ctx.arc(ox, oy, Math.max(1.5, R * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// // ★★★ 核心引擎：6 阶形态专属真·神龙尾翼渲染引擎 (Epic Dragon Tail) ★★★
function drawEpicDragonTail(ctx, cx, cy, cellSize, idx, snake, stageIdx, animTick) {
  const penult = snake[idx - 1] || snake[idx];
  const { cols, rows } = getGrid();

  let dx = snake[idx].x - penult.x;
  let dy = snake[idx].y - penult.y;
  if (dx > cols / 2) dx -= cols;
  else if (dx < -cols / 2) dx += cols;
  if (dy > rows / 2) dy -= rows;
  else if (dy < -rows / 2) dy += rows;

  // 尾巴朝向延伸方向 (+X 为龙尾末梢，-X 连向身躯)
  const tailAngle = Math.atan2(dy, dx);
  const R = Math.max(5, cellSize * 0.52);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tailAngle);

  if (stageIdx === 0) {
    // ══════════════════════════════════════════════════
    // 【LV1 幼蛇 · 萌系水滴收束圆尾】
    // ══════════════════════════════════════════════════
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, -R * 0.7);
    ctx.quadraticCurveTo(R * 0.5, -R * 0.5, R * 1.3, 0);
    ctx.quadraticCurveTo(R * 0.5, R * 0.5, -R * 0.5, R * 0.7);
    ctx.closePath();
    ctx.fill();

    // 萌尾亮白高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(R * 0.3, -R * 0.2, R * 0.18, 0, Math.PI * 2);
    ctx.fill();

  } else if (stageIdx === 1) {
    // ══════════════════════════════════════════════════
    // 【LV2 灵蟒 · 冰晶尖刺剑尾】
    // ══════════════════════════════════════════════════
    const tailGrad = ctx.createLinearGradient(-R, 0, R * 1.6, 0);
    tailGrad.addColorStop(0, '#0077b6');
    tailGrad.addColorStop(0.6, '#00b4d8');
    tailGrad.addColorStop(1, '#caf0f8');
    ctx.fillStyle = tailGrad;

    ctx.beginPath();
    ctx.moveTo(-R * 0.6, -R * 0.65);
    ctx.lineTo(R * 1.8, 0); // 锋利寒晶尾尖
    ctx.lineTo(-R * 0.6, R * 0.65);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-R * 0.6, 0);
    ctx.lineTo(R * 1.8, 0);
    ctx.stroke();

  } else if (stageIdx === 2) {
    // ══════════════════════════════════════════════════
    // 【LV3 狂蛟 · 雷霆战戟倒钩刺尾】
    // ══════════════════════════════════════════════════
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, -R * 0.5);
    ctx.lineTo(R * 1.9, 0);
    ctx.lineTo(-R * 0.5, R * 0.5);
    ctx.closePath();
    ctx.fill();

    // 上下倒钩雷刺
    ctx.fillStyle = '#fb8500';
    ctx.beginPath();
    ctx.moveTo(R * 0.2, -R * 0.4);
    ctx.lineTo(R * 0.8, -R * 1.2);
    ctx.lineTo(R * 0.9, -R * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(R * 0.2, R * 0.4);
    ctx.lineTo(R * 0.8, R * 1.2);
    ctx.lineTo(R * 0.9, R * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

  } else if (stageIdx === 3) {
    // ══════════════════════════════════════════════════
    // 【LV4 冥螭 · 冥月死神弯月镰尾】
    // ══════════════════════════════════════════════════
    const scytheWave = Math.sin(animTick * 0.2) * 0.2;
    ctx.fillStyle = '#240046';
    ctx.beginPath();
    ctx.moveTo(-R * 0.6, -R * 0.5);
    ctx.quadraticCurveTo(R * 0.8, -R * 0.2, R * 1.8, -R * (1.1 + scytheWave));
    ctx.quadraticCurveTo(R * 1.1, -R * 0.2, R * 0.4, 0);
    ctx.quadraticCurveTo(R * 0.8, R * 0.5, -R * 0.6, R * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 幽火光晕
    ctx.fillStyle = '#e0aaff';
    ctx.beginPath();
    ctx.arc(R * 1.8, -R * (1.1 + scytheWave), R * 0.25, 0, Math.PI * 2);
    ctx.fill();

  } else if (stageIdx === 4) {
    // ══════════════════════════════════════════════════
    // 【LV5 应龙 · 祥云凤羽神圣龙尾】
    // ══════════════════════════════════════════════════
    const tailWave = Math.sin(animTick * 0.2) * R * 0.3;
    const plumes = [
      { ty: -R * 0.75, len: R * 1.8, w: tailWave },
      { ty: 0, len: R * 2.2, w: 0 },
      { ty: R * 0.75, len: R * 1.8, w: -tailWave }
    ];

    plumes.forEach(p => {
      const plumeGrad = ctx.createLinearGradient(-R * 0.5, 0, p.len, p.ty);
      plumeGrad.addColorStop(0, '#d00000');
      plumeGrad.addColorStop(0.5, '#fb8500');
      plumeGrad.addColorStop(1, '#ffd166');
      ctx.fillStyle = plumeGrad;

      ctx.beginPath();
      ctx.moveTo(-R * 0.5, 0);
      ctx.quadraticCurveTo(R * 0.6, p.ty * 0.5 + p.w, p.len, p.ty + p.w);
      ctx.quadraticCurveTo(R * 0.8, p.ty * 0.8, -R * 0.5, 0);
      ctx.fill();
    });

  } else if (stageIdx === 5) {
    // ══════════════════════════════════════════════════
    // 【LV6 灭世神龙 · 超新星彗星等离子尾】
    // ══════════════════════════════════════════════════
    const baseHue = (animTick * 4) % 360;
    for (let i = 0; i < 3; i++) {
      const cometOffset = (i - 1) * R * 0.5;
      const plasmaGrad = ctx.createLinearGradient(-R * 0.5, 0, R * 2.4, cometOffset);
      plasmaGrad.addColorStop(0, '#ffffff');
      plasmaGrad.addColorStop(0.4, `hsl(${(baseHue + i * 50) % 360}, 100%, 65%)`);
      plasmaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = plasmaGrad;

      ctx.beginPath();
      ctx.moveTo(-R * 0.5, cometOffset * 0.5);
      ctx.lineTo(R * (2.2 - i * 0.3), cometOffset);
      ctx.lineTo(-R * 0.5, cometOffset * 0.5 + R * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    // 尾部超新星微星核
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
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
    } else if (code === 'KeyG' || code === 'g' || code === 'G') {
      // 快速成长测试快捷键 (+25 节)
      for (let i = 0; i < 25; i++) {
        const last = snake[snake.length - 1] || { x: 0, y: 0 };
        snake.push({ ...last });
      }
      checkEvolution();
      showTip(`✨ 快速成长：身长达 ${snake.length} 节`);
    } else if (code === 'KeyL' || code === 'l' || code === 'L') {
      // 终极神龙测试快捷键 (直达 305 节灭世神龙)
      while (snake.length < 305) {
        const last = snake[snake.length - 1] || { x: 0, y: 0 };
        snake.push({ ...last });
      }
      checkEvolution();
      showTip(`👑 登峰造极：化身「${STAGES[5].name}」！(身长 ${snake.length} 节)`);
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

// 全局测试挂钩 (用于自动化测试与调试)
if (typeof window !== 'undefined') {
  window.__snakeGame = {
    getSnake: () => snake,
    getLength: () => snake.length,
    getStageIdx: () => stageIdx,
    getStage: () => STAGES[stageIdx],
    setStage: (lvl) => {
      const idx = Math.max(0, Math.min(STAGES.length - 1, lvl - 1));
      const targetLen = STAGES[idx].minLen + 2;
      while (snake.length < targetLen) {
        const last = snake[snake.length - 1] || { x: 0, y: 0 };
        snake.push({ ...last });
      }
      if (snake.length > targetLen) {
        snake.length = targetLen;
      }
      checkEvolution();
      render();
    },
    grow: (num = 25) => {
      for (let i = 0; i < num; i++) {
        const last = snake[snake.length - 1] || { x: 0, y: 0 };
        snake.push({ ...last });
      }
      checkEvolution();
      render();
    },
    setDifficulty: (diff) => {
      if (DIFFICULTY_CONFIGS[diff]) {
        difficulty = diff;
        updateMines();
        render();
      }
    },
    render: () => render()
  };
}

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

// 支持 URL 查询参数一键直达指定形态或难度 (例如 ?stage=6 或 ?diff=HELL)
try {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const sParam = params.get('stage');
    const dParam = params.get('diff');
    const freezeParam = params.get('freeze');
    if (dParam && DIFFICULTY_CONFIGS[dParam.toUpperCase()]) {
      difficulty = dParam.toUpperCase();
    }
    if (sParam) {
      const targetStage = parseInt(sParam, 10);
      if (targetStage >= 1 && targetStage <= 6) {
        const idx = targetStage - 1;
        stageIdx = idx;
        const targetLen = targetStage === 1 ? 5 : STAGES[idx].minLen + (targetStage === 6 ? 10 : 4);
        const c = STAGES[idx].grid;
        const r = Math.max(16, Math.floor(c * 1.15));
        const sArr = [];
        let curX = Math.min(c - 4, Math.max(6, Math.floor(c * 0.72)));
        let curY = 3;
        let curDir = 'LEFT';
        for (let i = 0; i < targetLen; i++) {
          sArr.push({ x: curX, y: curY });
          if (i < targetLen - 1) {
            if (curDir === 'LEFT') {
              if (curX > 2) {
                curX--;
              } else {
                curY += 2;
                if (curY >= r - 3) curY = 3;
                curDir = 'RIGHT';
              }
            } else {
              if (curX < c - 3) {
                curX++;
              } else {
                curY += 2;
                if (curY >= r - 3) curY = 3;
                curDir = 'LEFT';
              }
            }
          }
        }
        snake = sArr;
        dir = 'RIGHT';
        nextDir = 'RIGHT';
        // 测试模式：停止自动物理位移，仅保留全量动画渲染
        lastMoveTime = Date.now() + 100000000;
      }
    } else if (freezeParam) {
      lastMoveTime = Date.now() + 100000000;
    }
  }
} catch (e) {}

// 初始化启动
updateLayout();
spawnFood();
updateMines();
requestAnimationFrame(loop);

