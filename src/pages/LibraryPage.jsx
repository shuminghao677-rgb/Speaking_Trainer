// src/pages/LibraryPage.jsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { categorizeItemsCoarse, categorizeItemsWithAI } from '../utils/deepseek';

const PROMPT_VERSION = 'v11_subcategory_clean_ui'; // 更新版本号

export default function LibraryPage({ title = 'Library', type = 'expression', colorClass = '' }) {
  const { scenes, items, updateCategories, deleteItem, apiKey, setApiKey, resetItemsCategory } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [processedGroups, setProcessedGroups] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('processedGroupsVersion');
      if (savedVersion !== PROMPT_VERSION) {
        localStorage.setItem('processedGroups', JSON.stringify({}));
        localStorage.setItem('processedGroupsVersion', PROMPT_VERSION);
        return {};
      }
      return JSON.parse(localStorage.getItem('processedGroups') || '{}');
    } catch { return {}; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('processedGroups', JSON.stringify(processedGroups || {}));
      localStorage.setItem('processedGroupsVersion', PROMPT_VERSION);
    } catch (e) {}
  }, [processedGroups]);

  const libraryItems = Array.isArray(items) ? items.filter((item) => item.type === type) : [];

  const groupedItems = libraryItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const getSceneName = (sceneId) => {
    const s = (scenes || []).find((s) => s.id === sceneId);
    return s ? s.name : '未知场景';
  };

  const toggleExpand = (id) => setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const requireApiKey = () => {
    let currentKey = apiKey;
    if (!currentKey) {
      currentKey = window.prompt('请输入你的 Deepseek API Key:');
      if (currentKey) setApiKey(currentKey);
    }
    return currentKey;
  };

  const handleCoarseCategorize = async () => {
    const unCategorizedItems = libraryItems.filter((item) => !item.category || item.category === 'Uncategorized');
    if (unCategorizedItems.length === 0) return alert('当前库所有内容都已分配了大类！');
    const currentKey = requireApiKey();
    if (!currentKey) return;
    const existingCategories = [...new Set(libraryItems.map((i) => i.category).filter((c) => c && c !== 'Uncategorized'))];

    setLoading(true);
    try {
      const categoryMap = await categorizeItemsCoarse(unCategorizedItems, existingCategories, currentKey);
      updateCategories(categoryMap);
    } catch (error) { alert(`分配大类失败: ${error.message}`); } 
    finally { setLoading(false); }
  };

  const handleDeepDiveCategory = async (category, catItems) => {
    const currentKey = requireApiKey();
    if (!currentKey) return;

    setLoading(true);
    try {
      const detailMap = await categorizeItemsWithAI(catItems, currentKey);
      updateCategories(detailMap);
      setProcessedGroups(prev => ({ ...prev, [category]: true }));
    } catch (e) { alert(`解析失败: ${e.message}`); } 
    finally { setLoading(false); }
  };

  const renderCompactList = (dataList) => {
    if (!dataList || dataList.length === 0) return null;
    return (
      <div className="mt-2 space-y-1.5">
        {dataList.map((line, i) => {
          const match = line.match(/^\[(.*?)\]\s*(.*)/);
          if (match) {
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start text-[13px] leading-relaxed bg-sky-50/60 px-2 py-1.5 rounded-sm border border-sky-100/60">
                <span className="shrink-0 text-sky-700 font-bold mr-2 mb-1 sm:mb-0">
                  [{match[1].trim()}]
                </span>
                <span className="flex flex-wrap items-center">
                  {match[2].split(',').map((chunk, idx, arr) => {
                    const wordMatch = chunk.match(/(.*?)\((.*?)\)/);
                    return (
                      <span key={idx} className="mr-1.5">
                        <span className="text-slate-900 font-medium">{wordMatch ? wordMatch[1].trim() : chunk.trim()}</span>
                        {wordMatch && <span className="text-slate-500 text-[11px] ml-1">({wordMatch[2].trim()})</span>}
                        {idx < arr.length - 1 && <span className="text-slate-300 ml-1">,</span>}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          }
          return <div key={i} className="text-[13px] text-slate-600 before:content-['•'] before:mr-1.5">{line}</div>;
        })}
      </div>
    );
  };

  const renderChunks = (chunksStr) => {
    if (!chunksStr) return null;
    return (
      <div className="flex flex-wrap gap-1 mb-1">
        {chunksStr.split('/').map((chunk, idx) => (
          <span key={idx} className={`px-2 py-0.5 rounded-sm text-sm font-bold shadow-sm border ${idx % 2 === 0 ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
            {chunk.trim()}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h2 className={`text-2xl font-bold ${colorClass}`}>{title}</h2>
        <div className="flex gap-3">
          <button onClick={handleCoarseCategorize} disabled={loading} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm">
            {loading ? '🧠 AI 处理中...' : '✨ 仅分配大类 (防截断)'}
          </button>
        </div>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-400 py-20">当前库为空，快去添加语料吧！</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, catItems]) => {
            
            // 按 subCategory 进行二级分组
            const subGroupedItems = catItems.reduce((acc, item) => {
              const subCat = item.subCategory ? item.subCategory : '📌 待解析/其他';
              if (!acc[subCat]) acc[subCat] = [];
              acc[subCat].push(item);
              return acc;
            }, {});

            return (
              <div key={category} className="mb-8">
                {/* 大类头部 */}
                <div className="flex justify-between items-center mb-5 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-slate-700 pl-3 flex items-center gap-2">
                      {category === 'Uncategorized' ? '📦 未分类待处理' : category}
                      <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">{catItems.length}</span>
                    </h3>
                    {category !== 'Uncategorized' && (
                      <button onClick={() => resetItemsCategory(catItems.map(i => i.id))} className="text-[12px] text-slate-400 hover:text-red-500 transition-colors ml-2">
                        ↺ 重置此组测试
                      </button>
                    )}
                  </div>
                  {category !== 'Uncategorized' && (
                    <button onClick={() => handleDeepDiveCategory(category, catItems)} disabled={loading} className="text-xs font-bold bg-white text-blue-600 px-4 py-2 rounded-md border border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
                      {loading ? '处理中...' : '✨ 深度解析本组'}
                    </button>
                  )}
                </div>

                {/* 🌟 二级分组：清爽色系卡片式渲染 */}
                <div className="space-y-5">
                  {Object.entries(subGroupedItems)
                    .sort(([a], [b]) => {
                      if (a === '📌 待解析/其他') return 1;
                      if (b === '📌 待解析/其他') return -1;
                      return 0;
                    })
                    .map(([subCat, subItems]) => {
                      const isParsed = subCat !== '📌 待解析/其他';
                      
                      // 🌟 去掉红底，改为清爽的莫兰迪灰白/淡灰蓝色包裹，依然保留高级的分界感
                      const wrapperClass = isParsed 
                        ? "bg-slate-50/60 border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm" 
                        : "pt-2";

                      return (
                        <div key={subCat} className={wrapperClass}>
                          
                          {/* 霸气大标题 */}
                          {isParsed && (
                            <div className="flex items-center gap-4 mb-5 pl-1">
                              <h4 className="text-[17px] font-black text-slate-800 tracking-wide">
                                {subCat}
                              </h4>
                              <div className="h-[2px] bg-slate-200/80 flex-1 rounded-full"></div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {subItems.map((item) => {
                              const displayData = item.type === 'expression' ? item.relatedPhrases : (item.synonyms?.length ? item.synonyms : []);
                              
                              const borderClass = isParsed ? "border-slate-200/60" : "border-slate-100";

                              return (
                                <div key={item.id} className={`py-3 border-b ${borderClass} group relative`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-baseline gap-2">
                                      {item.type === 'template' && item.chunks ? renderChunks(item.chunks) : <span className="font-bold text-base text-slate-800">{item.word || item.content || item.baseWord}</span>}
                                      <span className="text-xs text-slate-400 font-medium">{item.chinese || item.zh || item.baseWordZh}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-300 uppercase tracking-wider hidden group-hover:block">{getSceneName(item.sceneId)}</div>
                                  </div>

                                  {item.type === 'template' && item.grammarNote && (
                                    <div className="text-[12px] text-indigo-600 bg-white/80 px-2 py-1 rounded-sm border border-indigo-100 mb-2 mt-1 flex items-start gap-1">
                                      <span className="mt-[1px]">💡</span><span>{item.grammarNote}</span>
                                    </div>
                                  )}

                                  {renderCompactList(displayData)}

                                  {(item.sentence || item.relatedExpressions?.length > 0) && (
                                    <div className="mt-2.5">
                                      <button onClick={() => toggleExpand(item.id)} className="text-[11px] text-blue-500 font-medium hover:text-blue-700">
                                        {expandedItems[item.id] ? '🔼 收起' : '📖 语境造句/平替'}
                                      </button>
                                      {expandedItems[item.id] && (
                                        <div className="mt-2 space-y-2">
                                          {item.sentence && (
                                            <div className="bg-white/80 p-2 rounded-sm border-l-2 border-blue-300 shadow-sm">
                                              <div className="text-[12px] text-slate-700 italic leading-snug">"{item.sentence}"</div>
                                              {item.sentenceZh && <div className="text-[10px] text-slate-400 mt-1">{item.sentenceZh}</div>}
                                            </div>
                                          )}
                                          {item.type === 'template' && item.relatedExpressions?.length > 0 && (
                                            <div className="flex flex-col gap-1.5 mt-2">
                                              {item.relatedExpressions.map((expr, i) => {
                                                const match = expr.match(/(.*?)\((.*?)\)/);
                                                return (
                                                  <div key={i} className="text-[12px] text-emerald-800 bg-white/90 px-2 py-1.5 rounded-sm border border-emerald-100 flex flex-col shadow-sm">
                                                    <span className="font-medium">🔄 {match ? match[1].trim() : expr}</span>
                                                    {match && <span className="text-[11px] text-emerald-600/80 ml-5 mt-0.5">{match[2].trim()}</span>}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <button onClick={() => deleteItem(item.id)} className="absolute top-2 right-0 text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all bg-white/90 rounded px-1">删除</button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}