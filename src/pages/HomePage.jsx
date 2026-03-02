import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

export default function HomePage() {
  const { scenes, addScene, deleteScene } = useAppContext();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

  const handleCreate = () => {
    if (!name.trim()) return alert('请输入场景名称！');
    addScene(name.trim(), date);
    setName('');
  };

  const handleExport = () => {
    const data = {
      scenes: localStorage.getItem('learning_scenes'),
      items: localStorage.getItem('learning_items'),
      apiKey: localStorage.getItem('deepseek_api_key')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SpeakingTrainer_Backup.json';
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.scenes) localStorage.setItem('learning_scenes', data.scenes);
        if (data.items) localStorage.setItem('learning_items', data.items);
        if (data.apiKey) localStorage.setItem('deepseek_api_key', data.apiKey);
        alert('🎉 数据导入成功！网页即将刷新。');
        window.location.reload();
      } catch (err) {
        alert('导入失败，文件格式可能不正确。');
      }
    };
    reader.readAsText(file);
  };

  // ⚠️ 核心修改：二次确认弹窗
  const confirmDeleteScene = (e, sceneId) => {
    e.stopPropagation(); // 阻止点击卡片跳转到详情页
    const isConfirmed = window.confirm("⚠️ 危险操作！\n\n确定要删除这个场景吗？\n该场景下的【所有词汇和句子】都会被永久删除！");
    if (isConfirmed) {
      deleteScene(sceneId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">新建学习场景</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="text" 
            placeholder="输入场景名称，例如：星巴克点餐、海关对话..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            创建场景
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">我的场景库 ({scenes.length})</h3>
        <div className="space-x-4">
          <button onClick={handleExport} className="text-sm text-gray-500 hover:text-blue-600 transition font-medium">导出备份</button>
          <button onClick={() => fileInputRef.current.click()} className="text-sm text-gray-500 hover:text-blue-600 transition font-medium">导入数据</button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {scenes.map(scene => (
          <div key={scene.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition group relative cursor-pointer" onClick={() => navigate(`/scene/${scene.id}`)}>
            <div className="text-sm text-gray-400 mb-2">{scene.date}</div>
            <h4 className="text-lg font-bold text-gray-800">{scene.name}</h4>
            <button 
              onClick={(e) => confirmDeleteScene(e, scene.id)}
              className="absolute top-4 right-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition"
            >
              删除
            </button>
          </div>
        ))}
        {scenes.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">还没有场景，赶快创建一个吧！</div>}
      </div>
    </div>
  );
}