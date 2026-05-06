import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { tts } from '../utils/tts';

const PlayerView = ({
  question, total, current, onNext, onPrev, onJump, onToggleFavorite, onMarkWrong, onEdit,
  ttsSettings, onTtsChange, autoNext, onToggleAutoNext, fontSize, skipCitations
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  
  const isComponentMounted = useRef(true);
  const playbackTimerRef = useRef(null);
  const currentPartIndexRef = useRef(0);
  const currentPartsRef = useRef([]);
  const lastProcessedIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const showAnswerRef = useRef(false);
  
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      tts.stop();
    };
  }, []);

  const handleContextMenu = (e) => {
    if (e) e.preventDefault();
    const x = e?.clientX || (e?.touches ? e.touches[0].clientX : window.innerWidth / 2);
    const y = e?.clientY || (e?.touches ? e.touches[0].clientY : window.innerHeight / 2);
    setContextMenu({ x, y });
  };

  const startLongPress = (e) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      handleContextMenu({ preventDefault: () => {}, clientX: x, clientY: y });
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ListenUp 공유', text: question.question });
      } else {
        alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      }
    } catch (err) { console.error('Share error:', err); }
    setContextMenu(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(question.question);
    alert('클립보드에 복사되었습니다.');
    setContextMenu(null);
  };

  const cleanForTts = (text) => {
    if (!text) return "";
    let cleaned = text.toString().replace(/\r\n/g, '\n');
    if (skipCitations) {
      cleaned = cleaned.replace(/①/g, ' 1번 ').replace(/②/g, ' 2번 ').replace(/③/g, ' 3번 ').replace(/④/g, ' 4번 ').replace(/⑤/g, ' 5번 ')
                       .replace(/[●•·]/g, ' ').replace(/\*\*/g, '').replace(/\[BLOCK\]/g, ' ');
    }
    return cleaned;
  };

  const prepareParts = useCallback(() => {
    if (!question) return;
    const parts = [];
    let combinedRaw = "";
    if (!question.answer || question.answer === 'NOTE') {
      combinedRaw = (question.question || "") + " [BLOCK] " + (question.explanation || "");
    } else {
      // For normal items or Help items with answers
      combinedRaw = (question.question || "") + " [BLOCK] [ANSWER_TRIGGER] [BLOCK] " + (question.answer || "") + " [BLOCK] " + (question.explanation || "");
    }
    const blocks = combinedRaw.split(/\[BLOCK\]/).filter(s => s.trim().length > 0);
    blocks.forEach((block) => {
      const lines = block.split(/\n/).map(s => s.trim()).filter(s => s.length > 0);
      lines.forEach((line, idx) => {
        parts.push({ text: line.replace(/\[ANSWER_TRIGGER\]/g, '').trim(), isTrigger: line.includes('[ANSWER_TRIGGER]'), isNewBox: idx === 0 });
      });
    });
    currentPartsRef.current = parts;
  }, [question]);

  const playPart = (index) => {
    const parts = currentPartsRef.current;
    if (!isComponentMounted.current || !isPlayingRef.current || !parts || !parts[index]) return;
    if (index >= parts.length) {
      if (autoNext) playbackTimerRef.current = setTimeout(onNext, 1500);
      else { setIsPlaying(false); isPlayingRef.current = false; }
      return;
    }
    currentPartIndexRef.current = index; setCurrentPartIndex(index);
    if (parts[index].isTrigger && !showAnswerRef.current) { setIsPlaying(false); isPlayingRef.current = false; tts.stop(); return; }
    tts.speak(cleanForTts(parts[index].text), () => {
      if (!isComponentMounted.current || !isPlayingRef.current) return;
      playbackTimerRef.current = setTimeout(() => playPart(index + 1), parts[index+1]?.isNewBox ? 800 : 300);
    });
  };

  useEffect(() => {
    if (!question || question.id === lastProcessedIdRef.current) return;
    lastProcessedIdRef.current = question.id;
    prepareParts(); setCurrentPartIndex(0); currentPartIndexRef.current = 0; 
    const shouldShow = question.category === '도움말';
    setShowAnswer(shouldShow); showAnswerRef.current = shouldShow;
    if (isPlaying) { tts.stop(); playPart(0); }
  }, [question?.id, prepareParts, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); isPlayingRef.current = false; tts.pause(); }
    else { setIsPlaying(true); isPlayingRef.current = true; if (tts.canResume()) tts.resume(); else playPart(currentPartIndexRef.current); }
  };

  const handleAnswerClick = () => {
    if (!showAnswer) {
      setShowAnswer(true); showAnswerRef.current = true;
      const triggerIdx = currentPartsRef.current.findIndex(p => p.isTrigger);
      tts.stop(); setIsPlaying(true); isPlayingRef.current = true;
      playPart(triggerIdx !== -1 ? triggerIdx + 1 : 0);
    } else { setShowAnswer(false); showAnswerRef.current = false; tts.stop(); setIsPlaying(false); isPlayingRef.current = false; }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] relative overflow-hidden font-sans">
      <header className="px-4 py-3 pt-12 flex flex-col gap-4 shrink-0 z-20">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-baseline whitespace-nowrap">
            <span className="text-[#4285F4] text-xl font-bold">{current}</span>
            <span className="text-[var(--text-muted)] text-sm font-medium mx-0.5">/</span>
            <span className="text-[var(--text-muted)] text-sm font-medium">{total}</span>
            <span className="text-[var(--text-muted)] text-xs ml-1.5 font-medium opacity-60">[{question?.incorrectCount || 0}]</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => onTtsChange({...ttsSettings, rate: ttsSettings.rate >= 2.0 ? 0.8 : ttsSettings.rate + 0.2})} className="px-2 py-1 bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold rounded-full border border-[var(--border-subtle)] min-w-[36px]">{ttsSettings.rate.toFixed(1)}x</button>
            
            <button className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
            
            <button onClick={onToggleAutoNext} className={`btn-icon ${autoNext ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
            
            <button className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
            
            <button className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
            
            <button onClick={togglePlay} className="btn-icon">
              {isPlaying ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>}
            </button>
            
            <button onClick={() => onEdit(question)} className="btn-icon"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
            
            <button onClick={onToggleFavorite} className={`btn-icon ${question?.isFavorite ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>
              <svg className="w-4 h-4" fill={question?.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
        </div>
        
        <div className="w-full h-[2px] bg-[var(--border-subtle)] relative">
          <div className="absolute left-0 top-0 h-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-soft)] transition-all duration-300" style={{ width: `${(current/total)*100}%` }}></div>
        </div>
      </header>

      <main className="flex-grow px-5 py-2 overflow-y-auto hide-scrollbar z-10">
        <div 
          className="premium-card rounded-3xl p-6 min-h-[140px] flex flex-col justify-between shadow-xl select-none"
          onContextMenu={handleContextMenu}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{question?.category || '전 체'}</span>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm">
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"></path></svg>
              <span className="text-[11px] font-bold text-red-500 whitespace-nowrap">1회</span>
            </div>
          </div>
          {(() => {
            const formatQuestion = (text) => {
              if (!text) return "";
              let formatted = text.replace(/<br\s*\/?>/gi, '\n');
              formatted = formatted.replace(/([^\n])\s*(①|\(1\)|1\))/g, '$1\n$2');
              return formatted;
            };

            return (
              <div className="mt-4 flex items-start gap-3 font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-keep" style={{ fontSize: `${fontSize}px` }}>
                <span className="flex-grow">{formatQuestion(question?.question)}</span>
              </div>
            );
          })()}
        </div>
 
        <AnimatePresence>
          {showAnswer && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
              <div 
                className="premium-card rounded-2xl p-6 border-l-4 border-[var(--accent)] select-none shadow-md"
                onContextMenu={handleContextMenu}
                onTouchStart={startLongPress}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
              >
                <div className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest mb-2">Answer</div>
                <div className="text-[var(--text-primary)] font-medium leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{question?.answer}</div>
              </div>
              {question?.explanation && (
                <div className="premium-card rounded-2xl p-6 bg-[var(--accent-soft)]/20 border border-[var(--border-subtle)] shadow-sm">
                  <div className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest mb-3">Explanation</div>
                  <div className="text-[var(--text-secondary)] font-normal leading-relaxed max-w-none" style={{ fontSize: `${fontSize}px` }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.explanation}</ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <section className="py-4 border-t border-[var(--border-subtle)] px-4 shrink-0 z-20 bg-[var(--bg-app)]">
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => onJump(0)} className="btn-page text-[var(--accent)] border-[var(--border-subtle)] active:bg-[var(--accent-soft)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
            <button onClick={onPrev} className="btn-page text-[var(--text-primary)] border-[var(--border-subtle)] active:bg-[var(--accent-soft)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
          
          <div className="flex gap-1 items-center overflow-hidden">
            {(() => {
              const displayCount = Math.min(4, total);
              let start = Math.max(1, current - 1);
              if (start + displayCount - 1 > total) {
                start = Math.max(1, total - displayCount + 1);
              }
              if (current === 1) start = 1;
              
              return Array.from({ length: displayCount }, (_, i) => start + i).map(n => (
                <button key={n} onClick={() => onJump(n-1)} className={`btn-page ${n === current ? 'btn-page-active' : ''}`}>{n}</button>
              ));
            })()}
          </div>
          
          <div className="flex gap-1.5 items-center shrink-0">
            <button onClick={handleAnswerClick} className={`px-4 h-[32px] flex items-center justify-center text-[12px] font-bold transition-all rounded-full border whitespace-nowrap ${showAnswer ? 'bg-[#38BDF8] text-white border-[#38BDF8]' : 'text-[#38BDF8] premium-card glow-blue border-[#38BDF8]/30 shadow-sm'}`}>
              {showAnswer ? '숨기기' : '정답'}
            </button>
            <button onClick={onNext} className="btn-page text-[var(--text-primary)] border-[var(--border-subtle)] active:bg-[var(--accent-soft)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
            <button onClick={() => onJump(total - 1)} className="btn-page text-[var(--accent)] border-[var(--border-subtle)] active:bg-[var(--accent-soft)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {contextMenu && (
          <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)}>
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerView;
