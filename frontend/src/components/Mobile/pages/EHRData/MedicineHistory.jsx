import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import styles from "../BloodTest/BloodTest.module.css";
import logo from "../../../assets/SwasthyaSetuLogo.png";

// Simulated EHR data
const mockEHR = [
  {
    id: 0,
    patientName: "Subham Khandual",
    ageGender: "28 / Male",
    date: "2026-03-23",
    doctor: "Dr. Anil Kumar (General Physician)",
    diagnosis: "Mild Fever, Upper Respiratory Infection",
    summary: "Patient presented with mild fever and upper respiratory symptoms. Prescribed a course of antibiotics and supportive care.",
    detailedMedicines: [
      { name: "Paracetamol 500 mg", dosage: "1 tablet", frequency: "Twice a day (after food)", duration: "5 days" },
      { name: "Azithromycin 250 mg", dosage: "1 tablet", frequency: "Once a day", duration: "3 days" },
      { name: "Cetirizine 10 mg", dosage: "1 tablet", frequency: "At night", duration: "5 days" },
      { name: "Cough Syrup (Ambroxol)", dosage: "10 ml", frequency: "Twice daily", duration: "5 days" }
    ],
    status: "Completed"
  },
  { id: 1, date: "2025-03-01", doctor: "Dr. John Doe", summary: "Prescribed Paracetamol for fever.", prescription: "Paracetamol 500mg", status: "Completed" },
  { id: 2, date: "2025-03-02", doctor: "Dr. Jane Smith", summary: "Recommended skin cream.", prescription: "Hydrocortisone", status: "Completed" },
  { id: 3, date: "2025-02-15", doctor: "Dr. Alan Grant", summary: "Checkup for persistent cough.", prescription: "Cough Syrup (Benadryl)", status: "Completed" },
  { id: 4, date: "2025-03-10", doctor: "Dr. Sarah Connor", summary: "Follow-up for blood pressure.", prescription: "Amlodipine 5mg", status: "Ongoing" },
];

