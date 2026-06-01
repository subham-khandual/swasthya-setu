import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Stethoscope, Star, Video, FileText, PhoneCall, Bot, Loader, Calendar as CalIcon } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css";
import html2pdf from "html2pdf.js";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";
import logo from "../../../assets/SwasthyaSetuLogo.png";
import axios from "axios";
import { useNotifications } from "../../../../context/NotificationContext";

// Department Images
import genPhysicianImg from "../../../../assets/general_physician.png";
import pediatricianImg from "../../../../assets/pediatrician.png";
import cardiologistImg from "../../../../assets/cardiologist.png";
import neurologistImg from "../../../../assets/neurologist.png";
import orthoImg from "../../../../assets/orthopedic_surgeon.png";
import gyneImg from "../../../../assets/gynecologist.png";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DoctorIcon = (size) => L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]],
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0, -10],
});

const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setAddress(data.display_name || "Unknown location"))
        .catch(() => setAddress("Unable to fetch address"));
    },
  });
  return null;
};

const Doctors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchNotifications, addNotification } = useNotifications();

  // Mock doctor data
  const mockDoctors = [
    { id: 1, name: "Dr. R K Sharma", specialty: "Cardiologist", experience: "10 years", hospital: "Apollo Hospital", address: "Bhubaneswar", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821, fee: "$50" },
    { id: 2, name: "Dr. P K Mishra", specialty: "Dermatologist", experience: "8 years", hospital: "KIMS Hospital", address: "Patia", rating: 4.5, availableNow: false, nextSlot: "Tomorrow, 10 AM", lat: 20.354, lng: 85.822, fee: "$40" },
    { id: 3, name: "Dr. A R Ray", specialty: "Neurologist", experience: "15 years", hospital: "AIIMS Bhubaneswar", address: "Infocity", rating: 4.9, availableNow: true, lat: 20.334, lng: 85.810, fee: "$80" },
    { id: 4, name: "Dr. S Jena", specialty: "Orthopedist", experience: "12 years", hospital: "Sparsh Hospital", address: "Saheed Nagar", rating: 4.7, availableNow: false, nextSlot: "Tomorrow, 2 PM", lat: 20.291, lng: 85.845, fee: "$60" },
    { id: 5, name: "Dr. M Das", specialty: "Pediatrician", experience: "7 years", hospital: "Care Hospital", address: "Chandrasekharpur", rating: 4.6, availableNow: true, lat: 20.324, lng: 85.817, fee: "$45" },
    { id: 6, name: "Dr. N Sahoo", specialty: "General Physician", experience: "20 years", hospital: "SUM Hospital", address: "Kalinga Nagar", rating: 4.9, availableNow: true, lat: 20.260, lng: 85.839, fee: "$30" },
    { id: 7, name: "Dr. B Swain", specialty: "Psychiatrist", experience: "13 years", hospital: "Mental Health Institute", address: "Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.334, lng: 85.810, fee: "$70" },
    { id: 8, name: "Dr. S Mohanty", specialty: "Gynecologist", experience: "11 years", hospital: "Capital Hospital", address: "Unit 6", rating: 4.8, availableNow: true, lat: 20.276, lng: 85.839, fee: "$65" }
  ];

  const [doctors, setDoctors] = useState(mockDoctors);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  
  // AI Recommendation State
  const [symptomsInput, setSymptomsInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Booking State
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [selectedProfileDoctor, setSelectedProfileDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [medicalReport, setMedicalReport] = useState(null);
  const [previewPrescription, setPreviewPrescription] = useState(null);
  
  const [bookingDetailsList, setBookingDetailsList] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const barcodeRefs = useRef({});

  const specialties = [
    { value: "General Physician", label: "General Physician" },
    { value: "Pediatrician", label: "Pediatrician" },
    { value: "Cardiologist", label: "Cardiologist" },
    { value: "Neurologist", label: "Neurologist" },
    { value: "Orthopedist", label: "Orthopedist" },
    { value: "Gynecologist", label: "Gynecologist" },
    { value: "Dermatologist", label: "Dermatologist" },
    { value: "Psychiatrist", label: "Mental Health Specialist / Psychiatrist" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  const getSlotEndHour = (timeLabel) => {
    if (!timeLabel) return 23;
    const match = timeLabel.match(/(\d+):(\d+)\s*(AM|PM)\s*$/i);
    if (!match) return 23;
    let hour = parseInt(match[1]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour;
  };

  const filterExpiredAppointments = (appointments) => {
    const now = new Date();
    return appointments.filter(booking => {
      const bookingDate = new Date(booking.appointmentDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const bDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
      
      if (bDate > today) return true; // future date, keep
      if (bDate < today) return false; // past date, remove
      
      // Same day — check if slot time has passed
      const endHour = getSlotEndHour(booking.appointmentTime);
      return now.getHours() < endHour;
    });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => setUserLocation([position.coords.latitude, position.coords.longitude]),
        err => console.warn("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    const storedAppointments = JSON.parse(localStorage.getItem("doctorAppointments")) || [];
    const active = filterExpiredAppointments(storedAppointments);
    if (active.length !== storedAppointments.length) {
      localStorage.setItem("doctorAppointments", JSON.stringify(active));
    }
    setBookingDetailsList(active);

    // Auto-clean expired consultations every 60 seconds
    const interval = setInterval(() => {
      setBookingDetailsList(prev => {
        const filtered = filterExpiredAppointments(prev);
        if (filtered.length !== prev.length) {
          localStorage.setItem("doctorAppointments", JSON.stringify(filtered));
        }
        return filtered;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bookingDetailsList.forEach(booking => {
      const ref = barcodeRefs.current[booking.bookingId];
      if (ref) {
        try {
          JsBarcode(ref, booking.bookingId, { format: "CODE128", displayValue: true, fontSize: 14, width: 2, height: 40 });
        } catch (e) {}
      }
    });
  }, [bookingDetailsList]);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedSpecialty || doctor.specialty === selectedSpecialty.value)
  );

  const handleAiRecommendation = async () => {
    if (!symptomsInput) {
      toast.warn("Please enter your symptoms for AI recommendation.");
      return;
    }
    setIsAiLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ 
            role: "system", 
            content: "You are a medical triage AI. The user will provide symptoms. You must return exactly ONE of these specialties that best fits the symptoms: 'General Physician', 'Pediatrician', 'Cardiologist', 'Neurologist', 'Orthopedist', 'Gynecologist', 'Dermatologist', 'Psychiatrist'. Do not add any extra text or punctuation."
          }, { role: "user", content: symptomsInput }],
          temperature: 0.1
        })
      });
      const data = await response.json();
      const aiSpecialty = data.choices[0]?.message?.content.trim();
      
      const matchedOption = specialties.find(s => s.value.toLowerCase() === aiSpecialty.toLowerCase());
      if (matchedOption) {
        setSelectedSpecialty(matchedOption);
        toast.success(`AI recommends a ${matchedOption.label} based on your symptoms.`);
      } else {
        toast.info("AI suggests consulting a General Physician first.");
        setSelectedSpecialty({ value: "General Physician", label: "General Physician" });
      }
    } catch (err) {
      toast.error("AI recommendation failed. Please select manually.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!userName || !email || !appointmentType || !appointmentDate || !appointmentTime) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (!/^[A-Za-z ]{3,50}$/.test(userName)) {
      toast.error("Invalid name! Minimum 3 characters, only alphabets and spaces allowed.");
      return;
    }
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)) {
      toast.error("Invalid email format! Email must be in lowercase and use @gmail.com.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (appointmentDate < today) {
      toast.error("Invalid date. Please select today or a future date.");
      return;
    }

    const bookingId = `DOC${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const virtualLink = `/vedio-calling#${bookingId}`;

    const bookingData = {
      patientName: userName,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      hospitalName: selectedDoctor.hospital,
      appointmentDate,
      appointmentTime: appointmentTime.label,
      appointmentType: appointmentType.label,
      bookingId,
      patientId: `PAT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email,
      address: appointmentType.value === "inPerson" ? address : "N/A",
      latitude: appointmentType.value === "inPerson" ? latitude : "N/A",
      longitude: appointmentType.value === "inPerson" ? longitude : "N/A",
      virtualMeetingUrl: appointmentType.value === "video" ? virtualLink : null,
      hasReport: !!medicalReport
    };

    const updatedAppointments = [...bookingDetailsList, bookingData];
    localStorage.setItem("doctorAppointments", JSON.stringify(updatedAppointments));
    setBookingDetailsList(updatedAppointments);

    if (appointmentType.value === "inPerson") {
      toast.success(`In-Person Consultation booked with ${selectedDoctor.name}! Check notification box.`);
      try {
        const notifData = {
          _id: Math.random().toString(36).substring(2),
          type: "appointment",
          title: "In-Person Consultation Booked",
          message: `Your in-person consultation with ${selectedDoctor.name} at ${selectedDoctor.hospital} is scheduled for ${appointmentDate} at ${appointmentTime.label}.`,
          isRead: false,
          createdAt: new Date().toISOString()
        };

        // Push directly to frontend context instantly
        if (addNotification) {
          addNotification(notifData);
        }

        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?._id || user?.userId;
        if (userId) {
          await fetch(`${API_BASE_URL}/api/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: userId,
              recipientModel: "Patient",
              type: "appointment",
              title: notifData.title,
              message: notifData.message
            })
          });
        }
      } catch (e) {
        console.error("Failed to post notification", e);
      }
    } else {
      toast.success(`Video Consultation booked with ${selectedDoctor.name}! Join the video call at your booked time.`);
    }

    setIsBookingPopupOpen(false);
    setMedicalReport(null);
  };

  const getPrescriptionDetails = (specialty) => {
    switch (specialty) {
      case "Cardiologist": return ["Aspirin 75mg (1-0-0) after breakfast", "Atorvastatin 10mg (0-0-1) after dinner", "Monitor blood pressure daily", "Low sodium diet and regular brisk walking"];
      case "Dermatologist": return ["Ketoconazole Cream 2% - Apply locally twice a day", "Cetirizine 10mg (0-0-1) for 5 days", "Use a mild, fragrance-free soap", "Avoid direct sun exposure"];
      case "Neurologist": return ["Pregabalin 50mg (0-0-1) before sleep", "Vitamin B-12 Supplements (1-0-0) for 30 days", "Ensure 8 hours of uninterrupted sleep", "Follow up after 2 weeks"];
      case "Orthopedist": return ["Ibuprofen 400mg (1-0-1) after meals for 5 days", "Calcium + Vitamin D3 Supplement (1-0-0)", "Apply ice pack on the affected area twice a day", "Avoid lifting heavy weights"];
      case "Pediatrician": return ["Paracetamol Syrup 5ml (if fever > 100°F)", "ORS Liquid - Drink frequently", "Keep the child hydrated", "Sponge bath for high temperature"];
      case "Gynecologist": return ["Folic Acid 5mg (1-0-0) daily", "Iron Supplement (0-1-0) after lunch", "Drink 3-4 liters of water daily", "Routine ultrasound recommended"];
      case "Psychiatrist": return ["Escitalopram 10mg (1-0-0) after breakfast", "Maintain a daily mood journal", "Engage in 20 mins of mindfulness meditation", "Follow up session in 14 days"];
      case "General Physician":
      default: return ["Paracetamol 500mg (1-0-1) for 3 days", "Azithromycin 500mg (1-0-0) for 3 days", "Drink plenty of warm water and rest.", "Avoid cold foods and beverages"];
    }
  };

  const downloadPrescription = (booking) => {
    const rxItems = getPrescriptionDetails(booking.specialty);
    const rxListHtml = rxItems.map(item => `<li>${item}</li>`).join("");

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div style="padding: 30px; font-family: Arial, sans-serif;">
        <h1 style="color: #27ae60; text-align: center;">Swasthya Setu Digital Prescription</h1>
        <hr/>
        <p><strong>Doctor:</strong> ${booking.doctorName} (${booking.specialty})</p>
        <p><strong>Patient:</strong> ${booking.patientName}</p>
        <p><strong>Date:</strong> ${booking.appointmentDate}</p>
        <br/>
        <h3>Rx:</h3>
        <ul>
          ${rxListHtml}
        </ul>
        <br/>
        <p style="color: gray; text-align: center; font-size: 12px;">Digitally signed via Swasthya Setu Platform</p>
      </div>
    `;
    html2pdf().from(wrapper).save(`Prescription_${booking.bookingId}.pdf`);
  };

  return (
    <div className={styles.container} style={{ paddingBottom: "100px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header & Emergency */}
      <div style={{ background: "linear-gradient(90deg, #2ecc71, #27ae60)", padding: "20px", borderRadius: "15px", color: "white", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}><Stethoscope/> Doctor Consultancy</h1>
          <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>HD Video Consultations & Appointments</p>
        </div>
        <button 
          onClick={() => navigate('/vedio-calling#emergency')} 
          style={{ background: "#e74c3c", color: "white", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 10px rgba(231,76,60,0.4)", cursor: "pointer" }}
        >
          <PhoneCall size={18}/> Emergency
        </button>
      </div>

      {/* AI Recommendation */}
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2c3e50", marginBottom: "15px", fontSize: "1.2rem" }}>
          <Bot color="#2980b9"/> AI Doctor Match
        </h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input 
            type="text" 
            placeholder="Describe your symptoms (e.g. severe headache, chest pain...)" 
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ced4da", outline: "none" }}
          />
          <button onClick={handleAiRecommendation} disabled={isAiLoading} style={{ background: "#2980b9", color: "white", border: "none", padding: "0 20px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            {isAiLoading ? <Loader size={18} className="spin" /> : "Match"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <Select
            options={specialties}
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
            placeholder="Filter by Specialty"
            isClearable
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <input 
            type="text" 
            placeholder="Search doctor by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc", height: "38px" }}
          />
        </div>
      </div>

      {/* Doctors Grid */}
      <h2 style={{ color: "#2c3e50", fontSize: "1.3rem", marginBottom: "15px" }}>Available Specialists</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        {filteredDoctors.map(doc => (
          <div key={doc.id} style={{ background: "white", borderRadius: "12px", padding: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #27ae60" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#2c3e50" }}>{doc.name}</h3>
                <p style={{ margin: "2px 0", color: "#7f8c8d", fontSize: "0.9rem" }}>{doc.specialty} • {doc.experience}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#f39c12", fontSize: "0.85rem", marginTop: "5px" }}>
                  <Star size={14} fill="#f39c12"/> {doc.rating} Rating
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", background: doc.availableNow ? "#e8f8f5" : "#fef9e7", color: doc.availableNow ? "#27ae60" : "#f39c12", padding: "4px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {doc.availableNow ? "Available Now" : doc.nextSlot}
                </span>
                <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", fontWeight: "bold", color: "#2980b9" }}>{doc.fee}</p>
              </div>
            </div>
            <hr style={{ borderColor: "#f1f2f6", margin: "10px 0" }}/>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => { setSelectedProfileDoctor(doc); setIsProfilePopupOpen(true); }}
                style={{ flex: 1, padding: "8px", background: "#f1f2f6", color: "#2c3e50", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}
              >
                View Profile
              </button>
              <button 
                onClick={() => { setSelectedDoctor(doc); setIsBookingPopupOpen(true); }}
                style={{ flex: 1, padding: "8px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
              >
                <CalIcon size={16}/> Book
              </button>
            </div>
          </div>
        ))}
        {filteredDoctors.length === 0 && <p style={{ color: "#7f8c8d" }}>No doctors found matching your criteria.</p>}
      </div>

      {/* Consultation History */}
      {bookingDetailsList.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ color: "#2c3e50", fontSize: "1.3rem", margin: 0 }}>Your Consultations</h2>
            <button 
              onClick={() => {
                localStorage.removeItem("doctorAppointments");
                setBookingDetailsList([]);
                toast.info("Consultation history cleared.");
              }} 
              style={{ background: "#e74c3c", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
            >
              Clear History
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {bookingDetailsList.map((booking, idx) => (
              <div key={idx} style={{ background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #ecf0f1" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: 0, color: "#2c3e50" }}>{booking.doctorName}</h4>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#7f8c8d" }}>{booking.appointmentDate} at {booking.appointmentTime}</p>
                    <span style={{ display: "inline-block", background: booking.appointmentType.includes("Video") ? "#e1bee7" : "#c8e6c9", color: booking.appointmentType.includes("Video") ? "#8e24aa" : "#2e7d32", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75rem", marginTop: "5px" }}>
                      {booking.appointmentType}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {booking.appointmentType.includes("Video") && (
                      <button onClick={() => navigate(booking.virtualMeetingUrl)} style={{ background: "#2980b9", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem" }}>
                        <Video size={14}/> Join Call
                      </button>
                    )}
                    <button onClick={() => setPreviewPrescription(booking)} style={{ background: "#f39c12", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem" }}>
                      <FileText size={14}/> Prescription
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.6)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", overflow: "hidden" }}>
              <div className="modal-header" style={{ background: "#27ae60", color: "white", borderBottom: "none" }}>
                <h5 className="modal-title">Book with {selectedDoctor?.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px", background: "#f9fbfd" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  
                  {/* Personal Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#7f8c8d", fontWeight: "600", marginBottom: "5px", display: "block" }}>Patient Name</label>
                      <input type="text" placeholder="John Doe" value={userName} onChange={e => setUserName(e.target.value)} className="form-control" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #dfe6e9", height: "42px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#7f8c8d", fontWeight: "600", marginBottom: "5px", display: "block" }}>Email Address</label>
                      <input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className="form-control" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #dfe6e9", height: "42px" }} />
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "#7f8c8d", fontWeight: "600", marginBottom: "5px", display: "block" }}>Consultation Type</label>
                    <Select
                      options={[{ value: "video", label: "Video Consultation ($" + selectedDoctor?.fee.replace('$', '') + ")" }, { value: "inPerson", label: "In-Person Consultation" }]}
                      value={appointmentType}
                      onChange={(opt) => {
                        setAppointmentType(opt);
                        if (opt?.value === "video") {
                          setAppointmentTime({ value: "24hours", label: "24 Hours Access" });
                        } else {
                          setAppointmentTime(null);
                        }
                      }}
                      placeholder="Select type..."
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: base => ({ ...base, zIndex: 99999 }), control: provided => ({ ...provided, borderRadius: "8px", border: "1px solid #dfe6e9", minHeight: "42px" }) }}
                    />
                  </div>

                  {/* Date & Time */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#7f8c8d", fontWeight: "600", marginBottom: "5px", display: "block" }}>Date</label>
                      <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="form-control" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #dfe6e9", height: "42px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#7f8c8d", fontWeight: "600", marginBottom: "5px", display: "block" }}>Time Slot</label>
                      <Select 
                        options={appointmentType?.value === "video" ? [{ value: "24hours", label: "24 Hours Access" }] : timeSlots} 
                        value={appointmentTime} 
                        onChange={setAppointmentTime} 
                        placeholder="Select time..." 
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 99999 }), control: provided => ({ ...provided, borderRadius: "8px", border: "1px solid #dfe6e9", minHeight: "42px" }) }} 
                      />
                    </div>
                  </div>
                </div>

                {appointmentType?.value === "video" && (
                  <div className="mb-3" style={{ background: "white", padding: "15px", borderRadius: "8px", border: "1px dashed #ccc" }}>
                    <label style={{ fontSize: "0.9rem", color: "#7f8c8d", display: "flex", alignItems: "center", gap: "5px" }}>
                      <FileText size={16}/> Upload Medical Reports (Optional)
                    </label>
                    <input type="file" onChange={e => setMedicalReport(e.target.files[0])} className="form-control mt-2" style={{ fontSize: "0.85rem" }} />
                    <p style={{ fontSize: "0.75rem", color: "#bdc3c7", marginTop: "5px", marginBottom: 0 }}>PDF, JPG, PNG formats supported. End-to-end encrypted.</p>
                  </div>
                )}

                {appointmentType?.value === "inPerson" && (
                  <div className="mb-3">
                    <label style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>Your Location</label>
                    <MapContainer center={userLocation || [20.333, 85.821]} zoom={13} style={{ height: "150px", borderRadius: "8px", marginTop: "5px" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {pinLocation && <Marker position={pinLocation} icon={DoctorIcon([30, 30])} />}
                      <MapClickHandler setPinLocation={setPinLocation} setLatitude={setLatitude} setLongitude={setLongitude} setAddress={setAddress} />
                    </MapContainer>
                  </div>
                )}

              </div>
              <div className="modal-footer" style={{ background: "#f9fbfd", borderTop: "none" }}>
                <button className="btn" style={{ background: "#bdc3c7", color: "white" }} onClick={() => setIsBookingPopupOpen(false)}>Cancel</button>
                <button className="btn" style={{ background: "#2980b9", color: "white", display: "flex", alignItems: "center", gap: "5px" }} onClick={handleBookAppointment}>
                  {appointmentType?.value === "video" ? <Video size={16}/> : <CalIcon size={16}/>} Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Popup */}
      {isProfilePopupOpen && selectedProfileDoctor && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.6)", zIndex: 1040, position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px", width: "100%", margin: "0 20px" }}>
            <div className="modal-content" style={{ borderRadius: "15px", overflow: "hidden", background: "white" }}>
              <div className="modal-header" style={{ background: "#2980b9", color: "white", borderBottom: "none", display: "flex", justifyContent: "space-between", padding: "15px 20px", alignItems: "center" }}>
                <h5 className="modal-title" style={{ margin: 0, fontSize: "1.2rem" }}>Doctor Profile</h5>
                <button type="button" style={{ background: "transparent", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }} onClick={() => setIsProfilePopupOpen(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: "20px", textAlign: "center" }}>
                <img 
                  src={
                    selectedProfileDoctor.specialty === "Cardiologist" ? cardiologistImg :
                    selectedProfileDoctor.specialty === "Pediatrician" ? pediatricianImg :
                    selectedProfileDoctor.specialty === "Neurologist" ? neurologistImg :
                    selectedProfileDoctor.specialty === "Orthopedist" ? orthoImg :
                    selectedProfileDoctor.specialty === "Gynecologist" ? gyneImg :
                    genPhysicianImg
                  }
                  alt={selectedProfileDoctor.specialty}
                  style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid #f1f2f6", marginBottom: "15px" }}
                />
                <h3 style={{ margin: "0 0 5px 0", color: "#2c3e50" }}>{selectedProfileDoctor.name}</h3>
                <p style={{ margin: "0 0 15px 0", color: "#2980b9", fontWeight: "bold", fontSize: "1.1rem" }}>{selectedProfileDoctor.specialty}</p>
                
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "15px", textAlign: "left", marginBottom: "15px" }}>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong><Star size={16} color="#f39c12" style={{ verticalAlign: "middle", marginRight: "5px" }}/> Rating:</strong> {selectedProfileDoctor.rating} / 5.0</p>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong><Stethoscope size={16} color="#27ae60" style={{ verticalAlign: "middle", marginRight: "5px" }}/> Experience:</strong> {selectedProfileDoctor.experience}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong>Location:</strong> {selectedProfileDoctor.hospital}, {selectedProfileDoctor.address}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong>Consultation Fee:</strong> {selectedProfileDoctor.fee}</p>
                </div>
                
                <p style={{ color: "#7f8c8d", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  Dr. {selectedProfileDoctor.name.replace("Dr. ", "")} is a highly experienced {selectedProfileDoctor.specialty.toLowerCase()} with {selectedProfileDoctor.experience} of clinical practice. Dedicated to providing compassionate and comprehensive care to all patients.
                </p>
              </div>
              <div className="modal-footer" style={{ padding: "15px 20px", background: "#f9fbfd", borderTop: "1px solid #ecf0f1", display: "flex", gap: "10px" }}>
                <button style={{ flex: 1, padding: "10px", background: "#bdc3c7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }} onClick={() => setIsProfilePopupOpen(false)}>Close</button>
                <button 
                  style={{ flex: 1, padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }} 
                  onClick={() => {
                    setIsProfilePopupOpen(false);
                    setSelectedDoctor(selectedProfileDoctor);
                    setIsBookingPopupOpen(true);
                  }}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Preview Popup */}
      {previewPrescription && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.6)", zIndex: 1050, position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px", width: "100%", margin: "0 20px" }}>
            <div className="modal-content" style={{ borderRadius: "15px", overflow: "hidden", background: "white" }}>
              <div className="modal-header" style={{ background: "#f39c12", color: "white", borderBottom: "none", display: "flex", justifyContent: "space-between", padding: "15px 20px", alignItems: "center" }}>
                <h5 className="modal-title" style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}><FileText size={20}/> Digital Prescription</h5>
                <button type="button" style={{ background: "transparent", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }} onClick={() => setPreviewPrescription(null)}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: "30px 20px", background: "#fdfbf7" }}>
                <div style={{ textAlign: "center", borderBottom: "1px dashed #ccc", paddingBottom: "15px", marginBottom: "20px" }}>
                  <h2 style={{ color: "#27ae60", margin: "0 0 10px 0", fontSize: "1.4rem" }}>Swasthya Setu</h2>
                  <p style={{ margin: "2px 0", color: "#7f8c8d", fontSize: "0.9rem" }}>E-Prescription Document</p>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong>Doctor:</strong> {previewPrescription.doctorName} <span style={{ color: "#7f8c8d", fontSize: "0.85rem" }}>({previewPrescription.specialty})</span></p>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong>Patient:</strong> {previewPrescription.patientName}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.95rem" }}><strong>Date:</strong> {previewPrescription.appointmentDate}</p>
                </div>
                
                <div style={{ background: "white", padding: "15px", borderRadius: "8px", border: "1px solid #eee" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "1.2rem", borderBottom: "2px solid #3498db", display: "inline-block" }}>Rx</h3>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#34495e", lineHeight: "1.8" }}>
                    {getPrescriptionDetails(previewPrescription.specialty).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <p style={{ color: "#bdc3c7", fontSize: "0.75rem", margin: 0 }}>Digitally signed via Swasthya Setu Platform</p>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: "15px 20px", background: "#f9fbfd", borderTop: "1px solid #ecf0f1", display: "flex", gap: "10px" }}>
                <button style={{ flex: 1, padding: "10px", background: "#bdc3c7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }} onClick={() => setPreviewPrescription(null)}>Close</button>
                <button 
                  style={{ flex: 1, padding: "10px", background: "#f39c12", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }} 
                  onClick={() => downloadPrescription(previewPrescription)}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-center" />
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default Doctors;
