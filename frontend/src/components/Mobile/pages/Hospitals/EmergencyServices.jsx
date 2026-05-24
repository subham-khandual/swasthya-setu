import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Ambulance, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Select from "react-select";
import hospitalData from "../../../assets/Data/Hospitallist.json";
import styles from "./Hospital.module.css";

const PATIENT_ID = "67ccc44c671f5aa635f458e1";
const DEFAULT_LOCATION = [20.2961, 85.8245];

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

const AmbulanceIcon = L.divIcon({
  className: "ambulance-marker",
  html: '<div style="background-color: blue; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmergencyServices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userLocation = React.useMemo(() => location.state?.userLocation || DEFAULT_LOCATION, [location.state?.userLocation]);
  const [hospitals] = useState(hospitalData);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        // Simulate ambulance movement towards user location
        setAmbulanceLocation([
          userLocation[0] + (Math.random() - 0.5) * 0.01,
          userLocation[1] + (Math.random() - 0.5) * 0.01,
        ]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isTracking, userLocation]);

  const getNearestEmergencyHospitals = () => {
    return hospitals
      .filter(h => h.emergencyServices.available)
      .map(hospital => ({
        ...hospital,
        distance: calculateDistance(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  const handleBookAmbulance = () => {
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method!");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const billData = {
        patientId: PATIENT_ID,
        hospital: "City Emergency Center",
        service: "Emergency Ambulance Service",
        amount: 500,
        status: "Paid",
        paymentMethod: selectedMethod.value,
        notes: "Emergency booking from dashboard"
      };

      const response = await fetch(`${API_BASE_URL}/api/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (response.ok) {
        toast.success(`Ambulance booked! Payment of ₹500 via ${selectedMethod.label} successful.`);
        setShowPayment(false);
        setIsTracking(true);
      } else {
        toast.error("Failed to record booking.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Server error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentOptions = [
    { value: "card", label: "Credit/Debit Card" },
    { value: "upi", label: "UPI" },
    { value: "netbanking", label: "Net Banking" },
    { value: "insurance", label: "Insurance" },
  ];

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Emergency Services</h1>
      </div>

      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={handleBookAmbulance}>
          <div className={styles.iconContainer}>
            <Ambulance className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Book Ambulance</h3>
          <p className={styles.cardSubtitle}>Request emergency transport</p>
        </div>
      </div>

      {isTracking && (
        <div className={styles.labsSection}>
          <h2 className={styles.sectionTitle}>Live Ambulance Tracking</h2>
          <MapContainer center={userLocation} zoom={13} style={{ height: "300px", borderRadius: "15px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation} icon={UserIcon} />
            {ambulanceLocation && <Marker position={ambulanceLocation} icon={AmbulanceIcon} />}
          </MapContainer>
        </div>
      )}

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Nearest Emergency Hospitals</h2>
        <div className={styles.labsGrid}>
          {getNearestEmergencyHospitals().map((hospital, index) => (
            <div key={index} className={styles.labCard}>
              <div className={styles.labAvatar}>
                <img src={hospital.imageUrl} alt={hospital.name} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.labName}>{hospital.name}</h3>
              <p className={styles.labDistance}>Distance: {hospital.distance.toFixed(2)} km</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Response Time: {hospital.emergencyServices.estimatedResponseTime}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showPayment && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #e74c3c, #c0392b)", color: "#fff" }}>
                <h5 className="modal-title">Emergency Booking Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPayment(false)} disabled={isProcessing}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <p>You are booking an emergency ambulance service.</p>
                <p><strong>Total Amount: ₹500</strong></p>
                <div className="mb-3">
                  <label className="form-label">Select Payment Method</label>
                  <Select
                    options={paymentOptions}
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    placeholder="Choose payment method..."
                    styles={selectStyles}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn" 
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} 
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm & Pay"}
                </button>
                <button 
                  className="btn" 
                  style={{ background: "#95a5a6", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} 
                  onClick={() => setShowPayment(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default EmergencyServices;
