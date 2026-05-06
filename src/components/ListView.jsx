import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icon = ({ name, className = "" }) => <i className={`fa-solid fa-${name} ${className}`}></i>;

const ListView = ({
  questions, categories, selectedCategory, onSelectCategory, onSelect, onEdit, onDelete, onToggleFavorite, onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // all, favorites, incorrect

  const filtered = questions.filter(q => {
    const matchCat = selectedCategory === '전체' || q.category === selectedCategory;
    const matchSearch = (q.question || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (q.answer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchMode = filterMode === 'all' || 
                      (filterMode === 'favorites' && q.isFavorite) || 
                      (filterMode === 'incorrect' && (q.incorrectCount || 0) > 0);
    return matchCat && matchSearch && matchMode;
  });

  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimer = React.useRef(null);

  const handleContextMenu = (e, item) => {
    if (e) e.preventDefault();
    const x = e?.clientX || (e?.touches ? e.touches[0].clientX : window.innerWidth / 2);
    const y = e?.clientY || (e?.touches ? e.touches[0].clientY : window.innerHeight / 2);
    setContextMenu({ itemId: item.id, question: item.question, x, y });
  };

  const startLongPress = (e, item) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      handleContextMenu({ preventDefault: () => {}, clientX: x, clientY: y }, item);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleShare = async () => {
    if (!contextMenu) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'StudyPlayer 공유', text: contextMenu.question });
      } else {
        alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      }
    } catch (err) { console.error('Share error:', err); }
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(contextMenu.question);
    alert('클립보드에 복사되었습니다.');
    setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] relative" onClick={() => setContextMenu(null)}>
      {/* Header - Master Sync */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-[#2282b9]/20" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">목록</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="p-2 transition-colors">
            <svg className="text-[var(--text-muted)]" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
          </button>
        </div>
      </header>

      {/* Category Tabs - Master Sync */}
      <nav className="px-6 border-b border-[var(--border-subtle)] shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 whitespace-nowrap">
          {categories.map(cat => (
            <div key={cat} className="flex flex-col items-center">
              <button 
                onClick={() => onSelectCategory(cat)}
                className={`py-2 text-[14px] font-semibold transition-all ${selectedCategory === cat ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {cat}
              </button>
              {selectedCategory === cat && <motion.div layoutId="tab-line" className="h-0.5 w-full bg-[var(--accent-primary)]" />}
            </div>
          ))}
        </div>
      </nav>

      {/* Main Content - Master Sync */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar pb-32">
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
            <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </span>
          <input 
            className="w-full bg-[var(--bg-item)] border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[#38BDF8]" 
            placeholder="검색어 입력..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-3">
          {[{id:'all',l:'모두'},{id:'favorites',l:'중요'},{id:'incorrect',l:'틀린 문제'}].map(f => (
            <button 
              key={f.id} onClick={() => setFilterMode(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${filterMode === f.id ? 'bg-[#2282b9] border-[#2282b9] text-white shadow-lg shadow-[#2282b9]/20' : 'bg-[var(--bg-item)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Study List Cards */}
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const cleanQuestion = (text) => {
              if (!text) return "";
              const match = text.match(/(.{3,})\s*(①|②|③|④|⑤|\(\d\)|[1-5]\))/);
              if (match) {
                const cleaned = text.substring(0, text.indexOf(match[2])).trim();
                if (cleaned.length > 5) return cleaned;
              }
              return text;
            };

            return (
              <motion.div 
                key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onTouchStart={(e) => startLongPress(e, item)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                className="bg-[var(--bg-card)] rounded-3xl p-6 relative group border border-[var(--border-subtle)] hover:border-[#38BDF8]/20 transition-all active:scale-[0.99] select-none shadow-sm"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(item.id)}>
                    <span className="text-xs font-semibold text-[#38BDF8]">{item.category}</span>
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                      {cleanQuestion(item.question)}
                    </h3>
                    <div className="mt-3 flex items-center gap-2">
                    {item.incorrectCount > 0 && (
                      <span className="bg-red-500/10 text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-500/20">X {item.incorrectCount}</span>
                    )}
                    {item.isFavorite && (
                      <svg className="text-[#38BDF8]" fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    )}
                  </div>
                </div>
                {/* Action Icons - Master Sync Horizontal */}
                <div className="flex gap-3 text-[var(--text-muted)] shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="hover:text-[var(--text-primary)] transition-colors">
                    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }} className={`transition-colors ${item.isFavorite ? 'text-[#38BDF8]' : 'hover:text-[#38BDF8]'}`}>
                    <svg fill={item.isFavorite ? "currentColor" : "none"} height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if(confirm('삭제할까요?')) onDelete(item.id); }} className="hover:text-[#EF4444] transition-colors">
                    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Context Menu Overlay - Master Sync */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'fixed', top: Math.min(contextMenu.y, window.innerHeight - 120), left: Math.min(contextMenu.x, window.innerWidth - 160), zIndex: 9999 }}
            className="w-36 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleShare} className="w-full px-4 py-2.5 flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors">
              <svg className="w-4 h-4 text-[#38BDF8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              <span className="text-xs font-bold">공유하기</span>
            </button>
            <div className="h-[1px] bg-[var(--border-subtle)] mx-2"></div>
            <button onClick={handleCopy} className="w-full px-4 py-2.5 flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span className="text-xs font-bold">복사하기</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListView;
