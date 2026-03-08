import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider } from './AppContext';
import HomePage from './pages/HomePage';
import SceneDetail from './pages/SceneDetail';
import LibraryPage from './pages/LibraryPage';

function App() {
  // 🌟 新增：读取和保存名字的状态。如果没有记录，默认为空
  const [userName, setUserName] = useState(() => localStorage.getItem('trainer_user_name') || '');
  // 🌟 新增：如果一开始没名字，直接默认进入编辑状态
  const [isEditing, setIsEditing] = useState(() => !localStorage.getItem('trainer_user_name'));
  const [tempName, setTempName] = useState(() => localStorage.getItem('trainer_user_name') || '');

  const handleSaveName = () => {
    const finalName = tempName.trim();
    setUserName(finalName);
    localStorage.setItem('trainer_user_name', finalName);
    setIsEditing(false);
  };

  const navItems = [
    { path: '/', label: '场景主页' },
    { path: '/templates', label: '句型库' },
    { path: '/expressions', label: '表达库' },
    { path: '/synonyms', label: '同义词库' },
  ];

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen font-sans text-gray-900">
          <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 h-16 flex items-center">
            <div className="max-w-5xl mx-auto w-full px-6 flex items-center justify-between">
              
              {/* 🌟 修改区：动态专属标题 */}
              <div className="text-xl font-bold text-blue-600 tracking-tight flex items-center">
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      autoFocus
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      onBlur={handleSaveName} // 鼠标点击旁边空白处也会自动保存
                      placeholder="你的名字"
                      className="border-b-2 border-blue-400 bg-transparent focus:outline-none w-20 text-center mr-1 text-blue-600 placeholder-blue-300"
                    />
                    <span>的 Speaking Trainer</span>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer group flex items-center"
                    onClick={() => { setTempName(userName); setIsEditing(true); }}
                  >
                    <span>{userName ? `${userName}的` : '你的'} Speaking Trainer</span>
                    <span className="text-[12px] ml-2 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" title="点击修改名字">✏️ 改名</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 md:space-x-8">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        (isActive && item.path !== '/') || (isActive && item.path === window.location.pathname)
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>

          <main className="pt-24 pb-10 px-4 max-w-5xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scene/:id" element={<SceneDetail />} />
              <Route path="/templates" element={<LibraryPage title="句型模板库 Templates" type="template" colorClass="text-indigo-800" />} />
              <Route path="/expressions" element={<LibraryPage title="日常表达库 Casual Expressions" type="expression" colorClass="text-emerald-800" />} />
              <Route path="/synonyms" element={<LibraryPage title="同义词库 Synonyms" type="synonym" colorClass="text-amber-800" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;