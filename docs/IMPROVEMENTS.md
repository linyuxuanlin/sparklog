# 可选改进清单（不改变现有 UI）

- 性能
  - 静态索引分片（按月/按标签）减少首屏 JSON 体积
  - 本地 LRU 缓存与 `Cache-Control` 配置
- 交互
  - 详情弹窗路由拦截（保持返回历史）
  - 标签统计与建议标签展示
- 工程
  - 将 GitHub Token 权限缩减到 specific repo + content:write
  - 加入简单 E2E 测试（Playwright）
  - 草稿状态可视（仅控制台 log，不改变 UI）

可逐条选择性纳入，均可轻松移除。

