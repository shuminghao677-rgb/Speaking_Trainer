import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import HomePage from './pages/HomePage';
import SceneDetail from './pages/SceneDetail';
import LibraryPage from './pages/LibraryPage';

function App() {
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
              {/* 统一为 Writing Trainer 同款的经典蓝色加粗标题 */}
              <div className="text-xl font-bold text-blue-600 tracking-tight">
                范昕允的 Speaking Trainer
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