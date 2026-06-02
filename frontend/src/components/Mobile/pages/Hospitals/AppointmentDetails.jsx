import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";
import logo from "../../../assets/SwasthyaSetuLogo.png";
import styles from "./AppointmentDetails.module.css";

const AppointmentDetails = () => {
  const location = useLocation();
  const { appointment } = location.state || {};
  const [downloading, setDownloading] = useState(false);
  const barcodeRef = useRef(null);

  // Default appointment details if none provided
  const defaultDetails = {
    patientName: "Alekhya Kumar Swain",
    hospitalName: "Apollo Hospitals",
    specialty: "Cardiology",
    doctorName: "Dr. Assigned",
    appointmentDate: "2025-03-08",
    appointmentTime: "9:00 AM - 12:00 PM",
    bookingId: "APPT5B0P492JS",
    patientId: "PATWRSXQ0",
    email: "alekhakumarswain111@gmail.com",
  };

  const details = appointment || defaultDetails;
  const currentDate = new Date().toLocaleDateString();

  // QR Code payload
  const qrCodePayload = `
Patient Name: ${details.patientName}
Hospital: ${details.hospitalName}
Specialty: ${details.specialty}
Doctor: ${details.doctorName}
Appointment Date: ${details.appointmentDate}
Appointment Time: ${details.appointmentTime}
Booking ID: ${details.bookingId}
Patient ID: ${details.patientId}
Email: ${details.email}
Instructions: Please arrive 15 minutes early with this slip and any relevant medical records. For cancellation or rescheduling, contact the hospital at least 24 hours prior.
  `.trim();

  // Generate barcode
  useEffect(() => {
    if (barcodeRef.current && details.bookingId) {
      JsBarcode(barcodeRef.current, details.bookingId, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        width: 2,
        height: 40,
      });
    }
  }, [details.bookingId]);

  const handleDownloadPDF = () => {
    setDownloading(true);

    const qrCanvas = document.getElementById("qrCodeCanvas");
    const qrCodeDataUrl = qrCanvas.toDataURL("image/png");
    const barcodeCanvas = document.getElementById("barcode");
    const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");

    const wrapper = document.createElement("div");
    wrapper.style.padding = "20px";
    wrapper.style.fontFamily = "'Arial', sans-serif";
    wrapper.style.background = "#f5f7fa";
    wrapper.style.color = "#000000";
    wrapper.style.lineHeight = "1.6";
    wrapper.innerHTML = `
      <div style="text-align: center; background: linear-gradient(90deg, #2ecc71, #27ae60); padding: 15px; border-radius: 15px 15px 0 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <img src="${logo}" alt="Swasthya Setu Logo" style="width: 90px; height: auto; margin-right: 15px;" />
        <h1 style="font-size: 32px; font-weight: 700; color: #fff; margin: 0; display: inline; font-family: 'Playfair Display', serif;">Swasthya Setu</h1>
        <p style="font-size: 16px; color: #fff; margin: 5px 0; font-family: 'Open Sans', sans-serif;">Bug busters</p>
        <p style="font-size: 14px; color: #fff; font-family: 'Open Sans', sans-serif;">Booking ID: ${details.bookingId}</p>
      </div>
      <div style="background: #ffffff; padding: 25px; border-radius: 0 0 15px 15px; box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; padding-right: 20px;">
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Patient Name:</strong> ${details.patientName}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Booking ID:</strong> ${details.bookingId}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Patient ID:</strong> ${details.patientId}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Email:</strong> ${details.email}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Date of Issue:</strong> ${currentDate}</p>
          </div>
          <div style="text-align: center; flex: 0 0 120px;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px; border: 2px solid #e0e0e0; border-radius: 8px;" />
            <p style="font-size: 12px; color: #666666; margin-top: 8px; font-family: 'Open Sans', sans-serif;">Scan to view appointment details</p>
          </div>
        </div>
        <hr style="border: 2px solid #000000; margin: 20px 0;" />
        <h2 style="font-size: 24px; font-weight: 700; color: #2c3e50; text-align: center; margin-bottom: 20px; font-family: 'Playfair Display', serif;">APPOINTMENT DETAILS</h2>
        <div style="margin-bottom: 20px;">
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Hospital:</strong> ${details.hospitalName}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Specialty:</strong> ${details.specialty}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Doctor:</strong> ${details.doctorName}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Appointment Date:</strong> ${details.appointmentDate}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Appointment Time:</strong> ${details.appointmentTime}</p>
        </div>
        <p style="font-size: 14px; color: #666666; margin-top: 15px; font-family: 'Open Sans', sans-serif;">
          <strong style="color: #2c3e50;">Instructions:</strong> Please arrive 15 minutes early with this slip and any relevant medical records. For cancellation or rescheduling, contact the hospital at least 24 hours prior.
        </p>
        <div style="text-align: center; margin-top: 25px;">
          <img src="${barcodeDataUrl}" alt="Barcode" style="width: 180px; height: auto; border: 2px solid #e0e0e0; border-radius: 8px;" />
          <p style="font-size: 12px; color: #666666; margin-top: 8px; font-family: 'Open Sans', sans-serif;">Booking ID: ${details.bookingId}</p>
        </div>
        <p style="font-size: 12px; color: #666666; text-align: center; margin-top: 25px; font-family: 'Open Sans', sans-serif;">
          Generated by Swasthya Setu on ${currentDate} | Confidential Appointment Details
        </p>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `${details.patientName}_Appointment_Details_${details.bookingId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    document.body.appendChild(wrapper);
    html2pdf()
      .from(wrapper)
      .set(opt)
      .save()
      .then(() => {
        document.body.removeChild(wrapper);
        setDownloading(false);
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
        setDownloading(false);
      });
  };

  if (!appointment) {
    return <div>No appointment details available.</div>;
  }

  return (
    <div className={styles.detailsContainer}>
      <div className={styles.detailsSection}>
        <h1 className={styles.detailsTitle}>Appointment Details</h1>
        <div className={styles.detailsContent}>
          <div className={styles.logoContainer}>
            <img src={logo} alt="Swasthya Setu Logo" className={styles.logo} />
            <h3 className={styles.brandTitle}>Swasthya Setu</h3>
          </div>
          <div className={styles.patientInfo}>
            <div className={styles.patientDetails}>
              <p className={styles.detailItem}><strong>Patient Name:</strong> {details.patientName}</p>
              <p className={styles.detailItem}><strong>Booking ID:</strong> {details.bookingId}</p>
              <p className={styles.detailItem}><strong>Patient ID:</strong> {details.patientId}</p>
              <p className={styles.detailItem}><strong>Email:</strong> {details.email}</p>
              <p className={styles.detailItem}><strong>Date of Issue:</strong> {currentDate}</p>
            </div>
            <div className={styles.qrCodeContainer}>
              <QRCodeCanvas id="qrCodeCanvas" value={qrCodePayload} size={120} level="H" />
              <p className={styles.qrCodeText}>Scan to view appointment details</p>
            </div>
          </div>
          <hr className={styles.divider} />
          <div className={styles.appointmentDetails}>
            <p className={styles.detailItem}><strong>Hospital:</strong> {details.hospitalName}</p>
            <p className={styles.detailItem}><strong>Specialty:</strong> {details.specialty}</p>
            <p className={styles.detailItem}><strong>Doctor:</strong> {details.doctorName}</p>
            <p className={styles.detailItem}><strong>Appointment Date:</strong> {details.appointmentDate}</p>
            <p className={styles.detailItem}><strong>Appointment Time:</strong> {details.appointmentTime}</p>
            <p className={styles.detailItem}><strong>Appointment Type:</strong> <span className={styles.typeBadge}>{details.appointmentType || "In-Person"}</span></p>
            {details.appointmentType === "Video Consultation" && (
              <div className={styles.videoActionContainer}>
                <p className={styles.videoInfo}>This is an online video consultation. You can join the call 5 minutes before the scheduled time.</p>
                <button 
                  className={styles.joinVideoButton}
                  onClick={() => window.location.href = `/vedio-calling#${details.bookingId}`}
                >
                  Join Video Consultation
                </button>
              </div>
            )}
            <p className={styles.instructions}>
              <strong>Instructions:</strong> Please arrive 15 minutes early with this slip and any relevant medical records. For cancellation or rescheduling, contact the hospital at least 24 hours prior.
            </p>
          </div>
          <div className={styles.barcodeContainer}>
            <canvas ref={barcodeRef} id="barcode" className={styles.barcode} />
            <p className={styles.qrCodeText}>Booking ID: {details.bookingId}</p>
          </div>
          <p className={styles.footerText}>
            Generated by Swasthya Setu on {currentDate} | Confidential Appointment Details
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className={styles.downloadButton}
          disabled={downloading}
        >
          {downloading ? "Generating PDF..." : "Download Appointment Details"}
        </button>
      </div>
    </div>
  );
};

export default AppointmentDetails;
