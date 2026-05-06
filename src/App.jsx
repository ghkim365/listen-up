import React, { useState, useEffect, useRef } from 'react';
import PlayerView from './components/PlayerView';
import EditorView from './components/EditorView';
import ListView from './components/ListView';
import { tts } from './utils/tts';
import { githubSync } from './utils/githubSync';
import { motion, AnimatePresence } from 'framer-motion';

// Font Awesome Helper
const Icon = ({ name, className = "" }) => <i className={`fa-solid fa-${name} ${className}`}></i>;

const NavBtn = ({ active, onClick, iconName, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${active ? 'text-[#4285f4]' : 'text-gray-600'}`}
  >
    <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-all relative ${active ? 'bg-[#4285f4]/5 shadow-[0_0_20px_rgba(66,133,244,0.3)]' : ''}`}>
      <Icon name={iconName} className={`text-[18px] ${active ? 'scale-110' : ''}`} />
    </div>
    <span className={`text-[9px] font-bold tracking-tighter uppercase ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

const App = () => {
  const [view, setView] = useState('player'); 
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [editingItem, setEditingItem] = useState(null);
  const [studyMode, setStudyMode] = useState('all'); 
  
  // Advanced States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [lastAdminClickTime, setLastAdminClickTime] = useState(0);
  const [backupList, setBackupList] = useState([]);
  const [customBackupPath, setCustomBackupPath] = useState('');
  const [customRestorePath, setCustomRestorePath] = useState('');

  // Settings
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Pretendard');
  const [ttsSettings, setTtsSettings] = useState({ engine: 'edge', voice: 'hyunsu', rate: 1.1 });
  const [skipCitations, setSkipCitations] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [lastUsedCategory, setLastUsedCategory] = useState('일반');

  const [cloudSettings, setCloudSettings] = useState({
    token: '', owner: 'ghkim365', repo: 'study-player', path: 'app_config.json', lastSync: null
  });

  useEffect(() => {
    const saved = localStorage.getItem('study_questions');
    let currentQuestions = saved ? JSON.parse(saved) : [];
    if (currentQuestions.length === 0) {
      currentQuestions = [
        { id: 's1', question: "ListenUp 프리미엄 학습기", answer: "환영합니다! 본 버전은 홈 백업 환경이 반영된 ListenUp 프리미엄 버전입니다.", category: "공지", incorrectCount: 0, isFavorite: true, explanation: "3050의 모든 기능이 통합되었습니다." }
      ];
      localStorage.setItem('study_questions', JSON.stringify(currentQuestions));
    }
    setQuestions(currentQuestions);

    const savedSettings = {
      fontSize: localStorage.getItem('font_size'),
      fontFamily: localStorage.getItem('font_family'),
      tts: localStorage.getItem('tts_settings'),
      cloud: localStorage.getItem('cloud_settings'),
      autoNext: localStorage.getItem('auto_next'),
      lastCat: localStorage.getItem('last_used_category')
    };

    if (savedSettings.fontSize) setFontSize(parseInt(savedSettings.fontSize));
    if (savedSettings.fontFamily) setFontFamily(savedSettings.fontFamily);
    if (savedSettings.tts) setTtsSettings(JSON.parse(savedSettings.tts));
    if (savedSettings.cloud) setCloudSettings(JSON.parse(savedSettings.cloud));
    if (savedSettings.autoNext) setAutoNext(savedSettings.autoNext === 'true');
    if (savedSettings.lastCat) { setLastUsedCategory(savedSettings.lastCat); setSelectedCategory(savedSettings.lastCat); }

    fetchBackupList();
  }, []);

  useEffect(() => {
    localStorage.setItem('font_size', fontSize.toString());
    localStorage.setItem('font_family', fontFamily);
    localStorage.setItem('tts_settings', JSON.stringify(ttsSettings));
    localStorage.setItem('auto_next', autoNext.toString());
    tts.setEngine(ttsSettings.engine); tts.setVoice(ttsSettings.voice); tts.setRate(ttsSettings.rate);
  }, [fontSize, fontFamily, ttsSettings, autoNext]);

  const fetchBackupList = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackupList(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const handleBackup = async (path = null) => {
    setIsBackingUp(true);
    try {
      const url = path ? `/api/backup?path=${encodeURIComponent(path)}` : '/api/backup';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) { alert('백업 완료!'); fetchBackupList(); }
      else alert('백업 실패: ' + data.error);
    } catch (e) { alert('서버 연결 실패'); }
    finally { setIsBackingUp(false); }
  };

  const handleRestore = async (folder = null) => {
    if (!confirm('디자인 환경을 복원할까요? 현재 작업 중인 내용은 사라질 수 있습니다.')) return;
    setIsRestoring(true);
    try {
      const url = folder ? `/api/restore?folder=${encodeURIComponent(folder)}` : '/api/restore';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) { alert('복원 시작... 10초 후 새로고침됩니다.'); setTimeout(() => window.location.reload(), 10000); }
      else alert('복원 실패: ' + data.error);
    } catch (e) { alert('서버 연결 실패'); }
    finally { setIsRestoring(false); }
  };

  const pickFolder = async (setter) => {
    try {
      const res = await fetch('/api/pick-folder');
      const data = await res.json();
      if (data.path) setter(data.path);
    } catch (e) { alert('폴더 선택기 실행 실패'); }
  };

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_data_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('데이터 내보내기에 실패했습니다.');
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const rawData = JSON.parse(re.target.result);
          let finalData = null;

          // 1. Direct array check
          if (Array.isArray(rawData)) {
            finalData = rawData;
          } 
          // 2. Object check - look for common array keys
          else if (rawData && typeof rawData === 'object') {
            const possibleKeys = ['questions', 'items', 'data', 'list', 'questionsList'];
            for (const key of possibleKeys) {
              if (Array.isArray(rawData[key])) {
                finalData = rawData[key];
                break;
              }
            }
          }

          if (finalData && finalData.length > 0) {
            // Basic validation for the first item
            const firstItem = finalData[0];
            if (firstItem.question || firstItem.id) {
              setQuestions(finalData);
              localStorage.setItem('study_questions', JSON.stringify(finalData));
              alert('데이터 불러오기 완료! 총 ' + finalData.length + '개의 문항을 로드했습니다.');
            } else {
              alert('데이터 내부의 문항 형식이 올바르지 않습니다.');
            }
          } else {
            alert('불러온 파일에서 유효한 문항 데이터를 찾을 수 없습니다.');
          }
        } catch (err) { 
          console.error('Import parse error:', err);
          alert('잘못된 파일 형식입니다. JSON 파일을 확인해주세요.'); 
        }
        if (document.body.contains(input)) document.body.removeChild(input);
      };
      reader.readAsText(file);
    };

    input.click();
    // Some browsers need timeout before removal if not handled in onchange
    setTimeout(() => { if(document.body.contains(input)) document.body.removeChild(input); }, 60000);
  };

  const filteredQuestions = React.useMemo(() => {
    let f = questions;
    if (selectedCategory !== '전체') f = f.filter(q => q.category === selectedCategory);
    if (studyMode === 'incorrect') f = f.filter(q => q.incorrectCount > 0);
    else if (studyMode === 'favorites') f = f.filter(q => q.isFavorite);
    return f;
  }, [questions, selectedCategory, studyMode]);

  // Handle out of bounds currentIndex gracefully
  useEffect(() => {
    if (filteredQuestions.length > 0 && currentIndex >= filteredQuestions.length) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions.length, currentIndex]);

  const categories = ['전체', ...new Set(questions.map(q => q.category))];

  const [isMobileMode, setIsMobileMode] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isRealMobile, setIsRealMobile] = useState(false);
  const [theme, setTheme] = useState('dark'); // dark, light, system
  const [darkness, setDarkness] = useState(0); // 0 to 100
  const [userFontColor, setUserFontColor] = useState(''); // Empty means use theme default

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    const savedDarkness = parseInt(localStorage.getItem('app_darkness') || '0');
    const savedFontColor = localStorage.getItem('app_font_color') || '';
    setTheme(savedTheme);
    setDarkness(savedDarkness);
    setUserFontColor(savedFontColor);

    // Real Mobile Detection
    const checkRealMobile = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsRealMobile(isMobile);
      if (isMobile) setIsMobileMode(true);
    };
    checkRealMobile();
    window.addEventListener('resize', checkRealMobile);
    return () => window.removeEventListener('resize', checkRealMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('app_darkness', darkness.toString());
    localStorage.setItem('app_font_color', userFontColor);
    
    const root = document.querySelector('.mobile-frame');
    if (!root) return;

    // Apply Theme Class
    if (theme === 'light') root.classList.add('light-theme');
    else if (theme === 'dark') root.classList.remove('light-theme');
    else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.remove('light-theme');
      else root.classList.add('light-theme');
    }

    // Apply User Font Color Override
    if (userFontColor) {
      root.style.setProperty('--text-primary', userFontColor);
    } else {
      root.style.removeProperty('--text-primary');
    }
  }, [theme, darkness, userFontColor, isMobileMode, isLandscape, view]);

  return (
    <div className={`device-wrapper min-h-screen bg-black flex flex-col items-center justify-center transition-all duration-500 ${!isMobileMode ? 'p-0 pt-0' : ''}`}>
      {/* Device Toggle Bar - Master Sync - Hidden on Real Mobile */}
      {!isRealMobile && (
        <div className="fixed top-4 right-6 flex items-center gap-2 z-[100]">
        <div className="flex bg-[#1F2229] p-1 rounded-xl border border-gray-800 shadow-xl">
          <button 
            onClick={() => setIsMobileMode(false)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isMobileMode ? 'bg-[#2282b9] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" x2="12" y1="17" x2="12" y2="21"></line></svg>
            PC
          </button>
          <button 
            onClick={() => setIsMobileMode(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isMobileMode ? 'bg-[#2282b9] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" x2="12" y1="18" y2="18"></line></svg>
            MOBILE
          </button>
        </div>
        
        {/* Rotation Button - Toggle Landscape/Portrait */}
        <button 
          onClick={() => setIsLandscape(!isLandscape)}
          className={`p-2.5 bg-[#1F2229] border border-gray-800 rounded-xl transition-all shadow-xl active:scale-95 ${isLandscape ? 'text-[#2282b9] border-[#2282b9]/50' : 'text-gray-400'}`}
          title="화면 회전"
        >
          <svg className={`w-4 h-4 transition-transform duration-500 ${isLandscape ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        </button>
      </div>
      )}

      <div className={`transition-all duration-500 ease-in-out shadow-2xl relative flex flex-col overflow-hidden ${
        isMobileMode 
          ? (isRealMobile ? 'w-full h-screen bg-[var(--bg-app)]' : (isLandscape ? 'w-[844px] h-[410px] rounded-[40px] border-[8px] border-[#2D2F36] bg-[var(--bg-app)]' : 'mobile-frame')) 
          : 'w-full h-screen bg-[var(--bg-app)]'
      }`}>
        {isMobileMode && !isLandscape && !isRealMobile && <div className="status-bar-notch"></div>}
        
        {/* Darkness Overlay - Simulates Brightness Reduction */}
        <div 
          className="absolute inset-0 z-[9999] pointer-events-none transition-opacity duration-300 bg-black"
          style={{ opacity: darkness / 100 }}
        ></div>

        <div className={`app-container flex-1 overflow-hidden relative flex flex-col ${!isMobileMode ? 'w-full max-w-4xl mx-auto border-x border-[var(--border-subtle)]' : ''}`}>
          <AnimatePresence mode="wait">
            {view === 'player' && (
              <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <PlayerView
                  question={filteredQuestions[currentIndex]} total={filteredQuestions.length} current={currentIndex + 1}
                  onNext={() => setCurrentIndex((prev) => (prev + 1) % filteredQuestions.length)}
                  onPrev={() => setCurrentIndex((prev) => (prev - 1 + filteredQuestions.length) % filteredQuestions.length)}
                  onJump={setCurrentIndex}
                  onToggleFavorite={() => {
                    const updated = questions.map(q => q.id === filteredQuestions[currentIndex]?.id ? { ...q, isFavorite: !q.isFavorite } : q);
                    setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated));
                  }}
                  onMarkWrong={() => {
                    const updated = questions.map(q => q.id === filteredQuestions[currentIndex]?.id ? { ...q, incorrectCount: (q.incorrectCount || 0) + 1 } : q);
                    setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated));
                  }}
                  onEdit={(item) => { setEditingItem(item); setView('editor'); }}
                  ttsSettings={ttsSettings} onTtsChange={setTtsSettings}
                  autoNext={autoNext} onToggleAutoNext={() => setAutoNext(!autoNext)}
                  fontSize={fontSize} skipCitations={skipCitations}
                />
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <ListView
                  questions={questions} categories={categories} selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onSelect={(id) => { 
                    const idxInFiltered = filteredQuestions.findIndex(q => q.id === id);
                    if (idxInFiltered !== -1) {
                      setCurrentIndex(idxInFiltered);
                    } else {
                      setSelectedCategory('전체');
                      setStudyMode('all');
                      const globalIdx = questions.findIndex(q => q.id === id);
                      setCurrentIndex(globalIdx !== -1 ? globalIdx : 0);
                    }
                    setView('player'); 
                  }}
                  onEdit={(item) => { setEditingItem(item); setView('editor'); }}
                  onDelete={(id) => { const updated = questions.filter(q => q.id !== id); setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated)); }}
                  onToggleFavorite={(id) => { const updated = questions.map(q => q.id === id ? { ...q, isFavorite: !q.isFavorite } : q); setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated)); }}
                  onClose={() => setView('player')}
                />
              </motion.div>
            )}

            {view === 'editor' && (
              <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <EditorView
                  editingItem={editingItem} lastUsedCategory={lastUsedCategory}
                  existingCategories={categories.filter(c => c !== '전체')}
                  onSave={(q) => {
                    let updated;
                    if (editingItem) updated = questions.map(item => item.id === editingItem.id ? { ...editingItem, ...q } : item);
                    else {
                      const newItem = { ...q, id: Date.now(), incorrectCount: 0, isFavorite: false };
                      updated = [...questions, newItem];
                      setLastUsedCategory(q.category); setSelectedCategory(q.category);
                      setCurrentIndex(updated.filter(item => item.category === q.category).length - 1);
                    }
                    setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated));
                    localStorage.setItem('last_used_category', q.category); setEditingItem(null); setView('player');
                  }}
                  onBulkSave={(newList) => {
                    const updated = [...questions, ...newList.map((q, idx) => ({ ...q, id: Date.now() + idx, incorrectCount: 0, isFavorite: false }))];
                    setQuestions(updated); localStorage.setItem('study_questions', JSON.stringify(updated));
                    if (newList.length > 0) { setLastUsedCategory(newList[newList.length-1].category); setSelectedCategory(newList[newList.length-1].category); }
                    setView('player');
                  }}
                  onCancel={() => { setEditingItem(null); setView('player'); }}
                />
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
                <header className="flex items-center justify-between px-6 pt-14 pb-4 shrink-0 z-20">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-[#2282b9]/20" />
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">설정</h1>
                  </div>
                  <button onClick={() => setView('player')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </button>
                </header>

                <main className="flex-1 overflow-y-auto px-6 space-y-8 pb-40 z-10 no-scrollbar">
                  {/* Theme Switcher - Master Sync */}
                  <section className="space-y-4">
                    <h3 className="text-[13px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-wider">밝기 (테마)</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        {id:'light',l:'밝게',i:'sun'},
                        {id:'dark',l:'어둡게',i:'moon'},
                        {id:'system',l:'시스템',i:'desktop'}
                      ].map(t => (
                        <button 
                          key={t.id} onClick={() => setTheme(t.id)} 
                          className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-[0.97] ${theme === t.id ? 'border-[#2282b9] bg-[#2282b9]/10 text-[#2282b9]' : 'border-[var(--border-subtle)] bg-[var(--bg-item)] text-[var(--text-muted)]'}`}
                        >
                          <Icon name={t.i} className="text-lg" />
                          <span className="text-[11px] font-bold">{t.l}</span>
                        </button>
                      ))}
                    </div>

                    {/* Darkness Slider - Screenshot 83 Sync */}
                    <div className="mt-6 space-y-4 px-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Darkness</label>
                        <span className="text-[#2282b9] font-bold text-sm">{darkness}%</span>
                      </div>
                      <div className="relative flex items-center group">
                        <input 
                          type="range" min="0" max="95" value={darkness} onChange={(e) => setDarkness(parseInt(e.target.value))} 
                          className="w-full h-2 bg-[var(--bg-item)] rounded-lg appearance-none cursor-pointer accent-[#2282b9] border border-[var(--border-subtle)]" 
                        />
                      </div>
                    </div>

                    {/* Font Color Picker - New Request */}
                    <div className="mt-8 space-y-4 px-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Font Color</label>
                        <button onClick={() => setUserFontColor('')} className="text-[10px] font-bold text-[#2282b9] hover:underline">기본값 복원</button>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          {c:'#1F2937',n:'Charcoal'},
                          {c:'#000000',n:'Black'},
                          {c:'#1E3A8A',n:'Navy'},
                          {c:'#7C2D12',n:'Brown'},
                          {c:'#065F46',n:'Emerald'},
                          {c:'#581C87',n:'Purple'},
                          {c:'#FFFFFF',n:'White'}
                        ].map(color => (
                          <button 
                            key={color.c} onClick={() => setUserFontColor(color.c)}
                            style={{ backgroundColor: color.c }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${userFontColor === color.c ? 'border-[#2282b9] scale-110 shadow-lg' : 'border-[var(--border-subtle)]'}`}
                            title={color.n}
                          />
                        ))}
                        {/* Custom Color Picker */}
                        <div className="relative w-8 h-8 rounded-full border-2 border-[var(--border-subtle)] overflow-hidden">
                          <input 
                            type="color" value={userFontColor || '#1F2937'} onChange={(e) => setUserFontColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -translate-x-[25%] -translate-y-[25%] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    {/* Study Mode */}
                    <div className="space-y-3">
                      <h3 className="text-[13px] font-bold text-[var(--text-muted)] ml-1">학습 모드</h3>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[{id:'all',l:'전체'},{id:'incorrect',l:'오답'},{id:'favorites',l:'즐겨찾기'}].map(m => (
                          <button key={m.id} onClick={() => setStudyMode(m.id)} className={`py-3.5 rounded-xl border text-[13px] font-bold transition-all active:scale-[0.97] ${studyMode === m.id ? 'border-[#2282b9] text-[#2282b9] bg-[#2282b9]/10' : 'border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-item)]'}`}>{m.l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-3">
                      <h3 className="text-[13px] font-bold text-[var(--text-muted)] ml-1">글꼴</h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {['Pretendard','나눔스퀘어','Noto Sans KR','에스코어 드림','인천교육자람체','온글잎'].map(f => (
                          <button key={f} onClick={() => setFontFamily(f)} className={`py-4 rounded-xl border text-[14px] font-bold transition-all active:scale-[0.97] ${fontFamily === f ? 'border-[#2282b9] text-[#2282b9] bg-[#2282b9]/10' : 'border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-item)]'} ${f === '인천교육자람체' ? 'text-xs' : ''}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Font Size */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <label className="text-[13px] font-bold text-[var(--text-muted)]">글자 크기 <span className="text-[11px] font-medium opacity-60">(현재 권장: 16px)</span></label>
                      <span className="text-[#2282b9] font-bold text-base">{fontSize}px</span>
                    </div>
                    <input type="range" min="12" max="30" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--bg-item)] rounded-lg appearance-none cursor-pointer accent-[#2282b9]" />
                  </section>

                  {/* TTS Engine */}
                  <section className="space-y-3">
                    <h3 className="text-[13px] font-bold text-[var(--text-muted)] ml-1">음성 엔진 (Robotic vs Premium)</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => setTtsSettings({...ttsSettings, engine: 'premium'})}
                        className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all active:scale-[0.97] ${ttsSettings.engine === 'premium' ? 'border-[#2282b9] bg-[#2282b9]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-item)]'}`}
                      >
                        <span className={`text-[14px] font-bold ${ttsSettings.engine === 'premium' ? 'text-[#2282b9]' : 'text-[var(--text-primary)]'}`}>Premium (Edge)</span>
                        <span className={`text-[10px] mt-0.5 ${ttsSettings.engine === 'premium' ? 'text-[#2282b9]/70' : 'text-[var(--text-muted)]'}`}>자연스러운 고음질</span>
                      </button>
                      <button 
                        onClick={() => setTtsSettings({...ttsSettings, engine: 'browser'})}
                        className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all active:scale-[0.97] ${ttsSettings.engine === 'browser' ? 'border-[#2282b9] bg-[#2282b9]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-item)]'}`}
                      >
                        <span className={`text-[14px] font-bold ${ttsSettings.engine === 'browser' ? 'text-[#2282b9]' : 'text-[var(--text-primary)]'}`}>기본 (Browser)</span>
                        <span className={`text-[10px] mt-0.5 ${ttsSettings.engine === 'browser' ? 'text-[#2282b9]/70' : 'text-[var(--text-muted)]'}`}>오프라인/기본</span>
                      </button>
                    </div>

                    {/* Edge Voice Selection Grid - Restored from Screenshot 86 */}
                    {ttsSettings.engine === 'premium' && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {[
                          {id:'ko-KR-SunHiNeural', n:'선희', g:'여성'},
                          {id:'ko-KR-SunHiNeural_N', n:'나라', g:'여성'},
                          {id:'ko-KR-SunHiNeural_A', n:'아라', g:'여성'},
                          {id:'ko-KR-InJoonNeural', n:'인준', g:'남성'},
                          {id:'ko-KR-InJoonNeural_M', n:'민호', g:'남성'},
                          {id:'ko-KR-InJoonNeural_H', n:'현수', g:'남성'}
                        ].map(voice => (
                          <button 
                            key={voice.n}
                            onClick={() => setTtsSettings({...ttsSettings, voice: voice.id})}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${ttsSettings.voice === voice.id ? 'border-[#2282b9] bg-[#2282b9]/10 text-[#2282b9]' : 'border-[var(--border-subtle)] bg-[var(--bg-item)] text-[var(--text-muted)]'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${ttsSettings.voice === voice.id ? 'bg-[#2282b9]' : 'bg-gray-600/30'}`} />
                            <span className="text-[11px] font-bold whitespace-nowrap">{voice.g} ({voice.n})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Speech Speed Slider - Restored from Screenshot 86 */}
                    <div className="mt-6 space-y-4 px-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">음성 속도</label>
                        <span className="text-[#2282b9] font-bold text-sm">{ttsSettings.rate.toFixed(1)}x</span>
                      </div>
                      <div className="relative flex items-center group">
                        <input 
                          type="range" min="0.5" max="2.0" step="0.1" value={ttsSettings.rate} 
                          onChange={(e) => setTtsSettings({...ttsSettings, rate: parseFloat(e.target.value)})} 
                          className="w-full h-1.5 bg-[var(--bg-item)] rounded-lg appearance-none cursor-pointer accent-[#2282b9] border border-[var(--border-subtle)]" 
                        />
                      </div>
                      {/* Voice Test Button */}
                      <button 
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance("테스트용 음성입니다. 안녕하세요?");
                          utterance.rate = ttsSettings.rate;
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="w-full py-3.5 mt-2 rounded-xl bg-[var(--bg-item)] border border-[var(--border-subtle)] flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[#2282b9] transition-all active:scale-95 text-xs font-bold"
                      >
                        <Icon name="volume-high" />
                        <span>음성 테스트</span>
                      </button>
                    </div>
                  </section>

                  {/* Backup & Restore Section */}
                  <section className="space-y-4 pt-6 border-t border-[var(--border-subtle)]">
                    <h3 className="text-[13px] font-bold text-[var(--text-muted)] ml-1">데이터 및 디자인 백업</h3>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-2">
                        <button onClick={exportData} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--bg-item)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)] text-[13px] active:scale-[0.97] transition-all">
                          <Icon name="file-export" className="text-[var(--text-muted)]" />
                          <span>내보내기</span>
                        </button>
                        <p className="text-[9px] text-[var(--text-muted)] text-center truncate px-1">.../listen_up/json</p>
                      </div>
                      <div className="space-y-2">
                        <button onClick={importData} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--bg-item)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)] text-[13px] active:scale-[0.97] transition-all">
                          <Icon name="file-import" className="text-[var(--text-muted)]" />
                          <span>불러오기</span>
                        </button>
                        <p className="text-[9px] text-[var(--text-muted)] text-center truncate px-1">기본 경로: /json</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button onClick={() => handleBackup()} disabled={isBackingUp} className="w-full py-4 rounded-xl bg-[var(--bg-item)] border border-[#2282b9]/20 flex items-center justify-center gap-2 text-[#2282b9] font-bold text-[13px] active:scale-[0.97] transition-all">
                        <Icon name="floppy-disk" />
                        <span>디자인 현재상태 백업 (Auto-timestamp)</span>
                      </button>
                      <p className="text-[9px] text-[var(--text-muted)] text-center">.../listen_up/backups</p>
                    </div>

                    <button onClick={() => handleRestore()} disabled={isRestoring} className="w-full py-4 rounded-xl border border-red-950/30 bg-red-950/5 flex items-center justify-center gap-2 text-red-500/80 font-bold text-[13px] active:scale-[0.97] transition-all">
                      <Icon name="rotate-left" />
                      <span>디자인 복원 (One-click)</span>
                    </button>
                  </section>

                  {/* Cloud Sync */}
                  <section className="space-y-6 pt-6 border-t border-[var(--border-subtle)]">
                    <div className="bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-5">
                      <div className="flex items-center gap-2">
                        <Icon name="cloud" className="text-[#2282b9] text-xl" />
                        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">개인용 클라우드 동기화 (GitHub)</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">GitHub Personal Access Token</label>
                          <input 
                            type="password" value={cloudSettings.token} onChange={(e) => setCloudSettings({...cloudSettings, token: e.target.value})}
                            placeholder="ghp_********************"
                            className="w-full bg-black/10 border border-[var(--border-subtle)] rounded-xl py-3 px-4 text-[var(--text-primary)] text-xs font-mono focus:ring-1 focus:ring-[#2282b9]/30"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Owner (ID)</label>
                            <input 
                              type="text" value={cloudSettings.owner} onChange={(e) => setCloudSettings({...cloudSettings, owner: e.target.value})}
                              className="w-full bg-black/10 border border-[var(--border-subtle)] rounded-xl py-3 px-4 text-[var(--text-primary)] text-xs font-bold focus:ring-1 focus:ring-[#2282b9]/30"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Repo Name</label>
                            <input 
                              type="text" value={cloudSettings.repo} onChange={(e) => setCloudSettings({...cloudSettings, repo: e.target.value})}
                              className="w-full bg-black/10 border border-[var(--border-subtle)] rounded-xl py-3 px-4 text-[var(--text-primary)] text-xs font-bold focus:ring-1 focus:ring-[#2282b9]/30"
                            />
                          </div>
                        </div>

                        <button className="w-full py-4 rounded-xl bg-[#2282b9] text-white font-bold text-[14px] shadow-lg shadow-[#2282b9]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                          <Icon name="cloud-arrow-up" /> 지금 동기화 실행
                        </button>
                        
                        <p className="text-[9px] text-[var(--text-muted)] text-center">마지막 동기화: {cloudSettings.lastSync || '기록 없음'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Past Backups */}
                  <section className="space-y-4 pb-20">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-[13px] font-bold text-[var(--text-muted)]">과거 시점 복원</h3>
                      <button onClick={() => fetch('/api/open-backups')} className="text-[10px] text-[#2282b9] font-bold flex items-center gap-1.5 hover:underline">
                        <Icon name="folder-open" /> 폴더 열기
                      </button>
                    </div>
                    {backupList.length > 0 ? (
                      <div className="space-y-2">
                        {backupList.slice(0, 5).map(folder => (
                          <button key={folder} onClick={() => handleRestore(folder)} className="w-full py-4 px-5 rounded-xl bg-[var(--bg-item)] border border-[var(--border-subtle)] flex items-center justify-between group transition-all active:bg-white/5">
                            <span className="text-[11px] text-[var(--text-muted)] font-bold group-hover:text-[var(--text-primary)]">{folder}</span>
                            <Icon name="rotate-left" className="text-[var(--text-muted)] group-hover:text-[#2282b9]" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-[11px] text-[var(--text-muted)] italic bg-[var(--bg-item)]/30 rounded-xl border border-dashed border-[var(--border-subtle)]">백업 내역이 없습니다.</div>
                    )}
                  </section>
                </main>
              </motion.div>
            )}
          </AnimatePresence>
        </div> {/* End of app-container */}

        <footer className="h-20 bg-[var(--bg-nav)] border-t border-[var(--border-subtle)] flex items-center justify-around px-2 shrink-0 z-50 pb-2">
          {/* Nav Item: Study */}
          <button 
            onClick={() => setView('player')} 
            className={`flex flex-col items-center gap-1 transition-all ${view === 'player' ? 'text-[#2282b9]' : 'text-[var(--text-muted)]'}`}
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <div className={`rounded-full border-2 p-[2px] flex items-center justify-center ${view === 'player' ? 'border-[#2282b9]' : 'border-current opacity-40'}`}>
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
            <span className="text-[10px] font-bold">학습</span>
          </button>

          {/* Nav Item: List */}
          <button 
            onClick={() => setView('list')} 
            className={`flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'text-[#2282b9]' : 'text-[var(--text-muted)]'}`}
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <div className={`rounded-full border-2 p-[2px] flex items-center justify-center ${view === 'list' ? 'border-[#2282b9]' : 'border-current opacity-40'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24"><line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line></svg>
              </div>
            </div>
            <span className="text-[10px] font-bold">목록</span>
          </button>

          {/* Nav Item: Add */}
          <button 
            onClick={() => { setEditingItem(null); setView('editor'); }} 
            className={`flex flex-col items-center gap-1 transition-all ${view === 'editor' ? 'text-[#2282b9]' : 'text-[var(--text-muted)]'}`}
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <div className={`rounded-full border-2 p-[2px] flex items-center justify-center ${view === 'editor' ? 'border-[#2282b9]' : 'border-current opacity-40'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
              </div>
            </div>
            <span className="text-[10px] font-bold">추가</span>
          </button>

          {/* Nav Item: Settings */}
          <button 
            onClick={() => setView('settings')} 
            className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-[#2282b9]' : 'text-[var(--text-muted)]'}`}
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <div className={`rounded-full border-2 p-[2px] flex items-center justify-center ${view === 'settings' ? 'border-[#2282b9]' : 'border-current opacity-40'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
            </div>
            <span className="text-[10px] font-bold">설정</span>
          </button>
        </footer>
        {/* iOS Home Indicator */}
        <div className="h-1 w-32 bg-[var(--text-muted)] opacity-20 rounded-full mx-auto mb-2 shrink-0"></div>
        </div>
      </div>
  );
};

export default App;
