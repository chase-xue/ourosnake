// 微信小游戏 & Web - 极简赛博·自噬蜕变贪吃蛇 (动态全屏自适应版)
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 4阶形态配置
const STAGES = [
  { level: 1, name: '肥蛇', tag: 'LV1 萌态', grid: 14, minLen: 1 },
  { level: 2, name: '灵动', tag: 'LV2 进阶', grid: 20, minLen: 10 },
  { level: 3, name: '修长', tag: 'LV3 优雅', grid: 28, minLen: 25 },
  { level: 4, name: '神龙', tag: 'LV4 终极', grid: 36, minLen: 50 }
];

const SPEEDS = { EASY: 190, NORMAL: 125, HARD: 75 };

let snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
let dir = 'RIGHT';
let nextDir = 'RIGHT';
let food = { x: 8, y: 8 };
let specialItem = null;
let stageIdx = 0;
let speed = 'NORMAL';
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
  speedY: 520,
  pillW: 64,
  pillH: 28,
  speedStartX: 91,
  dpadY: 595,
  hubR: 46
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
  topH = Math.max(92, safeTop + 80);

  // 底部控制区高度自适应（包含底部手势横条安全区）
  botH = Math.max(150, Math.min(220, Math.floor(H * 0.22) + safeBottom));

  arenaW = W - padX * 2;
  arenaH = Math.max(180, H - topH - botH);

  // 计算网格实际高度，并重新计算控制区的完美居中位置
  const cols = STAGES[stageIdx].grid;
  const cellSize = arenaW / cols;
  const rows = Math.max(8, Math.floor(arenaH / cellSize));
  const actualArenaH = rows * cellSize;

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

  // 底部剩余空间的精细排布
  const arenaBottom = topH + actualArenaH;
  const remainH = H - arenaBottom;

  ctrl.cx = W / 2;
  ctrl.pillW = Math.min(76, Math.max(54, Math.floor((W - padX * 2 - 24) / 3)));
  ctrl.pillH = Math.max(26, Math.min(30, Math.floor(remainH * 0.16)));
  const totalSpeedW = ctrl.pillW * 3;
  ctrl.speedStartX = (W - totalSpeedW) / 2;

  // 速度选择条与罗盘垂直居中在 remainH 中，且底部避开 safeBottom
  ctrl.speedY = arenaBottom + Math.max(6, Math.floor((remainH - safeBottom - 116) * 0.25));

  const dpadAvailableH = H - (ctrl.speedY + ctrl.pillH) - safeBottom;
  ctrl.dpadY = (ctrl.speedY + ctrl.pillH) + Math.max(40, Math.floor(dpadAvailableH / 2));
  ctrl.hubR = Math.max(38, Math.min(48, Math.floor(dpadAvailableH * 0.38)));
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
      if ((x !== food.x || y !== food.y) && !snake.some(s => s.x === x && s.y === y)) {
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
  }

  snake.unshift(head);
  let popTail = true;

  // 吃食物
  if (head.x === food.x && head.y === food.y) {
    popTail = false;
    vibrate('light');
    spawnFood();
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

  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SNAKE / 生存进化', padX, top);

  ctx.fillStyle = UI.text;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(String(snake.length).padStart(2, '0'), padX, top + 17);
  ctx.fillStyle = UI.muted;
  ctx.font = '11px sans-serif';
  ctx.fillText('当前长度', padX + 43, top + 28);

  // 中央信息只展示当前形态和下一次进化进度
  const infoX = padX + 112;
  const infoW = w - infoX - padX - 58;
  ctx.fillStyle = UI.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(stage.name, infoX, top + 18);
  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.fillText(stage.tag, infoX, top + 38);

  const nextStage = STAGES[Math.min(stageIdx + 1, STAGES.length - 1)];
  const rangeStart = stage.minLen;
  const rangeEnd = stageIdx === STAGES.length - 1 ? Math.max(snake.length, stage.minLen) : nextStage.minLen;
  const progress = stageIdx === STAGES.length - 1 ? 1 : Math.max(0, Math.min(1, (snake.length - rangeStart) / (rangeEnd - rangeStart)));
  const barY = top + 58;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  drawRoundedRect(ctx, padX, barY, w - padX * 2, 5, 2.5);
  ctx.fill();
  if (progress > 0) {
    ctx.fillStyle = UI.accent;
    drawRoundedRect(ctx, padX, barY, (w - padX * 2) * progress, 5, 2.5);
    ctx.fill();
  }
  ctx.fillStyle = UI.muted;
  ctx.font = '9px sans-serif';
  ctx.fillText(stageIdx === STAGES.length - 1 ? '已达最终形态' : `距离 ${nextStage.name} 还差 ${Math.max(0, nextStage.minLen - snake.length)} 节`, padX, barY + 10);

  // 右侧操作改成两个轻量图标按钮
  const rightW = 26;
  const rightX = w - padX - rightW;

  // 暂停
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

  // 重来
  ctx.fillStyle = UI.panel2;
  drawRoundedRect(ctx, rightX, top + 42, rightW, 26, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 110, 0.35)';
  ctx.stroke();
  ctx.fillStyle = UI.danger;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('↻', rightX + rightW / 2, top + 55);
}

