import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Mic, MicOff, PhoneOff, Video, Activity, AlertCircle, Bot, Volume2 } from 'lucide-react';

import genPhysicianImg from "../../assets/general_physician.png";
import pediatricianImg from "../../assets/pediatrician.png";
import cardiologistImg from "../../assets/cardiologist.png";
import neurologistImg from "../../assets/neurologist.png";
import orthoImg from "../../assets/orthopedic_surgeon.png";
import gyneImg from "../../assets/gynecologist.png";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const specialties = [
  { id: "General Physician", img: genPhysicianImg },
  { id: "Cardiologist", img: cardiologistImg },
  { id: "Neurologist", img: neurologistImg },
  { id: "Pediatrician", img: pediatricianImg },
  { id: "Orthopedist", img: orthoImg },
  { id: "Gynecologist", img: gyneImg },
  { id: "Dermatologist", img: genPhysicianImg }, // Fallback
  { id: "ENT Specialist", img: genPhysicianImg },
  { id: "Nutritionist/Dietitian", img: genPhysicianImg },
  { id: "Psychiatrist", img: genPhysicianImg },
];

const VideoConsultation = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0]);
  const [hasPrebookedSpecialty, setHasPrebookedSpecialty] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [textInput, setTextInput] = useState('');

  const localVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#DOC")) {
       const bookingId = hash.substring(1);
       const appointments = JSON.parse(localStorage.getItem("doctorAppointments") || "[]");
       const booking = appointments.find(a => a.bookingId === bookingId);
       if (booking) {
          const matchedSpecialty = specialties.find(s => s.id === booking.specialty);
          if (matchedSpecialty) {
             setSelectedSpecialty(matchedSpecialty);
          } else {
             setSelectedSpecialty({ id: booking.specialty, img: specialties[0].img });
          }
          setHasPrebookedSpecialty(true);
       }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        // We use a separate state to submit the final transcript to avoid stale state in onend
      };

      recognitionRef.current = recognition;
    } else {
      toast.error("Speech Recognition is not supported in this browser. You can still type your messages.");
    }

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // When transcript updates and listening stops, submit message.
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleUserMessage(transcript);
      setTranscript('');
    }
  }, [isListening]);

  useEffect(() => {
    if (isCallActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.warn("Camera access denied or not available.");
          toast.warn("Camera access disabled. Continuing in audio mode.");
        });
        
      // Initial AI Greeting
      handleAiResponse(`Namaste! Main Dr. Sayraa hoon, aapki ${selectedSpecialty.id}. Boliye, aaj main aapki kya madad kar sakti hoon?`);
    } else {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    }
  }, [isCallActive]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  const toggleListen = () => {
    if (isAiSpeaking) {
       window.speechSynthesis.cancel();
       setIsAiSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Recognition already started.");
      }
    }
  };

  const handleAiResponse = async (forcedText = null, customMessages = null) => {
    let aiReply = forcedText;
    const currentMessages = customMessages || messages;
    
    if (!forcedText) {
      setIsAiThinking(true);
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are Dr. Sayraa, an advanced AI Virtual Doctor specializing EXCLUSIVELY in ${selectedSpecialty.id}. Speak concisely, empathetically, and professionally like a real doctor in a telemedicine consultation. Keep responses to 2-3 short sentences. Respond in Hinglish (a mix of Hindi and English). Do NOT repeatedly state that you are a ${selectedSpecialty.id} in normal conversation.
                
CRITICAL RULE: If the user asks about symptoms or a disease that is OUTSIDE of your specialty (${selectedSpecialty.id}), you MUST politely refuse to answer. You MUST start your response by stating your specialty exactly like this: "Mein ${selectedSpecialty.id} hun." Then, tell them which specific department doctor they SHOULD consult instead (e.g., "Bukhar ke liye aap General Physician se baat kar sakte hain"). Do not provide any medical advice for unrelated conditions.
                
If it IS related to your specialty, analyze symptoms and provide basic guidance. If critical/emergency symptoms are detected, you MUST start your response exactly with the tag [EMERGENCY].`
              },
              ...currentMessages.map(m => ({ role: m.role, content: m.content }))
            ],
            temperature: 0.5,
            max_tokens: 150
          })
        });
        const data = await response.json();
        aiReply = data.choices[0].message.content;
      } catch(err) {
        toast.error("Network error: AI could not respond.");
        aiReply = "I'm having trouble connecting to my knowledge base. Please try speaking again.";
      } finally {
        setIsAiThinking(false);
      }
    }

    let isEmerg = false;
    let cleanReply = aiReply;
    if (aiReply.includes("[EMERGENCY]")) {
      isEmerg = true;
      setIsEmergency(true);
      cleanReply = aiReply.replace(/\[EMERGENCY\]/g, "").trim();
    }

    setMessages(prev => [...prev, { role: "assistant", content: cleanReply }]);
    speakText(cleanReply);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Replace "Sayraa" with phonetic spelling for correct TTS pronunciation
    const spokenText = text.replace(/Sayraa/gi, "Sigh-raa");
    
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = "hi-IN";
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        
        const voices = window.speechSynthesis.getVoices();
        let femaleVoice = voices.find(
          (voice) =>
            (voice.lang === "hi-IN" || voice.name.includes("Google हिन्दी") || voice.lang === "en-IN") &&
            (voice.name.toLowerCase().includes("female") || voice.gender === "female")
        );
        
        if (!femaleVoice) {
           femaleVoice = voices.find(v => v.lang.includes('hi') && v.name.toLowerCase().includes('female')) 
                      || voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('female'))
                      || voices.find(v => v.lang.includes('hi'))
                      || voices.find(v => v.lang.includes('en'));
        }

        if (femaleVoice) {
          utterance.voice = femaleVoice;
          utterance.lang = femaleVoice.lang;
        }

        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        utterance.onerror = () => setIsAiSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const handleUserMessage = (text) => {
    if(!text.trim()) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    handleAiResponse(null, newMessages);
  };

  const endCall = () => {
    setIsCallActive(false);
    setMessages([]);
    setIsEmergency(false);
    setTranscript('');
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const handleStartCall = () => {
    const hash = window.location.hash; 
    if (hash && hash.startsWith("#DOC")) {
       const bookingId = hash.substring(1);
       const appointments = JSON.parse(localStorage.getItem("doctorAppointments") || "[]");
       const booking = appointments.find(a => a.bookingId === bookingId);
       
       if (booking) {
          const now = new Date();
          // Adjust timezone explicitly if needed, but local ISO is fine for basic check 
          const tzOffset = now.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
          const todayDate = localISOTime.split("T")[0];
          
          if (booking.appointmentDate !== todayDate) {
             toast.error(`Your video consultation is scheduled for ${booking.appointmentDate}. Please join on that date.`);
             return;
          }
          
          // Removed hour restriction - users can join anytime on the booked date (24 hours)
          
          const matchedSpecialty = specialties.find(s => s.id === booking.specialty);
          if (matchedSpecialty) {
             setSelectedSpecialty(matchedSpecialty);
          } else {
             setSelectedSpecialty({ id: booking.specialty, img: specialties[0].img });
          }
       }
    }
    setIsCallActive(true);
  };

  // --------------------------------------------------------
  // SETUP SCREEN
  // --------------------------------------------------------
  if (!isCallActive) {
    return (
      <div style={setupContainerStyle}>
        <div style={setupCardStyle}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Activity color="#27ae60" size={48} style={{ marginBottom: "10px" }} />
            <h1 style={{ color: "#2c3e50", margin: 0 }}>AI Virtual Doctor</h1>
            <p style={{ color: "#7f8c8d", marginTop: "10px" }}>Experience next-generation healthcare with our AI specialists.</p>
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", color: "#34495e", fontWeight: "bold", marginBottom: "10px" }}>
              {hasPrebookedSpecialty ? "Your Booked Department:" : "Select Department:"}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
              {specialties.map(spec => {
                const isSelected = selectedSpecialty.id === spec.id;
                const isDisabled = hasPrebookedSpecialty && !isSelected;
                
                return (
                  <div 
                    key={spec.id}
                    onClick={() => {
                      if (!hasPrebookedSpecialty) {
                        setSelectedSpecialty(spec);
                      }
                    }}
                    style={{
                      padding: "15px 10px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #2980b9" : "1px solid #ddd",
                      backgroundColor: isSelected ? "#ebf5fb" : (isDisabled ? "#f5f6fa" : "white"),
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      opacity: isDisabled ? 0.5 : 1
                    }}
                  >
                    <img src={spec.img} alt={spec.id} style={{ width: "40px", height: "40px", marginBottom: "8px", borderRadius: "50%", objectFit: "cover", filter: isDisabled ? "grayscale(100%)" : "none" }} />
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "600", color: "#2c3e50" }}>{spec.id}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleStartCall}
            style={{ width: "100%", padding: "15px", borderRadius: "10px", backgroundColor: "#27ae60", color: "white", border: "none", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(39, 174, 96, 0.3)" }}
          >
            <Video size={20} /> Start Consultation
          </button>
        </div>
        <ToastContainer position="top-center" />
      </div>
    );
  }

  // --------------------------------------------------------
  // ACTIVE CALL SCREEN
  // --------------------------------------------------------
  return (
    <div style={containerStyle}>
      {/* Top Banner */}
      <div style={topBannerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#e74c3c", animation: "pulse 1.5s infinite" }} />
          <span>AI Consultation • {selectedSpecialty.id}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Bot size={18} /> Swasthya Setu AI
        </div>
      </div>

      {/* Main Video Area (AI Avatar) */}
      <div style={mainVideoAreaStyle}>
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          
          <div style={{ 
            width: "180px", 
            height: "180px", 
            borderRadius: "50%", 
            border: isAiSpeaking ? "4px solid #3498db" : "4px solid transparent",
            padding: "5px",
            boxShadow: isAiSpeaking ? "0 0 30px rgba(52, 152, 219, 0.6)" : "none",
            transition: "all 0.3s ease",
            position: "relative"
          }}>
            <img 
              src={selectedSpecialty.img} 
              alt="AI Doctor" 
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", backgroundColor: "#fff" }}
            />
            {isAiSpeaking && (
               <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#3498db", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
                 <Volume2 size={12} /> Speaking
               </div>
            )}
            {isAiThinking && (
               <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#f39c12", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
                 <Activity size={12} className="spin" /> Thinking
               </div>
            )}
          </div>
          
          <h2 style={{ color: "white", marginTop: "20px", fontWeight: "300" }}>Dr. Sayraa ({selectedSpecialty.id})</h2>
        </div>
      </div>
      
      {/* Local Video (User) */}
      <video 
        ref={localVideoRef} 
        id="localVideo" 
        autoPlay 
        muted 
        playsInline
        style={localVideoStyle}
      />

      {/* Emergency Alert Overlay */}
      {isEmergency && (
        <div style={emergencyAlertStyle}>
          <AlertCircle size={24} />
          <strong>EMERGENCY DETECTED:</strong> Please seek immediate physical medical attention or call an ambulance.
        </div>
      )}

      {/* Live Captions / Chat */}
      <div style={captionsAreaStyle}>
        <div ref={chatContainerRef} style={{ height: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "10px" }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div style={{ 
                backgroundColor: msg.role === 'user' ? "#2980b9" : "rgba(255,255,255,0.15)", 
                color: "white", 
                padding: "8px 14px", 
                borderRadius: "15px",
                borderBottomRightRadius: msg.role === 'user' ? 0 : "15px",
                borderBottomLeftRadius: msg.role === 'user' ? "15px" : 0,
                fontSize: "0.9rem",
                lineHeight: 1.4
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input 
              type="text" 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { 
                if(e.key === 'Enter' && textInput.trim()) { 
                  handleUserMessage(textInput); 
                  setTextInput(''); 
                } 
              }}
              placeholder="Type your symptoms here..."
              style={{ flex: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", outline: "none", backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
            />
            <button 
              onClick={() => {
                if(textInput.trim()) {
                  handleUserMessage(textInput);
                  setTextInput('');
                }
              }}
              style={{ padding: "10px 20px", borderRadius: "20px", border: "none", backgroundColor: "#3498db", color: "white", cursor: "pointer", fontWeight: "bold", transition: "0.2s" }}
            >
              Send
            </button>
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
          <button 
            onClick={toggleListen}
            style={{
              ...controlBtnStyle,
              backgroundColor: isListening ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
              color: isListening ? "#3498db" : "white",
              border: isListening ? "2px solid #3498db" : "1px solid rgba(255,255,255,0.2)"
            }}
          >
              {isListening ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button 
            onClick={endCall} 
            style={{ ...controlBtnStyle, backgroundColor: '#e74c3c', width: "60px", border: "none" }}
          >
              <PhoneOff size={24} />
          </button>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
          100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 2s linear infinite; }
        
        /* Custom Scrollbar for chat */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

// Styles
const setupContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f4f7f6',
  padding: '20px'
};

const setupCardStyle = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  width: '100%',
  maxWidth: '600px'
};

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  margin: 0,
  backgroundColor: '#121212',
  backgroundImage: 'radial-gradient(circle at center, #2c3e50 0%, #121212 100%)',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  position: 'relative',
  overflow: 'hidden'
};

const topBannerStyle = {
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  padding: '10px 20px',
  borderRadius: '30px',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  zIndex: 20,
  fontSize: '0.9rem',
  border: '1px solid rgba(255,255,255,0.1)'
};

const mainVideoAreaStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  zIndex: 10,
  paddingBottom: '200px'
};

const localVideoStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  width: '120px',
  height: '160px',
  borderRadius: '12px',
  backgroundColor: '#000',
  objectFit: 'cover',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  zIndex: 20
};

const captionsAreaStyle = {
  position: 'absolute',
  bottom: '100px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90%',
  maxWidth: '600px',
  zIndex: 20,
  backgroundColor: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(5px)',
  padding: '15px',
  borderRadius: '15px',
  border: '1px solid rgba(255,255,255,0.1)'
};

const emergencyAlertStyle = {
  position: 'absolute',
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(231, 76, 60, 0.9)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  zIndex: 30,
  fontWeight: 'bold',
  boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)'
};

const controlsStyle = {
  position: 'absolute',
  bottom: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '20px',
  zIndex: 20
};

const controlBtnStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(5px)',
  transition: 'all 0.2s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
};

export default VideoConsultation;
