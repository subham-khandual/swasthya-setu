import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapPin, Clock, FileText, DollarSign, Bell, Lock, Ambulance, X } from "lucide-react"; // Added X icon
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import hospitalData from "../../../assets/Data/Hospitallist.json";
import styles from "./Hospital.module.css";
import HospitalBookingSlip from "./HospitalBookingSlip";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HospitalIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/33/33426.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapClickHandler = ({ setPinLocation }) => {
  useMapEvents({
    click(e) {
      setPinLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [hospitals] = useState(hospitalData);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null); // Add time slot state
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showBookingSlip, setShowBookingSlip] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [appointments, setAppointments] = useState([]); // Store booked appointments
  const [appointmentType, setAppointmentType] = useState({ value: "in-person", label: "In-Person" });

  useEffect(() => {
    // Fetch user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => toast.error("Failed to get location")
    );

    // Load appointments from localStorage
    const savedAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
    setAppointments(savedAppointments);
  }, []);

  // Add a listener to update appointments when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
      setAppointments(savedAppointments);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const selectStyles = {
    container: (base) => ({ ...base, width: "100%", zIndex: 1050 }),
    control: (base) => ({
      ...base,
      borderRadius: "10px",
      border: "1px solid #ced4da",
      boxShadow: "none",
      "&:hover": { borderColor: "#ced4da" },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 1051,
      borderRadius: "10px",
      marginTop: "2px",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      fontFamily: "Georgia, serif",
      color: "#2c3e50",
      backgroundColor: isFocused ? "#e6f3ff" : "white",
      "&:active": { backgroundColor: "#e6f3ff" },
    }),
    singleValue: (base) => ({
      ...base,
      color: "#2c3e50",
      fontFamily: "Georgia, serif",
    }),
  };

  const specialties = [
    { value: "cardiology", label: "Cardiology" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "neurology", label: "Neurology" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "insurance", label: "Insurance" },
  ];

  const appointmentTypes = [
    { value: "in-person", label: "In-Person" },
    { value: "video", label: "Video Consultation" },
  ];

  const getNearestHospitals = () => {
    if (!userLocation) return [];
    return hospitals
      .map((hospital) => ({
        ...hospital,
        distance: calculateDistance(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  };

  const handleEmergencyAdmission = (hospital) => {
    toast.success(`Emergency admission requested at ${hospital.name}`);
  };

  const handleConfirmBooking = () => {
    if (!selectedSpecialty || !appointmentDate || !selectedTime || !paymentMethod) {
      toast.error("Please fill all required fields!");
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // yyyy-mm-dd
    if (appointmentDate < todayStr) {
      toast.error("Please choose today or a future date, not a past date.");
      return;
    }

    const newBooking = {
      patientName: "User", // Placeholder; replace with actual user data if available
      hospitalName: selectedHospital.name,
      specialty: selectedSpecialty.label,
      doctorName: "Dr. Assigned",
      appointmentDate,
      appointmentTime: selectedTime.label, // Use selected time slot
      appointmentType: appointmentType.label,
      bookingId: `APPT${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      patientId: `PAT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email: "user@example.com", // Placeholder
    };

    const updatedAppointments = [...appointments, newBooking];
    setAppointments(updatedAppointments);
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments)); // Save to localStorage
    setBookingDetails(newBooking);
    setShowBookingSlip(true);
    setIsBookingPopupOpen(false);

    // Trigger Notification on Server
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      axios.post(`${API_BASE_URL}/api/notifications`, {
        recipient: user.userId || user._id,
        recipientModel: user.role === 'doctor' ? 'Doctor' : 'User',
        type: 'appointment',
        title: 'Appointment Booked',
        message: `Your appointment at ${selectedHospital.name} for ${selectedSpecialty.label} has been confirmed.`,
        data: { bookingId: newBooking.bookingId }
      }).catch(err => console.error("Failed to trigger notification:", err));
    }

    // Reset form fields
    setSelectedSpecialty(null);
    setAppointmentDate("");
    setSelectedTime(null);
    setPaymentMethod(null);
  };

  // Function to handle appointment cancellation
  const handleCancelAppointment = (bookingId) => {
    const updatedAppointments = appointments.filter((appointment) => appointment.bookingId !== bookingId);
    setAppointments(updatedAppointments);
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    toast.success("Appointment cancelled successfully!");
    // Optionally dispatch storage event to sync with other tabs
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.greeting}>Hospital Dashboard</h1>

      {/* Summary Cards */}
      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/all-hospitals", { state: { userLocation } })}>
          <MapPin /> <h3>Find Hospitals</h3>
          <p>Search & book appointments</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/medical-records")}>
          <FileText /> <h3>Medical Records</h3>
          <p>Access your EHR</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/emergency-services")}>
          <Ambulance /> <h3>Emergency</h3>
          <p>One-click emergency support</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/billing")}>
          <DollarSign /> <h3>Billing</h3>
          <p>Manage payments & insurance</p>
        </div>
      </div>

      {/* Appointments Section */}
      <div className={styles.appointmentsSection}>
        <h2>Your Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments booked yet.</p>
        ) : (
          <div className={styles.appointmentsGrid}>
            {appointments.map((appointment, index) => (
              <div key={index} className={styles.appointmentCard} style={{ position: "relative" }} onClick={() => navigate(`/appointment/${appointment.bookingId}`, { state: { appointment } })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3>{appointment.hospitalName}</h3>
                    <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                    <p><strong>Time:</strong> {appointment.appointmentTime || "N/A"}</p>
                    <p><strong>Specialty:</strong> {appointment.specialty}</p>
                    <p><strong>Booking ID:</strong> {appointment.bookingId}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className={styles.cancelButton}
                      onClick={(e) => { e.stopPropagation(); handleCancelAppointment(appointment.bookingId); }}
                      title="Cancel Appointment"
                    >
                      <X size={18} color="#e74c3c" />
                    </button>
                    {appointment.appointmentType === "Video Consultation" && (
                      <button
                        className={styles.joinCallBtn}
                        onClick={(e) => { e.stopPropagation(); navigate(`/vedio-calling#${appointment.bookingId}`); }}
                      >
                        Join Call
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Hospitals */}
      <div className={styles.hospitalsSection}>
        <h2>Nearby Hospitals</h2>
        <div className={styles.hospitalsGrid}>
          {getNearestHospitals().map((hospital, index) => (
            <div key={index} className={styles.hospitalCard} onClick={() => { setSelectedHospital(hospital); setIsBookingPopupOpen(true); }}>
              <img src={hospital.imageUrl} alt={hospital.name} className={styles.hospitalImage} loading="lazy" decoding="async" />
              <h3>{hospital.name}</h3>
              <p>Distance: {hospital.distance.toFixed(2)} km</p>
              <p>Available Beds: {hospital.bedAvailability.general}</p>
              <button
                className={styles.emergencyBtn}
                onClick={(e) => { e.stopPropagation(); handleEmergencyAdmission(hospital); }}
              >
                Emergency
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: "#27ae60", color: "#fff" }}>
                <h5>Book Appointment</h5>
                <button className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p>Selected Hospital: {selectedHospital?.name}</p>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Choose Specialty
                  </label>
                  <Select
                    options={specialties}
                    value={selectedSpecialty}
                    onChange={setSelectedSpecialty}
                    placeholder="Select Specialty"
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Time Slot
                  </label>
                  <Select
                    options={timeSlots}
                    value={selectedTime}
                    onChange={setSelectedTime}
                    placeholder="Choose a time slot..."
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Appointment Type
                  </label>
                  <Select
                    options={appointmentTypes}
                    value={appointmentType}
                    onChange={setAppointmentType}
                    placeholder="In-Person or Video?"
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Payment Method
                  </label>
                  <Select
                    options={paymentOptions}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Payment Method"
                    styles={selectStyles}
                  />
                </div>
                <div className="mt-3">
                  <MapContainer center={userLocation || [20.5937, 78.9629]} zoom={13} style={{ height: "200px" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={HospitalIcon} />}
                    <MapClickHandler setPinLocation={setPinLocation} />
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" style={{ borderRadius: "10px" }} onClick={handleConfirmBooking}>Book Now</button>
                <button className="btn btn-danger" style={{ borderRadius: "10px" }} onClick={() => setIsBookingPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBookingSlip && <HospitalBookingSlip bookingDetails={bookingDetails} />}
      <ToastContainer />
    </div>
  );
};

export default HospitalDashboard;
