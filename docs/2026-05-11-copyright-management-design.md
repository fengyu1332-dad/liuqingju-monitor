# 留情局数字资源版权管理系统设计文档

**日期**: 2026-05-11
**版本**: v1.0
**状态**: 已批准

---

## 1. 功能概述

版权管理模块是数字资源管理的第二阶段，包含版权声明和侵权处理两大功能。

### 1.1 核心功能

- **版权声明**：上传资源时选择版权类型
- **侵权处理**：收到侵权通知后自动下架

### 1.2 设计原则

- **版权优先**：鼓励原创，注明来源
- **快速响应**：侵权投诉快速处理
- **证据保全**：记录侵权投诉详情

---

## 2. 版权声明

### 2.1 版权类型

| 类型 | 说明 |
|------|------|
| 原创 | 用户原创内容 |
| 转载 | 转载自其他来源，需注明出处 |
| 授权 | 获得原作者授权 |
| 公共领域 | 无版权限制 |
| CC协议 | Creative Commons协议 |

### 2.2 版权字段

```javascript
// 资源数据增加版权字段
{
  id: "resource_xxx",
  // ... 其他字段
  copyright: {
    type: "original",           // 版权类型
    source: "",                // 来源（转载/授权时填写）
    author: "",                // 原作者（转载/授权时填写）
    license: "",               // 许可证（CC协议时填写）
    statement: ""              // 版权声明文本
  }
}
```

### 2.3 UI展示

- 资源卡片显示版权标签
- 资源详情页显示完整版权信息
- 管理后台显示版权审核

---

## 3. 侵权处理

### 3.1 侵权类型

| 类型 | 说明 |
|------|------|
| 抄袭 | 未经授权使用他人作品 |
| 盗版 | 传播盗版资源 |
| 引用不当 | 转载未注明来源 |

### 3.2 侵权流程

```
收到侵权投诉 → 自动下架资源 → 通知发布者
    ↓
管理员审核
    ↓
├── 有效侵权 → 永久下架/删除
└── 无效投诉 → 恢复资源 → 通知双方
```

### 3.3 数据结构

```javascript
// localStorage: liuqingju_copyright_reports
{
  reports: [
    {
      id: "cr_xxx",
      type: "plagiarism",          // 侵权类型
      resourceId: "resource_xxx",   // 被投诉资源
      reporterId: "user_xxx",       // 投诉人
      reporterName: "张三",
      evidence: "证据详情...",
      contact: "联系方式",
      status: "pending",            // pending/resolved
      createdAt: "ISO日期"
    }
  ]
}
```

---

## 4. CopyrightService 服务

### 4.1 核心方法

```javascript
const CopyrightService = {
  // 侵权投诉
  submitReport(data),
  getReports(status),
  resolveReport(reportId, result, note),

  // 版权检查
  checkResource(resourceId)
}
```

---

## 5. 实施计划

### Phase 1: 服务层
1. 创建 copyright-service.js
2. 修改 resource-service.js 支持版权字段

### Phase 2: 上传界面
1. 上传时添加版权声明选项

### Phase 3: 资源详情页
1. 显示版权信息
2. 添加侵权投诉入口

### Phase 4: 管理后台
1. 版权审核界面
2. 侵权处理界面
