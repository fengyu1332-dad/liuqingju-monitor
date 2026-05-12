# AI监控系统部署指南

**版本**: v1.0
**更新日期**: 2026-05-11

---

## 📋 部署概览

本指南将帮助您完成以下部署任务：

1. ✅ 创建 GitHub 仓库
2. ✅ 配置 GitHub Secrets
3. ✅ 创建 Supabase 项目
4. ✅ 初始化数据库
5. ✅ 测试数据同步

---

## 🚀 第一步：创建 GitHub 仓库

### 1.1 在 GitHub 创建新仓库

1. 访问 https://github.com 并登录
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `liuqingju-monitor`
   - **Description**: `留情局大学招生信息监控系统`
   - **Visibility**: Public 或 Private
   - **不要**勾选 "Add a README file"
4. 点击 **"Create repository"**

### 1.2 上传代码到仓库

**方法一：使用 Git 命令行**

```bash
# 进入 university-monitor-package 目录
cd d:/BaiduSyncdisk/AI/liuqingju/university-monitor-package

# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: AI监控系统"

# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/liuqingju-monitor.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

**方法二：使用 GitHub Desktop**

1. 下载并安装 GitHub Desktop
2. 选择 "Add an Existing Repository"
3. 选择 `university-monitor-package` 文件夹
4. 点击 "Publish repository"

---

## 🔐 第二步：配置 GitHub Secrets

### 2.1 获取必要的 API Key

#### 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录账号
3. 进入 API Keys 页面
4. 点击 "Create API Key"
5. 复制生成的 Key（格式：`sk-xxxxxxxxxxxxxxxx`）

#### 获取 Supabase Credentials

（下一节会详细说明）

### 2.2 配置 GitHub Secrets

1. 进入您的 GitHub 仓库
2. 点击 **Settings**（在仓库顶部导航栏）
3. 在左侧菜单中选择 **"Secrets and variables"** → **"Actions"**
4. 点击 **"New repository secret"** 按钮
5. 逐个添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `DEEPSEEK_API_KEY` | `sk-xxxxxxxxxxxxxxxx` | DeepSeek API 密钥 |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_KEY` | `eyJhbGci...` | Supabase Service Role Key |
| `BOT_USER_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | 留情局机器人用户 ID |

---

## 🗄️ 第三步：创建 Supabase 项目

### 3.1 创建 Supabase 账号

1. 访问 https://supabase.com
2. 点击 **"Start your project"**
3. 使用 GitHub 账号授权登录
4. 点击 **"New project"**

### 3.2 填写项目信息

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Organization** | 选择您的组织或个人 | |
| **Name** | `liuqingju-monitor` | 项目名称 |
| **Database Password** | 设置一个强密码 | 建议使用随机密码生成器 |
| **Region** | `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)` | 选择离中国最近的区域 |

点击 **"Create new project"** 等待项目创建完成（大约2分钟）。

### 3.3 获取 Supabase 凭证

项目创建完成后，在项目仪表板中获取以下信息：

1. **Project Settings** → **API**
2. 找到以下信息：

```
Project URL: https://xxxxx.supabase.co
Project API Key (anon/public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**：
- `SUPABASE_URL` = Project URL
- `SUPABASE_KEY` = Service Role secret（不是 anon key！）

### 3.4 更新 GitHub Secrets

将获取的 Supabase 凭证添加到 GitHub Secrets：

1. 返回 GitHub 仓库 Settings
2. 添加 `SUPABASE_URL`
3. 添加 `SUPABASE_KEY`

---

## 📊 第四步：初始化数据库

### 4.1 在 Supabase SQL Editor 执行

1. 进入 Supabase 项目
2. 点击左侧菜单 **"SQL Editor"**
3. 点击 **"New query"**

### 4.2 执行基础表结构

复制以下 SQL 并执行：

```sql
-- ============================================================
-- 留情局监控系统 - 数据库初始化
-- ============================================================

-- 1. 大学配置表
CREATE TABLE IF NOT EXISTS monitor_universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 监控页面表
CREATE TABLE IF NOT EXISTS monitor_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES monitor_universities(id),
    url TEXT NOT NULL,
    page_type TEXT DEFAULT 'admission',
    degree_level TEXT DEFAULT 'all',
    is_monitored BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 搜索关键词表
CREATE TABLE IF NOT EXISTS monitor_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    keyword_cn TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 执行日志表
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_time TIMESTAMPTZ DEFAULT NOW(),
    universities_processed INTEGER DEFAULT 0,
    posts_published INTEGER DEFAULT 0,
    errors TEXT,
    status TEXT DEFAULT 'success',
    metadata JSONB DEFAULT '{}'
);

-- 5. 已处理页面表
CREATE TABLE IF NOT EXISTS processed_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    university TEXT,
    content_hash TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    post_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 留情局情报表
CREATE TABLE IF NOT EXISTS intelligence_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    tag TEXT DEFAULT 'essay',
    tag_label TEXT DEFAULT 'ESSAY',
    source TEXT,
    source_url TEXT,
    degree_level TEXT DEFAULT 'all',
    confidence REAL DEFAULT 0,
    is_auto_generated BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 情报分类表
CREATE TABLE IF NOT EXISTS intelligence_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#722ed1',
    icon TEXT DEFAULT 'book',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 关键时点表
CREATE TABLE IF NOT EXISTS intelligence_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'calendar',
    color TEXT DEFAULT 'blue',
    event_date DATE NOT NULL,
    event_type TEXT DEFAULT 'deadline',
    university TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 同步日志表
CREATE TABLE IF NOT EXISTS intelligence_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,
    records_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 情报标签表
CREATE TABLE IF NOT EXISTS intelligence_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    color TEXT DEFAULT '#8c8c8c',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 插入默认数据
-- ============================================================

-- 插入情报分类
INSERT INTO intelligence_categories (name, slug, color, icon, sort_order) VALUES
    ('招生政策', 'policy', '#722ed1', 'graduation-cap', 1),
    ('资源下载', 'resources', '#52c41a', 'download', 2),
    ('申请截止', 'deadline', '#faad14', 'clock', 3),
    ('奖学金', 'scholarship', '#1890ff', 'gift', 4),
    ('文书写作', 'essay', '#eb2f96', 'edit', 5)
ON CONFLICT DO NOTHING;

-- 插入情报标签
INSERT INTO intelligence_tags (tag, label, color) VALUES
    ('policy', 'POLICY', '#722ed1'),
    ('resources', 'RESOURCES', '#52c41a'),
    ('deadline', 'DEADLINE', '#faad14'),
    ('scholarship', 'SCHOLARSHIP', '#1890ff'),
    ('essay', 'ESSAY', '#eb2f96'),
    ('competition', 'COMPETITION', '#13c2c2'),
    ('visa', 'VISA', '#52c41a')
ON CONFLICT DO NOTHING;

-- 插入关键时点
INSERT INTO intelligence_milestones (title, description, icon, color, event_date, event_type, university) VALUES
    ('AMC 10/12 美国数学竞赛', '报名截止日期', 'trophy', 'purple', '2024-10-28', 'competition', 'MAA'),
    ('UC Application Deadline', '加州大学申请截止', 'graduation-cap', 'orange', '2024-11-30', 'deadline', 'University of California'),
    ('Common App Early Action', '提前行动申请截止', 'file-alt', 'blue', '2024-11-01', 'deadline', 'Common App'),
    ('USACO December Contest', '美国计算机奥林匹克竞赛', 'code', 'cyan', '2024-12-15', 'competition', 'USACO'),
    ('UK UCAS Deadline', '英国大学本科申请截止', 'university', 'red', '2025-01-15', 'deadline', 'UCAS')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 创建索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_universities_active ON monitor_universities(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_university ON monitor_pages(university_id);
CREATE INDEX IF NOT EXISTS idx_logs_runtime ON execution_logs(run_time DESC);
CREATE INDEX IF NOT EXISTS idx_processed_url ON processed_pages(url);
CREATE INDEX IF NOT EXISTS idx_intelligence_published ON intelligence_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_source ON intelligence_posts(source);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON intelligence_milestones(event_date);

-- ============================================================
-- RLS 策略（行级安全）
-- ============================================================

-- 情报表：公开读取
ALTER TABLE intelligence_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read intelligence" ON intelligence_posts
    FOR SELECT USING (true);

-- 情报表：自动写入
CREATE POLICY "Service role can insert intelligence" ON intelligence_posts
    FOR INSERT WITH CHECK (true);

-- 监控表：仅服务角色可写
ALTER TABLE monitor_universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage universities" ON monitor_universities
    FOR ALL USING (true);

ALTER TABLE monitor_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage pages" ON monitor_pages
    FOR ALL USING (true);

ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage logs" ON execution_logs
    FOR ALL USING (true);

ALTER TABLE processed_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage processed" ON processed_pages
    FOR ALL USING (true);

-- 时点表：公开读取
ALTER TABLE intelligence_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read milestones" ON intelligence_milestones
    FOR SELECT USING (is_active = true);

-- 分类和标签：公开读取
ALTER TABLE intelligence_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON intelligence_categories
    FOR SELECT USING (is_active = true);

ALTER TABLE intelligence_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tags" ON intelligence_tags
    FOR SELECT USING (is_active = true);

-- ============================================================
-- 完成提示
-- ============================================================

SELECT '✅ 数据库初始化完成！' AS status;
SELECT '共创建 10 个表' AS tables_created;
```

点击 **"Run"** 执行 SQL。

### 4.3 获取机器人用户 ID

1. 在留情局系统中注册或登录一个机器人账号
2. 打开浏览器开发者工具（F12）
3. 在 Console 中执行：
   ```javascript
   const user = JSON.parse(localStorage.getItem('liuqingju_current_user'));
   console.log('用户ID:', user?.id);
   ```
4. 复制获取的 ID
5. 在 GitHub Secrets 中添加 `BOT_USER_ID`

---

## ⚙️ 第五步：配置 GitHub Actions

### 5.1 创建工作流目录

确保您的仓库中有以下文件结构：

```
liuqingju-monitor/
├── .github/
│   └── workflows/
│       └── monitor.yml
├── backend/
│   ├── src/
│   │   ├── main.py
│   │   ├── adapter.py
│   │   └── sync_service.py
│   ├── config/
│   │   └── universities.yaml
│   └── requirements.txt
└── README.md
```

### 5.2 触发首次运行

1. 在 GitHub 仓库页面
2. 点击 **"Actions"** 标签
3. 选择 **"University Admission Monitor"** 工作流
4. 点击 **"Run workflow"** 按钮
5. 选择运行选项：
   - **Branch**: `main`
   - **dry_run**: `false`
   - **sync_target**: `all`
6. 点击 **"Run workflow"**

### 5.3 检查运行结果

1. 点击工作流运行记录
2. 查看 **"Actions"** 日志
3. 确保所有步骤都是绿色勾选
4. 如果有错误，检查错误信息并修复

---

## 🧪 第六步：测试数据同步

### 6.1 本地测试

在本地运行监控脚本：

```bash
cd university-monitor-package/backend

# 安装依赖
pip install -r requirements.txt

# 测试运行（不实际发布）
python src/main.py --dry-run --export-liuqingju

# 正式运行
python src/main.py --export-liuqingju

# 查看统计
python src/main.py --stats
```

### 6.2 验证 Supabase 数据

1. 进入 Supabase 项目
2. 点击 **"Table Editor"**
3. 选择 `intelligence_posts` 表
4. 确认是否有新数据

### 6.3 在留情局中配置

1. 打开留情局 `admin-login.html`
2. 登录管理员账号
3. 进入 **"AI监控"** 标签页
4. 配置 Supabase 连接信息
5. 测试同步功能

---

## 📋 部署检查清单

在完成所有步骤后，使用以下清单进行验证：

### GitHub 配置

- [ ] GitHub 仓库已创建
- [ ] 代码已推送
- [ ] 所有 Secrets 已配置
  - [ ] `DEEPSEEK_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`
  - [ ] `BOT_USER_ID`

### Supabase 配置

- [ ] 项目已创建
- [ ] 所有表已创建
- [ ] 默认数据已插入
- [ ] RLS 策略已配置
- [ ] 获取了正确的凭证

### GitHub Actions

- [ ] 工作流文件存在
- [ ] 定时触发已配置
- [ ] 手动触发可工作
- [ ] 首次运行成功

### 数据同步

- [ ] 本地测试通过
- [ ] Supabase 有数据
- [ ]留情局可同步

---

## 🔧 故障排查

### 问题 1：GitHub Actions 失败

**可能原因**：Secrets 配置错误

**解决方法**：
1. 检查 Secrets 名称是否正确
2. 确认 API Key 未过期
3. 查看 Actions 日志中的具体错误

### 问题 2：Supabase 连接失败

**可能原因**：
- URL 格式错误
- API Key 不正确

**解决方法**：
1. 确认 SUPABASE_URL 格式为 `https://xxx.supabase.co`
2. 使用 Service Role Key，不是 anon key

### 问题 3：DeepSeek API 错误

**可能原因**：
- API Key 额度用完
- 请求频率过高

**解决方法**：
1. 检查 https://platform.deepesk.com 查看使用量
2. 降低监控频率

### 问题 4：留情局同步失败

**可能原因**：
- Supabase 凭证未配置
- CORS 策略阻止

**解决方法**：
1. 在留情局管理员后台配置 Supabase
2. 检查 Supabase 项目设置中的 CORS

---

## 📞 获得帮助

如果遇到问题：

1. **GitHub Actions 日志**：查看仓库的 Actions 页面
2. **Supabase 状态**：检查 https://status.supabase.com
3. **DeepSeek 状态**：检查 https://platform.deepseek.com

---

*文档版本: v1.0*
*最后更新: 2026-05-11*
