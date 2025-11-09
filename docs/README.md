# vogame.com K12 科学/物理“概念具象化游戏”需求文档

本目录收录产品概览、通用规范与各游戏模块的详细需求说明（Markdown）。

- 产品定位：面向K12的“轻量级SaaS”科学概念互动实验室
- 域名寓意：Vivid + Object Game = 生动的概念具象化游戏
- 商业模式：B2C 订阅；免费试用（每模块1关+基础探索），订阅解锁全部关卡、报告、存档与分享

## 目录
- 概览与通用规范
  - docs/spec/common-reporting-spec.md — 数据与学习报告、通用交付要求
- 模块需求
  - docs/games/01-buoyancy-lab.md — 浮力与密度实验室
  - docs/games/02-circuit-debugger.md — 电路故障排除
  - docs/games/03-force-motion-playground.md — 力与运动操场
  - docs/games/04-friction-ramp.md — 摩擦与斜面
  - docs/games/05-levers-pulleys-builder.md — 杠杆与滑轮工坊
  - docs/games/06-projectile-sandbox.md — 抛体运动沙盒
  - docs/games/07-optics-lab.md — 光学小实验
  - docs/games/08-sound-wave-studio.md — 声音与波工作室
  - docs/games/09-heat-transfer-lab.md — 热与热传递
  - docs/games/10-energy-skate-park.md — 能量滑板场
  - docs/games/11-magnet-electromagnet.md — 磁与电磁铁
  - docs/games/12-gas-pressure-lab.md — 气体压强与体积

## 文档结构建议（各模块）
每个模块遵循统一结构，便于设计、研发与验收：
- 元信息（module_id、版本、年级段、状态）
- 摘要与学习目标
- 用户故事与关键用例
- 玩法与关卡
- 交互与可视化
- 数据与学习报告（引用通用规范，补充模块特有指标）
- 自适应与提示
- 技术规格（模型、数值、平台）
- 性能与兼容
- 无障碍与本地化
- 安全与隐私
- 商业化与试用策略
- 验收标准
- 后续拓展

## 路线图（建议）
- M1：完成3个核心模块可用版本（01,02,03），接入基础数据上报
- M2：上线订阅与家长报告；扩展到6个模块
- M3：全量12模块+成就体系+分享/导出
