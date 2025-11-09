# 通用数据与学习报告规范 + 交付要求

本文件为所有模块共享的通用规范。模块文档仅补充“特有指标/规则”。

## 1. 通用数据模型（匿名化）
- identity: user_id_hash, session_id, device, grade_band
- progress: module_id, level_id, start_time, end_time, duration_s, completion_state, stars
- behavior: attempts, errors, hints_used, undo_count, redo_count, pause_count
- learning: pre_quiz_score, post_quiz_score, key_metric (模块自定义), notes
- engagement: explore_time_s, charts_toggled, advanced_options_used
- quality: fps_avg, fps_p95, input_latency_ms, crash_flag

导出：家长视图（本次表现/趋势/建议）、学生视图（徽章/达成）、CSV/PNG

## 2. 自适应与提示框架
- 失败N次阈值触发：显示关键概念卡片 + 可选“示例演示/自动微调建议”
- 渐进式帮助：提示 → 半步演示 → 直接示例（需用户确认）
- 通过后解锁“挑战+”与“自由探索”记录

## 3. 性能与设备
- 移动/平板优先，60FPS目标；低端机可退化视觉效果
- 固定时间步长物理；图表采样限频，滤波稳定读数
- PWA可选：离线缓存关卡与最近记录

## 4. 无障碍与本地化
- 色盲/高对比模式；键盘操作路径；关键反馈附文本/旁白
- 术语表本地化（zh-CN 起步，后续支持中英切换）

## 5. 安全与隐私
- 最小化数据收集；敏感数据不收集；传输/存储加密
- 家长同意流程；可删除账号与数据导出

## 6. 商业化与试用
- 试用：每模块1关 + 基础探索；订阅解锁全部内容、报告、存档与分享
- 家庭套餐与学期包；价格与试用策略可AB测试

## 7. 验收清单（所有模块通用）
- 概念正确性：与教科书/近似解析一致（误差阈值在模块定义）
- 任务可重复完成；多设备表现一致
- 数据上报字段齐全且准确；导出可读
- 性能：fps_avg≥50，崩溃率低；输入延迟可接受
- 无障碍：颜色对比、键盘可达、关键文本到位
