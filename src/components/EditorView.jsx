import React, { useState, useEffect } from 'react';

const Icon = ({ name, className = "" }) => <i className={`fa-solid fa-${name} ${className}`}></i>;

const EditorView = ({ editingItem, existingCategories, lastUsedCategory, onSave, onBulkSave, onCancel }) => {
  const [tab, setTab] = useState('single'); // single, bulk
  const [mode, setMode] = useState('question'); // question, note
  const [category, setCategory] = useState(lastUsedCategory || '일반');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (editingItem) {
      setQuestionText(editingItem.question || '');
      setAnswerText(editingItem.answer || '');
      setExplanationText(editingItem.explanation || '');
      setCategory(editingItem.category || '일반');
    }
  }, [editingItem]);

  const handleSave = () => {
    if (!questionText.trim()) { alert('내용을 입력하세요.'); return; }
    onSave({
      question: questionText,
      answer: mode === 'note' ? 'NOTE' : answerText,
      explanation: explanationText,
      category: category
    });
  };

  const handleBulkParse = () => {
    const blocks = bulkText.split('\n\n').filter(b => b.trim());
    const newList = blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim());
      const question = lines[0];
      let answer = 'NOTE';
      let explanation = '';
      const ansIdx = lines.findIndex(l => l.startsWith('정답:'));
      if (ansIdx !== -1) {
        answer = lines[ansIdx].replace('정답:', '').trim();
        explanation = lines.slice(ansIdx + 1).join('\n');
      } else {
        explanation = lines.slice(1).join('\n');
      }
      return { question, answer, explanation, category };
    });
    onBulkSave(newList);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              const imgTag = `\n![image](${e.target.result})\n`;
              setExplanationText(prev => prev + imgTag);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    } catch (e) { alert('이미지 붙여넣기 실패'); }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {/* Header - Master Sync */}
      <header className="pt-14 px-6 pb-4 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{editingItem ? '문제 수정' : '문제 추가'}</h1>
        
        <div className="flex bg-[var(--bg-item)] rounded-xl p-1 text-[12px] font-bold border border-[var(--border-subtle)]">
          <button onClick={() => setTab('single')} className={`px-4 py-1.5 rounded-lg transition-all ${tab === 'single' ? 'bg-[#2282b9] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>개별 입력</button>
          <button onClick={() => setTab('bulk')} className={`px-4 py-1.5 rounded-lg transition-all ${tab === 'bulk' ? 'bg-[#2282b9] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>대량 불러오기</button>
        </div>

        <button onClick={onCancel} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 transition-colors">
          <Icon name="xmark" className="text-2xl" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar space-y-6 pb-40">
        {tab === 'single' ? (
          <>
            {/* Input Mode */}
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="text-[#2282b9]">◆</span> 입력 모드
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMode('question')} className={`py-3.5 rounded-xl border text-[13px] font-bold transition-all ${mode === 'question' ? 'bg-[#2282b9]/10 border-[#2282b9]/40 text-[#2282b9]' : 'bg-[var(--bg-item)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>문제 형식 (①~⑤)</button>
                <button onClick={() => setMode('note')} className={`py-3.5 rounded-xl border text-[13px] font-bold transition-all ${mode === 'note' ? 'bg-[#2282b9]/10 border-[#2282b9]/40 text-[#2282b9]' : 'bg-[var(--bg-item)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>암기 노트 (내용 중심)</button>
              </div>
            </section>

            {/* Category */}
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="text-[#2282b9]">◇</span> 과목 선택
              </h2>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-xl py-3.5 px-5 text-[var(--text-primary)] text-[14px] focus:ring-1 focus:ring-[#2282b9]/30 appearance-none"
                  >
                    {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    {!existingCategories.includes('일반') && <option value="일반">일반</option>}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                    <Icon name="chevron-down" className="text-xs" />
                  </div>
                </div>
                <button onClick={() => { const n = prompt('새 과목명:'); if(n) setCategory(n); }} className="px-5 bg-[var(--bg-item)] border border-[#2282b9]/20 rounded-xl text-[#2282b9] text-[13px] font-bold active:scale-95 transition-all">과목 추가</button>
              </div>
            </section>

            {/* Question Text */}
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="text-[#2282b9]">T</span> 문제 내용
              </h2>
              <textarea 
                value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                placeholder="학습할 질문을 입력하세요"
                className="w-full h-40 bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-2xl p-5 text-[var(--text-primary)] text-[15px] focus:ring-1 focus:ring-[#2282b9]/30 placeholder-[var(--text-muted)] resize-none leading-relaxed shadow-sm"
              />
            </section>

            {/* Answer & Explanation */}
            {mode === 'question' && (
              <section className="space-y-3">
                <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">정답</h2>
                <input 
                  type="text" value={answerText} onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="예: ① 한라산"
                  className="w-full bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-xl py-4 px-5 text-[var(--text-primary)] text-[15px] focus:ring-1 focus:ring-[#2282b9]/30 placeholder-[var(--text-muted)] shadow-sm"
                />
              </section>
            )}

            <section className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">해설 및 이미지</h2>
                <button onClick={handlePaste} className="text-[10px] font-bold text-[#2282b9] uppercase tracking-widest border border-[#2282b9]/20 px-3 py-1 rounded-full flex items-center gap-1.5 active:scale-95 transition-all">
                  <Icon name="image" className="text-[11px]" /> 이미지 붙여넣기
                </button>
              </div>
              <textarea 
                value={explanationText} onChange={(e) => setExplanationText(e.target.value)}
                placeholder="상세 설명 또는 이미지를 붙여넣으세요"
                className="w-full h-56 bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-2xl p-5 text-[var(--text-primary)] text-[15px] focus:ring-1 focus:ring-[#2282b9]/30 placeholder-[var(--text-muted)] resize-none leading-relaxed shadow-sm"
              />
            </section>

            <div className="pt-2 pb-20">
              <button onClick={handleSave} className="w-full h-16 bg-[#2282b9] text-white font-bold rounded-2xl shadow-xl shadow-[#2282b9]/20 text-[16px] active:scale-[0.98] transition-all">저장하기</button>
            </div>
          </>
        ) : (
          <section className="space-y-6">
            <h2 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="text-[#2282b9]">L</span> 대량 데이터 입력
            </h2>
            <div className="bg-[#2282b9]/5 border border-[#2282b9]/20 rounded-xl p-5">
              <p className="text-[11px] text-[#2282b9] leading-relaxed font-bold">질문 (첫 줄)<br/>정답: ① 답변 (중간 줄)<br/>해설 (나머지 줄)<br/><br/>위 형식으로 한 블록을 만들고, 두 번의 엔터(공백 라인)로 블록을 구분하세요.</p>
            </div>
            <textarea 
              value={bulkText} onChange={(e) => setBulkText(e.target.value)}
              placeholder="여기에 대량 데이터를 붙여넣으세요"
              className="w-full h-[400px] bg-[var(--bg-item)] border border-[var(--border-subtle)] rounded-2xl p-5 text-[var(--text-primary)] text-[14px] focus:ring-1 focus:ring-[#2282b9]/30 placeholder-[var(--text-muted)] resize-none font-mono"
            />
            <button onClick={handleBulkParse} className="w-full h-16 bg-[#2282b9] text-white font-bold rounded-2xl shadow-xl shadow-[#2282b9]/20 text-[16px] active:scale-[0.98] transition-all">일괄 저장하기</button>
          </section>
        )}
      </main>
    </div>
  );
};

export default EditorView;
