# IFLOW.md - vogame.com 项目上下文

## 项目概述

vogame.com 是一个面向K-12学生的互动科学教育平台，通过引人入胜的模拟游戏帮助学生可视化和理解复杂的科学概念。项目愿景是让抽象科学概念"可看、可玩、可证据化"。

### 核心特性
- 12个不同的科学概念游戏，涵盖物理、化学和生物学科
- 适应性学习，基于学生表现提供个性化反馈
- 详细的学习进度跟踪和家长报告
- 跨平台支持（桌面、平板、移动设备）
- PWA功能，支持离线学习
- 多语言支持（英语和中文）

### 12个科学模块
1. 浮力实验室（Buoyancy Lab）- 探索密度和浮力概念
2. 电路故障排除（Circuit Debugger）- 学习电路和故障排除
3. 力与运动游乐场（Force & Motion Playground）- 理解牛顿运动定律
4. 摩擦与斜面（Friction & Ramp）- 研究摩擦力和斜面
5. 杠杆与滑轮构建器（Levers & Pulleys Builder）- 实验简单机械
6. 抛体沙盒（Projectile Sandbox）- 探索抛体运动
7. 光学实验室（Optics Lab）- 发现光的反射和折射
8. 声音与波工作室（Sound & Wave Studio）- 学习声波和属性
9. 热传导实验室（Heat Transfer Lab）- 研究热能和热传导
10. 能量滑板公园（Energy Skate Park）- 探索能量守恒
11. 磁铁与电磁铁（Magnet & Electromagnet）- 研究磁场
12. 气体压强实验室（Gas Pressure Lab）- 理解气体定律和压强-体积关系

## 技术栈

### 前端
- 框架：Next.js 14 (App Router)
- 语言：TypeScript
- UI组件：基于Tailwind CSS的自定义设计系统
- 图形渲染：PixiJS（硬件加速的2D渲染）
- 图表：uPlot（高性能数据可视化）
- 状态管理：Zustand
- 国际化：i18next

### 后端
- API：Next.js API Routes
- 数据库：Supabase (PostgreSQL)
- 认证：Supabase Auth
- 支付：Stripe

### 开发运维
- 单体仓库：pnpm + Turborepo
- 部署：Vercel
- 监控：Sentry

## 项目架构

项目采用monorepo架构，包含以下包：

- `apps/web` - Next.js web应用程序
- `packages/sim-core` - 核心模拟引擎
- `packages/sim-modules` - 各个模拟模块
- `packages/ui` - 可复用UI组件
- `packages/charts` - 数据可视化组件
- `packages/analytics-sdk` - 分析和事件跟踪
- `packages/i18n` - 国际化工具

## 构建和运行

### 前提条件
- Node.js 18+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 开发环境
```bash
pnpm dev
```
在浏览器中打开 http://localhost:3000

### 构建项目
```bash
pnpm build
```

### 测试
```bash
# 运行整个monorepo的测试
pnpm test

# 运行特定包的测试
cd packages/sim-core
pnpm test
```

### 可用脚本
- `pnpm dev` - 启动所有应用的开发服务器
- `pnpm build` - 构建所有包和应用
- `pnpm lint` - 对所有包和应用进行代码检查
- `pnpm typecheck` - 在整个monorepo中运行类型检查
- `pnpm format` - 使用Prettier格式化代码

## 开发约定

### 代码质量
- 严格的TypeScript类型检查
- ESLint (airbnb + react + ts) 代码规范
- Prettier代码格式化

### 测试
- Vitest单元测试（包含数值容差断言）
- React Testing Library用于UI逻辑测试
- Playwright端到端测试和视觉回归测试

### 性能要求
- 目标帧率：60 FPS（低端设备不低于40 FPS）
- 首屏加载时间：≤ 2.5s（4G网络）
- 交互到首帧时间：≤ 100ms

### 模拟引擎标准
模块API约定：
```ts
interface SimInitOptions {
  canvas: HTMLCanvasElement;
  locale?: string;
  devicePerf?: 'low'|'mid'|'high';
}

interface SimController {
  start(): void; pause(): void; reset(): void; destroy(): void;
  step(dtMs: number): void;
  setParams(p: Record<string, unknown>): void;
  getState(): unknown; setState(s: unknown): void;
  getMetrics(): Record<string, number | string | boolean>;
}

function init(options: SimInitOptions): Promise<SimController>;
```

### 数据和报告
核心数据模型包括：
- 身份信息：用户ID哈希、会话ID、设备、年级段
- 进度信息：模块ID、关卡ID、开始时间、结束时间、持续时间、完成状态
- 行为信息：尝试次数、错误、提示使用、撤销次数
- 学习信息：前后测分数、关键指标、笔记
- 参与度：探索时间、图表切换、高级选项使用
- 质量指标：平均FPS、95% FPS、输入延迟、崩溃标志

## 项目目录结构
```
/
├── apps/
│   └── web/              # Next.js web应用
├── packages/
│   ├── sim-core/         # 核心模拟引擎
│   ├── sim-modules/      # 各个模拟模块
│   ├── ui/               # 可复用UI组件
│   ├── charts/           # 数据可视化组件
│   ├── analytics-sdk/    # 分析和事件跟踪SDK
│   └── i18n/             # 国际化工具
├── docs/                 # 项目文档
│   ├── games/            # 各个游戏模块的详细文档
│   └── spec/             # 技术规范文档
└── README.md             # 项目主文档
```

## 商业模式
- 免费试用 + 订阅模式
- 家庭套餐与学期包
- 家长报告增强复购