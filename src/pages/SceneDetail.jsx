import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

export default function SceneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scenes, items, addItem, deleteItem, addRelatedWord } = useAppContext();
  
  const scene = scenes.find(s => s.id === id);
  const sceneItems = items.filter(i => i.sceneId === id);

  const [templateStr, setTemplateStr] = useState('');
  const [templateZh, setTemplateZh] = useState('');
  
  const [expressionStr, setExpressionStr] = useState('');
  const [expressionZh, setExpressionZh] = useState('');
  
  const [baseWord, setBaseWord] = useState('');
  const [baseWordZh, setBaseWordZh] = useState('');
  
  const [newRelated, setNewRelated] = useState({});
  const [newRelatedZh, setNewRelatedZh] = useState({});

  if (!scene) return <div className="text-center py-20">场景不存在或已被删除</div>;

  const handleAddSimple = (type, content, zhContent, setContent, setZhContent) => {
    if (!content.trim()) return;
    addItem(id, type, { content: content.trim(), zh: zhContent.trim() });
    setContent('');
    setZhContent('');
  };

  const handleCreateSynonymGroup = () => {
    if (!baseWord.trim()) return;
    addItem(id, 'synonym', { 
      baseWord: baseWord.trim(), 
      baseWordZh: baseWordZh.trim(), 
      relatedWords: [] 
    });
    setBaseWord('');
    setBaseWordZh('');
  };

  const handleAddRelated = (itemId) => {
    const word = newRelated[itemId];
    const zh = newRelatedZh[itemId];
    if (!word || !word.trim()) return;
    
    addRelatedWord(itemId, { word: word.trim(), zh: zh ? zh.trim() : '' });
    
    setNewRelated({ ...newRelated, [itemId]: '' }); 
    setNewRelatedZh({ ...newRelatedZh, [itemId]: '' }); 
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button onClick={() => navigate('/')} className="text-blue-500 mb-4 hover:underline">← 返回主页</button>
      
      <div className="bg-slate-800 text-white p-6 rounded-xl mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{scene.name}</h1>
        <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{scene.date}</span>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-indigo-800 mb-4">句型模板 Templates</h2>
          <div className="flex gap-2 mb-4">
            <input value={templateStr} onChange={e => setTemplateStr(e.target.value)} placeholder="输入英文，如：I'd like to..." className="flex-[2] px-4 py-2 bg-gray-50 border rounded-lg" />
            <input value={templateZh} onChange={e => setTemplateZh(e.target.value)} placeholder="中文释义(选填)" className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
            <button onClick={() => handleAddSimple('template', templateStr, templateZh, setTemplateStr, setTemplateZh)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium">添加</button>
          </div>
          <div className="space-y-2">
            {sceneItems.filter(i => i.type === 'template').map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                <div>
                  <span className="font-medium text-gray-800">{item.content}</span>
                  {item.zh && <span className="ml-3 text-sm text-gray-400">({item.zh})</span>}
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 text-sm">删除</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">日常表达 Expressions</h2>
          <div className="flex gap-2 mb-4">
            <input value={expressionStr} onChange={e => setExpressionStr(e.target.value)} placeholder="输入英文，如：Keep the change." className="flex-[2] px-4 py-2 bg-gray-50 border rounded-lg" />
            <input value={expressionZh} onChange={e => setExpressionZh(e.target.value)} placeholder="中文释义(选填)" className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
            <button onClick={() => handleAddSimple('expression', expressionStr, expressionZh, setExpressionStr, setExpressionZh)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">添加</button>
          </div>
          <div className="space-y-2">
            {sceneItems.filter(i => i.type === 'expression').map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                <div>
                  <span className="font-medium text-gray-800">{item.content}</span>
                  {item.zh && <span className="ml-3 text-sm text-gray-400">({item.zh})</span>}
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 text-sm">删除</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-amber-800 mb-4">同义词 Synonyms</h2>
          <div className="flex gap-2 mb-6">
            <input value={baseWord} onChange={e => setBaseWord(e.target.value)} placeholder="输入基准词 (如：Happy)" className="flex-[2] px-4 py-2 bg-gray-50 border rounded-lg" />
            <input value={baseWordZh} onChange={e => setBaseWordZh(e.target.value)} placeholder="中文释义(选填)" className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg text-sm" />
            <button onClick={handleCreateSynonymGroup} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium whitespace-nowrap">新建词组</button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {sceneItems.filter(i => i.type === 'synonym').map(item => (
              <div key={item.id} className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg relative group">
                <button onClick={() => deleteItem(item.id)} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-sm">删除整组</button>
                <div className="font-bold text-lg text-amber-900 mb-3 border-b border-amber-200 pb-2 inline-block">
                  主词：{item.baseWord} {item.baseWordZh && <span className="text-sm font-normal text-amber-700 ml-1">({item.baseWordZh})</span>}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(item.relatedWords || []).map((rw, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-amber-200 text-amber-800 rounded-full text-sm shadow-sm">
                      {rw.word} {rw.zh && <span className="text-xs text-amber-600 ml-1">({rw.zh})</span>}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input 
                    value={newRelated[item.id] || ''} 
                    onChange={e => setNewRelated({...newRelated, [item.id]: e.target.value})} 
                    placeholder="关联英文..." 
                    className="flex-[2] px-3 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-amber-400"
                    onKeyDown={e => e.key === 'Enter' && handleAddRelated(item.id)}
                  />
                  <input 
                    value={newRelatedZh[item.id] || ''} 
                    onChange={e => setNewRelatedZh({...newRelatedZh, [item.id]: e.target.value})} 
                    placeholder="中文释义..." 
                    className="flex-1 px-3 py-1 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-amber-400"
                    onKeyDown={e => e.key === 'Enter' && handleAddRelated(item.id)}
                  />
                  <button onClick={() => handleAddRelated(item.id)} className="px-3 py-1 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600 whitespace-nowrap">
                    添加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}