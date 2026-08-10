import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { askSutraAssistantStream } from '../services/geminiService';
import glossary from '../data/glossary.json';

export function ChatDrawer({ currentSutraText, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '阿彌陀佛！我是您的讀經陪伴小助手。請告訴我您想請益的經文或佛法問題。' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (overrideText = null) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMessage = textToSend.trim();
    if (!overrideText) setInputText('');

    // 1. 將使用者的訊息渲染到畫面上
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    let term = userMessage.replace(/請問|是什麼|什麼意思|意思|解說|法門|有哪些|嗎|\?|？|與|及|請解釋/g, '').trim();
    if (!term) term = userMessage;

    // Check local glossary first
    const matchedTerm = glossary.find(g => 
      g.term === term || 
      userMessage.includes(g.term) || 
      (term.length >= 2 && g.term.includes(term))
    );

    if (matchedTerm) {
      setTimeout(() => {
        const reportText = `✨ 【小助手 義理整理報告】
───────────────
📌 查詢項目：『${matchedTerm.term}』${matchedTerm.pinyin ? `（${matchedTerm.pinyin}）` : ''}

📜 【出處與典故】
收錄於【${matchedTerm.category}】。經典依據參照大乘諸經論脈絡。

💡 【義理剖析】
${matchedTerm.definition}

🌸 【修學指引與妙用】
修學時當會通經旨脈絡，隨文入觀。於日常行住坐臥間，照見身心緣起假合，遠離妄想執著，契入自性真常。
───────────────`;
        setMessages((prev) => [...prev, { sender: 'ai', text: reportText }]);
        setLoading(false);
      }, 250);
      return;
    }

    // 2. 準備 Streaming 空白訊息點位（打字機效果）
    setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

    // 3. 呼叫 Gemini AI Streaming 服務模組帶入 RAG 當前經文上下文
    await askSutraAssistantStream(userMessage, currentSutraText, (accumulatedText) => {
      setMessages((prev) => {
        const newArr = [...prev];
        if (newArr.length > 0 && newArr[newArr.length - 1].sender === 'ai') {
          newArr[newArr.length - 1] = { sender: 'ai', text: accumulatedText };
        }
        return newArr;
      });
    });

    setLoading(false);
  };

  return (
    <div className="ai-panel chat-drawer">
      {/* 標題欄 */}
      <div className="ai-header">
        <div className="ai-title-group">
          <Bot size={20} color="var(--primary-gold)" />
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-serif)' }}>陪伴讀經小助手</span>
        </div>
        {onClose && (
          <button className="tool-btn" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* 訊息展示區域 (支援打字機實時 Streaming 顯示) */}
      <div className="chat-messages ai-messages-container" style={{ flex: 1 }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.sender === 'user' ? 'user' : 'assistant'}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text || (loading && idx === messages.length - 1 ? '✨ 小助手正在檢索經義中...' : '')}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷標籤（Shortcut Chips：自動觸發「請解釋...」與 RAG 經文提問） */}
      <div className="ai-suggestions" style={{ padding: '6px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="chip-btn" onClick={() => handleSend('請解釋這段經文')}>📖 請解釋這段經文</button>
        <button className="chip-btn" onClick={() => handleSend('請解釋四顛倒')}>請解釋四顛倒</button>
        <button className="chip-btn" onClick={() => handleSend('請解釋斷常見')}>請解釋斷常見</button>
        <button className="chip-btn" onClick={() => handleSend('請解釋「凡所有相，皆是虛妄」')}>凡所有相皆是虛妄</button>
        <button className="chip-btn" onClick={() => handleSend('請解釋「應無所住，而生其心」')}>應無所住而生其心</button>
      </div>

      {/* 輸入框與發送按鈕（右下角對話視窗） */}
      <div className="chat-input-container ai-input-area" style={{ padding: '8px 12px' }}>
        <input
          type="text"
          className="ai-input-box"
          value={inputText}
          placeholder="詢問名詞或經文意思（如：這段是什麼意思？）..."
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="ai-send-btn" onClick={() => handleSend()} disabled={loading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default ChatDrawer;
