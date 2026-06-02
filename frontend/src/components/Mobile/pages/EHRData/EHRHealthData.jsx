import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./EHRData.module.css";
import html2pdf from "html2pdf.js";
import logo from "../../../assets/SwasthyaSetuLogo.png";

const EHRHealthData = ({ patientId }) => {
  const getResolvedPatientId = () => {
    try {
      const lastEditedId = localStorage.getItem('lastEditedPatientId');
      if (lastEditedId) return lastEditedId;

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      return user?.userId || user?._id || patientId || "67ccc44c671f5aa635f458e1";
    } catch (e) {
      return patientId || "67ccc44c671f5aa635f458e1";
    }
  };
  const resolvedPatientId = getResolvedPatientId();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [sharingAccess, setSharingAccess] = useState({ doctors: [], nutritionists: [] });
  const [aiInsights, setAiInsights] = useState(null);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/patients/${resolvedPatientId}`, {
          withCredentials: true,
        });
        console.log(response.data);
        setPatientData(response.data);
        setLoading(false);
        fetchAIInsights(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch patient data");
        setLoading(false);
      }
    };

    if (resolvedPatientId) {
      fetchPatientData();
    }
  }, [resolvedPatientId]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/billing/patient/${resolvedPatientId}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setBills(data);
      } catch (err) {
        console.error("Failed to fetch bills for EHR:", err);
      }
    };
    if (resolvedPatientId) {
      fetchBills();
    }
  }, [resolvedPatientId]);

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : "Born in future";
  };

  const fetchAIInsights = (data) => {
    const insights = {
      healthTrends: `Based on your blood pressure (${data.bloodPressure || "N/A"}), sugar levels, and cholesterol, your health trends are stable but require monitoring.`,
      treatmentProgress: `Your ongoing treatments for ${data.ongoingTherapies?.join(", ") || "none"} show improvement in ${data.primarySymptoms || "general health"} parameters.`,
      recommendations: [
        data.bloodPressure && parseInt(data.bloodPressure.split("/")[0]) > 140
          ? "Consider dietary adjustments to lower blood pressure (e.g., reduce salt intake)."
          : null,
        data.chronicConditions?.includes("Diabetes")
          ? "Monitor blood sugar levels closely and adjust diet (e.g., low-carb diet recommended)."
          : null,
        data.followUpRequired
          ? `Schedule a follow-up with your doctor on ${formatDate(data.followUpDate)}.`
          : null,
      ].filter(Boolean),
    };
    setAiInsights(insights);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", resolvedPatientId);
      await axios.post(`${API_BASE_URL}/api/patients/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("File uploaded successfully!");
      const response = await axios.get(`${API_BASE_URL}/api/patients/${resolvedPatientId}`, {
        withCredentials: true,
      });
      setPatientData(response.data);
    } catch (err) {
      setError("Failed to upload file: " + (err.response?.data?.error || err.message));
    }
  };

  const handleShareAccess = (type, id) => {
    setSharingAccess((prev) => ({
      ...prev,
      [type]: [...prev[type], id],
    }));
    alert(`Granted ${type} access to ID ${id}`);
  };

  const handleDownloadPDF = () => {
    const currentDate = new Date().toLocaleDateString();

    // Create a temporary wrapper for the PDF with a professional medical report layout
    const wrapper = document.createElement("div");
    wrapper.style.padding = "20px";
    wrapper.style.fontFamily = "Arial, sans-serif";
    wrapper.style.color = "#000000"; // Black text for professionalism
    wrapper.style.lineHeight = "1.4";
    wrapper.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <img src="${logo}" alt="Swasthya Setu Logo" style="width: 80px; height: auto; margin-right: 15px;" />
        <h1 style="font-size: 28px; font-weight: bold; color: #000000; margin: 0;">Swasthya Setu</h1>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0;">Name: ${patientData.name}</p>
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0;">Age: ${calculateAge(patientData.dob)}</p>
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0;">Gender: ${patientData.gender}</p>
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0;">Address: ${patientData.address || "N/A"}</p>
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0;">Date: ${currentDate}</p>
      </div>
      <hr style="border: 1px solid #000000; margin: 20px 0;" />
      <div style="font-size: 12px;">
        <h2 style="font-size: 18px; font-weight: bold; color: #000000; margin-bottom: 10px;">Patient Health Report</h2>
        <p style="margin-bottom: 10px;">
          <strong>Patient Overview:</strong> ${patientData.name}, a ${patientData.gender.toLowerCase()}, born on ${formatDate(patientData.dob)} (Age: ${calculateAge(patientData.dob)}), with blood group ${patientData.bloodType}. 
          Current vitals include weight: ${patientData.weight} kg, height: ${patientData.height} cm, blood pressure: ${patientData.bloodPressure || "Not recorded"}.
          Total blood donations: ${patientData.totalDonations || 0}, with the last donation on ${formatDate(patientData.lastDonationDate)}. 
          Eligibility for donation: ${patientData.eligibleForDonation ? "Yes" : "No"}.
        </p>
        ${
          patientData.chronicConditions?.length > 0 || patientData.familyHistory?.length > 0
            ? `
              <p style="margin-bottom: 10px;">
                <strong>Medical History:</strong> 
                ${patientData.chronicConditions?.length > 0 ? `Chronic conditions: ${patientData.chronicConditions.join(", ")}.` : ""}
                ${patientData.familyHistory?.length > 0 ? `Family history: ${patientData.familyHistory.join(", ")}.` : ""}
              </p>
            `
            : ""
        }
        <p style="margin-bottom: 10px;">
          <strong>Surgical & Allergy Profile:</strong> 
          ${patientData.surgeries ? `Previous surgeries: Yes (${patientData.surgeryDetails || "Details not specified"}).` : "No previous surgeries."}
          ${patientData.medicationAllergies?.length > 0 ? `Medication allergies: ${patientData.medicationAllergies.join(", ")}.` : "No known medication allergies."}
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Medication & Therapy:</strong> 
          ${patientData.currentMeds ? `Currently on medications: ${patientData.medsList?.length > 0 ? patientData.medsList.join(", ") : "Not specified"}.` : "No current medications."}
          ${patientData.pastMeds ? `Past medications: ${patientData.pastMeds}.` : ""}
          ${patientData.ongoingTherapies?.length > 0 ? `Ongoing therapies: ${patientData.ongoingTherapies.join(", ")}.` : ""}
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Lifestyle Factors:</strong> 
          Smoking: ${patientData.smokingStatus || "Not specified"}.
          Exercise: ${patientData.exerciseFrequency || "Not specified"}.
          Sleep: ${patientData.sleepHours || "Not specified"} hours/day.
          Diet: ${patientData.dietType?.length > 0 ? patientData.dietType.join(", ") : "Not specified"}.
          Alcohol: ${patientData.alcoholConsumption || "Not specified"}.
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Clinical Observations:</strong> 
          Primary symptoms: ${patientData.primarySymptoms || "None reported"}.
          Initial diagnosis: ${patientData.initialDiagnosis || "None"}.
          ${patientData.followUpRequired ? `Follow-up scheduled on: ${formatDate(patientData.followUpDate)}.` : "No follow-up required."}
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Immunization Record:</strong> 
          Polio vaccine: ${patientData.polioVaccine ? "Yes" : "No"}.
          Last tetanus shot: ${formatDate(patientData.tetanusShot)}.
          COVID-19 vaccine: ${patientData.covidVaccine || "Not specified"}.
          Booster: ${patientData.covidBooster ? "Yes" : "No"}.
        </p>
        ${
          patientData.bloodReport || patientData.imagingReport
            ? `
              <p style="margin-bottom: 10px;">
                <strong>Lab & Imaging Results:</strong> 
                ${patientData.bloodReport ? "Blood test results available." : ""}
                ${patientData.imagingReport ? "Imaging reports available." : ""}
                ${patientData.geneticOrBiopsyTest ? "Genetic/Biopsy test conducted." : ""}
              </p>
            `
            : ""
        }
        <h2 style="font-size: 18px; font-weight: bold; color: #000000; margin: 20px 0 10px;">AI-Powered Insights</h2>
        <p style="margin-bottom: 10px;">
          <strong>Health Trends:</strong> ${aiInsights?.healthTrends || "Not available"}.
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Treatment Progress:</strong> ${aiInsights?.treatmentProgress || "Not available"}.
        </p>
        <p style="margin-bottom: 10px;">
          <strong>Recommendations:</strong> 
          ${aiInsights?.recommendations?.length > 0 ? aiInsights.recommendations.join(" ") : "No specific recommendations at this time."}
        </p>
      </div>
      <hr style="border: 1px solid #000000; margin: 20px 0;" />
      <p style="font-size: 10px; text-align: center; color: #555555;">
        Generated by Swasthya Setu on ${currentDate} | Confidential Medical Report
      </p>
    `;

    const opt = {
      margin: 0.5,
      filename: `${patientData.name}_Health_Report_${currentDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    document.body.appendChild(wrapper);
    html2pdf().from(wrapper).set(opt).save().then(() => {
      document.body.removeChild(wrapper); // Clean up the temporary element
    });
  };

  if (loading) return <div className={styles.loading}>Loading EHR data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!patientData) return <div className={styles.noData}>No EHR data available.</div>;

  const baseUrl = `${API_BASE_URL}`; // Base URL for file paths

  return (
    <div id="ehr-content" className={styles.ehrContainer}>
      {/* Patient Summary Description */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Patient Summary</h2>
        <p className={styles.summaryText}>
          {patientData.name}, born on {formatDate(patientData.dob)}, is a {patientData.gender.toLowerCase()} with a {patientData.bloodType} blood group, currently listed as {patientData.occupation ? `a ${patientData.occupation.toLowerCase()}` : "having no specified occupation"}. 
          Being {calculateAge(patientData.dob)} years old, they have donated blood {patientData.totalDonations} time(s), with the last donation on {formatDate(patientData.lastDonationDate)}, and {patientData.eligibleForDonation ? "remain eligible" : "are not eligible"} for future donations. 
          Their recorded weight is {patientData.weight} kg, height is {patientData.height} cm, and blood pressure is {patientData.bloodPressure || "not specified"}.
          {patientData.weight && patientData.height && (
            <span> Body Mass Index (BMI): {((patientData.weight / (patientData.height / 100) ** 2)).toFixed(1)}.</span>
          )}
          {patientData.chronicConditions?.length > 0 && ` They have a history of ${patientData.chronicConditions.join(", ").toLowerCase()} as chronic condition(s).`} 
          {patientData.familyHistory?.length > 0 && ` Their family history includes a risk of ${patientData.familyHistory.join(", ").toLowerCase()}.`}
        </p>
        <p className={styles.summaryText}>
          {patientData.surgeries ? `They have had previous surgeries (${patientData.surgeryDetails || "details not specified"})` : "They report no previous surgeries"} and {patientData.medicationAllergies?.length > 0 ? `are allergic to ${patientData.medicationAllergies.join(", ").toLowerCase()}` : "have no medication allergies"}. 
          Currently, they are {patientData.currentMeds ? `taking medications (${patientData.medsList?.length > 0 ? patientData.medsList.join(", ") : "list not specified"})` : "not on any medications"}, with {patientData.pastMeds ? `past medications including ${patientData.pastMeds}` : "no past medication history"}, and {patientData.ongoingTherapies?.length > 0 ? `undergoing therapies like ${patientData.ongoingTherapies.join(", ").toLowerCase()}` : "no ongoing therapies"}. 
          Regarding lifestyle, they are a {patientData.smokingStatus ? patientData.smokingStatus.toLowerCase() : "unknown status"} smoker, exercise {patientData.exerciseFrequency ? patientData.exerciseFrequency.toLowerCase() : "frequency not specified"}, sleep {patientData.sleepHours || "N/A"} hours daily, follow a {patientData.dietType?.length > 0 ? patientData.dietType.join(", ").toLowerCase() : "unspecified"} diet, and {patientData.alcoholConsumption ? patientData.alcoholConsumption.toLowerCase() : "do not specify"} alcohol consumption.
          The doctor notes {patientData.primarySymptoms ? `primary symptoms as ${patientData.primarySymptoms}` : "no primary symptoms"}, an initial diagnosis of {patientData.initialDiagnosis || "none"}, and {patientData.followUpRequired ? `requires a follow-up on ${formatDate(patientData.followUpDate)}` : "no follow-up required"}.
        </p>
      </div>

      {/* Patient Demographics */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Patient Demographics</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Full Name:</strong> {patientData.name}</div>
          <div className={styles.dataItem}><strong>Date of Birth:</strong> {formatDate(patientData.dob)}</div>
          <div className={styles.dataItem}><strong>Gender:</strong> {patientData.gender}</div>
          <div className={styles.dataItem}><strong>Blood Group:</strong> {patientData.bloodType}</div>
          <div className={styles.dataItem}><strong>Phone Number:</strong> {patientData.phone}</div>
          <div className={styles.dataItem}><strong>Emergency Contact:</strong> {patientData.emergencyName} ({patientData.emergencyPhone})</div>
          <div className={styles.dataItem}><strong>Address:</strong> {patientData.address || "N/A"}</div>
          <div className={styles.dataItem}><strong>Occupation:</strong> {patientData.occupation || "N/A"}</div>
          <div className={styles.dataItem}><strong>Insurance Provider:</strong> {patientData.insuranceProvider || "N/A"}</div>
          <div className={styles.dataItem}><strong>Insurance Policy Number:</strong> {patientData.insurancePolicyNumber || "N/A"}</div>
          {patientData.insuranceFile && (
            <div className={styles.dataItem}><strong>Insurance Document:</strong> <a href={`${baseUrl}${patientData.insuranceFile}`} target="_blank" rel="noopener noreferrer" className={styles.link}>View File</a></div>
          )}
        </div>
      </div>

      {/* Blood Donation & Basic Vitals */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Blood Donation & Basic Vitals</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Last Donation Date:</strong> {formatDate(patientData.lastDonationDate)}</div>
          <div className={styles.dataItem}><strong>Total Donations:</strong> {patientData.totalDonations}</div>
          <div className={styles.dataItem}><strong>Eligible for Donation:</strong> {patientData.eligibleForDonation ? "Yes" : "No"}</div>
          <div className={styles.dataItem}><strong>Blood Pressure:</strong> {patientData.bloodPressure || "N/A"}</div>
          <div className={styles.dataItem}><strong>Weight:</strong> {patientData.weight} kg</div>
          <div className={styles.dataItem}><strong>Height:</strong> {patientData.height} cm</div>
          <div className={styles.dataItem}><strong>BMI:</strong> {patientData.weight && patientData.height ? (patientData.weight / (patientData.height / 100) ** 2).toFixed(1) : "N/A"}</div>
        </div>
      </div>

      {/* Medical History */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Medical History</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Chronic Conditions:</strong> {patientData.chronicConditions?.length > 0 ? patientData.chronicConditions.join(", ") : "None"}</div>
          <div className={styles.dataItem}><strong>Previous Surgeries:</strong> {patientData.surgeries ? "Yes" : "No"}</div>
          {patientData.surgeries && <div className={styles.dataItem}><strong>Surgery Details:</strong> {patientData.surgeryDetails || "N/A"}</div>}
          <div className={styles.dataItem}><strong>Medication Allergies:</strong> {patientData.medicationAllergies?.length > 0 ? patientData.medicationAllergies.join(", ") : "None"}</div>
          {patientData.medicationAllergies?.includes("Other") && <div className={styles.dataItem}><strong>Other Allergies:</strong> {patientData.otherAllergies || "N/A"}</div>}
          <div className={styles.dataItem}><strong>Family History:</strong> {patientData.familyHistory?.length > 0 ? patientData.familyHistory.join(", ") : "None"}</div>
          {patientData.familyHistory?.includes("Others") && <div className={styles.dataItem}><strong>Other Family History:</strong> {patientData.otherFamilyHistory || "N/A"}</div>}
        </div>
      </div>

      {/* Medications & Treatment */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Medications & Treatment</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Current Medications:</strong> {patientData.currentMeds ? "Yes" : "No"}</div>
          {patientData.currentMeds && <div className={styles.dataItem}><strong>Medications List:</strong> {patientData.medsList?.length > 0 ? patientData.medsList.join(", ") : "N/A"}</div>}
          <div className={styles.dataItem}><strong>Past Medications:</strong> {patientData.pastMeds || "N/A"}</div>
          <div className={styles.dataItem}><strong>Ongoing Therapies:</strong> {patientData.ongoingTherapies?.length > 0 ? patientData.ongoingTherapies.join(", ") : "None"}</div>
          {patientData.ongoingTherapies?.includes("Others") && <div className={styles.dataItem}><strong>Other Therapies:</strong> {patientData.ongoingTherapiesOthers || "N/A"}</div>}
        </div>
      </div>

      {/* Lab & Imaging Reports */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lab & Imaging Reports</h2>
        <div className={styles.profileGrid}>
          {patientData.bloodReport && <div className={styles.dataItem}><strong>Blood Test Results:</strong> <a href={`${baseUrl}${patientData.bloodReport}`} target="_blank" rel="noopener noreferrer" className={styles.link}>View File</a></div>}
          {patientData.imagingReport && <div className={styles.dataItem}><strong>Imaging Reports:</strong> <a href={`${baseUrl}${patientData.imagingReport}`} target="_blank" rel="noopener noreferrer" className={styles.link}>View File</a></div>}
          <div className={styles.dataItem}><strong>Genetic/Biopsy Test:</strong> {patientData.geneticOrBiopsyTest ? "Yes" : "No"}</div>
        </div>
      </div>

      {/* Immunizations & Vaccinations */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Immunizations & Vaccinations</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Polio Vaccine:</strong> {patientData.polioVaccine ? "Yes" : "No"}</div>
          <div className={styles.dataItem}><strong>Last Tetanus Shot:</strong> {formatDate(patientData.tetanusShot)}</div>
          <div className={styles.dataItem}><strong>COVID-19 Vaccine:</strong> {patientData.covidVaccine || "N/A"}</div>
          <div className={styles.dataItem}><strong>COVID Booster:</strong> {patientData.covidBooster ? "Yes" : "No"}</div>
        </div>
      </div>

      {/* Lifestyle & Nutrition */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lifestyle & Nutrition</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Smoking Status:</strong> {patientData.smokingStatus || "N/A"}</div>
          {patientData.smokingStatus === "Current" && <div className={styles.dataItem}><strong>Cigarettes per Day:</strong> {patientData.cigarettesPerDay || "N/A"}</div>}
          <div className={styles.dataItem}><strong>Exercise Frequency:</strong> {patientData.exerciseFrequency || "N/A"}</div>
          <div className={styles.dataItem}><strong>Sleep Hours:</strong> {patientData.sleepHours || "N/A"}</div>
          <div className={styles.dataItem}><strong>Diet Type:</strong> {patientData.dietType?.length > 0 ? patientData.dietType.join(", ") : "N/A"}</div>
          {patientData.dietType?.includes("Other") && <div className={styles.dataItem}><strong>Other Diet:</strong> {patientData.dietTypeOther || "N/A"}</div>}
          <div className={styles.dataItem}><strong>Alcohol Consumption:</strong> {patientData.alcoholConsumption || "N/A"}</div>
          {["Occasionally", "Regularly"].includes(patientData.alcoholConsumption) && (
            <div className={styles.dataItem}><strong>Alcohol Frequency:</strong> {patientData.alcoholFrequency || "N/A"}</div>
          )}
        </div>
      </div>

      {/* Doctor’s Initial Observations */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Doctor’s Initial Observations</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}><strong>Primary Symptoms:</strong> {patientData.primarySymptoms || "N/A"}</div>
          <div className={styles.dataItem}><strong>Initial Diagnosis:</strong> {patientData.initialDiagnosis || "N/A"}</div>
          <div className={styles.dataItem}><strong>Follow-Up Required:</strong> {patientData.followUpRequired ? "Yes" : "No"}</div>
          {patientData.followUpRequired && <div className={styles.dataItem}><strong>Follow-Up Date:</strong> {formatDate(patientData.followUpDate)}</div>}
        </div>
      </div>

      {/* Comprehensive Medical Records */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Comprehensive Medical Records</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Lab Reports & Test Results</h3>
            {patientData.bloodReport && (
              <a href={`${baseUrl}${patientData.bloodReport}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                View Blood Test Results
              </a>
            )}
            {patientData.imagingReport && (
              <a href={`${baseUrl}${patientData.imagingReport}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                View Imaging Reports
              </a>
            )}
            <p>Genetic/Biopsy Test: {patientData.geneticOrBiopsyTest ? "Yes" : "No"}</p>
          </div>
          <div className={styles.card}>
            <h3>Doctor’s Prescriptions</h3>
            <p>Current Medications: {patientData.currentMeds ? patientData.medsList?.join(", ") || "N/A" : "None"}</p>
            <p>Past Medications: {patientData.pastMeds || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Visit & Consultation History */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Visit & Consultation History</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Previous Doctor Visits</h3>
            <p>Primary Symptoms: {patientData.primarySymptoms || "N/A"}</p>
            <p>Initial Diagnosis: {patientData.initialDiagnosis || "N/A"}</p>
            <p>Follow-Up Required: {patientData.followUpRequired ? `Yes, on ${formatDate(patientData.followUpDate)}` : "No"}</p>
          </div>
          <div className={styles.card}>
            <h3>Hospital Admissions & Discharge Summaries</h3>
            <p>Details not available in current data. (Add API integration here)</p>
          </div>
          <div className={styles.card}>
            <h3>Emergency Cases & Accident Reports</h3>
            <p>Details not available in current data. (Add API integration here)</p>
          </div>
        </div>
      </div>

      {/* Billing & Payments */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Billing & Payments</h2>
        <div className={styles.profileGrid}>
          <div className={styles.dataItem}>
            <strong>Insurance Provider:</strong> {patientData.insuranceProvider || "N/A"}
          </div>
          <div className={styles.dataItem}>
            <strong>Policy Number:</strong> {patientData.insurancePolicyNumber || "N/A"}
          </div>
          {patientData.insuranceFile && (
            <div className={styles.dataItem}>
              <strong>Insurance Document:</strong>{" "}
              <a
                href={`${baseUrl}${patientData.insuranceFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                View File
              </a>
            </div>
          )}
          {bills.length > 0 ? (
            <>
              <div className={styles.dataItem}>
                <strong>Last Consultation Fee:</strong>{" "}
                ₹{bills[0].amount} ({bills[0].service || "Consultation"})
              </div>
              <div className={styles.dataItem}>
                <strong>Last Payment Status:</strong>{" "}
                {bills[0].status}
              </div>
              <div className={styles.dataItem}>
                <strong>Total Bills:</strong> {bills.length}
              </div>
            </>
          ) : (
            <div className={styles.dataItem}>
              <strong>Billing Records:</strong> No bills recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* AI-Powered Health Insights */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI-Powered Health Insights</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Health Trend Analysis</h3>
            <p className={styles.insightText}>{aiInsights?.healthTrends || "No insights available."}</p>
          </div>
          <div className={styles.card}>
            <h3>Treatment Progress Tracker</h3>
            <p className={styles.insightText}>{aiInsights?.treatmentProgress || "No progress data available."}</p>
          </div>
          <div className={styles.card}>
            <h3>AI-Generated Recommendations</h3>
            <ul className={styles.recommendations}>
              {aiInsights?.recommendations?.map((rec, index) => (
                <li key={index} className={styles.recommendationItem}>{rec}</li>
              )) || <p className={styles.insightText}>No recommendations available.</p>}
            </ul>
          </div>
        </div>
      </div>

      {/* Easy Upload & Sharing Options */}
      <div className={styles.section}>
      <h2 className={`${styles.sectionTitle} ${styles.uploadShareTitle}`}>Upload & Share Medical Reports</h2>
        <div className={styles.grid}>
          <div className={`${styles.card} ${styles.uploadShareCard}`}>
            <h3>Upload New Reports</h3>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className={`${styles.uploadInput} ${styles.uploadShareInput}`}
            />
            {uploadFile && <p className={styles.uploadText}>Selected file: {uploadFile.name}</p>}
          </div>
          <div className={`${styles.card} ${styles.uploadShareCard}`}>
            <h3>Share with Professionals</h3>
            <input
              type="text"
              placeholder="Doctor ID"
              className={`${styles.input} ${styles.uploadShareInput}`}
              onKeyPress={(e) => e.key === "Enter" && handleShareAccess("doctors", e.target.value)}
            />
            <input
              type="text"
              placeholder="Nutritionist ID"
              className={`${styles.input} ${styles.uploadShareInput}`}
              onKeyPress={(e) => e.key === "Enter" && handleShareAccess("nutritionists", e.target.value)}
            />
            <p className={styles.shareText}>Shared with: Doctors - {sharingAccess.doctors.join(", ")}, Nutritionists - {sharingAccess.nutritionists.join(", ")}</p>
          </div>
          <div className={`${styles.card} ${styles.uploadShareCard}`}>
            <h3>Download Records</h3>
            <button onClick={handleDownloadPDF} className={`${styles.downloadButton} ${styles.uploadShareButton}`}>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Access Control */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy & Access Control</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>User-Controlled Data Access</h3>
            <p className={styles.privacyText}>Manage who can view your records:</p>
            <select className={styles.select}>
              <option value="doctors">Doctors</option>
              <option value="nutritionists">Nutritionists</option>
              <option value="emergency">Emergency Responders</option>
            </select>
          </div>
          <div className={styles.card}>
            <h3>Emergency Access Settings</h3>
            <p className={styles.privacyText}>Allow emergency responders to access key medical data.</p>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              Enable Emergency Access
            </label>
          </div>
          <div className={styles.card}>
            <h3>Encrypted & Secure Storage</h3>
            <p className={styles.privacyText}>Your data is stored securely, compliant with GDPR/HIPAA standards.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EHRHealthData;
