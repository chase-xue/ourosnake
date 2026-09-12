# 贡献指南 (Contributing Guide)

感谢你对本项目感兴趣！我们非常欢迎并鼓励社区贡献代码、提出建议和报告问题。

---

## 🛠️ 如何参与贡献

### 1. 报告 Bug 或提出新需求 (Issues)
- 在提交 Issue 前，请先检索现有 Issue，确认未有重复项。
- 报告 Bug 时，请尽可能提供详细信息：
  - 复现环境（微信版本、基础库版本、设备型号 / 浏览器型号）
  - 复现步骤及异常现象描述
  - 相关截图或日志信息

### 2. 提交代码 (Pull Requests)
1. **Fork 本仓库** 到你自己的 GitHub 账号下。
2. **克隆代码并创建分支**：
   ```bash
   git clone https://github.com/chase-xue/ourosnake.git
   cd ourosnake
   git checkout -b feature/your-feature-name
   ```
3. **本地开发与测试**：
   - 使用微信开发者工具导入项目，或在浏览器中打开 `index.html` 验证游戏逻辑。
   - 保持原有代码风格，避免引入不必要的第三方重型依赖。
4. **提交并推送**：
   ```bash
   git commit -m "feat: 添加某种新道具/优化手势交互"
   git push origin feature/your-feature-name
   ```
5. **发起 Pull Request**：
   - 描述你的改动原因和具体修改点。
   - 关联相关的 Issue（如有）。

---

## 💡 代码与设计规范

- **纯原生轻量**：本项目核心坚持基于 HTML5 / Canvas 纯原生开发，不依赖任何第三方重量级引擎（以保持极限小包体与高性能）。
- **兼容性**：修改 `game.js` 时，请确保代码同时兼容微信小游戏环境与浏览器 Web 预览环境。
- **命名规范**：遵循驼峰命名（变量与函数 `camelCase`，常量 `UPPER_SNAKE_CASE`）。

再次感谢你的贡献与支持！✨
