# GitHub API 限制绕过方案

## 已实现的解决方案

### 1. 智能缓存系统 ✅
- **5分钟本地缓存**：减少重复API调用
- **ETag支持**：仅在内容变更时重新获取
- **分层缓存**：文件列表和内容分别缓存

### 2. 速率优化
- **批量请求控制**：每批5个并发请求
- **请求间隔**：批次间100ms延迟
- **条件请求**：使用If-None-Match头

## 使用方法

### 清除缓存

```javascript
import { GitHubService } from '@/services/githubService'

const githubService = GitHubService.getInstance()

// 清除所有缓存
githubService.clearCache()

// 清除特定类型缓存
githubService.clearCacheByType('files')  // 文件列表
githubService.clearCacheByType('content') // 文件内容
```

## 限制对比

| 方案 | API限制 | 提升倍数 |
|------|---------|----------|
| 未认证 | 60次/小时 | 1x |
| 单Token | 5000次/小时 | 83x |
| 缓存+Token | ~10000次/小时 | 167x |

## 最佳实践

1. **缓存优先**：大部分请求会命中缓存
2. **批量控制**：避免短时间大量请求
3. **错误处理**：友好的用户提示

## 紧急解决方案

如果仍然遇到限制：

1. **等待重置**：每小时重置一次
2. **使用管理员Token**：获得5000次/小时限额
3. **延长缓存**：修改`CACHE_DURATION`常量
4. **减少并发**：降低`batchSize`值

## 监控和调试

检查控制台日志了解：
- 缓存命中率
- API调用频率
- 错误情况