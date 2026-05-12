/**
 * 监控状态总览页面
 * 展示关键指标、最近活动、大学分布等
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/admin/StatCard';
import { getMonitorStats, getAutoPosts, triggerMonitor } from '../../lib/monitorApi';

export default function MonitorDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, postsData] = await Promise.all([
        getMonitorStats(),
        getAutoPosts({ page: 1, pageSize: 5 }),
      ]);
      setStats(statsData);
      setRecentPosts(postsData.posts || []);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTrigger() {
    try {
      setTriggering(true);
      await triggerMonitor(false);
      alert('监控任务已触发，请稍后查看执行日志');
    } catch (err) {
      console.error('触发失败:', err);
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const statusColor = stats?.lastExecution?.status === 'success'
    ? 'green' : stats?.lastExecution?.status === 'failed' ? 'red' : 'amber';

  const statusText = {
    success: '正常运行',
    partial: '部分成功',
    failed: '执行失败',
  };

  // 按帖子数量排序大学
  const topUniversities = Object.entries(stats?.universityBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监控总览</h1>
          <p className="mt-1 text-sm text-gray-500">大学招生信息监控系统运行状态</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {triggering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              执行中...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              立即执行
            </>
          )}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="监控大学数"
          value={stats?.totalUniversities || 0}
          subtitle="当前正在监控的大学数量"
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />

        <StatCard
          title="已发布帖子"
          value={stats?.totalPosts || 0}
          subtitle={`今日新增 ${stats?.todayPosts || 0} 条`}
          color="blue"
          trend={stats?.todayPosts > 0 ? stats.todayPosts : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatCard
          title="最近执行状态"
          value={statusText[stats?.lastExecution?.status] || '未执行'}
          subtitle={stats?.lastExecution
            ? `上次执行: ${new Date(stats.lastExecution.run_time).toLocaleString('zh-CN')}`
            : '暂无执行记录'
          }
          color={statusColor}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="上次发布数"
          value={stats?.lastExecution?.posts_published || 0}
          subtitle={`处理了 ${stats?.lastExecution?.universities_processed || 0} 所大学`}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </div>

      {/* 7天趋势图 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近 7 天发布趋势</h2>
        <div className="flex items-end justify-between h-40 gap-2">
          {(stats?.dailyTrend || []).map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-700 mb-1">
                {day.count > 0 ? day.count : ''}
              </span>
              <div
                className="w-full bg-indigo-500 rounded-t-md transition-all duration-300 min-h-[4px]"
                style={{
                  height: `${Math.max(day.count * 20, 4)}px`,
                  opacity: day.count > 0 ? 1 : 0.2,
                }}
              />
              <span className="text-xs text-gray-400 mt-2">
                {day.date.slice(5)} {/* MM-DD */}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 大学帖子分布 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">大学帖子分布</h2>
            <Link
              to="/admin/monitor/posts"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {topUniversities.map(([uni, count]) => {
              const maxCount = topUniversities[0]?.[1] || 1;
              const percentage = (count / maxCount) * 100;
              return (
                <div key={uni} className="flex items-center">
                  <span className="text-sm text-gray-600 w-28 truncate">{uni}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
            {topUniversities.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
            )}
          </div>
        </div>

        {/* 最近发布的帖子 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近发布</h2>
            <Link
              to="/admin/monitor/posts"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </p>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-xs text-gray-400">
                      {post.source_university}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  post.info_type === 'admission' ? 'bg-blue-50 text-blue-700' :
                  post.info_type === 'enrollment' ? 'bg-green-50 text-green-700' :
                  post.info_type === 'deadline' ? 'bg-amber-50 text-amber-700' :
                  post.info_type === 'scholarship' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {{
                    admission: '招生',
                    enrollment: '录取',
                    deadline: '截止',
                    scholarship: '奖学金',
                    other: '其他',
                  }[post.info_type] || '其他'}
                </span>
              </div>
            ))}
            {recentPosts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无发布记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
