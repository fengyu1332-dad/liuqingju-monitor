# 留情局消息通知系统设计文档

**日期**: 2026-05-11
**版本**: v1.0

---

## 1. 系统概述

消息通知系统是留情局用户体验优化的核心功能，帮助用户及时了解社区互动和重要信息。

### 1.1 核心功能

- **消息中心**：集中展示所有通知消息
- **互动通知**：帖子回复、资源下载、悬赏响应等互动提醒
- **系统通知**：悬赏状态变更、积分变动等系统消息

### 1.2 设计原则

- **不打扰**：仅提供消息中心，不弹窗打扰用户
- **轻量化**：基于 localStorage，无需后端支持
- **可扩展**：预留消息类型扩展接口

---

## 2. 消息类型

### 2.1 互动通知

| 类型 | 触发场景 | 消息内容示例 |
|------|---------|-------------|
| post_reply | 你的帖子被回复 | "张三 回复了你的帖子《IB选课建议》" |
| resource_download | 你的资源被下载 | "李四 下载了你的资源《Past Paper 2023》" |
| bounty_response | 你的悬赏被响应 | "王五 响应了你的悬赏《申请文书修改》" |
| bounty_accepted | 你的响应被采纳 | "恭喜！你的响应被采纳，获得 50 积分" |

### 2.2 系统通知

| 类型 | 触发场景 | 消息内容示例 |
|------|---------|-------------|
| bounty_completed | 悬赏完成 | "你的悬赏《申请文书修改》已被完成" |
| points_change | 积分变动 | "每日登录奖励：+5 积分" |
| level_up | 等级提升 | "恭喜！你已升级为 Lv.2 学徒" |

---

## 3. 数据结构

### 3.1 消息记录

```javascript
{
  id: 'notif_xxx',
  userId: 'user_xxx',           // 接收者ID
  type: 'post_reply',           // 消息类型
  title: '新回复通知',            // 消息标题
  content: '张三 回复了你的帖子《IB选课建议》',  // 消息内容
  relatedId: 'post_xxx',         // 关联ID（帖子/资源/悬赏等）
  relatedType: 'post',           // 关联类型：post/resource/bounty
  isRead: false,                 // 是否已读
  createdAt: 'ISO日期'
}
```

### 3.2 用户消息列表

```javascript
// localStorage key: 'liuqingju_notifications'
{
  userId: 'user_xxx',
  messages: [/* 消息数组，按时间倒序 */],
  lastUpdate: 'ISO日期'
}
```

---

## 4. 技术实现

### 4.1 文件结构

```
js/
  ├── notification-service.js    # 通知服务（新增）
  └── user-menu.js               # 用户菜单（扩展通知入口）
```

### 4.2 NotificationService 核心方法

```javascript
const NotificationService = {
  // 发送通知
  send(userId, type, title, content, relatedId, relatedType),

  // 获取用户所有通知
  getNotifications(userId),

  // 获取未读数量
  getUnreadCount(userId),

  // 标记单条已读
  markAsRead(notificationId),

  // 全部已读
  markAllAsRead(userId),

  // 删除通知
  deleteNotification(notificationId),

  // 清除历史通知
  clearAll(userId),

  // 触发器：在各业务逻辑中调用
  onPostReply(postAuthorId, replierName, postTitle, postId),
  onResourceDownload(authorId, downloaderName, resourceTitle, resourceId),
  onBountyResponse(bountyOwnerId, responderName, bountyTitle, bountyId),
  onBountyCompleted(bountyOwnerId, bountyTitle, bountyId),
  onLevelUp(userId, newLevel, newTitle)
}
```

---

## 5. 触发点集成

### 5.1 积分系统触发

| 事件 | 调用的方法 |
|------|-----------|
| 每日登录 | NotificationService.send('points_change', ...) |
| 积分扣除 | NotificationService.send('points_change', ...) |
| 等级提升 | NotificationService.onLevelUp() |

### 5.2 论坛系统触发

| 事件 | 调用的方法 |
|------|-----------|
| 发布帖子 | - |
| 帖子被回复 | NotificationService.onPostReply() |
| 资源被下载 | NotificationService.onResourceDownload() |

### 5.3 悬赏系统触发

| 事件 | 调用的方法 |
|------|-----------|
| 悬赏被响应 | NotificationService.onBountyResponse() |
| 悬赏被采纳 | NotificationService.onBountyAccepted() |
| 悬赏完成 | NotificationService.onBountyCompleted() |

---

## 6. 用户界面

### 6.1 导航栏入口

```
[Logo]  首页  论坛  资源  悬赏  [通知图标(3)]  [用户菜单]
                                   ↑红色角标显示未读数量
```

### 6.2 消息中心面板

点击通知图标展开面板：

```
┌─────────────────────────────────────┐
│ 消息中心                      [全部已读] │
├─────────────────────────────────────┤
│ ● 新回复通知                    刚刚 │
│   张三 回复了你的帖子《IB选课建议》      │
├─────────────────────────────────────┤
│ ○ 资源下载                         10分钟前 │
│   李四 下载了你的资源《Past Paper》     │
├─────────────────────────────────────┤
│ ● 悬赏响应                         1小时前 │
│   王五 响应了你的悬赏《申请文书修改》     │
└─────────────────────────────────────┘
```

### 6.3 交互说明

- **点击通知**：跳转到相关页面（帖子/资源/悬赏详情）
- **点击全部已读**：所有未读标记为已读
- **点击删除**：单条通知删除

---

## 7. 实施计划

### Phase 1: 核心服务
1. 创建 notification-service.js
2. 实现消息发送、读取、删除功能
3. 实现未读数量统计

### Phase 2: 业务集成
1. 在 forum-service.js 集成帖子回复通知
2. 在 resource-service.js 集成资源下载通知
3. 在 bounty-service.js 集成悬赏响应通知
4. 在 points-service.js 集成积分变动通知

### Phase 3: UI展示
1. 在导航栏添加通知入口
2. 实现消息中心下拉面板
3. 添加未读数量角标

---

## 8. 注意事项

1. **存储限制**：localStorage 有大小限制，需要定期清理历史消息（保留最近100条）
2. **性能优化**：频繁更新通知时使用防抖
3. **已读同步**：用户登录时同步未读状态
