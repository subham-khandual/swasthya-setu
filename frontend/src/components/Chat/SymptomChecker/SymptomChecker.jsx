import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../apiConfig";
import styles from "./SymptomChecker.module.css";
import Picker from "emoji-picker-react";
import { fetchAIReply } from "../aiClient";


const SymptomChecker = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userName, setUserName] = useState("User");
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Speech Recognition and Synthesis Setup
  const recognition = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      setUserName(user.userName || user.name || "User");
    }
  }, []);

  const speakText = useCallback((text) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("Speech synthesis not available.");
      return;
    }
    if (synth.speaking) {
      console.error("SpeechSynthesis is already speaking.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN"; // Prefer English for medical terms, fallback to Hindi
      utterance.rate = 1;
      utterance.pitch = 1.1;

      synth.speak(utterance);
    }
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem("symptomCheckerMessages");
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
          { text: "I didn't quite catch that. Could you please repeat your symptoms?", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const systemMessage = `Act as an intelligent AI Symptom Checker and Medical Triage Assistant.
Your primary role is to analyze the symptoms provided by the user and provide preliminary health guidance.
1. Be highly professional, empathetic, and clear.
2. Structure your response into:
   - Possible Health Conditions (Top 3 max)
   - Risk Analysis (Low, Moderate, High, Critical)
   - Precautionary Measures & First Aid
   - Recommendations
3. EMERGENCY ALERTS: If symptoms indicate a potentially life-threatening condition (e.g., chest pain, difficulty breathing, severe bleeding, sudden numbness, high fever with stiff neck), IMMEDIATELY output a CRITICAL alert advising them to seek immediate medical attention and suggest they go to a nearby hospital. Start your response with "🚨 CRITICAL ALERT:" in such cases.
4. Always add a disclaimer at the end stating: "Disclaimer: I am an AI, not a doctor. This information is for educational purposes and should not replace professional medical advice."
5. Support multilingual input. Respond in the language the user is speaking (English, Hindi, etc.). Use markdown for formatting.`;

  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = `Hello ${userName}, I am the AI Symptom Checker. Please tell me what symptoms you are experiencing right now (e.g., fever, headache, chest pain, fatigue). You can type or use your voice.`;
      const initialMessages = [{
        text: initialMessage,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }];
      setMessages(initialMessages);

      const initialHistory = [
        {
          role: "model",
          parts: [{ text: initialMessage }],
        },
      ];
      setConversationHistory(initialHistory);
      speakText(initialMessage);
    }
  }, [userName, speakText, messages.length]);

  useEffect(() => {
    localStorage.setItem("symptomCheckerMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
      setMessages((prev) => [
        ...prev,
        { text: "Listening to your symptoms...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setUserInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const deleteAllMessages = () => {
    if (window.confirm("Are you sure you want to clear the symptom checker history?")) {
      setMessages([]);
      setConversationHistory([]);
      localStorage.removeItem("symptomCheckerMessages");
      const clearMessage = `History cleared. What symptoms are you experiencing?`;
      setMessages([{ text: clearMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(clearMessage);
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
      const messagesPayload = [
        ...conversationHistory.map(msg => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0]?.text || ""
        })),
        { role: "user", content: input }
      ];

      const aiText = await fetchAIReply({
        systemInstruction: systemMessage,
        messages: messagesPayload,
        temperature: 0.7,
        maxTokens: 800
      });

      if (!aiText) throw new Error("Empty response from API");


      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: input }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      // Simple text extraction for speech to avoid reading markdown
      const textToSpeak = aiText.replace(/\*\*/g, "").replace(/#/g, "").replace(/-/g, "").substring(0, 200) + "...";
      speakText(textToSpeak);
      
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = "I'm having trouble connecting to my medical database. Please try again or seek professional help if it's an emergency.";
      setMessages((prev) => [
        ...prev,
        { text: errorMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <div className={styles.avatar}>🩺</div>
        <div className={styles.headerInfo}>
          <span className={styles.headerTitle}>AI Symptom Checker</span>
          <span className={styles.headerSubtitle}>Intelligent Health Risk Analysis</span>
        </div>
        <button onClick={deleteAllMessages} className={styles.deleteButton} title="Clear Chat">
          🗑️
        </button>
      </div>
      <div 
        id="chatBox" 
        className={styles.chatBox}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
            <span className={styles.timestamp}>{msg.timestamp}</span>
          </div>
        ))}
        {isTyping && <div className={styles.typing}>Analyzing symptoms...</div>}
        {isListening && <div className={styles.typing}>🎙️ Listening...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.quickReplies}>
        <button onClick={() => handleQuickReply("I have a mild fever and headache")}>Fever & Headache</button>
        <button onClick={() => handleQuickReply("I am feeling severe chest pain")}>Chest Pain</button>
        <button onClick={() => handleQuickReply("I have a dry cough and fatigue")}>Cough & Fatigue</button>
        <button onClick={() => handleQuickReply("I'm having trouble breathing")}>Breathing Difficulty</button>
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
          <input
            id="userInput"
            type="text"
            placeholder="Describe your symptoms..."
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

export default SymptomChecker;
