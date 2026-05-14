# 留情局数字资源版权管理系统实施计划

> **For agentic workers:** 使用 Task 工具执行此计划的任务。

**Goal:** 实现版权声明和侵权处理两大功能

**Architecture:** 创建 CopyrightService 管理侵权投诉，扩展 ResourceService 支持版权声明

**Tech Stack:** 原生 JavaScript，localStorage，修改现有服务

---

## 文件结构

```
js/
  ├── copyright-service.js    # 新建：版权服务
  └── resource-service.js     # 修改：支持版权字段

upload.html      # 修改：上传时添加版权声明
resources.html   # 修改：显示版权信息、侵权投诉入口
admin.html       # 修改：版权审核和侵权处理
```

---

## 任务列表

### 任务 1: 创建 copyright-service.js

**Files:**
- 创建: `js/copyright-service.js`

核心功能：
- COPYRIGHT_TYPES 版权类型常量
- INFRINGEMENT_TYPES 侵权类型常量
- submitReport(data) 提交侵权投诉
- getReports(status) 获取投诉列表
- resolveReport(reportId, result, note) 处理投诉

### 任务 2: 修改 resource-service.js 支持版权字段

**Files:**
- 修改: `js/resource-service.js`

核心功能：
- COPYRIGHT_TYPES 版权类型常量
- addUserResource 添加版权字段
- getResourceCopyright(resourceId) 获取版权信息

### 任务 3: 修改上传页面添加版权声明

**Files:**
- 修改: `upload.html` 或资源上传模态框

核心功能：
- 版权类型选择
- 来源/原作者填写（转载/授权时显示）
- 版权声明文本

### 任务 4: 修改资源页面显示版权和侵权投诉

**Files:**
- 修改: `resources.html`

核心功能：
- 显示版权标签
- 侵权投诉入口
- 侵权投诉模态框

### 任务 5: 修改管理后台添加版权管理

**Files:**
- 修改: `admin.html`

核心功能：
- 版权审核界面
- 侵权投诉处理界面

---

**Plan complete!**
