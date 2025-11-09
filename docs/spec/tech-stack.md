# vogame.com 技术选型与项目技术描述（Tech Stack & Architecture)

版本：0.1.0（draft）  |  适用范围：K12 轻量级科学/物理互动SaaS（B2C）

## 1. 目标与约束
- 学习体验：上手≤30秒、关卡3–5分钟、整体≤10分钟、60 FPS 目标
- 设备：移动/平板优先，弱网/离线可用（PWA 缓存）
- 可验证性：关键指标可上报与导出（家长报告）
- 数据与合规：匿名化、最小化收集、家长同意；可删除与导出
- 研发效率：模块化、可复用引擎与UI，快速迭代与灰度发布

## 2. 总体架构（Monorepo + 前后端一体）
- Monorepo：pnpm + Turborepo
- 包结构（建议）：
  - apps/web：Next.js（营销页、账户、支付、PWA、模块容器）
  - packages/sim-core：数值模拟内核（TS）
  - packages/sim-modules：各游戏模块（可拆分多个包，如 buoyancy、circuit…）
  - packages/ui：设计系统与可复用组件（Tailwind + Radix UI）
  - packages/charts：轻量曲线/图表封装（基于 uPlot）
  - packages/analytics-sdk：事件上报SDK（Zod校验、Beacon API回退Fetch）
  - packages/i18n：词条与i18next封装
- 部署：
  - 前端与BFF：Vercel（Next.js Route Handlers），或任一Node无服务器平台
  - 数据层：Supabase（Postgres + Auth + Storage + RLS）
  - 静态与边缘缓存：CDN（Vercel/Cloudflare）

```mermaid
flowchart LR
  U[学生/家长] -- HTTPS --> Web[Next.js (React, PWA)]
  Web -- SDK --> BFF[Route Handlers / API]
  BFF -- SQL/REST --> DB[(Supabase Postgres)]
  BFF -- Webhook --> Stripe[(Stripe)]
  Web -- PWA Cache --> SW[(Service Worker)]
  Web -- Render --> Pixi[PixiJS/WebGL]
  Web -- Sim Step --> Core[s​im-core]
  Core -- Module API --> Mods[s​im-modules]
  BFF -- Error/Perf --> Sentry[(Sentry)]
```

## 3. 前端与渲染技术选型
- 语言/框架：TypeScript 5 + React 18 + Next.js（App Router）
  - 取舍：生态成熟、SSR/SEO适配营销页；互动区域采用Canvas/WebGL避免虚拟DOM瓶颈
- 渲染：PixiJS v7（WebGL2 优先，Canvas 回退）
  - 理由：2D性能优、API简洁、与React共存成熟；部分模块仅需矢量/位图与几何绘制
  - 备选：纯 Canvas 2D（更轻但需大量自研）、Three.js（3D 过度）
- 图表：uPlot（轻量高性能，适合 a/v/x、能量-位置、P–V 曲线）
- 状态管理：Zustand（轻量，适合局部UI与会话态）；模拟内部采用显式状态对象
- 样式与UI：Tailwind CSS + Radix UI（无障碍基础好，开发效率高）
- 国际化：i18next（JSON 词条 + 动态加载）
- 表单/设置：react-hook-form + Zod（模式校验）
- 音频：WebAudio（声音与波模块）
- PWA：next-pwa + Workbox（离线缓存/预缓存/运行时缓存策略）
- 错误监控：Sentry（前后端统一）

## 4. 模拟引擎（sim-core）与模块标准
- 目标：数值稳定、可测、可复用；与UI/渲染解耦
- 时间步进：固定Δt（默认 1/60s）；必要时子步（substep）
- 积分器：默认半隐式Euler；可选RK4用于轨迹精度（如抛体）
- 随机性：seeded RNG（可复现）
- 测试：解析解/准解析对照 + 误差阈值；golden 曲线回归

模块API（约定）：
```ts
export interface SimInitOptions {
  canvas: HTMLCanvasElement; // 或传入 PIXI.Application
  locale?: string;
  devicePerf?: 'low'|'mid'|'high';
}

export interface SimController {
  start(): void; pause(): void; reset(): void; destroy(): void;
  step(dtMs: number): void; // 若外部驱动
  setParams(p: Record<string, unknown>): void;
  getState(): unknown; setState(s: unknown): void;
  getMetrics(): Record<string, number | string | boolean>;
}

export function init(options: SimInitOptions): Promise<SimController>;
```

- 渲染集成：推荐 react-pixi 作为桥接；重度模块可直接操控 Pixi Application
- 性能策略：
  - OffscreenCanvas + Worker（可选）进行物理计算，主线程渲染
  - 采样/滤波稳定仪表（万用表、压力表）
  - 降级策略：低端机减少粒子、关闭阴影/发光

