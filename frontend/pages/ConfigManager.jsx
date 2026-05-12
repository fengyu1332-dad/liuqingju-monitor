/**
 * 配置管理页面
 * 管理监控的大学和页面列表
 */

import React, { useState, useEffect } from 'react';
import {
  getMonitorUniversities,
  addUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversityPages,
  addPage,
  deletePage,
} from '../../lib/monitorApi';

export default function ConfigManager() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUni, setExpandedUni] = useState(null);
  const [pages, setPages] = useState({});
  const [showAddUni, setShowAddUni] = useState(false);
  const [showAddPage, setShowAddPage] = useState(null);
  const [newUni, setNewUni] = useState({ name: '', country: '', is_active: true });
  const [newPage, setNewPage] = useState({ url: '', page_type: 'admission', degree_level: 'all' });

  useEffect(() => {
    loadUniversities();
  }, []);

  async function loadUniversities() {
    try {
      setLoading(true);
      const data = await getMonitorUniversities();
      setUniversities(data || []);
    } catch (err) {
      console.error('加载大学列表失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUniversity(e) {
    e.preventDefault();
    if (!newUni.name.trim()) return;
    try {
      await addUniversity(newUni);
      setNewUni({ name: '', country: '', is_active: true });
      setShowAddUni(false);
      loadUniversities();
    } catch (err) {
      console.error('添加大学失败:', err);
      alert('添加失败');
    }
  }

  async function handleToggleActive(uni) {
    try {
      await updateUniversity(uni.id, { is_active: !uni.is_active });
      loadUniversities();
    } catch (err) {
      console.error('更新失败:', err);
    }
  }

  async function handleDeleteUniversity(id) {
    if (!window.confirm('确定要删除这所大学及其所有监控页面吗？')) return;
    try {
      await deleteUniversity(id);
      if (expandedUni === id) setExpandedUni(null);
      loadUniversities();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  }

  async function handleExpandUniversity(uniId) {
    if (expandedUni === uniId) {
      setExpandedUni(null);
      return;
    }
    setExpandedUni(uniId);
    try {
      const data = await getUniversityPages(uniId);
      setPages(prev => ({ ...prev, [uniId]: data || [] }));
    } catch (err) {
      console.error('加载页面列表失败:', err);
    }
  }

  async function handleAddPage(uniId) {
    if (!newPage.url.trim()) return;
    try {
      await addPage({ ...newPage, university_id: uniId, is_active: true });
      setNewPage({ url: '', page_type: 'admission', degree_level: 'all' });
      setShowAddPage(null);
      const data = await getUniversityPages(uniId);
      setPages(prev => ({ ...prev, [uniId]: data || [] }));
    } catch (err) {
      console.error('添加页面失败:', err);
      alert('添加失败');
    }
  }

  async function handleDeletePage(pageId, uniId) {
    if (!window.confirm('确定要删除这个监控页面吗？')) return;
    try {
      await deletePage(pageId);
      const data = await getUniversityPages(uniId);
      setPages(prev => ({ ...prev, [uniId]: data || [] }));
    } catch (err) {
      console.error('删除失败:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">配置管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理监控的大学和页面列表</p>
        </div>
        <button
          onClick={() => setShowAddUni(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加大学
        </button>
      </div>

      {/* 添加大学表单 */}
      {showAddUni && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">添加监控大学</h3>
          <form onSubmit={handleAddUniversity} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">大学名称 *</label>
              <input
                type="text"
                value={newUni.name}
                onChange={(e) => setNewUni({ ...newUni, name: e.target.value })}
                placeholder="例如: MIT"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">国家</label>
              <input
                type="text"
                value={newUni.country}
                onChange={(e) => setNewUni({ ...newUni, country: e.target.value })}
                placeholder="例如: USA"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-36 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              确认添加
            </button>
            <button
              type="button"
              onClick={() => setShowAddUni(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </form>
        </div>
      )}

      {/* 大学列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : universities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">暂无监控大学，点击上方按钮添加</p>
          </div>
        ) : (
          universities.map((uni) => (
            <div key={uni.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 大学标题行 */}
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={() => handleExpandUniversity(uni.id)}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedUni === uni.id ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{uni.name}</span>
                    {uni.country && (
                      <span className="ml-2 text-xs text-gray-400">{uni.country}</span>
                    )}
                  </div>
                </button>
                <div className="flex items-center space-x-3">
                  {/* 启用/禁用开关 */}
                  <button
                    onClick={() => handleToggleActive(uni)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      uni.is_active ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        uni.is_active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteUniversity(uni.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 展开的页面列表 */}
              {expandedUni === uni.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      监控页面 ({(pages[uni.id] || []).length})
                    </h4>
                    <button
                      onClick={() => setShowAddPage(uni.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + 添加页面
                    </button>
                  </div>

                  {/* 添加页面表单 */}
                  {showAddPage === uni.id && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAddPage(uni.id); }}
                      className="flex flex-wrap gap-2 mb-3 p-3 bg-white rounded-lg border border-indigo-100"
                    >
                      <input
                        type="url"
                        value={newPage.url}
                        onChange={(e) => setNewPage({ ...newPage, url: e.target.value })}
                        placeholder="页面 URL"
                        className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <select
                        value={newPage.page_type}
                        onChange={(e) => setNewPage({ ...newPage, page_type: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded text-sm"
                      >
                        <option value="admission">招生</option>
                        <option value="enrollment">录取</option>
                        <option value="deadline">截止</option>
                        <option value="scholarship">奖学金</option>
                      </select>
                      <select
                        value={newPage.degree_level}
                        onChange={(e) => setNewPage({ ...newPage, degree_level: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded text-sm"
                      >
                        <option value="all">全部</option>
                        <option value="undergraduate">本科</option>
                        <option value="master">硕士</option>
                        <option value="phd">博士</option>
                      </select>
                      <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                        添加
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPage(null)}
                        className="px-3 py-1.5 border border-gray-200 text-sm rounded hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </form>
                  )}

                  {/* 页面列表 */}
                  <div className="space-y-2">
                    {(pages[uni.id] || []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{p.url}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-xs text-gray-400">{p.page_type}</span>
                            <span className="text-xs text-gray-400">{p.degree_level}</span>
                            {p.last_checked_at && (
                              <span className="text-xs text-gray-400">
                                最后检查: {new Date(p.last_checked_at).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePage(p.id, uni.id)}
                          className="text-gray-400 hover:text-red-600 ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {(pages[uni.id] || []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-3">暂无监控页面</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
