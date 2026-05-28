import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Bell, Calendar, Check, X, Clock, PlayCircle, Pill, Activity } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import styles from './MedicineTimeTable.module.css';

// Set the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Helper: Convert first page of PDF to an image URL
const pdfToImage = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
};

const MedicineTimeTable = () => {
  const [medicines, setMedicines] = useState([
    { id: 1, name: "Paracetamol", dose: "500mg", time: "08:00 AM", status: "taken", type: "Morning", frequency: "Daily" },
    { id: 2, name: "Vitamin C", dose: "1000mg", time: "01:00 PM", status: "pending", type: "Afternoon", frequency: "Daily" },
    { id: 3, name: "Atorvastatin", dose: "10mg", time: "08:00 PM", status: "pending", type: "Night", frequency: "Daily" }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // OCR/Add Medicine Form State
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedTime, setNewMedTime] = useState("");
  const [newMedType, setNewMedType] = useState("Morning");
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDisease, setScannedDisease] = useState("");
  const fileInputRef = useRef(null);

  const handleScanPrescription = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    toast.info("Processing file...");
    
    try {
      let imageSource;
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        toast.info("Converting PDF to image...");
        imageSource = await pdfToImage(file);
      } else {
        imageSource = URL.createObjectURL(file);
      }

      toast.info("Extracting text from prescription...");
      // 1. Run local OCR using Tesseract to extract raw text
      const { data: { text: extractedText } } = await Tesseract.recognize(imageSource, 'eng');
      if (!isPdf) URL.revokeObjectURL(imageSource);
      
      if (!extractedText || extractedText.trim().length < 5) {
        toast.error("Invalid file detected. Could not read any text. Please upload a valid medical prescription.");
        setIsScanning(false);
        e.target.value = null;
        return;
      }

      toast.info("Analyzing prescription data...");

      // 2. Send the extracted text to Groq's super-fast TEXT model
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert medical AI pharmacist. You analyze OCR text from prescriptions. You MUST identify the disease or diagnosis."
            },
            {
              role: "user",
              content: `Analyze this raw OCR text extracted from an uploaded document:\n\n"${extractedText}"\n\nSTEP 1: Is this a valid medical prescription (containing medicine names, doctor name, hospital name, or dosage instructions)?\nIf it is obviously NOT a prescription (random text, certificate, ID card, invoice, or irrelevant), reply with EXACTLY the word "INVALID" and nothing else.\n\nSTEP 2: If it IS a valid prescription, you MUST:\n- Identify the disease/diagnosis from the prescription. Look for words like "Diagnosis:", "Complaint:", "For:", or infer the disease from the medicines prescribed (e.g. Paracetamol + Azithromycin = Fever/Infection).\n- Extract every medicine with its dosage and timing.\n\nReturn a JSON object (NOT an array) with this exact format:\n{"disease": "the disease name", "medicines": [{"name": "medicine name", "dose": "dosage", "time": "08:00 AM", "type": "Morning"}]}\n\nThe "disease" field is MANDATORY. If not explicitly written, infer it from the medicines. Do not include any markdown. Just the raw JSON object.`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (data.error) {
          toast.error("AI API Error: " + data.error.message);
          setIsScanning(false);
          return;
      }

      let aiReply = data.choices[0].message.content.trim();
      
      if (aiReply.toUpperCase().includes("INVALID") || aiReply === "INVALID") {
         toast.error("Invalid file detected. Please upload a valid medical prescription.");
      } else {
         // Parse JSON and remove markdown if AI hallucinated it
         aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
         const parsed = JSON.parse(aiReply);
         
         // Support both old array format and new {disease, medicines} format
         let medList = [];
         let detectedDisease = "Unknown";
         
         if (Array.isArray(parsed)) {
            medList = parsed;
            detectedDisease = parsed[0]?.disease || "Unknown";
         } else if (parsed.medicines && Array.isArray(parsed.medicines)) {
            medList = parsed.medicines;
            detectedDisease = parsed.disease || "Unknown";
         }
         
         if (medList.length > 0) {
            const newMeds = medList.map(m => ({
               id: Date.now() + Math.random(),
               name: m.name || "Unknown Med",
               dose: m.dose || "N/A",
               time: m.time || "09:00 AM",
               type: m.type || "Morning",
               disease: detectedDisease,
               status: "pending",
               frequency: "Daily"
            }));
            
            setScannedDisease(detectedDisease);
            setMedicines(prev => [...prev, ...newMeds]);
            toast.success(`Extracted ${newMeds.length} medicines. Disease: ${detectedDisease}`);
         } else {
            toast.error("Could not extract medicines. Please try a clearer picture.");
         }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error analyzing prescription. Please try again.");
    } finally {
      setIsScanning(false);
      e.target.value = null; // Reset file input
    }
  };

  const addMedicine = () => {
    if (!newMedName || !newMedTime) return;
    const med = {
      id: Date.now(),
      name: newMedName,
      dose: newMedDose || "N/A",
      time: newMedTime,
      type: newMedType,
      status: "pending",
      frequency: "Daily"
    };
    setMedicines([...medicines, med]);
    setShowAddModal(false);
    setNewMedName("");
    setNewMedDose("");
  };

  const updateStatus = (id, newStatus) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  return (
    <div className={styles.container}>
      {/* Header Area */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Medicine Time Table</h1>
            <p className={styles.subtitle}>Track your daily prescriptions</p>
          </div>
          <div className={styles.notificationBell}>
            <Bell size={24} color="white" />
            <span className={styles.badge}>2</span>
          </div>
        </div>

        {/* Analytics Card */}
        <div className={styles.analyticsCard}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{medicines.filter(m => m.status === 'taken').length}</span>
            <span className={styles.statLabel}>Taken</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{medicines.filter(m => m.status === 'pending').length}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{medicines.filter(m => m.status === 'missed').length}</span>
            <span className={styles.statLabel}>Missed</span>
          </div>
        </div>
      </div>

      <div className={styles.actionsContainer}>
        <button className={styles.actionBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Add Medicine
        </button>
        <input 
          type="file" 
          accept="image/*,application/pdf" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileUpload} 
        />
        <button className={`${styles.actionBtn} ${styles.scanBtn}`} onClick={handleScanPrescription} disabled={isScanning}>
          {isScanning ? <Activity className={styles.spin} size={20} /> : <Camera size={20} />} 
          {isScanning ? "Verifying File..." : "Scan Prescription"}
        </button>
      </div>

      {scannedDisease && scannedDisease !== "Unknown" && (
        <div style={{
          margin: "0 15px 15px",
          padding: "15px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "15px",
          color: "white",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
        }}>
          <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9 }}>Detected Disease / Diagnosis</p>
          <h3 style={{ margin: "5px 0 0", fontSize: "1.2rem", fontWeight: 700 }}>{scannedDisease}</h3>
        </div>
      )}

      <div className={styles.timelineContainer}>
        <h2 className={styles.sectionTitle}>Today's Schedule</h2>
        
        {medicines.map(med => (
          <div key={med.id} className={`${styles.medCard} ${styles[med.status]}`}>
            <div className={styles.medIcon}>
              <Pill size={24} color="#3498db" />
            </div>
            <div className={styles.medDetails}>
              <h3 className={styles.medName}>{med.name}</h3>
              <p className={styles.medInfo}>{med.dose} • {med.frequency} • {med.type}</p>
              {med.disease && (
                 <p style={{ margin: "2px 0 5px 0", fontSize: "0.75rem", color: "#9b59b6", fontWeight: "bold" }}>
                   🩺 {med.disease}
                 </p>
              )}
              <div className={styles.medTime}>
                <Clock size={14} /> {med.time}
              </div>
            </div>
            <div className={styles.medActions}>
              {med.status === 'pending' ? (
                <>
                  <button className={styles.checkBtn} onClick={() => updateStatus(med.id, 'taken')}><Check size={18} /></button>
                  <button className={styles.missBtn} onClick={() => updateStatus(med.id, 'missed')}><X size={18} /></button>
                </>
              ) : (
                <span className={styles.statusLabel}>{med.status.toUpperCase()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Medicine</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}><X size={24} /></button>
            </div>
            <div className={styles.formGroup}>
              <label>Medicine Name</label>
              <input type="text" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="e.g. Paracetamol" />
            </div>
            <div className={styles.formGroup}>
              <label>Dosage</label>
              <input type="text" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} placeholder="e.g. 500mg" />
            </div>
            <div className={styles.formGroup}>
              <label>Time</label>
              <input type="time" value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Schedule Phase</label>
              <select value={newMedType} onChange={(e) => setNewMedType(e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </div>
            <button className={styles.saveBtn} onClick={addMedicine}>Save Schedule</button>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" />
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MedicineTimeTable;
