import { GoogleGenAI } from '@google/genai';

// 初始化 API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const systemPrompt = `你是一位慈悲、精通大乘佛法與經典的「陪伴讀經小助手」。
請以溫和、莊嚴、白話且易懂的語氣回答使用者的疑問。
當使用者詢問「這段是什麼意思？」或經典文義時，請務必結合【當前閱讀經文】的章節與上下文做精準白話解讀。
回答時請結合佛法智慧與實修指引，適當使用 Markdown 格式（如標題、列點、粗體）讓排版清晰易讀。`;

/**
 * 支援 Streaming 打字機效果的 Gemini 讀經小助手回應
 * @param {string} userQuery 使用者提問
 * @param {string} currentSutraText 當前頁面正在閱讀的經文內容（RAG 上下文）
 * @param {function} onChunk 實時接收累積文字的 callback 函式
 */
export async function askSutraAssistantStream(userQuery, currentSutraText = "", onChunk) {
  if (!ai || !apiKey) {
    const msg = "抱歉 查不到";
    if (onChunk) onChunk(msg);
    return msg;
  }

  try {
    const prompt = `【當前閱讀經文上下文】\n${currentSutraText || "無指定經文段落"}\n\n【使用者提問】\n${userQuery}`;
    let responseStream;

    try {
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        config: { systemInstruction: systemPrompt, temperature: 0.7 },
        contents: prompt,
      });
    } catch (errStream) {
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: systemPrompt, temperature: 0.7 },
        contents: prompt,
      });
    }

    let accumulatedText = "";
    for await (const chunk of responseStream) {
      const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || chunk.candidates?.[0]?.content?.parts?.[0]?.text || '');
      accumulatedText += chunkText;
      if (onChunk) {
        onChunk(accumulatedText);
      }
    }

    return accumulatedText;
  } catch (error) {
    console.error("Gemini Streaming 呼叫失敗：", error);
    let errorMsg = "阿彌陀佛，目前網路連線稍有延遲，請稍後再試。";
    if (error?.message && (error.message.includes('429') || error.message.includes('Quota exceeded') || error.message.includes('rate-limits'))) {
      errorMsg = "阿彌陀佛，您的 Gemini API 金鑰目前已達免費調用頻率或每日上限 (429 Rate Limit)。請稍後重試。";
    }
    if (onChunk) onChunk(errorMsg);
    return errorMsg;
  }
}

export async function askSutraAssistant(userQuery, currentSutraText = "") {
  let result = "";
  await askSutraAssistantStream(userQuery, currentSutraText, (text) => {
    result = text;
  });
  return result;
}
