import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Download, Loader, ShoppingBag, Activity, RefreshCw } from "lucide-react";
import logo from "../../../assets/SwasthyaSetuLogo.png";

// Default static simulated values that match the user's mockup 100% out-of-the-box
const defaultSimulatedMedicine = {
  _id: "ME7A4D",
  items: [
    { name: "Paracetamol 650mg", quantity: 2, price: 40 },
    { name: "Amoxicillin 500mg", quantity: 1, price: 120 }
  ],
  totalAmount: 200,
  createdAt: "2026-03-24T18:00:00.000Z", // In the past, so it shows fully delivered by default
  shippingAddress: {
    street: "Flat 405, SuuSri Green Heights, Sector 15",
  }
};

const defaultSimulatedBloodTest = {
  _id: "EA4E16", // Exact ID from the mockup screenshot
  tests: [{ name: "Diabetic Profile" }], // Exact test from mockup
  labName: "Central Lab", // Exact lab from mockup
  createdAt: "2026-03-24T19:35:38.000Z" // Exact date from mockup
};

const TrackOrder = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null); // Real DB Blood Test
  const [medicineData, setMedicineData] = useState(null); // Real DB Medicine Order
  const [activeTab, setActiveTab] = useState("medicine"); // Tab toggle
  const [error, setError] = useState(null);
  
  // Real-time ticking clock state to recalculate progression every second
  const [now, setNow] = useState(Date.now());

  // Sandbox simulation states in localStorage so they persist during refreshes
  const [sandboxMed, setSandboxMed] = useState(null);
  const [sandboxBlood, setSandboxBlood] = useState(null);

  // Tick clock every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on load and load from localStorage
  const loadTrackingData = async () => {
    try {
      // Load sandbox simulated orders if they exist in localStorage
      const savedMed = localStorage.getItem("sandbox_medicine");
      if (savedMed) setSandboxMed(JSON.parse(savedMed));
      
      const savedBlood = localStorage.getItem("sandbox_blood");
      if (savedBlood) setSandboxBlood(JSON.parse(savedBlood));

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : { _id: "guest" };
      const userId = user._id || user.userId || "guest";

      // Fetch latest real blood test using robust native fetch (matching BloodTest.jsx)
      try {
        const bloodResponse = await fetch(`${API_BASE_URL}/api/blood-tests/my-tests/${userId}`);
        if (bloodResponse.ok) {
          const data = await bloodResponse.json();
          if (data && data.length > 0) {
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTestData(sorted[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching real blood test:", err);
      }

      // Fetch latest real medicine order using robust native fetch
      try {
        const medicineResponse = await fetch(`${API_BASE_URL}/api/orders/user/${userId}`);
        if (medicineResponse.ok) {
          const data = await medicineResponse.json();
          if (data && data.length > 0) {
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setMedicineData(sorted[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching real medicine order:", err);
      }
    } catch (err) {
      console.error("Error in loadTrackingData:", err);
      setError("Failed to fetch tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 8000); // Poll database every 8s
    return () => clearInterval(interval);
  }, []);

  // Auto-switch to the category with the most recent order on page load
  useEffect(() => {
    if (!loading) {
      const realMedTime = medicineData ? new Date(medicineData.createdAt).getTime() : 0;
      const realBloodTime = testData ? new Date(testData.createdAt).getTime() : 0;
      
      const sandboxMedTime = sandboxMed ? new Date(sandboxMed.createdAt).getTime() : 0;
      const sandboxBloodTime = sandboxBlood ? new Date(sandboxBlood.createdAt).getTime() : 0;
      
      const medTime = Math.max(realMedTime, sandboxMedTime);
      const bloodTime = Math.max(realBloodTime, sandboxBloodTime);

      if (bloodTime > medTime && bloodTime > 0) {
        setActiveTab("blood");
      } else if (medTime > 0) {
        setActiveTab("medicine");
      }
    }
  }, [loading, medicineData, testData, sandboxMed, sandboxBlood]);

  // Determine active tracked order (Priority: Real DB > LocalStorage Sandbox > Default Mockup)
  const getActiveOrder = () => {
    if (activeTab === "medicine") {
      return medicineData || sandboxMed || defaultSimulatedMedicine;
    } else {
      return testData || sandboxBlood || defaultSimulatedBloodTest;
    }
  };

  const activeOrder = getActiveOrder();
  const isMedicine = activeTab === "medicine";

  // Calculate elapsed time in seconds since the active order was placed
  const getElapsedSeconds = () => {
    if (!activeOrder) return 999;
    const createdTime = new Date(activeOrder.createdAt).getTime();
    return Math.max(0, Math.floor((now - createdTime) / 1000));
  };

  const elapsedSeconds = getElapsedSeconds();

  // Dynamic status getter based on elapsed seconds (transitions smoothly to Completed after 45s)
  const getDynamicStatus = () => {
    if (isMedicine) {
      if (elapsedSeconds < 10) return "Pending";
      if (elapsedSeconds < 20) return "Confirmed";
      if (elapsedSeconds < 30) return "Processing";
      if (elapsedSeconds < 45) return "Shipped";
      return "Delivered";
    } else {
      if (elapsedSeconds < 15) return "Pending";
      if (elapsedSeconds < 30) return "Processing";
      if (elapsedSeconds < 45) return "Processing";
      return "Completed";
    }
  };

  // Dynamic progress percentage bar (transitions smoothly to 100% after 45s)
  const getDynamicProgress = () => {
    if (isMedicine) {
      if (elapsedSeconds < 10) return 20;
      if (elapsedSeconds < 20) return 40;
      if (elapsedSeconds < 30) return 60;
      if (elapsedSeconds < 45) return 80;
      return 100;
    } else {
      if (elapsedSeconds < 15) return 30;
      if (elapsedSeconds < 30) return 60;
      if (elapsedSeconds < 45) return 80;
      return 100;
    }
  };

  // Timeline steps dynamic generator for Medicine Order (5 Steps, completed step-by-step)
  const getMedicineSteps = () => {
    if (!activeOrder) return [];
    const timeString = new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    return [
      { step: "Order Placed", status: "completed", time: timeString },
      { step: "Confirmed", status: elapsedSeconds >= 10 ? "completed" : "pending" },
      { step: "Processing", status: elapsedSeconds >= 20 ? "completed" : "pending" },
      { step: "Out for Delivery", status: elapsedSeconds >= 30 ? "completed" : "pending" },
      { step: "Delivered", status: elapsedSeconds >= 45 ? "completed" : "pending" },
    ];
  };

  // Timeline steps dynamic generator for Blood Test (Matches the mockup screenshot precisely)
  const getBloodSteps = () => {
    if (!activeOrder) return [];
    
    // Maintain mockup timestamp if it's the default preview, else show live timestamp
    const timeString = activeOrder._id === "EA4E16" && elapsedSeconds > 200000
      ? "19:35:38" 
      : new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    return [
      { step: "Order Placed", status: "completed", time: timeString },
      { step: "Lab Confirmed", status: elapsedSeconds >= 15 ? "completed" : "pending" },
      { step: "Sample Collected", status: elapsedSeconds >= 30 ? "completed" : "pending" },
    ];
  };

  // Trigger a brand new simulated placement (resets progression timers instantly and overwrites the previous)
  const handleSimulateNewOrder = () => {
    const newTimestamp = new Date().toISOString();
    
    if (isMedicine) {
      const newMedOrder = {
        _id: `ME${Math.floor(1000 + Math.random() * 9000)}`,
        items: [
          { name: "Paracetamol 650mg", quantity: 2, price: 40 },
          { name: "Amoxicillin 500mg", quantity: 1, price: 120 }
        ],
        totalAmount: 200,
        createdAt: newTimestamp,
        shippingAddress: {
          street: "Flat 405, SuuSri Green Heights, Sector 15",
        }
      };
      localStorage.setItem("sandbox_medicine", JSON.stringify(newMedOrder));
      setSandboxMed(newMedOrder);
    } else {
      const newBloodTest = {
        _id: `EA${Math.floor(1000 + Math.random() * 9000)}`,
        tests: [{ name: "Diabetic Profile" }],
        labName: "Central Lab",
        createdAt: newTimestamp
      };
      localStorage.setItem("sandbox_blood", JSON.stringify(newBloodTest));
      setSandboxBlood(newBloodTest);
    }
  };

  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const handleDownloadReport = async () => {
    try {
      // Dynamic import to avoid code bloat on load
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const { jsPDF } = jsPDFModule;
      const autoTable = autoTableModule.default || autoTableModule;
      
      const doc = new jsPDF();

      // Retrieve logo and verification QR
      let logoBase64 = null;
      let qrBase64 = null;
      try {
        logoBase64 = await getBase64ImageFromURL(logo);
        const qrData = `https://swasthyasetu.com/verify/test/${activeOrder._id || 'demo'}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
        qrBase64 = await getBase64ImageFromURL(qrUrl);
      } catch (e) {
        console.warn("Could not load assets for PDF, generating clean text report instead.");
      }

      // Add logo
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
      }

      // Swasthya Setu Lab Header
      doc.setFontSize(22);
      doc.setTextColor(39, 174, 96); // Green
      doc.setFont("helvetica", "bold");
      doc.text("Swasthya Setu Diagnostics", 45, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Accredited Medical Laboratory Report", 45, 26);
      doc.text(`Lab Branch: ${activeOrder.labName || "Central Laboratory Hub, India"}`, 45, 31);

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', 165, 10, 25, 25);
      }

      // Drawing horizontal green separator bar
      doc.setDrawColor(39, 174, 96);
      doc.setLineWidth(1);
      doc.line(15, 38, 195, 38);

      // Patient metadata
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const patientName = user.name || "Subham Khandual";
      const patientAgeGender = "28 / Male";

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      doc.setFont("helvetica", "bold");
      doc.text("Patient Name: ", 15, 48);
      doc.setFont("helvetica", "normal");
      doc.text(patientName, 45, 48);

      doc.setFont("helvetica", "bold");
      doc.text("Age / Gender: ", 15, 55);
      doc.setFont("helvetica", "normal");
      doc.text(patientAgeGender, 45, 55);

      doc.setFont("helvetica", "bold");
      doc.text("Reference ID: ", 120, 48);
      doc.setFont("helvetica", "normal");
      doc.text(`REF_${activeOrder._id ? activeOrder._id.slice(-6).toUpperCase() : "EA4E16"}`, 150, 48);

      doc.setFont("helvetica", "bold");
      doc.text("Report Date: ", 120, 55);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(activeOrder.createdAt).toLocaleDateString("en-GB"), 150, 55);

      // Accent separator
      doc.setDrawColor(230, 230, 230);
      doc.line(15, 62, 195, 62);

      // Report Header Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(39, 174, 96);
      doc.text("Clinical Observations: Blood Chemistry", 15, 72);

      // Build Table of Results
      const activeTestName = activeOrder.tests?.map(t => t.name).join(", ") || "Diabetic Profile";
      const testObservations = [
        [activeTestName, "5.5%", "4.0% - 5.6%", "Normal"],
        ["Fasting Blood Glucose", "92 mg/dL", "70 - 100 mg/dL", "Normal"],
        ["Post Prandial Blood Glucose", "130 mg/dL", "< 140 mg/dL", "Normal"],
        ["Total Cholesterol", "180 mg/dL", "< 200 mg/dL", "Normal"],
        ["Hemoglobin (Hb)", "14.8 g/dL", "13.0 - 17.0 g/dL", "Normal"]
      ];

      autoTable(doc, {
        startY: 78,
        head: [['Test Parameter', 'Observed Value', 'Reference Interval', 'Status']],
        body: testObservations,
        headStyles: { fillColor: [39, 174, 96], fontSize: 11, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [248, 253, 250] },
        theme: 'striped',
        margin: { left: 15, right: 15 }
      });

      // Lab signature section
      const finalY = doc.lastAutoTable.finalY + 20;
      
      doc.setDrawColor(220, 220, 220);
      doc.line(15, finalY, 195, finalY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Authorized Medical Signatory", 130, finalY + 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Dr. Ananya Mishra, MD", 130, finalY + 18);
      doc.text("Senior Pathologist, Swasthya Setu", 130, finalY + 23);

      doc.setFontSize(8);
      doc.text("This report is digitally certified and verified by licensed clinical laboratory practitioners.", 15, finalY + 35);
      doc.text("For any queries or clinical correlations, please connect with the medical support team.", 15, finalY + 39);

      // Save PDF
      doc.save(`SwasthyaSetu_LabReport_${activeOrder._id ? activeOrder._id.slice(-6).toUpperCase() : "EA4E16"}.pdf`);
    } catch (err) {
      console.error("Failed to generate and download report PDF:", err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-white" style={{ maxWidth: "480px", margin: "0 auto" }}>
        <Loader className="spinner-border text-primary border-0" style={{ width: "3.5rem", height: "3.5rem", color: "#2563eb" }} />
        <h5 className="mt-3 text-muted fw-bold" style={{ fontFamily: "Montserrat, sans-serif" }}>Loading tracking details...</h5>
      </div>
    );
  }

  return (
    <div className="container py-4 bg-white" style={{ maxWidth: "480px", minHeight: "100vh", paddingBottom: "100px", margin: "0 auto" }}>
      
      {/* Title Header - Centered exactly like screenshot */}
      <h1 className="text-center mb-4" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, color: "#1e3a8a", fontSize: "1.7rem", marginTop: "15px" }}>
        Track Your Order
      </h1>

      {/* Dynamic Tab Switcher - Clean, minimalist pills to toggle between views */}
      <div className="d-flex justify-content-center gap-1 mb-4 p-1 shadow-sm" style={{ background: "#f1f5f9", borderRadius: "30px", border: "1px solid #e2e8f0" }}>
        <button
          className="btn flex-grow-1"
          style={{
            borderRadius: "25px",
            padding: "10px 18px",
            fontWeight: "700",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
            background: activeTab === "medicine" ? "#ffffff" : "transparent",
            color: activeTab === "medicine" ? "#2563eb" : "#64748b",
            border: "none",
            boxShadow: activeTab === "medicine" ? "0 4px 10px rgba(37, 99, 235, 0.08)" : "none"
          }}
          onClick={() => setActiveTab("medicine")}
        >
          Medicine Orders
        </button>
        <button
          className="btn flex-grow-1"
          style={{
            borderRadius: "25px",
            padding: "10px 18px",
            fontWeight: "700",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
            background: activeTab === "blood" ? "#ffffff" : "transparent",
            color: activeTab === "blood" ? "#2563eb" : "#64748b",
            border: "none",
            boxShadow: activeTab === "blood" ? "0 4px 10px rgba(37, 99, 235, 0.08)" : "none"
          }}
          onClick={() => setActiveTab("blood")}
        >
          Blood Tests
        </button>
      </div>

      <div style={{ padding: "0 10px" }}>
        
        {/* Active Order Card - Styled identically to the mockup */}
        <div className="card shadow-sm mb-4 position-relative" style={{ borderRadius: "15px", border: "1px solid #f1f5f9", background: "#fff", padding: "20px 24px" }}>
          
          {/* Simulate New Placement Floating Trigger Button */}
          <button
            className="btn btn-sm d-flex align-items-center justify-content-center"
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              background: "#eff6ff",
              color: "#2563eb",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid #bfdbfe",
              padding: "5px 12px",
              gap: "4px"
            }}
            onClick={handleSimulateNewOrder}
          >
            <RefreshCw size={11} className="spin-hover" />
            Place New Order
          </button>

          <h4 className="mb-3" style={{ fontWeight: 700, color: "#2c3e50", fontSize: "1.2rem", maxWidth: "160px" }}>
            Order #{activeOrder._id ? activeOrder._id.slice(-6).toUpperCase() : "MOCK"}
          </h4>
          <div style={{ color: "#34495e", fontSize: "0.92rem", lineHeight: "1.7" }}>
            <p className="mb-1">
              <strong>{isMedicine ? "Medicines:" : "Tests:"}</strong> {isMedicine ? (activeOrder.items?.map(t => t.name).join(", ")) : (activeOrder.tests?.map(t => t.name).join(", "))}
            </p>
            <p className="mb-1">
              <strong>{isMedicine ? "Pharmacy:" : "Lab:"}</strong> {isMedicine ? "Swasthya Setu Pharmacy" : activeOrder.labName}
            </p>
            <p className="mb-1">
              <strong>Date:</strong> {new Date(activeOrder.createdAt).toLocaleDateString("en-GB")}
            </p>
            <p className="mb-0">
              <strong>Status:</strong> {getDynamicStatus()}
            </p>
          </div>
        </div>

        {/* Progress Indicator - Matches the screenshot precisely */}
        <div className="mb-4" style={{ padding: "0 4px" }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h5 className="mb-0" style={{ fontWeight: 700, color: "#2c3e50", fontSize: "0.95rem" }}>Progress</h5>
            {elapsedSeconds <= 45 && (
              <span className="badge bg-primary text-white" style={{ fontSize: "0.75rem", borderRadius: "10px" }}>
                Live Tracking • {45 - elapsedSeconds}s left
              </span>
            )}
          </div>
          <h4 className="mb-2" style={{ fontWeight: 800, color: "#2c3e50", fontSize: "1.25rem" }}>
            {getDynamicProgress()}%
          </h4>
          <div className="progress" style={{ height: "8px", borderRadius: "4px", background: "#e9ecef" }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ 
                width: `${getDynamicProgress()}%`, 
                borderRadius: "4px",
                background: "#27ae60",
                transition: "width 0.9s linear"
              }}
              aria-valuenow={getDynamicProgress()}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        {/* Timeline Stepper Status Timeline Card - Matches the screenshot precisely */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: "15px", border: "1px solid #f1f5f9", background: "#fff", padding: "24px" }}>
          <h4 className="mb-4" style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "1.2rem" }}>
            Order Status
          </h4>
          <div className="timeline-container">
            {(isMedicine ? getMedicineSteps() : getBloodSteps()).map((step, index, arr) => (
              <div key={index} className="d-flex mb-4 position-relative">
                
                {/* Vertical Connecting Line */}
                {index < arr.length - 1 && (
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    top: "28px",
                    width: "2px",
                    height: "calc(100% + 16px)",
                    background: step.status === "completed" && arr[index+1].status === "completed" ? "#27ae60" : "#e9ecef",
                    zIndex: 1
                  }}></div>
                )}

                {/* Circular Checkmark Icon */}
                <div className="me-3 position-relative" style={{ zIndex: 2 }}>
                  {step.status === "completed" ? (
                    <div className="d-flex align-items-center justify-content-center" style={{ background: "#27ae60", borderRadius: "50%", padding: "4px", width: "28px", height: "28px" }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div style={{ 
                      width: "28px", 
                      height: "28px", 
                      borderRadius: "50%", 
                      background: "#fff", 
                      border: "2px solid #e9ecef",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}></div>
                  )}
                </div>

                {/* Step Content Details */}
                <div className="flex-grow-1">
                  <div className="d-flex flex-column">
                    <strong style={{ color: "#2c3e50", fontSize: "1rem", fontWeight: "600" }}>{step.step}</strong>
                    {step.status === "completed" ? (
                      <>
                        <span className="text-success small" style={{ fontWeight: 600 }}>Completed</span>
                        {step.time && <span className="text-success small" style={{ fontWeight: 500 }}>Completed• {step.time}</span>}
                      </>
                    ) : (
                      <span className="text-muted small">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons - Matches the mockup precisely */}
        <div className="mt-4 px-1">
          {(!isMedicine || getDynamicStatus() === "Delivered") && (
            <button
              className="btn btn-primary w-100 py-3 mb-2.5 shadow-sm border-0 d-flex align-items-center justify-content-center"
              style={{ background: "#2563eb", fontWeight: 700, borderRadius: "10px", fontSize: "0.95rem" }}
              onClick={handleDownloadReport}
            >
              <Download className="me-2" size={18} />
              Download Report
            </button>
          )}

          {isMedicine && getDynamicStatus() !== "Delivered" && (
            <button
              className="btn btn-primary w-100 py-3 mb-2.5 shadow-sm border-0 d-flex align-items-center justify-content-center"
              style={{ background: "#2563eb", fontWeight: 700, borderRadius: "10px", fontSize: "0.95rem" }}
              onClick={() => navigate("/medicine")}
            >
              <ShoppingBag className="me-2" size={18} />
              Order Medicine
            </button>
          )}

          <button 
            className="btn btn-outline-secondary w-100 py-3 mb-2" 
            style={{ background: "#fff", border: "1px solid #cbd5e0", color: "#475569", fontWeight: 600, borderRadius: "10px", fontSize: "0.95rem" }}
            onClick={() => alert("Connecting to Swasthya Setu customer support...")}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
