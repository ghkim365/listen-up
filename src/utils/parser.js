/**
 * Parser for Bulk Import Questions
 */

export const parseBulkQuestions = (text) => {
  if (!text || !text.trim()) return [];

  // Normalize and split into blocks. 
  // A new question typically starts with '#' or a number like '12.' or '12('
  // We also try to split by '①' IF it's likely a new question (not just a choice), but for now,
  // let's stick to the user's established practice of # or number.
  const blocks = text.split(/\n(?=#|\d+[\.\(\)])/).filter(b => b.trim());

  return blocks.map(block => {
    const lines = block.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return null;

    let id = Date.now() + Math.random();
    let count = 0;
    let category = '미분류';
    let type = 'note';
    let questionLines = [];
    let explanationLines = [];
    let answer = 'NOTE';
    let foundAnswer = false;

    // First line category extraction
    const firstLine = lines[0].trim();
    const catMatch = firstLine.match(/\((\d+)회?\s*(\d+)\)/);
    if (catMatch) {
      category = catMatch[2] + '과목';
    }

    // Handle '#' for incorrectCount
    let startLineIdx = 0;
    if (firstLine.startsWith('#')) {
      const hashMatch = firstLine.match(/^(#+)/);
      count = hashMatch ? hashMatch[1].length : 1;
      // Skip the hash line if it's just the hash, otherwise clean it
      if (firstLine.replace(/^#+\s*/, '').length === 0) {
        startLineIdx = 1;
      } else {
        lines[0] = firstLine.replace(/^#+\s*/, '');
      }
    }

    for (let i = startLineIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!foundAnswer) {
            // Check for Answer Line
            // 1. Just the circled number (e.g. "⑤")
            // 2. Circled number + "번" (e.g. "⑤번")
            // 3. Circled number + "정답" (e.g. "⑤ 정답")
            const isSingleCharAnswer = line.match(/^[①-⑳]$/);
            const isLabeledAnswer = line.match(/^[①-⑳]\s*(번|정답|답:)/) || line.match(/^(정답|답:)\s*[①-⑳]/);
            const containsAnswerLabel = line.includes('정답:') || line.includes('답:') || line.endsWith('가 정답') || line.endsWith('이 정답');

            // HEURISTIC: If we have choices above and now we see a single char line that matches choices, it's the answer.
            const isHeuristicAnswer = isSingleCharAnswer && questionLines.some(ql => ql.includes('①') || ql.includes('②') || ql.includes('③'));

            if (isHeuristicAnswer || isLabeledAnswer || containsAnswerLabel) {
                foundAnswer = true;
                type = 'question';
                const charMatch = line.match(/[①-⑳]/);
                answer = charMatch ? charMatch[0] : (line.match(/\d+/) ? line.match(/\d+/)[0] : '?');
                
                // If the line has more meat (explanation), add it to explanation
                if (line.length > 5 || isLabeledAnswer || containsAnswerLabel) {
                    explanationLines.push(lines[i]);
                }
                continue;
            }
            
            questionLines.push(lines[i]);
        } else {
            explanationLines.push(lines[i]);
        }
    }

    const questionText = questionLines.join('\n').trim();
    // Re-check type if foundAnswer was false
    if (!foundAnswer && (questionText.includes('①') || questionText.includes('②'))) {
        type = 'question';
        answer = '?'; // Still a question but answer lost
    }

    return {
      id,
      type,
      question: questionText,
      answer: type === 'note' ? 'NOTE' : answer,
      explanation: processExplanation(explanationLines.join('\n').trim()),
      category: category,
      incorrectCount: count,
      isFavorite: false
    };
  }).filter(q => q !== null);
};

/**
 * Intelligent explanation formatter
 * Converts plain text definitions into styled markdown boxes (blockquotes)
 */
export const processExplanation = (text) => {
  if (!text) return "";
  // Pre-process: split bunched lines (e.g. lines ending with "사항" but followed by more text)
  let processedText = text.replace(/(사항|경우|내용)( +)/g, '$1\n');
  
  // Replace tabs or multiple spaces with markdown table syntax
  const lines = processedText.split('\n').map(line => {
    // If it contains a tab OR at least 3 consecutive spaces, treat as table
    if (line.includes('\t') || line.match(/ {3,}/)) {
      const cells = line.split(/\t| {3,}/).filter(c => c.trim());
      if (cells.length > 1) {
        return `| ${cells.join(' | ')} |`;
      }
    }
    return line;
  });

  let result = [];
  let currentBox = [];
  let isInsideTable = false;
  
  const flushBox = () => {
    if (currentBox.length > 0) {
      result.push(`> ${currentBox.join('  \n> ')}`);
      result.push("");
      currentBox = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      // 다음 줄이 불렛 기호로 시작하면 박스를 닫지 않고 유지 (빈 줄 허용)
      const nextLine = lines[i+1]?.trim();
      const isNextBullet = nextLine && nextLine.match(/^[•\-·*→㉠-㉭㉮-㉿ⓐ-ⓩ㈎-㈿⑴-⒇]/);
      if (currentBox.length > 0 && isNextBullet) {
        continue;
      }
      flushBox();
      isInsideTable = false;
      continue;
    }

    // Circle numbers (①~⑳...) should start a NEW box
    if (line.match(/^[①-⑳]/)) {
      flushBox();
      currentBox.push(line);
      continue;
    }
    
    // Arrows (→) and other markers continue the box or start a new one if empty
    if (line.match(/^[→\d\.\-•·]/)) {
      currentBox.push(line);
      continue;
    }

    // Table Handling
    if (line.startsWith('|') && line.endsWith('|')) {
      flushBox();
      if (!isInsideTable) {
        // Add header separator if it's the start of a table and none exists
        const cellCount = (line.match(/\|/g) || []).length - 1;
        result.push(line);
        result.push(`| ${Array(cellCount).fill('---').join(' | ')} |`);
        isInsideTable = true;
      } else {
        result.push(line);
      }
      continue;
    }

    isInsideTable = false;

    // Pattern Detection for Auto-Boxing
    const isBullet = line.match(/^[•\-·*→㉠-㉭㉮-㉿ⓐ-ⓩ㈎-㈿⑴-⒇①-⑳]/) || line.startsWith('•') || line.startsWith('-') || line.startsWith('·') || line.startsWith('*');
    const isDefinition = line.includes('함은') || line.includes('말한다') || line.includes('의한다');
    const isCitation = line.match(/\(법\s*\d+조.*\)/);
    const isHeader = line.match(/^[①-⑳]/) || line.match(/^\d\.\s/);
    // Generic list items (e.g., lines ending with "사항")
    const isListItem = line.endsWith('사항') || line.endsWith('경우') || line.endsWith('내용') || line.endsWith('자');

    if (isHeader) {
      flushBox();
      result.push(""); // Ensure blank line before header
      result.push(`### ${line}`); 
      result.push("");
    } else if (isCitation) {
      flushBox();
      result.push(`${line}`);
      result.push("");
    } else if (isBullet || isDefinition || isListItem) {
      currentBox.push(line);
    } else {
      if (currentBox.length > 0) {
        currentBox.push(line);
      } else {
        // Preserve soft line breaks
        result.push(line + "  \n"); 
      }
    }
  }
  
  flushBox();
  return result.join('\n');
};
