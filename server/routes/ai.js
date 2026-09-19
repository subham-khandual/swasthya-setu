const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Helper to call Google Gemini API
 */
async function callGemini(apiKey, systemInstruction, messages, temperature = 0.7, maxTokens = 800) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'];
  
  // Format contents for Gemini
  const contents = [];
  for (const m of messages) {
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    const text = m.content || (m.parts && m.parts[0]?.text) || '';
    if (text.trim()) {
      contents.push({
        role,
        parts: [{ text }]
      });
    }
  }

  let lastError = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      });

      const candidate = response.data?.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text;
      if (reply) {
        return { reply: reply.trim(), model, provider: 'gemini' };
      }
    } catch (err) {
      lastError = err.response?.data?.error?.message || err.message;
      console.warn(`[AI Route] Gemini (${model}) failed: ${lastError}. Checking next...`);
    }
  }

  throw new Error(lastError || 'Gemini models failed to generate content');
}

/**
 * Converts raw PCM buffer (16-bit, 24kHz) to base64 WAV
 */
function pcmToWavBase64(rawPcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawPcmBuffer.length;
  const chunkSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, rawPcmBuffer]).toString('base64');
}

/**
 * Helper to call Groq API (Fallback)
 */
async function callGroq(apiKey, systemInstruction, messages, temperature = 0.7, maxTokens = 800) {
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
  const formattedMessages = [];

  if (systemInstruction) {
    formattedMessages.push({ role: 'system', content: systemInstruction });
  }

  for (const m of messages) {
    const role = m.role === 'model' ? 'assistant' : m.role;
    const content = m.content || (m.parts && m.parts[0]?.text) || '';
    if (content.trim()) {
      formattedMessages.push({ role, content });
    }
  }

  let lastError = null;
  for (const model of models) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: formattedMessages,
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 15000
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content;
      if (reply) {
        return { reply: reply.trim(), model, provider: 'groq' };
      }
    } catch (err) {
      lastError = err.response?.data?.error?.message || err.message;
      console.warn(`[AI Route] Groq (${model}) failed: ${lastError}`);
    }
  }

  throw new Error(lastError || 'Groq models failed to generate content');
}

/**
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], systemInstruction = '', temperature = 0.7, maxTokens = 800 } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Dynamically refresh env vars in case .env was updated
    require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Try Gemini first if key exists
    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, systemInstruction, messages, temperature, maxTokens);
        console.log(`[AI Route] Responded via Gemini (${result.model})`);
        return res.json({ success: true, ...result });
      } catch (geminiErr) {
        console.warn(`[AI Route] Gemini attempt unsuccessful: ${geminiErr.message}. Falling back to Groq.`);
      }
    }

    // 2. Fallback to Groq
    if (groqKey) {
      try {
        const result = await callGroq(groqKey, systemInstruction, messages, temperature, maxTokens);
        console.log(`[AI Route] Responded via Groq fallback (${result.model})`);
        return res.json({ success: true, ...result });
      } catch (groqErr) {
        console.error(`[AI Route] Groq attempt failed: ${groqErr.message}`);
      }
    }

    return res.status(503).json({
      error: 'AI services are currently unavailable. Please verify your GEMINI_API_KEY or GROQ_API_KEY.'
    });
  } catch (error) {
    console.error('[AI Route] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error while processing AI chat.' });
  }
});

/**
 * POST /api/ai/tts
 * Uses Gemini 3.1 Flash TTS Preview for natural, sweet female voice synthesis
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voice = 'Aoede' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const ttsModels = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
    let lastError = null;

    for (const model of ttsModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const payload = {
          contents: [{ role: 'user', parts: [{ text: text.trim() }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice
                }
              }
            }
          }
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const candidate = response.data?.candidates?.[0];
        const inlineAudio = candidate?.content?.parts?.[0]?.inlineData;
        if (inlineAudio && inlineAudio.data) {
          const rawPcm = Buffer.from(inlineAudio.data, 'base64');
          const wavBase64 = pcmToWavBase64(rawPcm, 24000, 1, 16);

          return res.json({
            success: true,
            audioBase64: wavBase64,
            audioUrl: `data:audio/wav;base64,${wavBase64}`,
            model,
            voice
          });
        }
      } catch (err) {
        lastError = err.response?.data?.error?.message || err.message;
        console.warn(`[AI Route TTS] Model ${model} failed: ${lastError}. Checking next...`);
      }
    }

    // Gracefully inform client to use browser speech synthesis fallback
    return res.json({
      success: false,
      fallbackToBrowser: true,
      error: lastError || 'All TTS models exhausted'
    });
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('[AI Route TTS Unexpected Error]:', errMsg);
    res.json({ success: false, fallbackToBrowser: true, error: errMsg });
  }
});

/**
 * POST /api/ai/stt
 * Uses Gemini 3.5 Transcribe for speech-to-text
 */
router.post('/stt', async (req, res) => {
  try {
    const { audio, mimeType = 'audio/wav' } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Audio data (base64) is required for STT.' });
    }

    require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${geminiKey}`;
    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: audio } },
          { text: 'Transcribe this spoken audio verbatim into text. Output only the transcribed speech.' }
        ]
      }]
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    const candidate = response.data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.audioTranscription?.text ||
                 candidate?.content?.parts?.[0]?.text || '';

    return res.json({
      success: true,
      text: text.trim(),
      model: 'gemini-3.5-transcribe'
    });
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('[AI Route STT Error]:', errMsg);
    res.status(500).json({ error: errMsg });
  }
});

module.exports = router;
