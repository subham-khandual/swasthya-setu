import API_BASE_URL from "../../apiConfig";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_MODEL = process.env.REACT_APP_GROQ_MODEL || "qwen/qwen3.8-27b";
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

/**
 * Direct browser call to Gemini as a fallback
 */
async function callGeminiDirect(apiKey, systemInstruction, messages, temperature = 0.7, maxTokens = 500) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'];
  const contents = messages.map(m => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || (m.parts && m.parts[0]?.text) || '' }]
  })).filter(c => c.parts[0].text.trim());

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens }
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (_) {}
  }
  throw new Error("Direct Gemini failed");
}

/**
 * Direct browser call to Groq as a fallback
 */
async function callGroqDirect(apiKey, systemInstruction, messages, temperature = 0.7, maxTokens = 500) {
  const models = [GROQ_MODEL, 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
  const groqMessages = [];
  if (systemInstruction) {
    groqMessages.push({ role: "system", content: systemInstruction });
  }
  for (const m of messages) {
    const role = m.role === 'model' ? 'assistant' : m.role;
    const content = m.content || (m.parts && m.parts[0]?.text) || '';
    if (content.trim()) {
      groqMessages.push({ role, content });
    }
  }

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();
    } catch (_) {}
  }
  throw new Error("Direct Groq failed");
}

/**
 * Unified AI reply generator:
 * 1. Calls backend server (/api/ai/chat) which prioritizes Gemini 3.1 Flash Lite and falls back to Groq
 * 2. If backend is offline, calls direct Gemini (if key valid)
 * 3. Falls back to direct Groq with verified models
 */
export async function fetchAIReply({ messages, systemInstruction, temperature = 0.6, maxTokens = 500 }) {
  // 1. Try backend server
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        systemInstruction,
        temperature,
        maxTokens
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch (err) {
    console.warn("[aiClient] Backend server unreachable, falling back to direct browser AI call:", err.message);
  }

  // 2. Direct browser Gemini fallback
  if (GEMINI_API_KEY) {
    try {
      const reply = await callGeminiDirect(GEMINI_API_KEY, systemInstruction, messages, temperature, maxTokens);
      if (reply) return reply;
    } catch (_) {}
  }

  // 3. Direct browser Groq fallback
  if (GROQ_API_KEY) {
    const reply = await callGroqDirect(GROQ_API_KEY, systemInstruction, messages, temperature, maxTokens);
    if (reply) return reply;
  }

  throw new Error("Could not retrieve AI response. Please check your network and API keys.");
}

/**
 * Request Gemini 3.1 Flash TTS Preview audio for given text
 */
export async function fetchGeminiTTS({ text, voice = 'Aoede' }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioUrl) {
        return data.audioUrl;
      }
    }
  } catch (err) {
    console.warn("[aiClient] Backend TTS call failed:", err.message);
  }
  return null;
}

/**
 * Transcribe recorded audio with Gemini 3.5 Transcribe
 */
export async function transcribeAudioWithGemini({ audioBase64, mimeType = 'audio/wav' }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/stt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: audioBase64, mimeType })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn("[aiClient] Backend STT call failed:", err.message);
  }
  return null;
}
