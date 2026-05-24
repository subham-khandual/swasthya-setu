import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FileText, Download } from "lucide-react";
import styles from "./Hospital.module.css"; // Reuse HospitalDashboard styles

const sampleRecords = [
  {
    id: 1,
    date: "2025-02-15",
    hospital: "Apollo Hospitals",
    doctor: "Dr. John Smith",
    specialty: "Cardiology",
    prescription: "Aspirin 75mg daily",
    labReport: "CBC - Normal, Lipid Profile - Elevated LDL",
    notes: "Follow up in 2 weeks, reduce cholesterol intake.",
  },
  {
    id: 2,
    date: "2025-01-10",
    hospital: "KIMS",
    doctor: "Dr. Priya Sharma",
    specialty: "Pediatrics",
    prescription: "Paracetamol 500mg as needed",
    labReport: "Fever Panel - Negative",
    notes: "Monitor temperature, hydrate well.",
  },
];

const MedicalRecords = () => {
  const [records] = useState(sampleRecords);

  const handleDownload = (recordId) => {
    toast.success(`Downloading record #${recordId}`);
    // Simulate download logic here
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medical Records</h1>
      </div>

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Your Health Records</h2>
        <div className={styles.labsGrid}>
          {records.map((record) => (
            <div key={record.id} className={styles.labCard}>
              <div className={styles.iconContainer}>
                <FileText className={styles.greenIcon} />
              </div>
              <h3 className={styles.labName}>{record.hospital}</h3>
              <p className={styles.labDistance}>Date: {record.date}</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Doctor: {record.doctor} ({record.specialty})
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>
                Prescription: {record.prescription}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>
                Lab Report: {record.labReport}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>
                Notes: {record.notes}
              </p>
              <button
                className="btn"
                style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "8px", width: "100%", marginTop: "10px" }}
                onClick={() => handleDownload(record.id)}
              >
                <Download size={16} style={{ marginRight: "5px" }} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default MedicalRecords;
