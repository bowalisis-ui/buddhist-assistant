import { GoogleGenAI } from '@google/genai';

// 初始化 API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * 發送問題給 Gemini 並取得讀經小助手回應
 * @param {string} userQuery 使用者提問
 * @param {string} currentSutraText 當前頁面正在閱讀的經文內容（RAG 上下文）
 */
export async function askSutraAssistant(userQuery, currentSutraText = "") {
  if (!ai || !apiKey) {
    return "抱歉 查不到";
  }

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `你是一位慈悲、精通大乘佛法與經典的「陪伴讀經小助手」。
請以溫和、莊嚴、白話且易懂的語氣回答使用者的疑問。
回答時請結合佛法智慧與實修指引，適當使用 Markdown 格式（如列點、粗體）讓排版清晰易讀。`,
          temperature: 0.7,
        },
        // 帶入當前閱讀的經文作為 Context，讓 AI 針對目前章節回答
        contents: `【當前閱讀經文】\n${currentSutraText}\n\n【使用者提問】\n${userQuery}`,
      });
    } catch (err25) {
      // Fallback to gemini-2.0-flash if 2.5 is unavailable
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: `你是一位慈悲、精通大乘佛法與經典的「陪伴讀經小助手」。
請以溫和、莊嚴、白話且易懂的語氣回答使用者的疑問。
回答時請結合佛法智慧與實修指引，適當使用 Markdown 格式（如列點、粗體）讓排版清晰易讀。`,
          temperature: 0.7,
        },
        contents: `【當前閱讀經文】\n${currentSutraText}\n\n【使用者提問】\n${userQuery}`,
      });
    }

    return response.text || "阿彌陀佛，目前網路或連線稍有延遲，請稍後再試。";
  } catch (error) {
    console.error("Gemini API 呼叫失敗：", error);
    return "阿彌陀佛，目前網路或連線稍有延遲，請稍後再試。";
  }
}
