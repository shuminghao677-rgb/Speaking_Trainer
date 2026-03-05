import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

const AppContext = createContext();

// Helper: normalize phrase for dedupe (lowercase, trim, remove punctuation except '/')
const normalizePhrase = (s = '') => {
  return s.toString()
    .toLowerCase()
    .replace(/[^\w\s\/]/g, '') // 去掉标点，但保留斜杠（用于合并短语时的分隔）
    .replace(/\s+/g, ' ')
    .trim();
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

  const addScene = (name, date) => {
    const newScene = { id: Date.now().toString(), name, date };
    setScenes([newScene, ...scenes]);
  };

  const deleteScene = (id) => {
    setScenes(scenes.filter(s => s.id !== id));
    setItems(items.filter(i => i.sceneId !== id)); 
  };

  const addItem = (sceneId, type, data) => {
    const newItem = {
      id: Date.now().toString(),
      sceneId,
      type,
      category: 'Uncategorized',
      aiReviewed: false,
      optionalExtensions: [], // 新增：可选延展
      ...data
    };
    setItems([newItem, ...items]);
  };

  // 防重复添加：如果重复则放入 optionalExtensions
  const addRelatedWord = (itemId, wordObj) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId && item.type === 'synonym') {
        const existing = item.relatedWords || [];
        const normNew = normalizePhrase(wordObj.word);
        // check duplicates in relatedWords
        const isDuplicate = existing.some(rw => normalizePhrase(rw.word) === normNew);
        // also check duplicates in optionalExtensions
        const existingOptional = item.optionalExtensions || [];
        const isInOptional = existingOptional.some(o => normalizePhrase(o.phrase) === normNew);

        if (isDuplicate) {
          // 已存在 -> 移入 optionalExtensions（如果还没在里面）
          if (!isInOptional) {
            const newOptional = [...existingOptional, { phrase: wordObj.word, phraseZh: wordObj.zh || '' }];
            return { ...item, optionalExtensions: newOptional };
          } else {
            showToast('该关联词已存在（包括可选项），已忽略重复。');
            return item;
          }
        } else {
          // 正常添加
          return { ...item, relatedWords: [...existing, wordObj] };
        }
      }
      return item;
    }));
  };

  const deletedItemsRef = useRef([]);

  const deleteItem = (id) => {
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete) {
      deletedItemsRef.current.push(itemToDelete); 
      showToast('已删除，按 Cmd + Z (或 Ctrl + Z) 撤销 ↩️');
    }
    setItems(items.filter(item => item.id !== id));
  };

  // 接收并覆盖新格式的数据，同时做去重并把被删的候选移入 optionalExtensions
  const updateCategories = (aiResultMap) => {
    setItems(prevItems => 
      prevItems.map(item => {
        const aiData = aiResultMap[item.id];
        if (aiData) {
          // collect optionalExtensions starting from existing ones
          const optionalExtensions = [...(item.optionalExtensions || [])];

          // helper: process relatedGroups returned by AI -> dedupe phrases globally for this item
          const processedRelatedGroups = (aiData.relatedGroups || []).map(group => {
            const seen = new Set();
            const newItems = [];

            (group.items || []).forEach(gItem => {
              const norm = normalizePhrase(gItem.phrase || '');
              if (!norm) return;
              if (seen.has(norm)) {
                // 重复项，放入 optionalExtensions（保留原始字段）
                if (!optionalExtensions.some(o => normalizePhrase(o.phrase) === norm)) {
                  optionalExtensions.push({
                    phrase: gItem.phrase,
                    phraseZh: gItem.phraseZh || '',
                    example: gItem.example || '',
                    exampleZh: gItem.exampleZh || ''
                  });
                }
              } else {
                seen.add(norm);
                newItems.push(gItem);
              }
            });

            return {
              ...group,
              items: newItems
            };
          });

          // 对已有的 item.relatedWords 做去重（用户手动加入的），并把重复项移到 optionalExtensions
          let dedupedRelatedWords = [];
          const seenRw = new Set();
          (item.relatedWords || []).forEach(rw => {
            const norm = normalizePhrase(rw.word || rw.phrase || '');
            if (!norm) return;
            if (seenRw.has(norm)) {
              // 重复 -> optionalExtensions
              if (!optionalExtensions.some(o => normalizePhrase(o.phrase) === norm)) {
                optionalExtensions.push({ phrase: rw.word || rw.phrase, phraseZh: rw.zh || '' });
              }
            } else {
              seenRw.add(norm);
              dedupedRelatedWords.push(rw);
            }
          });

          // 最后把 optionalExtensions 去重（以规范化后为准）
          const finalOptional = [];
          const seenOpt = new Set();
          optionalExtensions.forEach(o => {
            const norm = normalizePhrase(o.phrase || '');
            if (!seenOpt.has(norm)) {
              seenOpt.add(norm);
              finalOptional.push(o);
            }
          });

          // 共享 common fields
          const common = {
            aiReviewed: true,
            category: aiData.category || item.category || 'Uncategorized',
            subCategoryEnglish: aiData.subCategory || aiData.subCategoryEnglish || item.subCategoryEnglish || '',
            subCategoryZh: aiData.subCategoryZh || item.subCategoryZh || ''
          };

          if (item.type === 'expression' || item.type === 'template') {
             return { 
               ...item, 
               ...common,
               content: aiData.correctedText || item.content, 
               chunks: aiData.chunks || item.chunks || '',
               relatedGroups: processedRelatedGroups || item.relatedGroups || [],
               optionalExtensions: finalOptional,
               relatedWords: dedupedRelatedWords
             };
          }
          if (item.type === 'synonym') {
             return { 
               ...item, 
               ...common,
               baseWord: aiData.mainWord || aiData.correctedText || item.baseWord,
               relatedGroups: processedRelatedGroups || item.relatedGroups || [],
               optionalExtensions: finalOptional,
               relatedWords: dedupedRelatedWords
             };
          }
        }
        return item;
      })
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        const activeTag = document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        if (deletedItemsRef.current.length > 0) {
          const itemToRestore = deletedItemsRef.current.pop();
          setItems(prev => [itemToRestore, ...prev]);
          showToast('恢复成功 🌟');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setItems]);

  return (
    <AppContext.Provider value={{
      scenes, items, apiKey, setApiKey,
      addScene, deleteScene, addItem, deleteItem, updateCategories, addRelatedWord
    }}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-medium animate-fade-in-up">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);