// 底部现代操作区（优雅悬浮集成十字盘）
function renderModernControls(w, h, arenaHeight) {
  // 分段式速度选择，减少零散按钮感
  const pillW = ctrl.pillW, pillH = ctrl.pillH;
  const speedStartX = ctrl.speedStartX;
  const startY = ctrl.speedY;
  const totalSpeedW = pillW * 3;

  drawPanel(speedStartX - 3, startY - 3, totalSpeedW + 6, pillH + 6, 17, '#0e141e');

  ['EASY', 'NORMAL', 'HARD'].forEach((s, idx) => {
    const sx = speedStartX + idx * pillW;
    const isCur = speed === s;
    if (isCur) {
      ctx.fillStyle = UI.accent;
      drawRoundedRect(ctx, sx, startY, pillW, pillH, 14);
      ctx.fill();
    }

    ctx.fillStyle = isCur ? UI.bg : UI.muted;
    ctx.font = isCur ? 'bold 12px sans-serif' : '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s === 'EASY' ? '慢速' : s === 'NORMAL' ? '标准' : '极速', sx + pillW / 2, startY + pillH / 2);
  });

  // 2. 浑然一体的优雅圆形十字操控罗盘 (Circle D-Pad Hub)
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

  ctx.fillStyle = UI.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('也可在棋盘滑动', padX, dpadY + 4);
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

// 主循环驱动
function loop() {
  const now = Date.now();
  const interval = SPEEDS[speed] || 125;

  if (now - lastMoveTime >= interval) {
    lastMoveTime = now;
    tick();
  }

  if (now - lastItemTime >= 9000) {
    lastItemTime = now;
    if (gameState === 'RUNNING' && !specialItem && Math.random() < 0.7) {
      spawnSpecial();
    }
  }

  render();
  requestAnimationFrame(loop);
}

// 触摸交互：全面支持「中央罗盘点击」与「全屏流畅滑动」
wx.onTouchStart((e) => {
  if (!e.touches || !e.touches[0]) return;
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;

  const x = t.clientX, y = t.clientY;
  const cx = ctrl.cx;
  const dpadY = ctrl.dpadY;

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
    gameState = 'RUNNING';
    spawnFood();
    showTip('新的旅程开始了');
    vibrate('medium');
    return;
  }

  // 2. 速度选择胶囊
  const pillW = ctrl.pillW, pillH = ctrl.pillH;
  const speedStartX = ctrl.speedStartX;
  const startY = ctrl.speedY;

  ['EASY', 'NORMAL', 'HARD'].forEach((s, idx) => {
    const sx = speedStartX + idx * pillW;
    if (x >= sx && x <= sx + pillW && y >= startY - 5 && y <= startY + pillH + 5) {
      speed = s;
      vibrate('light');
    }
  });

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
      gameState = 'RUNNING';
      spawnFood();
      showTip('新的旅程开始了');
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
requestAnimationFrame(loop);

