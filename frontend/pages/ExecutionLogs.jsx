/**
 * 执行日志和统计页面
 * 展示历史执行记录和统计数据
 */

import React, { useState, useEffect } from 'react';
import { getExecutionLogs } from '../../lib/monitorApi';

const STATUS_MAP = {
  success: { label: '成功', color: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  partial: { label: '部分成功', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  failed: { label: '失败', color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export default function ExecutionLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    loadLogs();
  }, [page]);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await getExecutionLogs({ page, pageSize });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载日志失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  // 统计数据
  const successCount = logs.filter(l => l.status === 'success').length;
  const failCount = logs.filter(l => l.status === 'failed').length;
  const avgPublished = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.posts_published || 0), 0) / logs.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">执行日志</h1>
        <p className="mt-1 text-sm text-gray-500">查看监控任务的历史执行记录</p>
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">总执行次数</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">成功率</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">平均每次发布</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{avgPublished} 条</p>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">暂无执行记录</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处理大学</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布帖子</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">耗时</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误信息</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => {
                const statusInfo = STATUS_MAP[log.status] || STATUS_MAP.success;
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} mr-1.5`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(log.run_time).toLocaleString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {log.universities_processed || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {log.posts_published || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {log.duration_seconds ? `${log.duration_seconds}s` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-red-500 truncate block max-w-xs" title={log.errors || ''}>
                        {log.errors || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
