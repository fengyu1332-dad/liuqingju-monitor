/**
 * 已发布帖子管理页面
 * 支持搜索、筛选、查看详情、删除
 */

import React, { useState, useEffect } from 'react';
import { getAutoPosts, deleteAutoPost } from '../../lib/monitorApi';

const INFO_TYPE_MAP = {
  admission: { label: '招生', color: 'bg-blue-50 text-blue-700' },
  enrollment: { label: '录取', color: 'bg-green-50 text-green-700' },
  deadline: { label: '截止', color: 'bg-amber-50 text-amber-700' },
  scholarship: { label: '奖学金', color: 'bg-purple-50 text-purple-700' },
  other: { label: '其他', color: 'bg-gray-50 text-gray-700' },
};

const DEGREE_MAP = {
  undergraduate: '本科',
  master: '硕士',
  phd: '博士',
  all: '全学位',
};

export default function PostManager() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const pageSize = 15;

  useEffect(() => {
    loadPosts();
  }, [page, filterUniversity, filterType]);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await getAutoPosts({
        page,
        pageSize,
        filters: {
          search: search || undefined,
          university: filterUniversity || undefined,
          infoType: filterType || undefined,
        },
      });
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载帖子失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadPosts();
  }

  async function handleDelete(id) {
    if (!window.confirm('确定要删除这条帖子吗？')) return;
    try {
      setDeleting(id);
      await deleteAutoPost(id);
      loadPosts();
      setSelectedPost(null);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">帖子管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理自动发布的招生信息帖子</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索标题或内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部类型</option>
            <option value="admission">招生简章</option>
            <option value="enrollment">录取通知</option>
            <option value="deadline">截止日期</option>
            <option value="scholarship">奖学金</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            搜索
          </button>
        </form>
      </div>

      {/* 帖子列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">暂无帖子</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大学</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => {
                const typeInfo = INFO_TYPE_MAP[post.info_type] || INFO_TYPE_MAP.other;
                return (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 text-left max-w-xs truncate block"
                      >
                        {post.title}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{post.source_university || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{DEGREE_MAP[post.degree_level] || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {post.source_url && (
                          <a
                            href={post.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-indigo-600"
                            title="查看原文"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-gray-400 hover:text-indigo-600"
                          title="查看详情"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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

      {/* 帖子详情弹窗 */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={() => setSelectedPost(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto my-8 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedPost.title}</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    (INFO_TYPE_MAP[selectedPost.info_type] || INFO_TYPE_MAP.other).color
                  }`}>
                    {(INFO_TYPE_MAP[selectedPost.info_type] || INFO_TYPE_MAP.other).label}
                  </span>
                  <span className="text-sm text-gray-500">{selectedPost.source_university}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(selectedPost.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedPost.content}
                </div>

                {selectedPost.source_url && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={selectedPost.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      查看原文链接
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
