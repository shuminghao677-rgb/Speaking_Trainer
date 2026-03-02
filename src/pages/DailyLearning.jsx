import React, { useState } from 'react';
import { useAppContext } from '../AppContext';

export default function DailyLearning() {
  const [scene, setScene] = useState('');
  const [content, setContent] = useState('');
  const { items, addItem, deleteItem } = useAppContext();

  const today = new Date().toISOString().split('T')[0];
  const todayItems = items.filter(item => item.date === today);

  const handleSave = (type) => {
    if (!scene.trim() || !content.trim()) {
      alert('请填写场景和内容！');
      return;
    }
    addItem(scene.trim(), content.trim(), type);
    setContent(''); 
  };

  const getTypeName = (type) => {
    const map = { template: '句型模板', expression: '日常表达', synonym: '同义词' };
    return map[type];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* 顶部输入区 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 shrink-0">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">今天学到了什么？</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">场景 (Scene)</label>
            <input 
              type="text" 
              placeholder="例如：点餐、购物、面试..."
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">内容 (Content)</label>
            <textarea 
              rows="3"
              placeholder="输入你想记录的英文句子或单词..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button onClick={() => handleSave('template')} className="flex-1 bg-indigo-50 text-indigo-600 font-medium py-2 rounded-lg hover:bg-indigo-100">
              存入句型模板
            </button>
            <button onClick={() => handleSave('expression')} className="flex-1 bg-emerald-50 text-emerald-600 font-medium py-2 rounded-lg hover:bg-emerald-100">
              存入日常表达
            </button>
            <button onClick={() => handleSave('synonym')} className="flex-1 bg-amber-50 text-amber-600 font-medium py-2 rounded-lg hover:bg-amber-100">
              存入同义词库
            </button>
          </div>
        </div>
      </div>

      {/* 下方展示区 */}
      <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-800 mb-4">今日记录 ({todayItems.length})</h3>
        {todayItems.length === 0 ? (
          <div className="text-center text-gray-400 py-10">今天还没有记录哦，开始学习吧！</div>
        ) : (
          <div className="space-y-3">
            {todayItems.map(item => (
              <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">{item.scene}</span>
                    <span className="text-xs text-blue-500 font-medium">{getTypeName(item.type)}</span>
                  </div>
                  <p className="text-gray-800 font-medium">{item.content}</p>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}