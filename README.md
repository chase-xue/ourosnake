# OuroSnake: 极简赛博·自噬蜕变贪吃蛇 (Cyber Snake)

<p align="center">
  <img src="./avatar.jpg" width="128" height="128" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" alt="Cyber Snake Logo" />
</p>

<p align="center">
  <b>打破传统的革新玩法 · 4 阶形态蜕变 · 自噬断尾重生 · 视网膜级原生 Canvas 渲染</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-WeChat%20MiniGame%20%7C%20Web-07C160?logo=wechat&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/Language-JavaScript%20(ES6+)-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## 🎮 游戏简介 (Introduction)

**《极简赛博·自噬蜕变贪吃蛇》** 是一款基于 Canvas 纯原生（0 依赖、极限小包体）打造的微信小游戏与 Web 双端游戏。

不同于传统贪吃蛇“撞到自己即 Game Over”的挫败感，本项目引入了**“自噬断尾”**与**“4 阶形态进化”**核心玩法。随着蛇身变长，你将经历从呆萌肥蛇到修长神龙的华丽蜕变；即使误咬自身，也会触发断尾机制弃车保帅，带来极具张力与爽快感的全新体验。

> 💡 **项目特色**：同时原生支持 **微信小游戏平台** 与 **标准 Web 浏览器（可一键开启 GitHub Pages 线上试玩）**。

---

## ✨ 核心玩法与特色 (Features)

### 1. 🐉 4 阶形态跃迁体系 (Evolution Stages)
随着长度递增，网格动态加密，蛇的体态与质感产生质变：
* **LV1 萌态 · 肥蛇**（1~9 节）：圆润憨萌，宽阔网格，适合新手起步。
* **LV2 进阶 · 灵动**（10~24 节）：身姿矫健，速度加快。
* **LV3 优雅 · 修长**（25~49 节）：网格进一步细化，翡翠与极光蓝流光渐变。
* **LV4 终极 · 神龙**（50+ 节）：36 阶微细网格，傲视全场的赛博神龙！

### 2. ✂️ 自噬断尾机制 (Autophagy & Tail Severance)
* **告别瞬间暴毙**：当蛇头撞击自身身体某节时，会自动切除被撞击节点之后的尾部身体。
* **断尾求生**：伴随震动反馈与全屏警示波纹，形态可能退回萌态，但生命得以保留，随时东山再起！

### 3. 🧪 奇趣道具系统 (Special Items)
* **✂️ 瘦身药水（紫晶）**：长度缩减，紧急脱困降压。
* **★ 狂暴生长（金曜）**：瞬间暴增 3 节长度，加速进化进程。
* **🌀 无界穿墙**：边缘空间折叠穿梭，支持无限循环游走。

### 4. 🕹️ 人体工学双模操控 (Dual Controls)
* **移动端（微信）**：
  * **手势划屏**：屏幕任意区域极速滑动，极短位移（>15px）瞬间响应。
  * **悬浮圆形罗盘 (Circle D-Pad Hub)**：360° 扇形智能分区触控。
* **PC 端 / 浏览器**：
  * **方向键** `↑` `↓` `←` `→` 或 `W` `A` `S` `D` 控制转向。
  * **空格键 (`Space`)**：随时暂停 / 继续。
  * **`R` 键**：一键重新开局。

### 5. 💎 现代微质感视觉设计 (Visual Aesthetics)
* **克制优雅的深色背景**，配合顶部柔和极光光晕。
* **3D 渐变发光食物**，自带呼吸脉冲动画。
* **灵动蛇眼追踪**：蛇眼瞳孔会根据游动方向自然偏折。
* **视网膜级（Retina）高清渲染**：自动读取 `pixelRatio`，告别像素边缘模糊锯齿。

---

## 🚀 快速开始 (Quick Start)

### 方式一：在微信开发者工具中运行（推荐）

1. **安装工具**：下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. **导入项目**：
   - 打开微信开发者工具，点击 **“导入项目”**。
   - 目录选择本项目根目录：`snake-miniprogram`。
   - AppID 选择 **“测试号”**（或填入你自己的小游戏 AppID）。
   - 开发模式选择 **“小游戏”**。
3. **开始游玩与调试**：
   - 模拟器将自动编译并以 60 FPS 流畅运行，可直接点击或划屏体验！

### 方式二：在浏览器中直接体验 (Web Preview / GitHub Pages)

本项目内置轻量适配层 `index.html`：
* **本地试玩**：直接双击打开 `index.html`，或在根目录下通过任意静态服务器启动：
  ```bash
  # Python 3
  python3 -m http.server 8080
  # 访问 http://localhost:8080 即可在浏览器全屏游玩
  ```
* **一键开启 GitHub Pages 在线游玩**：
  1. 将仓库推送到 GitHub。
  2. 进入仓库 **Settings** -> **Pages**。
  3. **Branch** 选择 `main` / `master`，路径选择 `/(root)` 并保存。
  4. 稍等片刻，即可得到一个公开可玩的游戏网址：**https://chase-xue.github.io/ourosnake/** ，分享给朋友直接在手机/电脑浏览器中玩！

---

## 📁 目录结构 (Project Structure)

```text
ourosnake/
├── avatar.jpg               # 游戏 Logo / 图标素材
├── game.js                  # 游戏核心逻辑（Canvas渲染、循环、断尾、进化状态机）
├── game.json                # 微信小游戏全局配置
├── project.config.json      # 微信开发者工具工程配置（已脱敏为测试号）
├── index.html               # 纯 Web / GitHub Pages 在线试玩适配器
├── .gitignore               # Git 忽略文件规则（防止本地私有配置泄露）
├── LICENSE                  # MIT 开源许可证
├── CONTRIBUTING.md          # 社区贡献指南
└── README.md                # 项目详细说明文档
```

---

## ⚙️ 核心参数自定义 (Customization)

所有玩法与视觉参数均在 [game.js](game.js) 顶部清晰集中定义，方便二次开发定制：

```javascript
// 4 阶形态配置：可自定义升级所需节数与网格密度
const STAGES = [
  { level: 1, name: '肥蛇', tag: 'LV1 萌态', grid: 14, minLen: 1 },
  { level: 2, name: '灵动', tag: 'LV2 进阶', grid: 20, minLen: 10 },
  { level: 3, name: '修长', tag: 'LV3 优雅', grid: 28, minLen: 25 },
  { level: 4, name: '神龙', tag: 'LV4 终极', grid: 36, minLen: 50 }
];

// 三档难度行进间隔 (毫秒)
const SPEEDS = { EASY: 190, NORMAL: 125, HARD: 75 };
```

---

## 🤝 参与贡献 (Contributing)

我们由衷欢迎每一位开发者的建议、Issue 与 PR！
详情请查阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 📄 开源许可证 (License)

本项目遵循 [MIT License](LICENSE) 开源协议。无论是个人学习、改进二次发布还是衍生创作，皆可自由使用。
