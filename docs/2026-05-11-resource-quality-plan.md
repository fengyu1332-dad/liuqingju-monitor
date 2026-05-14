# 留情局数字资源内容质量管理系统实施计划

> **For agentic workers:** 使用 Task 工具执行此计划的任务。

**Goal:** 实现资源审核，质量评级和举报系统三大功能

**Architecture:** 创建 ReportService 管理举报，扩展 ResourceService 支持审核和评级

**Tech Stack:** 原生 JavaScript，localStorage，修改现有服务

---

## 文件结构

```
js/
  ├── report-service.js      # 新建：举报服务
  ├── resource-service.js     # 修改：支持审核和评级
  └── admin-service.js       # 修改：添加审核和举报管理

resources.html    # 修改：添加举报按钮、评分组件
admin.html       # 修改：添加审核管理和举报管理页面
```

---

## 任务列表

### 任务 1: 创建 report-service.js

**Files:**
- 创建: `js/report-service.js`

核心功能：
- 提交举报 submitReport
- 获取举报列表 getReports
- 处理举报 resolveReport
- 举报统计 getReportStats

### 任务 2: 修改 resource-service.js 支持审核和评级

**Files:**
- 修改: `js/resource-service.js`

核心功能：
- 添加审核字段到资源数据
- 审核方法：approveResource、rejectResource、getPendingResources
- 评级方法：setResourceRating、setAdminRating
- 隐藏资源：hideResource

### 任务 3: 修改 resources.html 添加举报和评分

**Files:**
- 修改: `resources.html`

核心功能：
- 资源卡片添加举报按钮
- 举报模态框
- 评分组件（星级评分）

### 任务 4: 修改 admin.html 添加审核和举报管理

**Files:**
- 修改: `admin.html`

核心功能：
- 资源审核界面（待审核列表）
- 举报管理界面（待处理/已处理）
- 审核操作（通过/拒绝/要求修改）
- 举报处理（忽略/警告/下架/删除）

---

**Plan complete!**
