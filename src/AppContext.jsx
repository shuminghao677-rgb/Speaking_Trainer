import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [scenes, setScenes] = useLocalStorage('learning_scenes', []);
  const [items, setItems] = useLocalStorage('learning_items', []);
  const [apiKey, setApiKey] = useLocalStorage('deepseek_api_key', '');
  
  // 底部漂浮提示框的状态
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  // 新建/删除场景
  const addScene = (name, date) => {
    const newScene = { id: Date.now().toString(), name, date };
    setScenes([newScene, ...scenes]);
  };
  const deleteScene = (id) => {
    setScenes(scenes.filter(s => s.id !== id));
    setItems(items.filter(i => i.sceneId !== id)); // 联动删除
  };

  // 添加内容
  const addItem = (sceneId, type, data) => {
    const newItem = {
      id: Date.now().toString(),
      sceneId,
      type,
      category: 'Uncategorized',
      ...data
    };
    setItems([newItem, ...items]);
  };

  const addRelatedWord = (itemId, wordObj) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId && item.type === 'synonym') {
        return { ...item, relatedWords: [...(item.relatedWords||[]), wordObj] };
      }
      return item;
    }));
  };

  // 🗑️ 【核心黑科技：用 useRef 记录被删除的条目】
  const deletedItemsRef = useRef([]);

  const deleteItem = (id) => {
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete) {
      deletedItemsRef.current.push(itemToDelete); // 存入“垃圾桶”
      showToast('已删除，按 Cmd + Z (或 Ctrl + Z) 撤销 ↩️');
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateCategories = (categoryMap) => {
    setItems(prevItems => 
      prevItems.map(item => 
        categoryMap[item.id] ? { ...item, category: categoryMap[item.id] } : item
      )
    );
  };

  // ⌨️ 【监听全局键盘事件：Cmd+Z / Ctrl+Z】
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        // 如果用户正在输入框里打字，让他用系统自带的撤销打字，不要触发恢复条目
        const activeTag = document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        // 如果不在输入框里，且垃圾桶里有东西，执行恢复！
        if (deletedItemsRef.current.length > 0) {
          e.preventDefault(); // 阻止浏览器默认行为
          const lastDeleted = deletedItemsRef.current.pop();
          setItems(prev => [lastDeleted, ...prev]);
          showToast('✨ 撤销成功！已恢复刚才删除的内容。');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setItems]);

  return (
    <AppContext.Provider value={{ 
      scenes, addScene, deleteScene, 
      items, addItem, deleteItem, addRelatedWord, updateCategories,
      apiKey, setApiKey 
    }}>
      {children}
      
      {/* 漂浮提示框 UI */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-medium animate-bounce-in">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);