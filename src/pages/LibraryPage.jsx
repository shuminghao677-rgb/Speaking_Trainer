import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { categorizeItemsCoarse, categorizeItemsWithAI } from '../utils/deepseek';

const PROMPT_VERSION = 'v4_ultimate';

export default function LibraryPage({ title = 'Library', type = 'expression', colorClass = '' }) {
  // 💡 注意：这里已经删除了 resetAllCategories
  const { scenes, items, updateCategories, deleteItem, apiKey, setApiKey } = useAppContext();
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
    } catch {
      return {};
    }
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
    if (unCategorizedItems.length === 0) {
      alert('太棒了！当前库所有内容都已分配了大类！');
      return;
    }
    const currentKey = requireApiKey();
    if (!currentKey) return;

    const existingCategories = [...new Set(libraryItems.map((i) => i.category).filter((c) => c && c !== 'Uncategorized'))];

    setLoading(true);
    try {
      const categoryMap = await categorizeItemsCoarse(unCategorizedItems, existingCategories, currentKey);
      updateCategories(categoryMap);
    } catch (error) {
      console.error('粗分失败：', error);
      alert(`分配大类失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDiveCategory = async (category, catItems) => {
    const currentKey = requireApiKey();
    if (!currentKey) return;

    setLoading(true);
    try {
      const detailMap = await categorizeItemsWithAI(catItems, currentKey);
      updateCategories(detailMap);
      setProcessedGroups(prev => ({ ...prev, [category]: true }));
    } catch (e) {
      console.error('深度解析失败：', e);
      alert(`解析失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ====== 渲染核心区 ======

  // 1. 渲染意群切片 (Template 专属交替底色)
  const renderChunks = (chunksStr) => {
    if (!chunksStr) return null;
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {chunksStr.split('/').map((chunk, idx) => (
          <span 
            key={idx} 
            className={`px-2.5 py-1 rounded-md text-base font-bold shadow-sm border ${
              idx % 2 === 0 
                ? 'bg-blue-50 text-blue-900 border-blue-100' 
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            {chunk.trim()}
          </span>
        ))}
      </div>
    );
  };

  // 2. 渲染意图拆解标签 (Expression 专属)
  const renderIntents = (phrases) => {
    if (!phrases || phrases.length === 0) return null;
    return (
      <div className="mt-3 flex flex-col gap-2">
        {phrases.map((phraseLine, i) => {
          const match = phraseLine.match(/^\[(.*?)\](.*)/);
          if (match) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded shadow-sm whitespace-nowrap font-medium text-xs">
                  {match[1].trim()}
                </span>
                <span className="text-slate-700 mt-0.5 font-medium">{match[2].trim()}</span>
              </div>
            );
          }
          return <div key={i} className="text-sm text-slate-600 before:content-['•'] before:mr-2">{phraseLine}</div>;
        })}
      </div>
    );
  };

  // 3. 渲染带语境辨析的同义词 (Synonym 专属)
  const renderSynonyms = (synonyms) => {
    if (!synonyms || synonyms.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {synonyms.map((syn, i) => {
          const match = syn.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return (
              <span key={i} className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm shadow-sm flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-default">
                <span className="font-bold">{match[1].trim()}</span>
                <span className="text-xs text-amber-700 bg-amber-200/50 px-1.5 py-0.5 rounded-md">{match[2].trim()}</span>
              </span>
            );
          }
          return (
            <span key={i} className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm shadow-sm font-bold hover:bg-amber-100 transition-colors cursor-default">
              {syn}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h2 className={`text-2xl font-bold ${colorClass}`}>{title}</h2>
        <div className="flex gap-3">
          {/* 洗牌按钮已彻底删除，清爽！ */}
          <button
            onClick={handleCoarseCategorize}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? '🧠 AI 处理中...' : '✨ 仅分配大类 (防截断)'}
          </button>
        </div>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-400 py-20">当前库为空，快去添加语料吧！</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, catItems]) => {
            const isProcessed = !!(processedGroups && processedGroups[category]);
            const catZh = catItems.find(i => i.categoryZh)?.categoryZh || '';

            return (
              <div key={category} className="mb-8">
                <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3 flex items-center gap-2">
                    {category === 'Uncategorized' ? '📦 未分类待处理' : category}
                    {catZh && <span className="text-gray-500 font-normal text-sm">{catZh}</span>}
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{catItems.length}</span>
                  </h3>

                  {category !== 'Uncategorized' && !isProcessed && (
                    <button
                      onClick={() => handleDeepDiveCategory(category, catItems)}
                      disabled={loading}
                      className="text-sm font-medium bg-white text-blue-600 px-4 py-1.5 rounded-md border border-blue-200 hover:bg-blue-50 hover:shadow active:scale-95 transition-all"
                    >
                      {loading ? '处理中...' : '✨ 深度解析本组 (拆解+造句)'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {catItems.map((item) => {
                    const displayWord = item.word || item.content || item.baseWord || '';
                    const displayZh = item.chinese || item.zh || item.baseWordZh || '';
                    const displaySynonyms = item.synonyms?.length ? item.synonyms : (item.relatedWords?.map(r=>r.word) || []);
                    
                    return (
                      <div key={item.id} className="p-5 bg-white border border-gray-200 rounded-xl group relative transition-all hover:shadow-lg hover:border-blue-300">
                        {/* 原场景标签作为小小的溯源参考 */}
                        <div className="mb-2">
                           <div className="inline-block text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                             Source: {getSceneName(item.sceneId)}
                           </div>
                        </div>

                        <div className="pr-12">
                          {/* 渲染主词/意群 */}
                          {item.type === 'template' && item.chunks ? (
                            renderChunks(item.chunks)
                          ) : (
                            <div className="font-bold text-xl text-slate-800 mb-1">{displayWord}</div>
                          )}
                          
                          {/* 中文释义 */}
                          {displayZh && <div className="text-sm text-slate-500 font-medium">{displayZh}</div>}
                          
                          {/* 意图拆解与同义词渲染 */}
                          {item.type === 'expression' && renderIntents(item.relatedPhrases)}
                          {item.type === 'synonym' && renderSynonyms(displaySynonyms)}
                        </div>

                        {/* 展开区域：神仙例句与同构平替 */}
                        {(item.sentence || item.relatedExpressions?.length > 0) && (
                          <div className="mt-5 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="text-sm text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                            >
                              {expandedItems[item.id] ? '🔼 收起深度解析' : '📖 展开深度解析与神仙造句'}
                            </button>

                            {expandedItems[item.id] && (
                              <div className="mt-4 space-y-4 animate-fade-in-up">
                                
                                {/* 融合神句 */}
                                {item.sentence && (
                                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                      <span>🌟</span> Contextual Weaving
                                    </div>
                                    <div className="text-slate-800 font-medium leading-relaxed italic">"{item.sentence}"</div>
                                    {item.sentenceZh && <div className="text-sm text-slate-500 mt-2">{item.sentenceZh}</div>}
                                  </div>
                                )}
                                
                                {/* 句型平替 */}
                                {item.type === 'template' && item.relatedExpressions?.length > 0 && (
                                  <div>
                                    <div className="text-xs font-bold text-emerald-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                      <span>🔄</span> Parallel Structure (同构平替)
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {item.relatedExpressions.map((expr, i) => (
                                        <div key={i} className="text-sm text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100 font-medium">
                                          {expr}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="absolute top-4 right-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 bg-white px-2 py-1 rounded shadow-sm border border-red-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          删除
                        </button>
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