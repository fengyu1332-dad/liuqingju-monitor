# 留情局数字资源内容质量管理系统设计文档

**日期**: 2026-05-11
**版本**: v1.0
**状态**: 已批准

---

## 1. 功能概述

内容质量模块是数字资源管理的第一阶段，包含资源审核、质量评级和举报系统三大功能。

### 1.1 核心功能

- **资源审核**：新上传资源需管理员审核后公开
- **质量评级**：管理员对资源质量进行评分
- **举报系统**：用户可举报违规或低质量资源

### 1.2 设计原则

- **审核前置**：未经审核的资源不对外展示
- **用户参与**：通过举报让用户参与内容监督
- **透明公开**：审核状态对上传者可见
- **可追溯**：记录审核历史和举报处理

---

## 2. 资源审核

### 2.1 审核状态

| 状态 | 值 | 说明 |
|------|-----|------|
| 待审核 | pending | 新上传，等待审核 |
| 已通过 | approved | 审核通过，公开显示 |
| 已拒绝 | rejected | 审核不通过 |
| 需修改 | revision | 需要上传者修改 |

### 2.2 审核流程

```
上传资源 → 待审核(pending)
    ↓
管理员审核
    ↓
├── 通过 → 已通过(approved) → 公开显示
├── 拒绝 → 已拒绝(rejected) → 通知上传者
└── 修改 → 需修改(revision) → 通知上传者修改
```

### 2.3 数据结构

```javascript
// 资源数据增加审核字段
{
  id: "resource_xxx",
  title: "...",
  // ... 其他字段
  review: {
    status: "pending",      // pending | approved | rejected | revision
    reviewerId: "user_xxx",
    reviewerName: "管理员",
    reviewNote: "审核备注",
    reviewAt: "ISO日期"
  }
}
```

### 2.4 审核管理界面

**管理员后台 → 资源审核**：
- 待审核列表
- 审核操作（通过/拒绝/要求修改）
- 审核历史

---

## 3. 质量评级

### 3.1 评级系统

| 等级 | 分值 | 说明 |
|------|------|------|
| ⭐ | 1-2分 | 基础资源 |
| ⭐⭐ | 3分 | 一般资源 |
| ⭐⭐⭐ | 4分 | 不错资源 |
| ⭐⭐⭐⭐ | 5分 | 优质资源 |
| ⭐⭐⭐⭐⭐ | 6分 | 精品资源 |

### 3.2 评级计算

- **初始评级**：管理员审核时设定
- **用户评分**：用户下载后可评分（1-5星）
- **综合评级**：(管理员评级 × 2 + 平均用户评分) / 3

### 3.3 数据结构

```javascript
// 资源数据增加评级字段
{
  id: "resource_xxx",
  // ... 其他字段
  rating: {
    adminRating: 5,           // 管理员评级
    userRatings: [4, 5, 4],  // 用户评分数组
    ratingCount: 3,          // 评分次数
    averageRating: 4.3       // 平均评分
  }
}
```

### 3.4 UI展示

- 资源卡片显示星级评分
- 资源详情页显示评分详情
- 评分排行榜筛选

---

## 4. 举报系统

### 4.1 举报类型

| 类型 | 说明 |
|------|------|
| 侵权 | 侵犯他人版权 |
| 虚假 | 内容与描述不符 |
| 低质 | 内容质量低下 |
| 违规 | 包含违规内容 |
| 其他 | 其他问题 |

### 4.2 举报流程

```
用户举报 → 系统记录 → 待处理
    ↓
管理员处理
    ↓
├── 有效举报 → 处理资源 → 通知举报人
└── 无效举报 → 关闭举报 → 通知举报人
```

### 4.3 数据结构

```javascript
// localStorage: liuqingju_reports
{
  reports: [
    {
      id: "report_xxx",
      type: "infringement",      // 举报类型
      resourceId: "resource_xxx", // 被举报资源
      reporterId: "user_xxx",   // 举报人
      reporterName: "张三",
      reason: "详细内容...",
      status: "pending",         // pending | resolved | rejected
      handlerId: "user_xxx",     // 处理人
      handlerNote: "处理备注",
      createdAt: "ISO日期",
      resolvedAt: "ISO日期"
    }
  ]
}
```

### 4.4 举报处理

| 处理结果 | 说明 |
|---------|------|
| 忽略 | 举报无效，不处理资源 |
| 警告 | 举报有效，向发布者发出警告 |
| 下架 | 资源暂时下架 |
| 删除 | 永久删除资源 |

---

## 5. ReportService 服务

### 5.1 核心方法

```javascript
const ReportService = {
  // 举报
  submitReport(data),

  // 举报列表
  getReports(status),
  getReportsByResource(resourceId),

  // 处理举报
  resolveReport(reportId, handlerId, result, note),
  rejectReport(reportId, handlerId, note),

  // 统计
  getPendingCount(),
  getReportStats()
}
```

---

## 6. 实施计划

### Phase 1: 服务层
1. 创建 report-service.js
2. 修改 resource-service.js 支持审核和评级

### Phase 2: 上传界面
1. 上传时显示审核说明
2. 上传后显示审核状态

### Phase 3: 资源详情页
1. 添加举报按钮
2. 显示评分组件

### Phase 4: 管理后台
1. 审核管理界面
2. 举报管理界面
3. 评级管理

---

## 7. 注意事项

1. **审核通知**：审核结果通过 NotificationService 通知上传者
2. **举报限制**：同一用户对同一资源只能举报一次
3. **恶意举报**：多次恶意举报会被限制
4. **审核超时**：超过7天未审核自动提醒管理员
