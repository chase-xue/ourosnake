// OuroSnake: 抖音高定竖屏 60FPS 纯游戏画面录制驱动引擎
(function() {
  console.log('[SHOWCASE] Automated Showcase Runner started.');

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('[SHOWCASE] gameCanvas not found!');
    return;
  }

  // 1. 初始化 60 FPS Canvas 纯画面流捕获 (仅录制 Canvas 游戏主体，零外界杂质)
  const stream = canvas.captureStream(60);
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 16000000 // 16 Mbps 4K级超清无损码率
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = async () => {
    console.log('[SHOWCASE] Recording complete. Total chunks:', chunks.length);
    const blob = new Blob(chunks, { type: mimeType });
    console.log('[SHOWCASE] Blob size:', blob.size, 'bytes. Uploading to /save-video...');
    try {
      const resp = await fetch('/save-video', {
        method: 'POST',
        headers: { 'Content-Type': 'video/webm' },
        body: blob
      });
      console.log('[SHOWCASE] Video upload response:', resp.status);
    } catch (err) {
      console.error('[SHOWCASE] Video upload error:', err);
    }
  };

  // 延迟半秒启动，确保首帧完全平稳渲染
  setTimeout(() => {
    recorder.start(100);
    console.log('[SHOWCASE] MediaRecorder active!');
    startTimeline();
  }, 500);

  // 2. 优雅巡航控制器 (Smooth Autopilot)
  let autoPilotTimer = null;
  function startAutoPilot() {
    autoPilotTimer = setInterval(() => {
      if (!window.__snakeGame) return;
      const snake = window.__snakeGame.getSnake();
      if (!snake || snake.length === 0) return;
      const head = snake[0];
      const stage = window.__snakeGame.getStage();
      const cols = stage.grid;
      const rows = Math.floor(cols * 1.15);

      const curDir = window.__snakeGame.getCurDir ? window.__snakeGame.getCurDir() : 'RIGHT';
      // 四角安全边界转弯
      if (curDir === 'RIGHT' && head.x >= cols - 4) {
        window.__snakeGame.setDir('DOWN');
      } else if (curDir === 'DOWN' && head.y >= rows - 5) {
        window.__snakeGame.setDir('LEFT');
      } else if (curDir === 'LEFT' && head.x <= 3) {
        window.__snakeGame.setDir('UP');
      } else if (curDir === 'UP' && head.y <= 3) {
        window.__snakeGame.setDir('RIGHT');
      }
    }, 85);
  }

  // 3. 编排从幼蛇至灭世神龙的全流程演出剧本 (Choreography Timeline)
  function startTimeline() {
    startAutoPilot();

    // 0s ~ 3.5s: LV1 幼蛇萌趣初探
    console.log('[SHOWCASE] Phase 1: LV1 幼蛇萌态展示');

    // 3.5s: 道具秀 1 · 🌊 灵蛇游步 (不走直线！)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 2: 激活 🌊 灵蛇游步 (S-Curve Wave)');
      window.__snakeGame.setBuff('WAVE', 12000);
      window.__snakeGame.setDir('RIGHT');
    }, 3500);

    // 8.5s: 道具秀 2 · 🧲 万象天引 (隔空吸附食物)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 3: 激活 🧲 万象天引 (Magnet Laser)');
      window.__snakeGame.setBuff('MAGNET', 10000);
    }, 8500);

    // 13.5s: 道具秀 3 · ⚡ 雷影瞬步 (免疫地雷与自噬断尾)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 4: 激活 ⚡ 雷影瞬步 (Phantom Immunity)');
      window.__snakeGame.setBuff('PHANTOM', 9000);
    }, 13500);

    // 17.5s: 突破进化 · LV2 灵蟒 (极光青璃流线)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 5: 进化至 LV2 灵蟒');
      window.__snakeGame.setStage(2);
    }, 17500);

    // 21.0s: 突破进化 · LV3 狂蛟 (曜金深海龙角)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 6: 进化至 LV3 狂蛟');
      window.__snakeGame.setStage(3);
    }, 21000);

    // 24.5s: 突破进化 · LV4 冥螭 (幽冥黑曜流光)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 7: 进化至 LV4 冥螭');
      window.__snakeGame.setStage(4);
    }, 24500);

    // 28.0s: 突破进化 · LV5 应龙 (至尊神翼巡天)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 8: 进化至 LV5 应龙 (胸前展翼巡天)');
      window.__snakeGame.setStage(5);
    }, 28000);

    // 32.0s: 终极登峰造极 · LV6 灭世神龙 (310节鸿蒙星河)
    setTimeout(() => {
      console.log('[SHOWCASE] Phase 9: 终极登峰造极 · 化身 LV6 灭世神龙！');
      window.__snakeGame.setGodMode(true);
      window.__snakeGame.setStage(6);
    }, 32000);

    // 39.5s: 录制圆满结束，停止录制并回传视频
    setTimeout(() => {
      console.log('[SHOWCASE] Showcase completed! Stopping recorder...');
      if (autoPilotTimer) clearInterval(autoPilotTimer);
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }, 39500);
  }
})();