## 5. 数据、报告与后端
- 数据库：Supabase Postgres 15（行级安全 RLS；时序事件按月分区）
- 鉴权：
  - 匿名会话（孩子）+ 家长账户（Email 魔法链接）
  - 家长购买与订阅绑定到 profile；孩子仅持有 session 与本地存档
- 支付：Stripe Checkout + Billing（家庭套餐/学期包）
- 事件上报：analytics-sdk（Zod 校验 + navigator.sendBeacon 回退 fetch）
- 导出：家长报告 CSV/PNG（服务器端预渲染图表）

核心表（简化）：
```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id), -- 可为空：匿名会话
  grade_band text,
  device jsonb,
  created_at timestamptz default now()
);

create table events (
  id bigserial primary key,
  session_id uuid references sessions(id) not null,
  module_id text not null,
  level_id text,
  ts timestamptz default now(),
  kind text not null, -- progress|behavior|quality|learning
  payload jsonb not null
) partition by range (ts);
```

RLS 示例（仅允许写入自己会话，读取需家长登录）：
```sql
alter table sessions enable row level security;
create policy insert_own on sessions for insert with check (true);
create policy select_own on sessions for select using (auth.uid() = profile_id);
```

## 6. 报告与指标落地
- 规范：docs/spec/common-reporting-spec.md
- 服务端聚合视图/物化视图：按 module_id/level_id 统计完成率、误差分布、提示使用率
- 家长视图：最近7天/30天趋势、关键概念建议与下一步练习

## 7. DevEx、测试与质量门槛
- 包管理/构建：pnpm + Turborepo；Next 内置编译；tsup 构建 sim-core 与 SDK
- 代码质量：ESLint（airbnb + react + ts）、Prettier、Type-Check 严格
- 单测：Vitest（含数值容差断言）、React Testing Library（UI逻辑）
- 性能/可用性：Lighthouse CI、Playwright（E2E + 视觉回归）
- 属性/随机测试：fast-check（参数域内不变式，如能量收支、P·V≈常数）
- 门槛：
  - fps_avg ≥ 50（低端机 ≥ 40）
  - 解析/准解析误差 ≤ 3–5%（按模块定义）
  - 首屏 ≤ 2.5s（4G），交互到首帧 ≤ 100ms

## 8. 安全、隐私与合规
- 隐私：匿名ID、最小化收集；不采集麦克风/定位（默认）
- 传输/存储：TLS、at-rest 加密、RLS、审计日志
- 前端安全：严格CSP、同源策略、XSS 保护（DOM 污染白名单）
- 支付与未成年人：支付仅在家长账户侧，孩子界面不暴露支付入口

## 9. PWA 与离线
- 预缓存：壳 + 热门模块资源；运行时缓存：图片、字体、CDN接口（缓存优先）
- 数据：IndexedDB（idb-keyval）本地存档与未上报事件队列；在线时回传
- 版本迁移：基于 semver 的存档迁移函数（sim-core 提供）

## 10. 功能开关与灰度
- Unleash（开源）或轻量远程 JSON 配置
- 维度：模块/关卡、实验功能、价格与试用策略 A/B

## 11. 取舍与备选方案
- React/Next vs SvelteKit：选 React/Next（团队与生态、SSR/SEO），若纯客户端App可选 SvelteKit + Vite 更轻
- PixiJS vs 纯 Canvas：选 PixiJS（GPU 加速、纹理/批量渲染）；极简模块可直接 Canvas 降复杂度
- Supabase vs 自建 Postgres：选 Supabase（Auth/RLS/存储集成）；若数据出海/边缘需求强，可加 Cloudflare Workers + D1/KV 作为边缘缓存

## 12. 里程碑对齐（建议）
- M1（4–6周）：apps/web 骨架 + 3 模块（01/02/03）MVP；事件上报与家长报告初版；Stripe 订阅
- M2（6–8周）：PWA 离线、A/B、无障碍完善；扩至 6 模块；错误与性能基线稳定
- M3（>8周）：全量 12 模块、分享/导出、成就体系；数据看板与增长工具链

## 13. 目录结构建议
```
/ (repo root)
  apps/
    web/
  packages/
    sim-core/
    sim-modules/
      buoyancy/
      circuit/
      ...
    ui/
    charts/
    analytics-sdk/
    i18n/
  docs/
    games/
    spec/
```

## 14. 附：示例 SDK 事件（Zod）
```ts
import { z } from 'zod';
export const EventPayload = z.object({
  module_id: z.string(), level_id: z.string().optional(),
  kind: z.enum(['progress','behavior','quality','learning']),
  ts: z.string().datetime().optional(),
  data: z.record(z.any())
});
export type EventPayload = z.infer<typeof EventPayload>;
```

—— 本文档与 docs/games/*.md、docs/spec/common-reporting-spec.md 配套使用，可作为立项与研发的统一技术依据。
