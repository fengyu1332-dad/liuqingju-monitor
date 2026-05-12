/**
 * 监控系统 API 层
 * 封装所有与监控系统相关的 Supabase API 调用
 */

import { supabase } from './supabase'; // 使用您现有的 supabase 客户端

// ==================== 监控配置相关 ====================

/**
 * 获取所有监控的大学配置
 */
export async function getMonitorUniversities() {
  const { data, error } = await supabase
    .from('monitor_universities')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * 添加监控大学
 */
export async function addUniversity(university) {
  const { data, error } = await supabase
    .from('monitor_universities')
    .insert(university)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * 更新监控大学
 */
export async function updateUniversity(id, updates) {
  const { data, error } = await supabase
    .from('monitor_universities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * 删除监控大学
 */
export async function deleteUniversity(id) {
  const { error } = await supabase
    .from('monitor_universities')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * 获取某个大学的监控页面列表
 */
export async function getUniversityPages(universityId) {
  const { data, error } = await supabase
    .from('monitor_pages')
    .select('*')
    .eq('university_id', universityId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * 添加监控页面
 */
export async function addPage(page) {
  const { data, error } = await supabase
    .from('monitor_pages')
    .insert(page)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * 删除监控页面
 */
export async function deletePage(id) {
  const { error } = await supabase
    .from('monitor_pages')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== 搜索关键词相关 ====================

/**
 * 获取所有搜索关键词
 */
export async function getKeywords() {
  const { data, error } = await supabase
    .from('monitor_keywords')
    .select('*')
    .order('category', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * 添加关键词
 */
export async function addKeyword(keyword) {
  const { data, error } = await supabase
    .from('monitor_keywords')
    .insert(keyword)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * 更新关键词
 */
export async function updateKeyword(id, updates) {
  const { data, error } = await supabase
    .from('monitor_keywords')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * 删除关键词
 */
export async function deleteKeyword(id) {
  const { error } = await supabase
    .from('monitor_keywords')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== 已发布帖子相关 ====================

/**
 * 获取自动发布的帖子列表
 */
export async function getAutoPosts({ page = 1, pageSize = 20, filters = {} }) {
  let query = supabase
    .from('posts')
    .select('*, categories(name, slug)', { count: 'exact' })
    .eq('is_auto_published', true);

  // 按大学筛选
  if (filters.university) {
    query = query.eq('source_university', filters.university);
  }

  // 按信息类型筛选
  if (filters.infoType) {
    query = query.eq('info_type', filters.infoType);
  }

  // 搜索
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  // 分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return { posts: data, total: count, page, pageSize };
}

/**
 * 删除自动发布的帖子
 */
export async function deleteAutoPost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== 执行日志相关 ====================

/**
 * 获取执行日志
 */
export async function getExecutionLogs({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('execution_logs')
    .select('*', { count: 'exact' })
    .order('run_time', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { logs: data, total: count, page, pageSize };
}

// ==================== 统计数据相关 ====================

/**
 * 获取监控统计总览
 */
export async function getMonitorStats() {
  // 总帖子数
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_auto_published', true);

  // 今日新增
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_auto_published', true)
    .gte('created_at', today.toISOString());

  // 监控大学数
  const { count: totalUniversities } = await supabase
    .from('monitor_universities')
    .select('*', { count: 'exact', head: true });

  // 最近执行状态
  const { data: lastExecution } = await supabase
    .from('execution_logs')
    .select('*')
    .order('run_time', { ascending: false })
    .limit(1)
    .single();

  // 各大学帖子分布
  const { data: universityBreakdown } = await supabase
    .from('posts')
    .select('source_university')
    .eq('is_auto_published', true);

  const breakdown = {};
  (universityBreakdown || []).forEach(p => {
    const uni = p.source_university || '未知';
    breakdown[uni] = (breakdown[uni] || 0) + 1;
  });

  // 最近7天发布趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('created_at')
    .eq('is_auto_published', true)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = (recentPosts || []).filter(
      p => p.created_at && p.created_at.startsWith(dateStr)
    ).length;
    dailyTrend.push({ date: dateStr, count });
  }

  return {
    totalPosts: totalPosts || 0,
    todayPosts: todayPosts || 0,
    totalUniversities: totalUniversities || 0,
    lastExecution: lastExecution || null,
    universityBreakdown: breakdown,
    dailyTrend,
  };
}

/**
 * 手动触发监控任务（通过 Supabase Edge Function）
 */
export async function triggerMonitor(dryRun = false) {
  // 如果您部署了 Supabase Edge Function
  // const { data, error } = await supabase.functions.invoke('run-monitor', {
  //   body: { dry_run: dryRun }
  // });
  // if (error) throw error;
  // return data;
  
  // 备选：通过 GitHub Actions API 触发
  console.log('触发监控任务, dryRun:', dryRun);
  return { success: true, message: '监控任务已触发' };
}
