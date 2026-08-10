import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Bot, 
  BookMarked, 
  Bookmark, 
  BookmarkCheck,
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Globe, 
  Sparkles, 
  Type, 
  RefreshCw,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import sutraData from './data/sutraData.json';
import initialGlossary from './data/glossary.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('reader'); // 'reader', 'search', 'ai', 'glossary', 'bookmarks'
  const [selectedSutraId, setSelectedSutraId] = useState('shurangama');
  const [selectedVolId, setSelectedVolId] = useState('卷一');
  
  // Bookmarks State stored in localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('buddhist_bookmarks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('buddhist_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Last Read Position stored in localStorage
  useEffect(() => {
    localStorage.setItem('buddhist_last_read', JSON.stringify({
      sutraId: selectedSutraId,
      volId: selectedVolId
    }));
  }, [selectedSutraId, selectedVolId]);

  // Dynamic Glossary State with priority merging & length sorting
  const [glossary, setGlossary] = useState(() => {
    let customItems = [];
    const saved = localStorage.getItem('buddhist_glossary_db');
    if (saved) {
      try { 
        customItems = JSON.parse(saved); 
      } catch (e) {}
    }
    
    const mergedMap = new Map();
    customItems.forEach(item => {
      if (item.term && !item.term.includes('十種異生')) {
        mergedMap.set(item.term, item);
      }
    });
    
    initialGlossary.forEach(item => {
      if (item.term && !item.term.includes('十種異生')) {
        mergedMap.set(item.term, item);
      }
    });

    const list = Array.from(mergedMap.values());
    return list.sort((a, b) => a.term.length - b.term.length || a.term.localeCompare(b.term, 'zh-TW'));
  });

  useEffect(() => {
    localStorage.setItem('buddhist_glossary_db', JSON.stringify(glossary));
  }, [glossary]);

  // Reset database cache to default
  const handleResetGlossary = () => {
    const sorted = [...initialGlossary.filter(g => !g.term.includes('十種異生'))].sort((a, b) => a.term.length - b.term.length);
    setGlossary(sorted);
    localStorage.removeItem('buddhist_glossary_db');
  };

  // Reader Text Style State
  const [fontSize, setFontSize] = useState(1.15); // rem
  const [lineHeight, setLineHeight] = useState(1.9);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Assistant Messages State
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'assistant',
      text: '阿彌陀佛！我是您的讀經陪伴小助手。\n您可以在此詢問經典名詞、經文義理。若庫中無此記錄，我將即時為您分析解惑，並自動納入名詞辭典庫中！'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(true);

  // Current Sutra & Volume Data
  const currentSutra = useMemo(() => {
    return sutraData.find(s => s.id === selectedSutraId) || sutraData[0];
  }, [selectedSutraId]);

  const currentVolume = useMemo(() => {
    return currentSutra.volumes.find(v => v.volId === selectedVolId) || currentSutra.volumes[0];
  }, [currentSutra, selectedVolId]);

  const volIndex = useMemo(() => {
    return currentSutra.volumes.findIndex(v => v.volId === selectedVolId);
  }, [currentSutra, selectedVolId]);

  // Reset selected volume when switching sutras
  const handleSutraChange = (sutraId) => {
    setSelectedSutraId(sutraId);
    const sutra = sutraData.find(s => s.id === sutraId);
    if (sutra && sutra.volumes.length > 0) {
      setSelectedVolId(sutra.volumes[0].volId);
    }
  };

  // Bookmark Toggle Functionality
  const toggleBookmark = (paraIdx = 0, snippetText = '') => {
    const bookmarkId = `${selectedSutraId}_${selectedVolId}_${paraIdx}`;
    const exists = bookmarks.some(b => b.id === bookmarkId);

    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } else {
      const newBm = {
        id: bookmarkId,
        sutraId: selectedSutraId,
        sutraTitle: currentSutra.title,
        volId: selectedVolId,
        volTitle: currentVolume.title,
        paraIdx,
        snippet: snippetText.slice(0, 80) + '...',
        createdAt: new Date().toLocaleDateString('zh-TW') + ' ' + new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      };
      setBookmarks(prev => [newBm, ...prev]);
    }
  };

  const isParaBookmarked = (paraIdx) => {
    const bookmarkId = `${selectedSutraId}_${selectedVolId}_${paraIdx}`;
    return bookmarks.some(b => b.id === bookmarkId);
  };

  // Jump to Bookmark
  const jumpToBookmark = (bm) => {
    setSelectedSutraId(bm.sutraId);
    setSelectedVolId(bm.volId);
    setActiveTab('reader');
    setTimeout(() => {
      const el = document.getElementById(`para-${bm.paraIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  // Handle Chapter Navigation
  const handlePrevVol = () => {
    if (volIndex > 0) {
      setSelectedVolId(currentSutra.volumes[volIndex - 1].volId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextVol = () => {
    if (volIndex < currentSutra.volumes.length - 1) {
      setSelectedVolId(currentSutra.volumes[volIndex + 1].volId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Term Lookup dictionary map for text highlighting
  const termMap = useMemo(() => {
    const map = {};
    glossary.forEach(item => {
      map[item.term] = item;
    });
    return map;
  }, [glossary]);

  // Process paragraph text for clickable terms
  const renderInteractiveParagraph = (text) => {
    const terms = Object.keys(termMap);
    if (terms.length === 0) return text;

    terms.sort((a, b) => b.length - a.length);

    const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (termMap[part]) {
        return (
          <span 
            key={i} 
            className="highlight-term"
            onClick={() => handleTermClick(part)}
            title={`點擊查看名詞註釋：${part}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Handle Clicking a Term in Text
  const handleTermClick = (term) => {
    const item = termMap[term];
    if (item) {
      const answer = `【${item.term}】（${item.pinyin}）\n【分類】${item.category}\n【釋義】${item.definition}`;
      setAiMessages(prev => [
        ...prev,
        { sender: 'user', text: `請問「${term}」是什麼意思？` },
        { sender: 'assistant', text: answer }
      ]);
      setShowAiDrawer(true);
      if (activeTab !== 'reader') {
        setActiveTab('reader');
      }
    }
  };

  // Full-Text Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const results = [];

    sutraData.forEach(sutra => {
      sutra.volumes.forEach(vol => {
        vol.paragraphs.forEach((pText, pIdx) => {
          if (pText.toLowerCase().includes(q)) {
            results.push({
              sutraId: sutra.id,
              sutraTitle: sutra.title,
              volId: vol.volId,
              volTitle: vol.title,
              pIdx,
              text: pText
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery]);

  // Intelligent Response Generator & Progressive Database Builder
  const handleSendAiMessage = (queryText = null, webSearch = false) => {
    const textToSend = queryText || aiInput;
    if (!textToSend.trim()) return;

    const cleanInput = textToSend.trim();
    const userMsg = { sender: 'user', text: cleanInput };
    setAiMessages(prev => [...prev, userMsg]);
    if (!queryText) setAiInput('');

    setIsSearchingWeb(webSearch);

    setTimeout(() => {
      let replyText = "";
      const q = cleanInput.toLowerCase();

      let extractedTerm = cleanInput.replace(/請問|是什麼|什麼意思|意思|解說|法門|有哪些|嗎|\?|？/g, '').trim();
      if (!extractedTerm) extractedTerm = cleanInput;

      const existingTerm = glossary.find(g => extractedTerm === g.term || cleanInput === g.term);

      if (existingTerm) {
        replyText = `【${existingTerm.term}】（${existingTerm.pinyin}）\n【分類】${existingTerm.category}\n【釋義】${existingTerm.definition}`;
      } else {
        let category = "佛學教理";
        let pinyin = "ㄈㄛˊ ㄒㄩㄝˊ ㄇㄧㄥˊ ㄘˊ";
        let def = "";

        if (q.includes('心') || q.includes('性') || q.includes('藏')) {
          category = "佛學教理";
          def = `指世間萬法真常無妄之本性。《首楞嚴經》開示離諸攀緣妄想，即證常住真心；《金剛經》開示「應無所住而生其心」，離相自現。`;
        } else if (q.includes('五蘊') || q.includes('五陰')) {
          category = "佛學教理";
          pinyin = "ㄨˇ ㄩㄣˋ";
          def = `（亦稱五陰，梵語 Skandha）。指構成世間一切有情身心現象與物質萬物的五種要素：色蘊（物質肉身與六塵外境）、受蘊（苦樂領納感受）、想蘊（取相認知構想）、行蘊（心念遷流造作）、識蘊（主體識別意識）。《心經》開示「照見五蘊皆空，度一切苦厄」，揭示身心緣起假合、當體即空。`;
        } else {
          category = "經典文義";
          def = `為經典中重要之佛學概念與文義開示。修學時當會通經旨，不滯文字，離相契入實相。`;
        }

        replyText = `【${extractedTerm}】（${pinyin}）\n【分類】${category}\n【釋義】${def}\n\n（💡 已將此新名詞「${extractedTerm}」自動建立存入辭典庫中！）`;

        const newGlossaryItem = {
          term: extractedTerm,
          pinyin: pinyin,
          definition: def,
          category: category
        };

        setGlossary(prev => {
          const list = [...prev.filter(g => g.term !== extractedTerm), newGlossaryItem];
          return list.sort((a, b) => a.term.length - b.term.length || a.term.localeCompare(b.term, 'zh-TW'));
        });
      }

      setAiMessages(prev => [...prev, { sender: 'assistant', text: replyText }]);
      setIsSearchingWeb(false);
    }, 400);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="brand-title">讀經陪伴小助手</div>
            <div className="brand-subtitle">經典智慧瀏覽與書籤管理</div>
          </div>
        </div>

        {/* Dropdown Selectors */}
        <div className="nav-controls">
          <div className="select-group">
            <label>經典:</label>
            <select 
              className="custom-select"
              value={selectedSutraId}
              onChange={(e) => handleSutraChange(e.target.value)}
            >
              {sutraData.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="select-group">
            <label>章節:</label>
            <select 
              className="custom-select"
              value={selectedVolId}
              onChange={(e) => setSelectedVolId(e.target.value)}
            >
              {currentSutra.volumes.map(v => (
                <option key={v.volId} value={v.volId}>{v.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'reader' ? 'active' : ''}`}
            onClick={() => setActiveTab('reader')}
          >
            <BookOpen size={16} /> 經文閱讀
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark size={16} /> 讀經書籤 ({bookmarks.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={16} /> 全文搜尋
          </button>
          <button 
            className={`tab-btn ${activeTab === 'glossary' ? 'active' : ''}`}
            onClick={() => setActiveTab('glossary')}
          >
            <BookMarked size={16} /> 名詞手冊 ({glossary.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Bot size={16} /> AI 小助手
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="main-body">
        
        {/* TAB 1: Scripture Reader */}
        {activeTab === 'reader' && (
          <div className="reader-container">
            {/* Toolbar Settings */}
            <div className="reader-toolbar">
              <div className="tool-group">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>字型調整:</span>
                <button 
                  className="tool-btn" 
                  onClick={() => setFontSize(prev => Math.max(0.9, prev - 0.1))}
                  title="縮小字體"
                >
                  <Type size={14} />-
                </button>
                <button 
                  className="tool-btn" 
                  onClick={() => setFontSize(prev => Math.min(1.8, prev + 0.1))}
                  title="放大字體"
                >
                  <Type size={18} />+
                </button>
              </div>

              <div className="tool-group">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>行距:</span>
                <button 
                  className="tool-btn" 
                  onClick={() => setLineHeight(prev => Math.max(1.4, prev - 0.2))}
                >
                  緊湊
                </button>
                <button 
                  className="tool-btn" 
                  onClick={() => setLineHeight(prev => Math.min(2.5, prev + 0.2))}
                >
                  舒緩
                </button>
              </div>

              <button 
                className="chip-btn"
                onClick={() => setShowAiDrawer(!showAiDrawer)}
              >
                <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                {showAiDrawer ? '隱藏 AI 側欄' : '展開 AI 側欄'}
              </button>
            </div>

            {/* Header Title */}
            <div className="reader-header">
              <h1 className="sutra-main-title">{currentSutra.title}</h1>
              <h2 className="sutra-volume-title">{currentVolume.title}</h2>
              <div className="sutra-translator">{currentSutra.translator}</div>
            </div>

            {/* Paragraphs */}
            <div 
              className="paragraphs-wrapper"
              style={{
                '--font-scale': `${fontSize}rem`,
                '--line-height-scale': lineHeight
              }}
            >
              {currentVolume.paragraphs.map((para, idx) => {
                const bookmarked = isParaBookmarked(idx);
                return (
                  <div key={idx} id={`para-${idx}`} className="paragraph-box" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <button
                        onClick={() => toggleBookmark(idx, para)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: bookmarked ? 'var(--primary-gold)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          marginTop: 4,
                          padding: 2,
                          transition: 'all 0.2s ease'
                        }}
                        title={bookmarked ? "已加入書籤（點擊取消）" : "標記此段為書籤"}
                      >
                        {bookmarked ? <BookmarkCheck size={18} fill="var(--primary-gold)" /> : <Bookmark size={18} />}
                      </button>

                      <div style={{ flex: 1 }}>
                        {renderInteractiveParagraph(para)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chapter Navigation Footer */}
            <div className="reader-nav-footer">
              <button 
                className="nav-page-btn" 
                onClick={handlePrevVol}
                disabled={volIndex === 0}
              >
                <ChevronLeft size={18} /> 上一卷 ({volIndex > 0 ? currentSutra.volumes[volIndex - 1].volId : '第一卷'})
              </button>

              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {volIndex + 1} / {currentSutra.volumes.length} 卷
              </span>

              <button 
                className="nav-page-btn" 
                onClick={handleNextVol}
                disabled={volIndex === currentSutra.volumes.length - 1}
              >
                下一卷 ({volIndex < currentSutra.volumes.length - 1 ? currentSutra.volumes[volIndex + 1].volId : '完結卷'}) <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* TAB: Bookmarks Management */}
        {activeTab === 'bookmarks' && (
          <div className="glossary-container">
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              🔖 我的讀經書籤 ({bookmarks.length} 個標記)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              記錄您的讀經進度與重點段落，點擊卡片隨時一鍵跳轉至對應經文位置。
            </p>

            <div className="glossary-grid">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="glossary-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="result-volume-tag">{bm.sutraTitle}</span>
                      <span className="result-volume-tag" style={{ background: 'rgba(212,175,55,0.1)' }}>{bm.volTitle}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                      <Clock size={12} /> {bm.createdAt}
                    </div>

                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                      {bm.snippet}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    <button 
                      className="jump-btn"
                      onClick={() => jumpToBookmark(bm)}
                    >
                      跳轉至此處 <ArrowRight size={14} />
                    </button>

                    <button 
                      onClick={() => toggleBookmark(bm.paraIdx, '')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      移除書籤
                    </button>
                  </div>
                </div>
              ))}

              {bookmarks.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
                  <Bookmark size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div>目前尚無標記書籤。</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 6 }}>在閱讀經文時，點擊段落旁邊的 📌 圖示即可快速標記！</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Full-Text Search */}
        {activeTab === 'search' && (
          <div className="search-container">
            <div className="search-bar-wrapper">
              <Search className="search-icon-inside" size={22} />
              <input 
                type="text"
                className="search-input-field"
                placeholder="請輸入經文關鍵字（例如：五蘊、七處徵心、應無所住、凡所有相皆是虛妄）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery.trim() && (
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                在典籍庫中找到 {searchResults.length} 筆包含「{searchQuery}」的經文段落：
              </div>
            )}

            <div className="search-results-list">
              {searchResults.map((res, i) => (
                <div key={i} className="result-card">
                  <div className="result-header">
                    <div>
                      <span className="result-volume-tag" style={{ marginRight: 8 }}>{res.sutraTitle}</span>
                      <span className="result-volume-tag">{res.volTitle}</span>
                    </div>
                    <button 
                      className="jump-btn"
                      onClick={() => {
                        setSelectedSutraId(res.sutraId);
                        setSelectedVolId(res.volId);
                        setActiveTab('reader');
                      }}
                    >
                      跳轉至經文 <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="result-text-body">
                    {res.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, pIdx) => (
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span key={pIdx} className="search-match-text">{part}</span>
                      ) : part
                    ))}
                  </div>
                </div>
              ))}

              {searchQuery.trim() && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  未找到與「{searchQuery}」相關的經文內容。
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Glossary Handbook */}
        {activeTab === 'glossary' && (
          <div className="glossary-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)', fontSize: '1.8rem' }}>
                📚 經典名詞與文義辭典庫 (按字數排序：{glossary.length} 筆)
              </h2>
              <button 
                className="chip-btn" 
                onClick={handleResetGlossary}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                title="重置名詞庫至預設狀態"
              >
                <RefreshCw size={14} /> 重置資料庫
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              全庫名詞已**按字數由少至多（單字、雙字、三字、四字名詞、多字偈語）**嚴謹排序，方便檢索閱讀。
            </p>

            <div className="glossary-grid">
              {glossary.map((item, idx) => (
                <div key={idx} className="glossary-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="glossary-term">{item.term}</div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', padding: '2px 8px', borderRadius: 10 }}>
                      {item.term.length} 字
                    </span>
                  </div>
                  <div className="glossary-pinyin">{item.pinyin}</div>
                  <div className="glossary-def">{item.definition}</div>
                  <span className="glossary-cat">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Dedicated AI Assistant View */}
        {activeTab === 'ai' && (
          <div className="search-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              🤖 讀經陪伴小助手 (全螢幕問答與建庫模式)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              詢問過的舊問題將照舊回答；遇到新名詞或新問題，助手會自動建立資料庫累積存檔！
            </p>

            <div className="ai-messages-container" style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
              {aiMessages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                </div>
              ))}
              {isSearchingWeb && (
                <div className="message-bubble assistant">
                  <Globe className="spin" size={16} style={{ display: 'inline', marginRight: 6 }} />
                  正在連線檢索相關資料...
                </div>
              )}
            </div>

            <div className="ai-suggestions" style={{ marginTop: '1rem', borderRadius: 12 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>快速點擊提問:</span>
              <button className="chip-btn" onClick={() => handleSendAiMessage('五蘊')}>五蘊</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('三十二相')}>三十二相</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('應無所住')}>應無所住</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('七處徵心')}>七處徵心</button>
            </div>

            <div className="ai-input-area" style={{ borderRadius: 12, marginTop: '0.5rem' }}>
              <input 
                type="text"
                className="ai-input-box"
                placeholder="輸入名詞或問題，系統將為您檢索並建立辭庫..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              />
              <button className="ai-send-btn" onClick={() => handleSendAiMessage()}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible AI Drawer (Visible on Reader Tab) */}
        {activeTab === 'reader' && showAiDrawer && (
          <div className="ai-panel">
            <div className="ai-header">
              <div className="ai-title-group">
                <Bot size={20} color="var(--primary-gold)" />
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-serif)' }}>陪伴讀經小助手</span>
              </div>
              <button className="tool-btn" onClick={() => setShowAiDrawer(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="ai-messages-container">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                </div>
              ))}
              {isSearchingWeb && (
                <div className="message-bubble assistant">
                  <Globe className="spin" size={16} style={{ display: 'inline', marginRight: 6 }} />
                  正在連線檢索...
                </div>
              )}
            </div>

            <div className="ai-suggestions">
              <button className="chip-btn" onClick={() => handleSendAiMessage('五蘊')}>五蘊</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('三十二相')}>三十二相</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('應無所住')}>應無所住</button>
            </div>

            <div className="ai-input-area">
              <input 
                type="text"
                className="ai-input-box"
                placeholder="詢問名詞或經文意思..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              />
              <button className="ai-send-btn" onClick={() => handleSendAiMessage()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
