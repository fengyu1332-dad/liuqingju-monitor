/**
 * 监控管理后台 - 数据库初始化 SQL
 * 
 * 在 Supabase SQL Editor 中执行此脚本，创建管理界面所需的表结构
 */

-- ============================================================
-- 1. 监控大学配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS monitor_universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                    -- 大学名称
    country TEXT,                          -- 国家
    is_active BOOLEAN DEFAULT TRUE,        -- 是否启用监控
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 监控页面表（每个大学可监控多个页面）
-- ============================================================
CREATE TABLE IF NOT EXISTS monitor_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES monitor_universities(id) ON DELETE CASCADE,
    url TEXT NOT NULL,                     -- 监控页面 URL
    page_type TEXT DEFAULT 'admission',    -- 页面类型: admission/enrollment/deadline/scholarship
    degree_level TEXT DEFAULT 'all',       -- 学位层次: undergraduate/master/phd/all
    is_active BOOLEAN DEFAULT TRUE,        -- 是否启用
    last_checked_at TIMESTAMPTZ,           -- 最后检查时间
    last_content_hash TEXT,                -- 最后内容哈希
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 搜索关键词表
-- ============================================================
CREATE TABLE IF NOT EXISTS monitor_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,                 -- 关键词
    category TEXT DEFAULT 'general',       -- 分类: general/admission/enrollment/deadline/scholarship
    language TEXT DEFAULT 'en',            -- 语言: en/zh/other
    weight REAL DEFAULT 1.0,               -- 权重（用于排序优先级）
    is_active BOOLEAN DEFAULT TRUE,        -- 是否启用
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 执行日志表（供管理界面查询）
-- ============================================================
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_time TIMESTAMPTZ DEFAULT NOW(),
    universities_processed INTEGER DEFAULT 0,
    pages_scraped INTEGER DEFAULT 0,
    posts_published INTEGER DEFAULT 0,
    errors TEXT,
    status TEXT DEFAULT 'success',         -- success/partial/failed
    duration_seconds INTEGER               -- 执行耗时
);

-- ============================================================
-- 5. 已处理页面记录表（供管理界面查询）
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    university TEXT NOT NULL,
    content_hash TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    post_id UUID,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_processed_url ON processed_pages(url);
CREATE INDEX IF NOT EXISTS idx_processed_uni ON processed_pages(university);
CREATE INDEX IF NOT EXISTS idx_processed_time ON processed_pages(processed_at);
CREATE INDEX IF NOT EXISTS idx_exec_logs_time ON execution_logs(run_time);
CREATE INDEX IF NOT EXISTS idx_monitor_pages_uni ON monitor_pages(university_id);

-- ============================================================
-- 6. 插入默认搜索关键词
-- ============================================================
INSERT INTO monitor_keywords (keyword, category, language, weight) VALUES
    -- 英文关键词
    ('admission', 'admission', 'en', 2.0),
    ('application', 'admission', 'en', 1.5),
    ('enrollment', 'enrollment', 'en', 2.0),
    ('acceptance', 'enrollment', 'en', 1.5),
    ('deadline', 'deadline', 'en', 2.0),
    ('scholarship', 'scholarship', 'en', 2.0),
    ('fellowship', 'scholarship', 'en', 1.5),
    ('financial aid', 'scholarship', 'en', 1.5),
    ('graduate', 'general', 'en', 1.0),
    ('postgraduate', 'general', 'en', 1.0),
    ('PhD', 'general', 'en', 1.0),
    ('master', 'general', 'en', 1.0),
    ('apply now', 'admission', 'en', 1.5),
    ('how to apply', 'admission', 'en', 1.0),
    ('requirements', 'admission', 'en', 1.0),
    ('tuition', 'scholarship', 'en', 1.0),
    ('funding', 'scholarship', 'en', 1.0),
    -- 中文关键词
    ('招生', 'admission', 'zh', 2.0),
    ('录取', 'enrollment', 'zh', 2.0),
    ('申请', 'admission', 'zh', 1.5),
    ('截止', 'deadline', 'zh', 2.0),
    ('奖学金', 'scholarship', 'zh', 2.0),
    ('研究生', 'general', 'zh', 1.5),
    ('博士', 'general', 'zh', 1.0),
    ('硕士', 'general', 'zh', 1.0),
    ('简章', 'admission', 'zh', 1.5),
    ('报考', 'admission', 'zh', 1.5),
    ('调剂', 'enrollment', 'zh', 1.5),
    ('复试', 'enrollment', 'zh', 1.5),
    ('推免', 'admission', 'zh', 1.0),
    ('保研', 'admission', 'zh', 1.0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. RLS 策略（行级安全）
-- ============================================================

-- 监控配置表：仅管理员可读写
ALTER TABLE monitor_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_keywords ENABLE ROW LEVEL SECURITY;

-- 执行日志和已处理页面：所有人可读
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_pages ENABLE ROW LEVEL SECURITY;

-- 注意：以下策略需要根据您的认证系统调整
-- 如果使用 Supabase Auth，可以基于 user_roles 表判断管理员

-- 管理员读写监控配置
CREATE POLICY "Admin can manage universities" ON monitor_universities
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin can manage pages" ON monitor_pages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin can manage keywords" ON monitor_keywords
    FOR ALL USING (true) WITH CHECK (true);

-- 所有人可读日志
CREATE POLICY "Anyone can read logs" ON execution_logs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read processed pages" ON processed_pages
    FOR SELECT USING (true);
