/**
 * 搜索关键词管理页面
 * 管理用于信息过滤和提取的搜索关键词
 */

import React, { useState, useEffect } from 'react';
import { getKeywords, addKeyword, updateKeyword, deleteKeyword } from '../../lib/monitorApi';

const CATEGORY_MAP = {
  general: { label: '通用', color: 'bg-gray-100 text-gray-700' },
  admission: { label: '招生', color: 'bg-blue-50 text-blue-700' },
  enrollment: { label: '录取', color: 'bg-green-50 text-green-700' },
  deadline: { label: '截止', color: 'bg-amber-50 text-amber-700' },
  scholarship: { label: '奖学金', color: 'bg-purple-50 text-purple-700' },
};

const LANGUAGE_MAP = {
  en: '英文',
  zh: '中文',
  other: '其他',
};

export default function KeywordManager() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    category: 'general',
    language: 'en',
    weight: 1.0,
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');

  useEffect(() => {
    loadKeywords();
  }, []);

  async function loadKeywords() {
    try {
      setLoading(true);
      const data = await getKeywords();
      setKeywords(data || []);
    } catch (err) {
      console.error('加载关键词失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newKeyword.keyword.trim()) return;
    try {
      await addKeyword({ ...newKeyword, is_active: true });
      setNewKeyword({ keyword: '', category: 'general', language: 'en', weight: 1.0 });
      setShowAdd(false);
      loadKeywords();
    } catch (err) {
      console.error('添加失败:', err);
      alert('添加失败');
    }
  }

  async function handleUpdate(id) {
    try {
      await updateKeyword(id, editForm);
      setEditingId(null);
      loadKeywords();
    } catch (err) {
      console.error('更新失败:', err);
      alert('更新失败');
    }
  }

  async function handleToggleActive(kw) {
    try {
      await updateKeyword(kw.id, { is_active: !kw.is_active });
      loadKeywords();
    } catch (err) {
      console.error('更新失败:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('确定要删除这个关键词吗？')) return;
    try {
      await deleteKeyword(id);
      loadKeywords();
    } catch (err) {
      console.error('删除失败:', err);
    }
  }

  // 筛选
  const filteredKeywords = keywords.filter(kw => {
    if (filterCategory && kw.category !== filterCategory) return false;
    if (filterLanguage && kw.language !== filterLanguage) return false;
    return true;
  });

  // 按分类分组
  const grouped = {};
  filteredKeywords.forEach(kw => {
    const cat = kw.category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(kw);
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">关键词管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理用于信息提取的搜索关键词</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加关键词
        </button>
      </div>

      {/* 添加关键词表单 */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">添加关键词</h3>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关键词 *</label>
              <input
                type="text"
                value={newKeyword.keyword}
                onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                placeholder="例如: admission"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={newKeyword.category}
                onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
              <select
                value={newKeyword.language}
                onChange={(e) => setNewKeyword({ ...newKeyword, language: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">英文</option>
                <option value="zh">中文</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">权重</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={newKeyword.weight}
                onChange={(e) => setNewKeyword({ ...newKeyword, weight: parseFloat(e.target.value) })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-20 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              确认添加
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </form>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">全部分类</option>
          {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">全部语言</option>
          <option value="en">英文</option>
          <option value="zh">中文</option>
          <option value="other">其他</option>
        </select>
        <span className="text-sm text-gray-400 self-center">
          共 {filteredKeywords.length} 个关键词
        </span>
      </div>

      {/* 关键词列表（按分类分组） */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        Object.entries(grouped).map(([category, kws]) => {
          const catInfo = CATEGORY_MAP[category] || CATEGORY_MAP.general;
          return (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${catInfo.color}`}>
                  {catInfo.label}
                </span>
                <span className="ml-2 text-xs text-gray-400">{kws.length} 个关键词</span>
              </div>
              <div className="divide-y divide-gray-50">
                {kws.map((kw) => (
                  <div key={kw.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    {editingId === kw.id ? (
                      /* 编辑模式 */
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          defaultValue={kw.keyword}
                          onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded text-sm w-32"
                        />
                        <select
                          defaultValue={kw.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded text-sm"
                        >
                          {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={kw.weight}
                          onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                          className="px-2 py-1 border border-gray-200 rounded text-sm w-16"
                        />
                        <button
                          onClick={() => handleUpdate(kw.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      /* 显示模式 */
                      <>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{kw.keyword}</span>
                          <span className="text-xs text-gray-400">{LANGUAGE_MAP[kw.language] || kw.language}</span>
                          <span className="text-xs text-gray-400">权重: {kw.weight}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleActive(kw)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              kw.is_active ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                kw.is_active ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => { setEditingId(kw.id); setEditForm({ keyword: kw.keyword, category: kw.category, weight: kw.weight }); }}
                            className="text-gray-400 hover:text-indigo-600"
                            title="编辑"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(kw.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="删除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {filteredKeywords.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="mt-2 text-sm text-gray-400">暂无关键词</p>
        </div>
      )}
    </div>
  );
}
