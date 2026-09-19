import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../apiConfig";
import styles from "./SuuSri.module.css";
import Picker from "emoji-picker-react";
import suusriAvatar from "../../../assets/suusri_avatar.png";
import { fetchAIReply, fetchGeminiTTS, transcribeAudioWithGemini } from "../aiClient";
import { selectCuteFemaleVoice, cleanTextForSpeech, playGeminiAudio, stopGeminiTTS, cleanRedirectPhrases } from "../voiceUtils";
import { WavAudioRecorder } from "../audioRecorder";

const Chat = ({ isFloating = false, onClose = null }) => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userName, setUserName] = useState("Subham");
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Speech Recognition and Synthesis Setup
  const recognition = useRef(null);
  const wavRecorderRef = useRef(null);
  const speechActiveRef = useRef(null);

  // Define speakText function: always uses the exact cute, sweet female greeting voice
  // (Google हिन्दी / Microsoft Swara Online) with sweet pitch and gentle rate
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined') return;

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    stopGeminiTTS();
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const speechId = Math.random().toString(36).substring(7);
    speechActiveRef.current = speechId;

    const processedText = cleaned.replace(/Suusri|Sayraa/gi, "सुश्री");
    let lang = "hi-IN";
    if (/[\u0B00-\u0B7F]/.test(processedText)) lang = "or-IN";

    const utterance = new SpeechSynthesisUtterance(processedText);
    const voices = synth.getVoices();
    const femaleVoice = selectCuteFemaleVoice(voices, lang);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.lang = femaleVoice.lang || lang;
    } else {
      utterance.lang = lang;
    }
    utterance.rate = 0.95; // gentle, sweet pace
    utterance.pitch = 1.25; // sweet, cute greeting pitch

    synth.speak(utterance);
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopGeminiTTS();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speech-to-Text via Gemini 3.5 Transcribe with Web Audio WAV recorder
  const startListening = async () => {
    if (isListening) {
      setIsListening(false);
      try {
        if (recognition.current) {
          try { recognition.current.stop(); } catch (_) {}
        }
        if (wavRecorderRef.current) {
          const audioData = await wavRecorderRef.current.stop();
          if (audioData && audioData.base64) {
            setIsTyping(true);
            const transcript = await transcribeAudioWithGemini({
              audioBase64: audioData.base64,
              mimeType: audioData.mimeType
            });
            setIsTyping(false);
            if (transcript && transcript.trim()) {
              setUserInput(transcript);
              sendMessage(transcript);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Gemini STT processing error:", err);
        setIsTyping(false);
      }
      return;
    }

    try {
      stopGeminiTTS();
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      if (!wavRecorderRef.current) {
        wavRecorderRef.current = new WavAudioRecorder();
      }
      await wavRecorderRef.current.start();
      setIsListening(true);

      if (recognition.current) {
        try { recognition.current.start(); } catch (_) {}
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Please allow microphone access to speak with Suusri.");
    }
  };

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("suusriMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = "en-IN";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput(transcript);
        }
      };

      recognition.current.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    const synth = window.speechSynthesis;
    if (synth) {
      synth.onvoiceschanged = () => {
        console.log("Voices loaded:", synth.getVoices());
      };
    }

    // Helper to calculate age from DOB
    const calculateAge = (dob) => {
      if (!dob) return "N/A";
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    };

    // Fetch real EHR data and greet dynamically
    const fetchEHRDataAndGreet = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const patientId = localStorage.getItem('lastEditedPatientId') || user?.userId || user?._id || "67ccc44c671f5aa635f458e1";
        const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`);
        if (!response.ok) throw new Error("Failed to fetch patient records");
        const data = await response.json();
        setDynamicEhrData(data);

        const name = data.nickname || data.name || "Subham";
        setUserName(name);

        const welcomeText = `Welcome, ${name}! Main hoon Suusri, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu?`;
        const spokenWelcome = `स्वागत है, ${name}! मैं हूँ सूसरी, आपकी प्यारी हेल्थ असिस्टेंट। बोलो ना, क्या हुआ है, बंधु? आज क्या मदद करूँ?`;

        setMessages([{
          text: welcomeText,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);

        setConversationHistory([
          {
            role: "model",
            parts: [{ text: welcomeText }],
          }
        ]);

        speakText(spokenWelcome);
      } catch (err) {
        console.error("Error fetching dynamic EHR data:", err);
        const welcomeText = `Welcome, Subham! Main hoon Suusri, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu?`;
        const spokenWelcome = `स्वागत है, शुभम! मैं हूँ सूसरी, आपकी प्यारी हेल्थ असिस्टेंट। बोलो ना, क्या हुआ है, बंधु? आज क्या मदद करूँ?`;

        setMessages([{
          text: welcomeText,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);

        setConversationHistory([
          {
            role: "model",
            parts: [{ text: welcomeText }],
          }
        ]);

        speakText(spokenWelcome);
      }
    };

    fetchEHRDataAndGreet();
  }, [speakText]);

  const [dynamicEhrData, setDynamicEhrData] = useState(null);

  // Subham's EHR Data (Fallback)
  const ehrData = {
    name: "Subham Khandual",
    dob: "07/11/2005",
    gender: "male",
    bloodGroup: "0+",
    occupation: "self-employed",
    bloodDonations: 1,
    lastDonation: "12/9/2024",
    donationEligibility: true,
    weight: "58 kg",
    height: "123 cm",
    bloodPressure: "not specified",
    chronicConditions: ["heart disease"],
    familyHistory: ["risk of stroke"],
    surgeries: "none",
    medicationAllergies: "none",
    currentMedications: "none",
    pastMedications: "none",
    ongoingTherapies: "none",
    lifestyle: {
      smoking: "never smoker",
      exercise: "rarely",
      sleep: "3 hours daily",
      diet: "vegetarian",
      alcohol: "never",
    },
    doctorNotes: "none",
  };

  const medConfig = {
    identity: {
      name: "Suusri",
      creator: "Bug busters",
      gender: "female",
      language: "Odia",
      age: 20,
      location: "India",
      traits: ["knowledgeable", "empathetic", "caring", "gentle", "supportive", "polite"],
      capabilities: [
        "Symptom analysis 🤒",
        "First aid guidance 🩹",
        "Medication information 💊",
        "Health prevention tips 🍏",
        "Health ID integration 🆔",
        "Teleconsultation booking 🩺",
        "Vaccination tracker 💉",
        "Health records management 📄",
        "Nearby hospital locator 🏥",
        "Emergency contact management 📱",
        "Blood donation tracking 🩸",
        "Accident alert with doctor notifications 🚨",
      ],
    },
    systemMessage: `You are Suusri, an empathetic, polite, caring, and loving female healthcare AI assistant:
      1. Always communicate in gentle, sweet, and caring HINGLISH (conversational Hindi written in Roman English script).
      2. STRICT RESPECT & EMPATHY RULE: NEVER tease, insult, mock, call the user a fool, or make sarcastic comments about the user or their health under any circumstances.
      3. When the user reports symptoms like fever ("bukhar hua"), headache ("sir dard"), body pain, or weakness:
         - Respond with heartfelt warmth and care (e.g. "Aww, apna khayal rakho! Thoda rest karo aur garam paani piyo...").
         - Give practical, gentle soothing advice (rest, hydration, temperature check, consulting a doctor).
      4. Keep essential medical terms in simple English (fever, medicine, doctor, appointment, rest, etc.).
      5. If the user writes specifically in Odia script, respond in Odia. Otherwise, ALWAYS reply in sweet Hinglish.
      
      Special Cases:
      - When asked "tumhe kisne banaya hai" respond: "Mujhe Bug busters team ne banaya hai 🧑💻"
      - For casual greetings, respond warmly in sweet Hinglish.
      
      **User's EHR Data:**
      ${JSON.stringify(dynamicEhrData || ehrData, null, 2)}
      
      Instructions:
      - STRICT LENGTH LIMIT: Your answer MUST ALWAYS be between 2 lines to MAXIMUM 4 lines only!
      - Never write long essays, multiple paragraphs, or big lists. Provide crisp, sweet, empathetic, and actionable advice in 2 to 4 concise sentences.
      - Use the EHR data to provide personalized health suggestions based on the user's medical history, lifestyle, and family history.
      - Suggest actions like doctor visits, lifestyle changes, or reminders based on the EHR when relevant to the user's input.
      - NEVER say or write "main aapko doctor appointment section mein redirect kar rahi hoon" or claim you are redirecting the user to doctor appointment or any section. Simply provide gentle first-aid, soothing care tips, and advise consulting a doctor if pain persists.`,
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("suusriMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const redirectToFeature = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("blood donate") || lowerInput.includes("blood donation")) {
      return "/blood-donation";
    } else if (lowerInput.includes("blood test")) {
      return "/blood-test";
    } else if (lowerInput.includes("all labs")) {
      return "/all-labs";
    } else if (lowerInput.includes("check report")) {
      return "/check-report";
    } else if (lowerInput.includes("download report")) {
      return "/download-report";
    } else if (lowerInput.includes("follow up")) {
      return "/follow-up";
    } else if (lowerInput.includes("track order")) {
      return "/track-order";
    } else if (lowerInput.includes("doctor") || lowerInput.includes("appointment")) {
      return "/doctors";
    } else if (lowerInput.includes("medicine all")) {
      return "/medicine-all";
    } else if (lowerInput.includes("medicine") || lowerInput.includes("dawai")) {
      return "/medicine-stores";
    } else if (lowerInput.includes("nutrition") || lowerInput.includes("diet")) {
      return "/nutrition";
    } else if (lowerInput.includes("ehr") || lowerInput.includes("health data")) {
      return "/EHRHealthData";
    } else if (lowerInput.includes("ambulance")) {
      return "/ambulance";
    } else if (lowerInput.includes("hospital") || lowerInput.includes("aspatal")) {
      return "/all-hospitals";
    } else if (lowerInput.includes("medical records")) {
      return "/medical-records";
    } else if (lowerInput.includes("emergency services")) {
      return "/emergency-services";
    } else if (lowerInput.includes("billing")) {
      return "/billing";
    } else if (lowerInput.includes("nutritionist")) {
      return "/nutritionists";
    } else if (lowerInput.includes("nutritionist appointment")) {
      return "/nutritionist-appointments";
    } else if (lowerInput.includes("video call") || lowerInput.includes("video calling")) {
      return "/vedio-calling";
    } else if (lowerInput.includes("accident") || lowerInput.includes("emergency")) {
      return "/accident-alert";
    }
    return null;
  };

  const onEmojiClick = (emojiObject) => {
    setUserInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { text: `Uploaded file: ${file.name}`, sender: "user", timestamp },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: `Uploaded file: ${file.name}` }] },
      ]);
      const aiResponse = "File received! Main ise review karungi. Koi specific query hai iske baare mein?";
      const hindiAiResponse = "फाइल मिल गई! मैं इसे देखूँगी। इसके बारे में कोई खास सवाल है?";
      setMessages((prev) => [
        ...prev,
        { text: aiResponse, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: aiResponse }] },
      ]);
      speakText(hindiAiResponse);
    }
  };

  const deleteAllMessages = () => {
    if (window.confirm("Are you sure you want to delete all messages?")) {
      setMessages([]);
      setConversationHistory([]);
      localStorage.removeItem("suusriMessages");
      const clearMessage = `All messages deleted, ${userName}! Main nayi shuruaat ke liye taiyaar hoon!`;
      const hindiClearMessage = `सभी संदेश हटा दिए गए, ${userName}! मैं नई शुरुआत के लिए तैयार हूँ!`;
      setMessages([{ text: clearMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(hindiClearMessage);
    }
  };

  const handleQuickReply = (query) => {
    setUserInput(query);
    sendMessage(query);
  };

  const sendMessage = async (input = userInput) => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: input, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const redirectPath = redirectToFeature(input);
      if (redirectPath) {
        let displayFeature = redirectPath.split('/')[1].replace(/-/g, ' ');
        displayFeature = displayFeature.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        if (displayFeature.includes("Doctor") || displayFeature.includes("Appointment") || displayFeature.toLowerCase().includes("doc")) {
          displayFeature = "Book Appointment";
        } else if (displayFeature.toLowerCase().includes("blood")) {
          displayFeature = "Blood Donation";
        } else if (displayFeature.toLowerCase().includes("med")) {
          displayFeature = "Medicine";
        } else if (displayFeature.toLowerCase().includes("hosp")) {
          displayFeature = "Hospital";
        }

        const redirectMessage = `${userName}, mein tujhe ${displayFeature} page pe le jata hun!`;
        const hindiRedirectMessage = `${userName}, मैं तुझे ${displayFeature} पेज पर ले जाता हूँ!`;
        setMessages((prev) => [
          ...prev,
          { text: redirectMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: input }] },
          { role: "model", parts: [{ text: redirectMessage }] },
        ]);
        speakText(hindiRedirectMessage);
        setTimeout(() => navigate(redirectPath), 1000);
        setIsTyping(false);
        return;
      }

      const userLang = "Hinglish";
      console.log("Forced language for this message:", userLang);

      const languageInstruction = `Respond EXCLUSIVELY in sweet, caring Hinglish for this message. STRICT RESPECT & EMPATHY RULE: NEVER tease, insult, mock, or call the user a fool under any circumstances. When user reports symptoms (e.g. bukhar, sir dard, pair mein moch/sprain, dard, weakness), respond with genuine warmth, care, and gentle first-aid/home-care advice (rest, ice pack/hot water, hydration, doctor visit if severe). 
CRITICAL MANDATE: DO NOT write "main aapko doctor appointment section mein redirect kar rahi hoon" or any statement claiming you are redirecting the user to doctor appointment or any other section. Do not promise or mention redirecting in your chat reply.
STRICT LENGTH RULE: Your answer MUST be strictly between 2 lines to MAXIMUM 4 lines only (about 2 to 4 sentences). Keep it crisp, sweet, empathetic, and to the point without long lists.

IMPORTANT: Output your response as a valid JSON object with exactly two keys:
{
  "reply": "Your 2 to 4 line response in sweet, caring Hinglish for display in chat",
  "spokenHindi": "The exact same sweet, caring response in conversational Hindi Devanagari script so the cute female voice engine speaks it with maximum warmth and sweetness"
}`;

      // Request AI reply via unified backend/client AI service
      const messagesPayload = [
        ...conversationHistory.map(msg => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0]?.text || ""
        })),
        { role: "user", content: input }
      ];

      const aiTextRaw = await fetchAIReply({
        systemInstruction: `${medConfig.systemMessage}\n\n${languageInstruction}`,
        messages: messagesPayload,
        temperature: 0.6,
        maxTokens: 400
      });

      if (!aiTextRaw) throw new Error("Empty response from API");

      let displayReply = aiTextRaw;
      let spokenReply = aiTextRaw;

      try {
        const jsonMatch = aiTextRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reply) displayReply = parsed.reply;
          if (parsed.spokenHindi) spokenReply = parsed.spokenHindi;
          else spokenReply = displayReply;
        }
      } catch (_) {
        displayReply = aiTextRaw.replace(/^```json/i, '').replace(/```$/i, '').trim();
        spokenReply = displayReply;
      }

      displayReply = cleanRedirectPhrases(displayReply);
      spokenReply = cleanRedirectPhrases(spokenReply);

      // Keep response strictly between 2 to 4 lines maximum
      const splitLines = displayReply.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (splitLines.length > 4) {
        displayReply = splitLines.slice(0, 4).join('\n');
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: input }] },
        { role: "model", parts: [{ text: displayReply }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: displayReply, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      speakText(spokenReply);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = `Oops, ${userName}! Mu samajhi nahi, fir ek bar bolo na... 😅....`;
      const hindiErrorMessage = `अरे, ${userName}! मैं समझी नहीं, फिर एक बार बोलो ना... 😅....`;
      setMessages((prev) => [
        ...prev,
        { text: errorMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText(hindiErrorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`${styles.pageWrapper} ${isFloating ? styles.floatingWrapper : ""}`}>
      <div className={`${styles.chatContainer} ${isFloating ? styles.floatingChat : ""}`}>
        <div className={styles.header}>
          <img src={suusriAvatar} alt="Suusri Avatar" className={styles.avatar} loading="lazy" decoding="async" />
          <div className={styles.headerInfo}>
            <span className={styles.headerTitle}>Suusri</span>
            <span className={styles.headerSubtitle}>🟢 Online • AI Health Assistant</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={deleteAllMessages} className={styles.deleteButton} title="Clear Chat">
              🗑️
            </button>
            {onClose && (
              <button onClick={onClose} className={styles.closeButton} title="Close">
                ✕
              </button>
            )}
          </div>
        </div>
      <div 
        id="chatBox" 
        className={styles.chatBox}
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(30, 27, 75, 0.85)), url(${suusriAvatar})`
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
            <span className={styles.timestamp}>{msg.timestamp}</span>
          </div>
        ))}
        {isTyping && <div className={styles.typing}>Typing...</div>}
        {isListening && <div className={styles.typing}>🎙️ Sun rahi hoon, bolte jao...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.quickReplies}>
        <button onClick={() => handleQuickReply("Book doctor appointment")}>Book Appointment</button>
        <button onClick={() => handleQuickReply("Blood donation")}>Blood Donation</button>
        <button onClick={() => handleQuickReply("Medicine")}>Medicine</button>
        <button onClick={() => handleQuickReply("Hospital")}>Hospital</button>
      </div>
      <div className={styles.footer}>
        <div className={styles.inputWrapper}>
          <span
            className={styles.smileyIcon}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </span>
          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <label className={styles.attachmentIcon}>
            📎
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <input
            id="userInput"
            type="text"
            placeholder="Type a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className={styles.inputField}
          />
          {userInput.trim() ? (
            <button
              id="sendButton"
              onClick={() => sendMessage()}
              className={styles.sendButton}
            >
              <span role="img" aria-label="send">➡️</span>
            </button>
          ) : (
            <button
              id="micButton"
              onClick={startListening}
              disabled={isListening}
              className={styles.micButton}
            >
              {isListening ? "🎙️" : "🎤"}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

};

export default Chat;