const MedicalHistory = () => {
  const navigate = useNavigate();

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

  const downloadPDF = async (record) => {
    try {
      toast.info("Preparing your prescription PDF...");
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const { jsPDF } = jsPDFModule;
      const autoTable = autoTableModule.default || autoTableModule;
      const doc = new jsPDF();

      // Load Images first
      let logoBase64 = null;
      let qrBase64 = null;
      
      try {
        logoBase64 = await getBase64ImageFromURL(logo);
        const qrData = `https://swasthyasetu.com/verify/${record.id || 'demo'}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
        qrBase64 = await getBase64ImageFromURL(qrUrl);
      } catch (err) {
        console.warn("Failed to load some images for PDF, continuing without them.");
      }

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
      }

      // Header
      doc.setFontSize(24);
      doc.setTextColor(39, 174, 96); // Green color
      doc.setFont("helvetica", "bold");
      doc.text("Swasthya Setu", 45, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Your Digital Health Companion", 45, 28);

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', 165, 10, 25, 25);
      }
      
      doc.setDrawColor(39, 174, 96);
      doc.setLineWidth(1);
      doc.line(15, 38, 195, 38);

      // Patient Info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Patient Name: `, 15, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`${record.patientName || "Guest User"}`, 45, 50);

      doc.setFont("helvetica", "bold");
      doc.text(`Age/Gender: `, 15, 58);
      doc.setFont("helvetica", "normal");
      doc.text(`${record.ageGender || "N/A"}`, 45, 58);

      doc.setFont("helvetica", "bold");
      doc.text(`Date: `, 15, 66);
      doc.setFont("helvetica", "normal");
      doc.text(`${record.date}`, 45, 66);

      doc.setFont("helvetica", "bold");
      doc.text(`Doctor: `, 120, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`${record.doctor}`, 145, 50);

      doc.setDrawColor(230, 230, 230);
      doc.line(15, 75, 195, 75);

      // Diagnosis
      doc.setFont("helvetica", "bold");
      doc.setTextColor(39, 174, 96);
      doc.text(`Diagnosis:`, 15, 85);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`${record.diagnosis || "General Consultation"}`, 15, 92);

      // Clinical Summary
      doc.setFont("helvetica", "bold");
      doc.setTextColor(39, 174, 96);
      doc.text(`Clinical Summary:`, 15, 105);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(record.summary, 180);
      doc.text(summaryLines, 15, 112);

      // Medicines Table
      doc.setFont("helvetica", "bold");
      doc.setTextColor(39, 174, 96);
      doc.text(`Prescribed Medicines:`, 15, 130);

      if (record.detailedMedicines) {
        autoTable(doc, {
          startY: 135,
          head: [['Medicine', 'Dosage', 'Frequency', 'Duration']],
          body: record.detailedMedicines.map(m => [m.name, m.dosage, m.frequency, m.duration]),
          headStyles: { fillColor: [39, 174, 96], fontSize: 11, fontStyle: 'bold' },
          bodyStyles: { fontSize: 10 },
          alternateRowStyles: { fillColor: [245, 255, 250] },
          theme: 'striped',
          margin: { left: 15, right: 15 }
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`${record.prescription}`, 15, 137);
      }

      // Footer with signature space
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setDrawColor(200);
      doc.line(140, pageHeight - 45, 190, pageHeight - 45);
      doc.setFontSize(10);
      doc.text("Doctor's Signature", 150, pageHeight - 40);

      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text("Disclaimer: This is a digital prescription generated by Swasthya Setu for information purposes.", 105, pageHeight - 20, { align: "center" });
      doc.text("Please consult a pharmacist for medication fulfillment.", 105, pageHeight - 15, { align: "center" });

      doc.save(`Prescription_${record.patientName || "User"}_${record.date}.pdf`);
      toast.success("Prescription PDF downloaded!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please check your browser console.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medical History</h1>
      </div>
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Consultations & Prescriptions</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine")}>
            Back to Medicine <ChevronRight size={16} />
          </button>
        </div>
        <div className="list-group">
          {mockEHR.map(record => (
            <div key={record.id} className="list-group-item shadow-sm mb-4" style={{ borderRadius: "20px", border: "1px solid #e0e0e0", padding: "20px", background: "#ffffff" }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1" style={{ fontWeight: "700", color: "#2c3e50" }}>{record.doctor}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}><FileText size={14} className="me-1" /> {record.date}</p>
                </div>
                <span className={`badge ${record.status === "Completed" ? "bg-success" : "bg-warning"}`} style={{ borderRadius: "10px", padding: "8px 12px" }}>
                  {record.status}
                </span>
              </div>

              {record.patientName && (
                <div className="mb-3 p-3" style={{ background: "#f8f9fa", borderRadius: "12px" }}>
                  <p className="mb-1"><strong>Patient:</strong> {record.patientName}</p>
                  <p className="mb-0"><strong>Age/Gender:</strong> {record.ageGender}</p>
                </div>
              )}

              {record.diagnosis && (
                <div className="mb-3">
                  <h6 style={{ fontWeight: "600", color: "#2c3e50" }}>Diagnosis</h6>
                  <p className="mb-0 text-muted">{record.diagnosis}</p>
                </div>
              )}

              <div className="mb-3">
                <h6 style={{ fontWeight: "600", color: "#2c3e50" }}>Clinical Summary</h6>
                <p className="mb-0 text-muted" style={{ fontSize: "0.95rem" }}>{record.summary}</p>
              </div>

              <div className="mb-4">
                <h6 style={{ fontWeight: "600", color: "#2c3e50" }}>Prescribed Medicines</h6>
                {record.detailedMedicines ? (
                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-borderless">
                      <thead className="text-muted" style={{ fontSize: "0.85rem" }}>
                        <tr>
                          <th className="ps-0">Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.detailedMedicines.map((med, idx) => (
                          <tr key={idx} style={{ fontSize: "0.9rem" }}>
                            <td className="ps-0 fw-bold">{med.name}</td>
                            <td>{med.dosage}</td>
                            <td>{med.frequency}</td>
                            <td>{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mb-0 fw-bold" style={{ color: "#27ae60" }}>{record.prescription}</p>
                )}
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn flex-grow-1"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "12px", padding: "12px", fontWeight: "600" }}
                  onClick={() => {
                    const medsToOrder = record.detailedMedicines 
                      ? record.detailedMedicines.map(m => ({ Name: m.name, Price: 50 }))
                      : [{ Name: record.prescription, Price: 50 }];
                    navigate("/medicine", { state: { cart: medsToOrder } });
                  }}
                >
                  Order Medicines
                </button>
                <button
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "12px", padding: "12px" }}
                  onClick={() => downloadPDF(record)}
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
