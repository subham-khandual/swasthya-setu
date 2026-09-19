// ------------------------------------------------------------------
// Voice Utilities: Strictly guarantees the sweet, cute greeting voice
// ------------------------------------------------------------------

// Voices known to sound robotic, harsh, rude, American, or male
const RUDE_AND_MALE_VOICE_NAMES = [
  "david", "mark", "ravi", "madhur", "hemant", "george", "richard", 
  "james", "male", "guy", "boy", "man", "prabhat",
  "zira",     // Robotic, stern Windows voice that users dislike
  "heera",    // Metallic/harsh Windows voice
  "cortana",
  "aoede", "puck", "charon", "fenrir", "kore" // American English synthetic voices
];

// Ranked list of preferred sweet, melodic Indian female voices (exact match to greeting voice)
const SWEET_FEMALE_PATTERNS = [
  "google हिन्दी",
  "google hindi",
  "swara",       // Microsoft Swara Online (Natural) - Hindi (India) - super sweet
  "kalpana",     // Microsoft Kalpana - Hindi (India)
  "neerja",      // Microsoft Neerja Online (Natural) - Indian female
  "shruti",
  "priya",
  "ananya",
  "subhasini"
];

let cachedSweetVoice = null;

export const isRudeOrMaleVoice = (v) => {
  if (!v) return true;
  const name = (v.name || "").toLowerCase();
  return RUDE_AND_MALE_VOICE_NAMES.some(bad => name.includes(bad)) || v.gender === "male";
};

export const isSweetFemaleVoice = (v) => {
  if (!v || isRudeOrMaleVoice(v)) return false;
  const name = (v.name || "").toLowerCase();
  return (
    SWEET_FEMALE_PATTERNS.some(p => name.includes(p)) ||
    name.includes("natural") ||
    name.includes("female") ||
    v.gender === "female"
  );
};

export const rememberSweetVoice = (voice) => {
  if (voice && !isRudeOrMaleVoice(voice)) {
    cachedSweetVoice = voice;
  }
};

export const getCachedSweetVoice = () => cachedSweetVoice;

/**
 * Selects the EXACT sweet female voice that sounds like the cute greeting.
 * Consistently re-uses the cached greeting voice across all follow-up messages.
 */
export const selectCuteFemaleVoice = (voices, targetLang = "hi-IN") => {
  if (!voices || voices.length === 0) return null;

  // 1. If we already found and verified the sweet greeting voice, stick to it 100%
  if (cachedSweetVoice) {
    const stillAvailable = voices.find(v => v.name === cachedSweetVoice.name);
    if (stillAvailable && !isRudeOrMaleVoice(stillAvailable)) {
      return stillAvailable;
    }
  }

  // 2. High-priority search: Sweet Hindi / Indian voices (matching the greeting voice)
  for (const pattern of SWEET_FEMALE_PATTERNS) {
    const found = voices.find(v => {
      const name = (v.name || "").toLowerCase();
      return name.includes(pattern) && !isRudeOrMaleVoice(v);
    });
    if (found) {
      cachedSweetVoice = found;
      return found;
    }
  }

  // 3. Any hi-IN voice that is not male/rude
  const hiVoice = voices.find(v => 
    (v.lang === "hi-IN" || v.lang === "hi_IN" || v.name.includes("हिन्दी")) && 
    !isRudeOrMaleVoice(v)
  );
  if (hiVoice) {
    cachedSweetVoice = hiVoice;
    return hiVoice;
  }

  // 4. Any Indian female voice (e.g., en-IN) that is not rude/male
  const indianVoice = voices.find(v => 
    (v.lang.includes("IN") || (v.name && v.name.toLowerCase().includes("india"))) && 
    !isRudeOrMaleVoice(v)
  );
  if (indianVoice) {
    cachedSweetVoice = indianVoice;
    return indianVoice;
  }

  // 5. Any non-rude female voice in browser
  const anySweet = voices.find(v => isSweetFemaleVoice(v));
  if (anySweet) {
    cachedSweetVoice = anySweet;
    return anySweet;
  }

  // 6. Absolute fallback: any non-male, non-rude voice
  const nonRude = voices.find(v => !isRudeOrMaleVoice(v));
  if (nonRude) {
    cachedSweetVoice = nonRude;
    return nonRude;
  }

  return null;
};

/**
 * Removes any unwanted 'redirect kar rahi hoon to doctor appointment' phrases from text
 */
export const cleanRedirectPhrases = (text) => {
  if (!text) return "";
  let cleaned = String(text)
    .replace(/(?:,\s*)?(?:(?:main|mein)\s+(?:aapko|tumhein|tujhe)\s+)?(?:(?:doctor\s+)?(?:appointment|appiont(?:ment)?)\s*(?:section|page)?\s*(?:mein|me|pe|par)?\s*)?redirect\s*(?:kar\s*(?:rahi|raha)\s*(?:hoon|hun|hai)|kar\s*dungi|karunga)[^.!?।\n]*[.!?।]?/gi, '')
    .replace(/(?:,\s*)?(?:(?:मैं|में)\s+(?:आपको|तुम्हें|तुझे)\s+)?(?:(?:डॉक्टर\s*)?(?:अपॉइंटमेंट|अपॉइंटमेन्ट)\s*(?:सेक्शन|पेज)?\s*(?:में|पे|पर)?\s*)?रीडायरेक्ट\s*(?:कर\s*(?:रही|रहा)\s*(?:हूँ|हुँ|है)|कर\s*दूंगी)[^.!?।\n]*[.!?।]?/gi, '')
    .replace(/\s*,\s*([.!?।])/g, '$1')
    .replace(/,\s*$/g, '.')
    .trim();
  return cleaned;
};

/**
 * Cleans markdown, bullets, emojis, URLs, and unwanted redirect phrases so speech synthesis sounds natural and clear
 */
export const cleanTextForSpeech = (rawText) => {
  if (!rawText) return "";
  let clean = cleanRedirectPhrases(String(rawText));
  clean = clean.replace(/[*_~`]+/g, ''); // markdown formatting
  clean = clean.replace(/^#{1,6}\s+/gm, ''); // headers
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
  clean = clean.replace(/https?:\/\/\S+/gi, ''); // URLs
  clean = clean.replace(/^[\s*•\-–—]+\s*/gm, ''); // bullets
  // Remove emojis so TTS does not speak emoji names out loud
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
  clean = clean.replace(/[\t ]+/g, ' ');
  return clean.trim();
};

let currentGeminiAudio = null;

export const stopGeminiTTS = () => {
  if (currentGeminiAudio) {
    try {
      currentGeminiAudio.pause();
      currentGeminiAudio.currentTime = 0;
    } catch (_) {}
    currentGeminiAudio = null;
  }
};

export const playGeminiAudio = (audioUrl) => {
  return new Promise((resolve, reject) => {
    stopGeminiTTS();
    try {
      const audio = new Audio(audioUrl);
      currentGeminiAudio = audio;
      audio.onended = () => {
        currentGeminiAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        currentGeminiAudio = null;
        reject(e);
      };
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
};
