import React, { createContext, useContext, useRef, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

const AppContext = createContext();

const extractIdFromKey = (key) => {
  if (!key) return null;
  const s = String(key);
  const idPattern = /ID\s*[:\-]?\s*(\d{6,})/i;
  const m1 = s.match(idPattern);
  if (m1 && m1[1]) return m1[1];
  const m2 = s.match(/(\d{6,})/);
  if (m2 && m2[1]) return m2[1];
  return null;
};

export const AppProvider = ({ children }) => {
  const [scenes, setScenes] = useLocalStorage('learning_scenes', []);
  const [items, setItems] = useLocalStorage('learning_items', []);
  const [apiKey, setApiKey] = useLocalStorage('deepseek_api_key', '');
  
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const addItem = (sceneId, type, data) => {
    setItems([{ id: Date.now().toString(), sceneId, type, category: 'Uncategorized', aiReviewed: false, ...data }, ...items]);
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    showToast('已删除 🗑️');
  };

  const addRelatedWord = (itemId, newWordObj) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, relatedWords: [...(item.relatedWords || []), newWordObj] };
      }
      return item;
    }));
  };

  const addScene = (name, date) => { 
    const newScene = { id: Date.now().toString(), name, date }; 
    setScenes([newScene, ...scenes]); 
  };
  
  const deleteScene = (id) => { 
    setScenes(scenes.filter(s => s.id !== id)); 
    setItems(items.filter(i => i.sceneId !== id)); 
  };

  const updateCategories = (aiResultMap) => {
    if (!aiResultMap || typeof aiResultMap !== 'object') return;

    const normMap = {};
    Object.keys(aiResultMap).forEach(k => {
      const v = aiResultMap[k];
      normMap[String(k)] = v;
      const ex = extractIdFromKey(k);
      if (ex) normMap[String(ex)] = v;
    });

    setItems(prevItems => {
      return (prevItems || []).map(item => {
        const aiData = normMap[String(item.id)];
        if (!aiData) return item;

        return {
          ...item,
          aiReviewed: true,
          category: aiData.category || item.category || 'Uncategorized',
          categoryZh: aiData.categoryZh || item.categoryZh || '',
          subCategory: aiData.subCategory || item.subCategory || '',
          subCategoryZh: aiData.subCategoryZh || item.subCategoryZh || '',
          word: aiData.word || item.word || item.content || item.baseWord || '',
          chinese: aiData.chinese || item.chinese || item.zh || item.baseWordZh || '',
          chunks: Array.isArray(aiData.chunks) ? aiData.chunks.join(' / ') : (aiData.chunks || item.chunks || ''),
          synonyms: Array.isArray(aiData.synonyms) ? aiData.synonyms : (item.synonyms || []),
          sentence: aiData.sentence || item.sentence || '',
          sentenceZh: aiData.sentenceZh || item.sentenceZh || '',
          relatedExpressions: Array.isArray(aiData.relatedExpressions) ? aiData.relatedExpressions : (item.relatedExpressions || []),
          relatedPhrases: Array.isArray(aiData.relatedPhrases) ? aiData.relatedPhrases : (item.relatedPhrases || [])
        };
      });
    });
  };

  // 临时大洗牌功能：全部退回未分类，等待新 AI 规则接管
  const resetAllCategories = () => {
    if (window.confirm('🧨 确定要将所有数据重置为【未分类】吗？\n这会让它们可以重新接受新版 AI 的“三轨并行”解析！')) {
      setItems(prevItems => {
        return (prevItems || []).map(item => ({
          ...item,
          category: 'Uncategorized',
          categoryZh: '',
          subCategory: '',
          subCategoryZh: '',
          aiReviewed: false 
        }));
      });
      showToast('洗牌完成！已全部重置为未分类 🔀');
    }
  };

  return (
    <AppContext.Provider value={{
      scenes, items, apiKey, setApiKey,
      addScene, deleteScene, addItem, deleteItem, addRelatedWord,
      updateCategories, resetAllCategories, showToast
    }}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-50 text-sm pointer-events-none animate-fade-in-up">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);