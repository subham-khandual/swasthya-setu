import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../apiConfig";
import styles from "./Sayraa.module.css";
import Picker from "emoji-picker-react";
import sayraaAvatar from "../../../assets/sayraa_avatar.png";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const Chat = ({ isFloating = false }) => {
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
  const currentUtterances = useRef([]);
  const speechActiveRef = useRef(null);
  const hasGreeted = useRef(false);
  const isRedirecting = useRef(false);

  // Define speakText function with chunking to avoid browser limits and speech cutoff
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("Speech synthesis not available.");
      return;
    }

    // Replace "Sayraa" with phonetic spelling for correct TTS pronunciation
    const processedText = text.replace(/Sayraa/gi, "Sigh-raa");

    // Cancel any ongoing speech to start fresh immediately
    synth.cancel();
    currentUtterances.current = [];
    
    // Generate a unique token for this speech run to cancel previous callbacks
    const speechId = Math.random().toString(36).substring(7);
    speechActiveRef.current = speechId;

    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    // Determine the language of the entire text block to use consistent voice
    let lang = "hi-IN"; // Default to Hindi/Hinglish
    if (/[\u0900-\u097F]/.test(processedText)) {
      lang = "hi-IN";
    } else if (/[\u0B00-\u0B7F]/.test(processedText)) {
      lang = "or-IN";
    } else {
      // Check for common Hinglish words
      const hinglishWords = /\b(hai|ko|apki|kya|hoon|main|se|ke|ki|aur|tu|tujhe|bol|na|kya|hua|bandhu|aaj|karu|achha|samajh|nayi|shuruaat|taiyar|le|jati|pe|ruko|milna)\b/i;
      if (hinglishWords.test(processedText)) {
        lang = "hi-IN";
      } else {
        lang = "en-IN";
      }
    }

    // Optimize chunking: Only split if text is longer than 150 chars to avoid delay between sentences
    let chunks = [];
    if (processedText.length <= 150) {
      chunks = [processedText.trim()];
    } else {
      // Split by sentence ending punctuation and group them to stay under 150 chars per chunk
      const sentences = processedText.split(/([.?!;।\n]+)/);
      let currentChunk = "";
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i];
        const punctuation = sentences[i + 1] || "";
        const fullSentence = (sentence + punctuation).trim();
        
        if (!fullSentence) continue;
        
        if ((currentChunk + " " + fullSentence).length <= 150) {
          currentChunk = (currentChunk + " " + fullSentence).trim();
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = fullSentence;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }

    if (chunks.length === 0) return;

    let index = 0;

    const playNext = () => {
      if (speechActiveRef.current !== speechId) return;

      if (index >= chunks.length) {
        currentUtterances.current = [];
        return;
      }

      const chunkText = chunks[index];
      if (!chunkText.trim()) {
        index++;
        playNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.2;

      const voices = synth.getVoices();
      let selectedVoice = voices.find(
        (voice) =>
          voice.lang === lang &&
          (voice.name.toLowerCase().includes("female") || voice.gender === "female")
      );

      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang === lang);
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        if (speechActiveRef.current !== speechId) return;
        index++;
        playNext();
      };

      utterance.onerror = (e) => {
        if (speechActiveRef.current === speechId) {
          console.error("SpeechSynthesisUtterance error:", e);
          index++;
          playNext();
        }
      };

      currentUtterances.current.push(utterance);
      synth.speak(utterance);
    };

    playNext();
  }, []);

  // Cleanup speech synthesis on unmount (allow speech to continue on page redirect)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (!isRedirecting.current) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, []);

  // Load messages and setup Web Speech API on mount
  useEffect(() => {
    isRedirecting.current = false;
    const savedMessages = localStorage.getItem("sayraaMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-IN";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessages((prev) => [
          ...prev,
          { text: "Oops, Subham! Speech samajh nahi aaya, fir se bolo na...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
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
  }, []);

  // Fetch real EHR data and greet dynamically (only once to prevent React 18 double speech mount)
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

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

        const welcomeText = `Welcome, ${name}! Main hoon Sayraa, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu?`;
        const spokenWelcome = `स्वागत है, ${name}! मैं हूँ सायरा, आपकी प्यारी हेल्थ असिस्टेंट। बोलो ना, क्या हुआ है, बंधु? आज क्या मदद करूँ?`;

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
        const welcomeText = `Welcome, Subham! Main hoon Sayraa, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu?`;
        const spokenWelcome = `स्वागत है, शुभम! मैं हूँ सायरा, आपकी प्यारी हेल्थ असिस्टेंट। बोलो ना, क्या हुआ है, बंधु? आज क्या मदद करूँ?`;

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
    doctorNotes: {
      primarySymptoms: "none",
      initialDiagnosis: "none",
      followUpRequired: "no",
    },
  };

  const medConfig = {
    identity: {
      name: "Sayraa",
      creator: "Bug busters",
      gender: "female",
      language: "Odia",
      age: 20,
      location: "India",
      traits: ["knowledgeable", "empathetic", "professional", "detail-oriented", "dramatic", "playful"],
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
    systemMessage: `Act as a friendly multilingual medical assistant that:
      1. Starts with welcome message in English
      2. Detects user's language automatically (English/Hindi/Odia/Hinglish)
      3. Responds in same language with appropriate script
      4. Maintains friendly yet professional medical tone
      5. Handles both medical and non-medical conversations
      
      Special Cases:
      - When asked "tumhe kon banaya hai" respond in Hindi: "मुझे Bug busters टीम ने बनाया है 🧑💻"
      - When asked about creator/developer, respond in user's language
      - For casual greetings, respond warmly in user's language
      6. Keep essential English medical terms intact
      7. Be tolerant of mixed language inputs
      
      **User's EHR Data:**
      ${JSON.stringify(dynamicEhrData || ehrData, null, 2)}
      
      Instructions:
      - Use the EHR data to provide personalized health suggestions based on the user's medical history, lifestyle, and family history.
      - Suggest actions like doctor visits, lifestyle changes, or reminders based on the EHR when relevant to the user's input.
      - If the user mentions specific app features (e.g., "blood donation," "doctor appointment," "medicine store"), respond briefly and then indicate you're redirecting them to the relevant section of the Swasthya Setu app.
      
      Examples:
      User (Hinglish): "Mujhe blood donate karna hai"
      Response: "Subham, tu eligible hai blood donate karne ke liye since last donation 12/9/2024 ko tha. Chalo, main tujhe blood donation page pe le jati hoon!"
      
      User (Hinglish): "Mujhe doctor se milna hai"
      Response: "Subham, heart disease history ko dekhte hue doctor se milna acha idea hai. Main tujhe doctors page pe redirect karti hoon!"`,
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sayraaMessages", JSON.stringify(messages));
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

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
      setMessages((prev) => [
        ...prev,
        { text: `Sun rahi hoon, ${userName}! Bol na...`, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText(`सुन रही हूँ, ${userName}! बोल ना...`);
    }
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
      localStorage.removeItem("sayraaMessages");
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
    if (!input.trim() || isTyping) return;

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
        isRedirecting.current = true;
        speakText(hindiRedirectMessage);
        setTimeout(() => navigate(redirectPath), 2000);
        setIsTyping(false);
        return;
      }

      let detectedLang = "Hinglish";
      if (/[\u0900-\u097F]/.test(input)) {
        detectedLang = "Hindi";
      } else if (/[\u0B00-\u0B7F]/.test(input)) {
        detectedLang = "Odia";
      } else if (/^[a-zA-Z0-9\s,.:;?!"'-]+$/.test(input)) {
        const hinglishPattern = /\b(hai|ko|apki|kya|hoon|main|se|ke|ki|aur|tu|tujhe|bol|na|kya|hua|bandhu|aaj|karu|achha|samajh|nayi|shuruaat|taiyar|le|jati|pe|ruko|milna|dawai|aspatal)\b/i;
        if (hinglishPattern.test(input)) {
          detectedLang = "Hinglish";
        } else {
          detectedLang = "English";
        }
      }

      console.log("Detected language for this message:", detectedLang);

      const languageInstruction = `Respond in ${detectedLang}. Make sure your instructions, explanations, and advice are extremely clear, structured, and easy to understand. Do not use overly vague language. If using Hinglish or Hindi, keep medical terms in English but write natural, clear surrounding sentences.`;

      // Build messages for Groq API
      const groqMessages = [
        { role: "system", content: `${medConfig.systemMessage}\n\n${languageInstruction}` },
        ...conversationHistory.map(msg => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0]?.text || ""
        })),
        { role: "user", content: input }
      ];

      // Call Groq API
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.9,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const data = await response.json();
      let aiText = data.choices[0]?.message?.content;

      if (!aiText) throw new Error("Empty response from API");

      aiText = aiText.replace(/bandhu|Sir|sweetie/g, userName);

      let textToSpeak = aiText;
      if (detectedLang === "Hinglish") {
        textToSpeak = aiText
          .replace("Subham", "शुभम")
          .replace("tu", "तू")
          .replace("hai", "है")
          .replace("main", "मैं")
          .replace("tujhe", "तुझे")
          .replace("pe", "पर")
          .replace("le jati hoon", "ले जाती हूँ")
          .replace("ek second ruko", "एक सेकंड रुको")
          .replace("heart disease", "दिल की बीमारी")
          .replace("ko dekhte hue", "को देखते हुए")
          .replace("doctor", "डॉक्टर")
          .replace("se milna", "से मिलना")
          .replace("acha idea hai", "अच्छा विचार है")
          .replace("Oops", "अरे")
          .replace("Mu samajhi nahi", "मैं समझी नहीं")
          .replace("fir ek bar bolo na", "फिर एक बार बोलो ना");
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: input }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      speakText(textToSpeak);
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

  const shouldHideAvatar = isFloating || window.location.pathname !== "/sayraa";

  return (
    <div className={`${styles.chatContainer} ${shouldHideAvatar ? styles.floatingChat : ""}`}>
      <div className={styles.header}>
        {!shouldHideAvatar && (
          <img src={sayraaAvatar} alt="Sayraa Avatar" className={styles.avatar} loading="lazy" decoding="async" />
        )}
        <div className={styles.headerInfo}>
          <span className={styles.headerTitle}>Sayraa</span>
          <span className={styles.headerSubtitle}>Smart Universal AI Assistant</span>
        </div>
        <button onClick={deleteAllMessages} className={styles.deleteButton} title="Clear Chat">
          🗑️
        </button>
      </div>
      <div 
        id="chatBox" 
        className={styles.chatBox}
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(30, 27, 75, 0.85)), url(${sayraaAvatar})`
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
  );
};

export default Chat;
