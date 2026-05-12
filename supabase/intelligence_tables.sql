/**
 * 留情局情报数据库初始化 SQL
 *
 * 在 Supabase SQL Editor 中执行此脚本
 */

-- ============================================================
-- 1. 情报分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS intelligence_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                    -- 分类名称
    slug TEXT UNIQUE NOT NULL,             -- URL slug
    color TEXT DEFAULT '#722ed1',           -- 颜色
    icon TEXT DEFAULT 'book',               -- 图标
    sort_order INTEGER DEFAULT 0,           -- 排序
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO intelligence_categories (name, slug, color, icon, sort_order) VALUES
    ('招生政策', 'policy', '#722ed1', 'graduation-cap', 1),
    ('资源下载', 'resources', '#52c41a', 'download', 2),
    ('申请截止', 'deadline', '#faad14', 'clock', 3),
    ('奖学金', 'scholarship', '#1890ff', 'gift', 4),
    ('文书写作', 'essay', '#eb2f96', 'edit', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. 情报表
-- ============================================================
CREATE TABLE IF NOT EXISTS intelligence_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                    -- 标题
    content TEXT,                           -- 内容
    tag TEXT DEFAULT 'essay',               -- 标签 slug
    tag_label TEXT DEFAULT 'ESSAY',         -- 标签显示名称
    source TEXT,                            -- 来源大学
    source_url TEXT,                        -- 原文链接
    degree_level TEXT DEFAULT 'all',        -- 学位层次
    confidence REAL DEFAULT 0,             -- AI 置信度
    is_auto_generated BOOLEAN DEFAULT FALSE,-- 是否 AI 自动生成
    view_count INTEGER DEFAULT 0,          -- 浏览数
    status TEXT DEFAULT 'published',         -- published/draft/hidden
    metadata JSONB DEFAULT '{}',             -- 额外元数据
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_intelligence_tag ON intelligence_posts(tag);
CREATE INDEX IF NOT EXISTS idx_intelligence_source ON intelligence_posts(source);
CREATE INDEX IF NOT EXISTS idx_intelligence_status ON intelligence_posts(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_published ON intelligence_posts(published_at DESC);

-- ============================================================
-- 3. 关键时点表
-- ============================================================
CREATE TABLE IF NOT EXISTS intelligence_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                    -- 标题
    description TEXT,                       -- 描述
    icon TEXT DEFAULT 'calendar',           -- 图标
    color TEXT DEFAULT 'blue',              -- 颜色
    event_date DATE NOT NULL,               -- 日期
    event_time TIME,                        -- 时间（可选）
    event_type TEXT DEFAULT 'deadline',     -- 类型: deadline/scholarship/interview/visa
    university TEXT,                         -- 大学
    is_active BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER DEFAULT 7,        -- 提前提醒天数
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_date ON intelligence_milestones(event_date);
CREATE INDEX IF NOT EXISTS idx_milestones_active ON intelligence_milestones(is_active);

-- 插入默认关键时点
INSERT INTO intelligence_milestones (title, description, icon, color, event_date, event_type, university) VALUES
    ('AMC 10/12 美国数学竞赛', '报名截止日期', 'trophy', 'purple', '2024-10-28', 'competition', 'MAA'),
    ('UC Application Deadline', '加州大学申请截止', 'graduation-cap', 'orange', '2024-11-30', 'deadline', 'University of California'),
    ('Common App Early Action', '提前行动申请截止', 'file-alt', 'blue', '2024-11-01', 'deadline', 'Common App'),
    ('USACO December Contest', '美国计算机奥林匹克竞赛', 'code', 'cyan', '2024-12-15', 'competition', 'USACO'),
    ('UK UCAS Deadline', '英国大学本科申请截止', 'university', 'red', '2025-01-15', 'deadline', 'UCAS'),
    ('Student Visa Appointment', '学生签证预约开始', 'passport', 'green', '2025-05-01', 'visa', 'US Embassy')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. 情报同步记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS intelligence_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,               -- push/pull/full
    records_count INTEGER DEFAULT 0,        -- 同步记录数
    status TEXT DEFAULT 'success',          -- success/failed/partial
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_time ON intelligence_sync_logs(executed_at DESC);

-- ============================================================
-- 5. 情报标签表（可扩展）
-- ============================================================
CREATE TABLE IF NOT EXISTS intelligence_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,              -- 标签 slug
    label TEXT NOT NULL,                   -- 显示名称
    color TEXT DEFAULT '#8c8c8c',          -- 颜色
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO intelligence_tags (tag, label, color) VALUES
    ('policy', 'POLICY', '#722ed1'),
    ('resources', 'RESOURCES', '#52c41a'),
    ('deadline', 'DEADLINE', '#faad14'),
    ('scholarship', 'SCHOLARSHIP', '#1890ff'),
    ('essay', 'ESSAY', '#eb2f96'),
    ('competition', 'COMPETITION', '#13c2c2'),
    ('visa', 'VISA', '#52c41a')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. RLS 策略（行级安全）
-- ============================================================
ALTER TABLE intelligence_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_tags ENABLE ROW LEVEL SECURITY;

-- 情报和时点：公开读取
CREATE POLICY "Anyone can read intelligence" ON intelligence_posts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read milestones" ON intelligence_milestones
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read tags" ON intelligence_tags
    FOR SELECT USING (is_active = true);

-- 自动生成的内容由机器人写入（通过 Service Role）
CREATE POLICY "Service role can insert intelligence" ON intelligence_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage milestones" ON intelligence_milestones
    FOR ALL USING (true);

-- 情报同步日志：仅管理员可访问
ALTER TABLE intelligence_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage sync logs" ON intelligence_sync_logs
    FOR ALL USING (true);

-- ============================================================
-- 7. 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intelligence_posts_updated_at
    BEFORE UPDATE ON intelligence_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_milestones_updated_at
    BEFORE UPDATE ON intelligence_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
