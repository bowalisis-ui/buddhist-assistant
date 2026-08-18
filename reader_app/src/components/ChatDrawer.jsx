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
