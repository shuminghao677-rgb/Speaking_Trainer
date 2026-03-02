import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { categorizeItemsWithAI } from '../utils/deepseek';

export default function LibraryPage({ title, type, colorClass }) {
  const { scenes, items, updateCategories, deleteItem, apiKey, setApiKey } = useAppContext();
  const [loading, setLoading] = useState(false);

  const libraryItems = items.filter(item => item.type === type);

  const groupedItems = libraryItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const getSceneName = (sceneId) => {
    const s = scenes.find(s => s.id === sceneId);
    return s ? s.name : '未知场景';
  };

  const handleAICategorize = async () => {
    if (libraryItems.length === 0) return alert('当前库没有内容需要分类。');
    let currentKey = apiKey;
    if (!currentKey) {
      currentKey = prompt('请输入你的 Deepseek API Key:');
      if (currentKey) setApiKey(currentKey);
      else return;
    }
    setLoading(true);
    try {
      const categoryMap = await categorizeItemsWithAI(libraryItems, currentKey);
      updateCategories(categoryMap);
      alert('AI 自动归类完成！');
    } catch (error) {
      alert(`分类失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h2 className={`text-2xl font-bold ${colorClass}`}>{title}</h2>
        <button onClick={handleAICategorize} disabled={loading} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50">
          {loading ? 'AI 分析中...' : 'AI 自动分类'}
        </button>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-400 py-20">当前库为空。</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-3 border-l-4 border-blue-400 pl-3">
                {category === 'Uncategorized' ? '未分类' : category.toUpperCase()}
                <span className="text-sm font-normal text-gray-400 ml-2">({catItems.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catItems.map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg group relative">
                    <span className="absolute top-4 right-4 text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">{getSceneName(item.sceneId)}</span>
                    
                    {type === 'synonym' ? (
                      <div className="pr-16">
                        <div className="font-bold text-gray-800 mb-2">
                          {item.baseWord} {item.baseWordZh && <span className="text-sm font-normal text-gray-500">({item.baseWordZh})</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(item.relatedWords || []).map((rw, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded">
                              {rw.word} {rw.zh && `(${rw.zh})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pr-16">
                        <p className="text-gray-800 font-medium">{item.content}</p>
                        {item.zh && <p className="text-sm text-gray-500 mt-1">{item.zh}</p>}
                      </div>
                    )}
                    
                    <button onClick={() => deleteItem(item.id)} className="absolute bottom-4 right-4 text-xs text-red-400 opacity-0 group-hover:opacity-100">删除</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}