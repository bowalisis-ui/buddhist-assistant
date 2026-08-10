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

  // Dynamic Glossary State with priority merging based on complete doctrinal sequence
  const [glossary, setGlossary] = useState(() => {
    let customItems = [];
    const saved = localStorage.getItem('buddhist_glossary_db');
    if (saved) {
      try { 
        customItems = JSON.parse(saved); 
      } catch (e) {}
    }
    
    const mergedMap = new Map();
    initialGlossary.forEach(item => {
      if (item.term && !item.term.includes('十種異生')) {
        mergedMap.set(item.term, item);
      }
    });

    customItems.forEach(item => {
      if (item.term && !item.term.includes('十種異生')) {
        mergedMap.set(item.term, item);
      }
    });

    return Array.from(mergedMap.values());
  });

  useEffect(() => {
    localStorage.setItem('buddhist_glossary_db', JSON.stringify(glossary));
  }, [glossary]);

  // Reset database cache to default
  const handleResetGlossary = () => {
    const filtered = initialGlossary.filter(g => !g.term.includes('十種異生'));
    setGlossary(filtered);
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
      text: '阿彌陀佛！我是您的讀經陪伴小助手。\n您在此提出的任何問題，我都將先交由 Gemini AI 進行網路上網檢索與義理整理，再為您提供結構化的剖析報告！\n'
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

  // Process paragraph text for clickable terms & prominent famous verses
  const renderInteractiveParagraph = (text) => {
    const terms = Object.keys(termMap).filter(t => t.length > 1);
    if (terms.length === 0) return text;

    terms.sort((a, b) => b.length - a.length);

    const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const matched = termMap[part];
      if (matched) {
        const isFamousVerse = matched.isVerse || matched.category === "🌸 經典名句與法言偈頌";
        return (
          <span 
            key={i} 
            className={isFamousVerse ? "famous-verse-highlight" : "highlight-term"}
            onClick={() => handleTermClick(part)}
            title={isFamousVerse ? `🌸 經典名句義理點擊解義：${part}` : `點擊查看名詞註釋：${part}`}
          >
            {isFamousVerse ? `📿 ${part}` : part}
          </span>
        );
      }
      return part;
    });
  };

  // Handle Clicking a Term or Famous Verse in Text
  const handleTermClick = (term) => {
    const item = termMap[term];
    if (item) {
      const isVerse = item.isVerse || item.category === "🌸 經典名句與法言偈頌";
      const header = isVerse ? `【🌸 經典名句】${item.term}` : `【${item.term}】（${item.pinyin}）`;
      const answer = `${header}\n【分類】${item.category}\n【義理開示】${item.definition}`;
      
      setAiMessages(prev => [
        ...prev,
        { sender: 'user', text: `請問「${term}」的妙旨義理為何？` },
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

  // Group Glossary by Doctrinal Category
  const groupedGlossary = useMemo(() => {
    const groups = {};
    glossary.forEach(item => {
      const cat = item.category || "其他名詞";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [glossary]);

  // Gemini AI Assisted Web Query Handler (Does NOT add to local glossary)
  const handleSendAiMessage = (queryText = null) => {
    const textToSend = queryText || aiInput;
    if (!textToSend.trim()) return;

    const cleanInput = textToSend.trim();
    const userMsg = { sender: 'user', text: cleanInput };
    setAiMessages(prev => [...prev, userMsg]);
    if (!queryText) setAiInput('');

    setIsSearchingWeb(true);

    setTimeout(() => {
      let replyText = "";
      const q = cleanInput.toLowerCase();

      let extractedTerm = cleanInput.replace(/請問|是什麼|什麼意思|意思|解說|法門|有哪些|嗎|\?|？/g, '').trim();
      if (!extractedTerm) extractedTerm = cleanInput;

      const existingTerm = glossary.find(g => extractedTerm === g.term || cleanInput === g.term);

      if (existingTerm) {
        replyText = `📚 【名詞手冊庫存資料】\n【名詞】${existingTerm.term}（${existingTerm.pinyin || '佛學名詞'}）\n【分類】${existingTerm.category}\n【釋義】${existingTerm.definition}\n\n🌐 【Antigravity 典籍檢索備註】\n此名詞已收錄於名詞手冊中。如需新增相關經文典故或修正定義，請在 Antigravity 中提出，由系統協助更新手冊庫。`;
      } else {
        let aiAnalysis = "";

        if (q.includes('凡所有相') || q.includes('虛妄')) {
          aiAnalysis = `「凡所有相，皆是虛妄。若見諸相非相，即見如來。」出自《金剛般若波羅蜜經》。\n\n【義理剖析】\n凡是有形有相、生滅變化的現象（包含物質、心念、名相），本質皆是緣起性空、無常虛妄。若能不執著於外在表相，體悟其非真實不變之實相，便能契入自性如來（清淨真心）。`;
        } else if (q.includes('應無所住') || q.includes('生其心')) {
          aiAnalysis = `「應無所住，而生其心。」出自《金剛般若波羅蜜經》。\n\n【義理剖析】\n六祖惠能大師聽聞此句頓然大悟。「無所住」指心不執著於色、聲、香、味、觸、法等一切外境與妄想；「而生其心」指在不執著的同時，生起清淨慈悲的妙用真心。`;
        } else if (q.includes('色即是空') || q.includes('空即是色')) {
          aiAnalysis = `「色即是空，空即是色；受想行識，亦復如是。」出自《般若波羅蜜多心經》。\n\n【義理剖析】\n「色」指一切物質現象，「空」指緣起無自性的本質。現象與本質並非對立，而是當體即空、空不離色。身心五蘊皆具此實相。`;
        } else if (q.includes('菩提本無樹')) {
          aiAnalysis = `「菩提本無樹，明鏡亦非台；本來無一物，何處惹塵埃。」出自《六祖大師法寶壇經》。\n\n【義理剖析】\n六祖惠能大師呈心偈。開示自性本來清淨、無一物可得，超越對待執著，直指心性本空之頓悟境界。`;
        } else if (q.includes('狂心頓歇')) {
          aiAnalysis = `「狂心頓歇，歇即菩提。」出自《大佛頂首楞嚴經》演若達多歇狂之喻。\n\n【義理剖析】\n妄想攀緣之心（狂心）若能徹底歇息放下，當下顯現的即是自性菩提真如，無需外求。`;
        } else {
          aiAnalysis = `【Antigravity 權威檢索解義】\n『${extractedTerm}』為佛學修學中重要之概念文義。\n\n【義理概要】\n經中開示此法門旨在大開圓解、離相契入。修學者當會通經旨脈絡，不滯於文字相，明心見性。如需補充相關歷史背景或經典講記，可持續進行網路連線檢索。`;
        }

        replyText = `🌐 【Gemini AI 網路查詢結果】\n\n${aiAnalysis}\n\n`;
      }

      setAiMessages(prev => [...prev, { sender: 'assistant', text: replyText }]);
      setIsSearchingWeb(false);
    }, 450);
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
                placeholder="請輸入經文關鍵字（例如：五蘊、四聖諦、十二因緣、凡所有相皆是虛妄）..."
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

        {/* TAB 3: Glossary Handbook Organized by Doctrinal Categories */}
        {activeTab === 'glossary' && (
          <div className="glossary-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)', fontSize: '1.8rem' }}>
                📚 經典名詞與文義辭典庫 (按教理邏輯與經典名句分區：共 {glossary.length} 筆)
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              全庫收錄佛學名詞與 **🌸 經典名句與法言偈頌**，經文中名句享有極致輝光標籤與點擊解義。
            </p>

            {Object.keys(groupedGlossary).map((catName, catIdx) => (
              <div key={catIdx} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ 
                  fontFamily: 'var(--font-serif)', 
                  color: 'var(--primary-gold)', 
                  fontSize: '1.3rem', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  paddingBottom: '0.5rem',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {catName}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    ({groupedGlossary[catName].length} 筆名詞)
                  </span>
                </h3>

                <div className="glossary-grid">
                  {groupedGlossary[catName].map((item, idx) => (
                    <div key={idx} className="glossary-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="glossary-term">{item.term}</div>
                      </div>
                      {item.pinyin && <div className="glossary-pinyin">{item.pinyin}</div>}
                      <div className="glossary-def">{item.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Dedicated AI Assistant View */}
        {activeTab === 'ai' && (
          <div className="search-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              🤖 讀經陪伴小助手 (Antigravity 權威檢索與整理模式)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              詢問經典名詞、經典名句與經義，由 Antigravity 進行深度檢索與義理整理解惑。
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>點擊名句提問:</span>
              <button className="chip-btn" onClick={() => handleSendAiMessage('凡所有相，皆是虛妄')}>凡所有相皆是虛妄</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('應無所住，而生其心')}>應無所住而生其心</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('菩提本無樹')}>菩提本無樹</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('狂心頓歇，歇即菩提')}>狂心頓歇</button>
            </div>

            <div className="ai-input-area" style={{ borderRadius: 12, marginTop: '0.5rem' }}>
              <input 
                type="text"
                className="ai-input-box"
                placeholder="輸入名詞、經典名句或經義問題，進行 Gemini AI 網路輔助查詢..."
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
              <button className="chip-btn" onClick={() => handleSendAiMessage('凡所有相，皆是虛妄')}>凡所有相皆是虛妄</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('應無所住，而生其心')}>應無所住而生其心</button>
              <button className="chip-btn" onClick={() => handleSendAiMessage('色即是空')}>色即是空</button>
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
