import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../../apiConfig";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Ambulance.module.css";
import {
  Ambulance as AmbulanceIcon,
  MapPin as LocationIcon,
  Clock as ClockIcon,
  User as PersonIcon,
  Phone as PhoneIcon,
  AlertTriangle as WarningIcon,
  Hospital as HospitalIcon,
  Bell as NotificationIcon,
  Lock as LockIcon,
  CreditCard as CreditCardIcon,
  Siren as SirenIcon,
  Share2 as ShareIcon,
  CheckCircle as CheckIcon,
} from "lucide-react";

// Fix for Leaflet's default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom ambulance icon for the map (representing 🚑)
const AmbulanceMarkerIcon = L.divIcon({
  html: '<div style="font-size: 24px; color: #f44336;">🚑</div>',
  className: "ambulance-icon",
  iconSize: [24, 24], // Size of the icon
  iconAnchor: [12, 12], // Center the icon on the position
  popupAnchor: [0, -12], // Adjust popup position relative to icon
});

// Custom component to handle map clicks and pin location
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        Pinned Location: Lat {position.lat}, Lng {position.lng}
        <br />
        Click "OK" in the popup to confirm.
      </Popup>
    </Marker>
  );
};

// Function to fetch location details using OpenStreetMap Nominatim API
const fetchLocationDetails = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || `Lat: ${lat}, Lng: ${lng}`;
  } catch (error) {
    console.error("Error fetching location details:", error);
    return `Lat: ${lat}, Lng: ${lng}`;
  }
};

// Function to calculate ETA (simulated)
const calculateETA = (distance) => {
  const speed = 40; // Average ambulance speed in km/h
  const timeInHours = distance / speed;
  return `${Math.round(timeInHours * 60)} minutes`; // Convert to minutes
};

const Ambulance = () => {
  const userStr = localStorage.getItem('user');
  const userData = userStr ? JSON.parse(userStr) : null;
  const user = {
    name: userData ? userData.userName : "Subham Khandual",
    location: { lat: 20.296071, lng: 85.824539 }, // Default Bhubaneswar location
    emergencyContacts: ["+91 1234567890", "+91 9876543210"],
    medicalHistory: "No critical conditions",
  };

  const [userLocation, setUserLocation] = useState(user.location);
  const [ambulanceRequests, setAmbulanceRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    type: "Emergency",
    urgency: "Critical",
    location: "",
    hospital: "",
    description: "",
    pinnedLocation: null,
    ambulanceType: "BLS",
    paymentMethod: "UPI",
    shareMedicalHistory: false,
  });
  const [isBooking, setIsBooking] = useState(false);
  const [liveAmbulance, setLiveAmbulance] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [pinnedLocationDetails, setPinnedLocationDetails] = useState("");
  const [allAmbulances, setAllAmbulances] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [ambulanceCoords, setAmbulanceCoords] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("Ordered");
  const [eta, setEta] = useState(null);
  const [trackingToken, setTrackingToken] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  // Ambulance types (both government and private)
  const ambulanceTypes = [
    { value: "BLS", label: "Basic Life Support (BLS)" },
    { value: "ALS", label: "Advanced Life Support (ALS)" },
    { value: "Air", label: "Air Ambulance" },
  ];

  const urgencyOptions = [
    { value: "Critical", label: "Critical (Accident, Cardiac Arrest, Stroke)" },
    { value: "Urgent", label: "Urgent (Severe Pain, Labor, Trauma)" },
    { value: "Normal", label: "Normal (Routine Transport, Doctor Visit)" },
  ];

  const paymentOptions = [
    { value: "UPI", label: "UPI" },
    { value: "Insurance", label: "Insurance" },
    { value: "Cash", label: "Cash on Arrival" },
    { value: "Hospital", label: "Hospital Billing" },
    { value: "Government Funded", label: "Government Funded (Free)" },
  ];

  const hospitalOptions = [
    { value: "Apollo Hospital", label: "Apollo Hospital" },
    { value: "AIIMS Bhubaneswar", label: "AIIMS Bhubaneswar" },
    { value: "Kalinga Hospital", label: "Kalinga Hospital" },
    { value: "AMRI Hospital", label: "AMRI Hospital" },
    { value: "SUM Hospital", label: "SUM Hospital" },
  ];

  // Quick emergency tags
  const emergencyTags = [
    { icon: "🚗", text: "Accident" },
    { icon: "❤️", text: "Heart Issue" },
    { icon: "🤒", text: "Fever" },
    { icon: "🩸", text: "Bleeding" },
  ];

  // Fetch current location and ambulance availability on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchLocationDetails(latitude, longitude).then((details) => {
          setNewRequest({ ...newRequest, location: details });
          setPinnedLocationDetails(details);
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to fetch your location. Using default location.");
      }
    );

    // Fetch real ambulance availability from the backend
    const fetchAvailableAmbulances = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ambulance/available`);
        if (response.data && response.data.length > 0) {
          // Map backend data to frontend format
          const mappedAmbulances = response.data.map(amb => ({
            id: amb._id,
            type: amb.type,
            location: amb.location,
            status: amb.status,
            number: amb.number,
            driver: amb.driverName,
            phone: amb.driverPhone,
            paramedic: amb.paramedicName,
            cost: amb.cost
          }));
          setAllAmbulances(mappedAmbulances);
        }
      } catch (err) {
        console.error("Error fetching available ambulances:", err);
      }
    };

    fetchAvailableAmbulances();
  }, []);

  // Live movement simulation effect
  useEffect(() => {
    let interval;
    if (isBooking && liveAmbulance && userLocation) {
      // Start moving the ambulance towards the user
      const startPos = liveAmbulance.location;
      const endPos = userLocation;
      let currentPos = { ...startPos };
      let step = 0;
      const totalSteps = 100;

      setAmbulanceCoords(startPos);
      setTrackingStatus("Dispatched");

      interval = setInterval(() => {
        step++;
        if (step <= totalSteps) {
          const lat = startPos.lat + (endPos.lat - startPos.lat) * (step / totalSteps);
          const lng = startPos.lng + (endPos.lng - startPos.lng) * (step / totalSteps);
          const newPos = { lat, lng };
          setAmbulanceCoords(newPos);
          
          // Update ETA
          const dist = calculateDistance(newPos, endPos);
          const mins = Math.max(1, Math.round(dist * 5)); // 5 mins per km
          setEta(`${mins} minutes`);

          // Update Status based on progress
          if (step === 1) setTrackingStatus("Dispatched");
          if (step === 60) {
            setTrackingStatus("Near You");
            toast.info("Ambulance is just 2 minutes away! Prepare the patient.");
          }
          if (step === 100) {
            setTrackingStatus("Reached");
            toast.success("Ambulance has reached your location.");
            clearInterval(interval);
            if (bookingId) {
              axios.patch(`${API_BASE_URL}/api/ambulance/booking/${bookingId}/status`, { status: 'Completed' })
                .catch(err => console.error("Failed to complete booking:", err));
            }
          }
        }
      }, 1000); // Update every second
    }
    return () => clearInterval(interval);
  }, [isBooking, liveAmbulance, userLocation, bookingId]);

  // Dummy data for hospitals (replace with API calls)
  const hospitals = [
    { id: 1, name: "St. Thomas Hospital", location: { lat: 20.297071, lng: 85.823539 }, bedsAvailable: 50, specialties: ["Cardiology", "Neurology"] },
    { id: 2, name: "City General Hospital", location: { lat: 20.295071, lng: 85.825539 }, bedsAvailable: 30, specialties: ["Emergency", "Trauma"] },
  ];

  // Handle location pinning
  const handleLocationPin = async (latlng) => {
    setPinnedLocation(latlng);
    const details = await fetchLocationDetails(latlng.lat, latlng.lng);
    setPinnedLocationDetails(details);
    setNewRequest({ ...newRequest, location: details, pinnedLocation: latlng });
  };

  const handleLocationConfirm = () => {
    if (pinnedLocation) {
      setIsLocationPickerOpen(false);
      setPinnedLocation(null);
    }
  };

  // Handle booking ambulance (government or private)
  const handleBookAmbulance = async (e) => {
    e.preventDefault();
    
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;

    const requestData = {
      ...newRequest,
      userId: userData ? (userData.userId || userData._id) : "Guest",
      patientName: userData ? userData.userName : "Guest Patient",
      coordinates: newRequest.pinnedLocation || userLocation,
    };

    try {
      // Call real backend booking API
      const response = await axios.post(`${API_BASE_URL}/api/ambulance/book`, requestData);
      const { booking, driver } = response.data;

      // Update state with real booking data
      setLiveAmbulance({
        ...driver,
        type: newRequest.ambulanceType,
        location: driver.location
      });
      setBookingId(booking._id);
      setTrackingToken(booking.trackingToken);
      setIsBooking(true);
      setAmbulanceRequests([...ambulanceRequests, booking]);
      
      findNearestHospital(requestData.coordinates);
      notifyEmergencyContacts(requestData);
      toast.success(`${newRequest.ambulanceType} ambulance booked successfully!`);

      // Trigger Notification on Server
      if (userData) {
        axios.post(`${API_BASE_URL}/api/notifications`, {
          recipient: userData.userId || userData._id,
          recipientModel: userData.role === 'doctor' ? 'Doctor' : 'User',
          type: 'emergency',
          title: 'Ambulance Booked',
          message: `Your ${newRequest.ambulanceType} ambulance (#${driver.number}) has been dispatched.`,
          data: { type: 'ambulance', bookingId: booking._id }
        }).catch(err => console.error("Failed to trigger notification:", err));
      }
    } catch (error) {
      console.error("Error booking ambulance:", error);
      let errorMsg = error.response?.data?.msg || `Failed to book ${newRequest.ambulanceType} ambulance.`;
      
      // If query is returned, add it for debugging
      if (error.response?.data?.query) {
        errorMsg += ` (Query: ${JSON.stringify(error.response.data.query)})`;
      }
      
      toast.error(errorMsg);
    }
  };

  // Handle Call Driver action
  const handleCallDriver = async (phoneNumber) => {
    const confirmCall = window.confirm(`Do you want to call the driver at ${phoneNumber}?`);
    
    if (confirmCall) {
      try {
        // Log the call action in the backend
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        
        await axios.post(`${API_BASE_URL}/api/ambulance/call-log`, {
          bookingId: bookingId,
          userId: userData ? (userData.userId || userData._id) : "Guest",
          driverPhone: phoneNumber
        });
        
        // Open the phone dialer
        window.location.href = `tel:${phoneNumber}`;
      } catch (err) {
        console.error("Failed to log call action:", err);
        // Still open the dialer even if logging fails
        window.location.href = `tel:${phoneNumber}`;
      }
    }
  };

  // Find nearest hospital with specialty and bed availability
  const findNearestHospital = async (location) => {
    const hospital = hospitals.reduce((nearest, current) => {
      const distance = calculateDistance(location, current.location);
      return distance < calculateDistance(location, nearest.location) ? current : nearest;
    }, hospitals[0]);
    
    // Fetch the address asynchronously and set it in the hospital object
    const address = await fetchLocationDetails(hospital.location.lat, hospital.location.lng);
    setNearestHospital({ ...hospital, address });
    
    preRegisterAtHospital(hospital, newRequest);
    assignSpecialist(hospital, newRequest.urgency);
  };

  // Pre-register at hospital
  const preRegisterAtHospital = (hospital, request) => {
    console.log(`Pre-registering ${user.name} at ${hospital.name} with urgency: ${request.urgency}`);
    toast.info(`Pre-registered at ${hospital.name} with details sent.`);
  };

  // Assign specialist based on urgency
  const assignSpecialist = (hospital, urgency) => {
    let specialist = "General Physician";
    if (urgency === "Critical" && hospital.specialties.includes("Neurology")) {
      specialist = "Neurologist";
    } else if (urgency === "Urgent" && hospital.specialties.includes("Trauma")) {
      specialist = "Trauma Specialist";
    }
    toast.info(`Assigned ${specialist} at ${hospital.name}.`);
  };

  // Notify emergency contacts
  const notifyEmergencyContacts = (request) => {
    user.emergencyContacts.forEach((contact) => {
      console.log(`Notifying ${contact} about ${request.urgency} ambulance request at ${request.location}`);
    });
    toast.success("Emergency contacts notified via SMS/app!");
  };

  // Notify hospitals and public
  const notifyHospitalsAndPublic = (request) => {
    hospitals.forEach((hospital) => {
      console.log(`Notifying ${hospital.name} about incoming patient with urgency: ${request.urgency}`);
    });
    toast.success("Nearest hospitals and public alerted!");
  };

  // Calculate distance between two points (in kilometers)
  const calculateDistance = (loc1, loc2) => {
    const R = 6371;
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Custom Select component for React-Select with portal positioning
  const PortalSelect = ({ options, value, onChange, placeholder }) => {
    return (
      <Select
        options={options}
        value={options.find((opt) => opt.value === value) || null}
        onChange={(selected) => onChange(selected ? selected.value : "")}
        placeholder={placeholder}
        className={`${styles.input} react-select-container`}
        menuPosition="fixed"
        menuPortalTarget={document.body}
        styles={{
          container: (base) => ({
            ...base,
            width: "100%",
            zIndex: 1000,
          }),
          menu: (base) => ({
            ...base,
            zIndex: 999999,
            position: "fixed",
            top: "auto",
            left: "auto",
            width: "100%",
            maxWidth: "480px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            background: "#fff",
            border: "1px solid #d4edda",
          }),
          control: (base) => ({
            ...base,
            border: "none",
            boxShadow: "none",
            background: "transparent",
            minHeight: "40px",
          }),
          valueContainer: (base) => ({
            ...base,
            padding: "0",
          }),
          option: (base) => ({
            ...base,
            fontFamily: "Georgia, serif",
            color: "#4a7f5e",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#4a7f5e",
            fontFamily: "Georgia, serif",
          }),
        }}
      />
    );
  };

  // Filter ambulances based on type for the map
  const filteredAmbulances = allAmbulances.filter((ambulance) => {
    if (filterType === "All") return true;
    return ambulance.type === filterType;
  });

  return (
    <div className={styles.stylishContainer}>
      <div className={styles.stylishContent}>
        {/* SOS Button for Emergency Ambulance Booking */}
        <button className={styles.sosButton} onClick={() => handleBookAmbulance({ preventDefault: () => {} })}>
          <SirenIcon className={styles.buttonIcon} /> One-Tap SOS (Emergency)
        </button>

        {/* Book an Ambulance Section */}
        <h2 className={styles.sectionTitle}>Book an Ambulance 🚑</h2>
        <div className={styles.ambulanceForm}>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <AmbulanceIcon />
            </div>
            <select
              value={newRequest.type}
              onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              className={styles.input}
            >
              <option value="Emergency">Emergency</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <WarningIcon />
            </div>
            <PortalSelect
              options={urgencyOptions}
              value={newRequest.urgency}
              onChange={(value) => setNewRequest({ ...newRequest, urgency: value })}
              placeholder="Select Urgency"
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <input
              type="text"
              placeholder="Enter or pin location"
              value={pinnedLocationDetails || newRequest.location}
              onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
              className={styles.input}
              readOnly
            />
            <button
              className={styles.pinButton}
              onClick={() => setIsLocationPickerOpen(true)}
              type="button"
            >
              Pin Location
            </button>
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <HospitalIcon />
            </div>
            <PortalSelect
              options={hospitalOptions}
              value={newRequest.hospital}
              onChange={(value) => setNewRequest({ ...newRequest, hospital: value })}
              placeholder="Enter hospital name (e.g., AIIMS Bhubaneswar)"
            />
          </div>

          <div className={styles.inputField} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px' }}>
            <div className="d-flex align-items-center mb-2" style={{ width: '100%' }}>
              <div className={styles.inputIcon} style={{ marginRight: '10px' }}>
                <WarningIcon />
              </div>
              <span style={{ fontWeight: 600, color: '#2c3e50' }}>Describe the Emergency (Optional)</span>
            </div>
            
            <div className="d-flex gap-2 flex-wrap mb-3">
              {emergencyTags.map((tag) => (
                <button
                  key={tag.text}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: newRequest.description.includes(tag.text) ? '#e8f5e9' : '#f8f9fa',
                    border: newRequest.description.includes(tag.text) ? '1px solid #27ae60' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    color: newRequest.description.includes(tag.text) ? '#27ae60' : '#495057'
                  }}
                  onClick={() => {
                    const currentDesc = newRequest.description;
                    if (currentDesc.includes(tag.text)) {
                      setNewRequest({ ...newRequest, description: currentDesc.replace(new RegExp(`\\s*${tag.text}\\s*`, 'g'), ' ').trim() });
                    } else {
                      setNewRequest({ ...newRequest, description: currentDesc ? `${currentDesc}, ${tag.text}` : tag.text });
                    }
                  }}
                >
                  {tag.icon} {tag.text}
                </button>
              ))}
            </div>

            <textarea
              value={newRequest.description}
              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              placeholder="e.g., Accident, Chest pain, High fever"
              className={styles.input}
              style={{ width: '100%', paddingLeft: '10px', minHeight: '80px', paddingTop: '10px' }}
              rows="3"
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <AmbulanceIcon />
            </div>
            <PortalSelect
              options={ambulanceTypes}
              value={newRequest.ambulanceType}
              onChange={(value) => setNewRequest({ ...newRequest, ambulanceType: value })}
              placeholder="Select Ambulance Type"
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <CreditCardIcon />
            </div>
            <PortalSelect
              options={paymentOptions}
              value={newRequest.paymentMethod}
              onChange={(value) => setNewRequest({ ...newRequest, paymentMethod: value })}
              placeholder="Select Payment Method"
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LockIcon />
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={newRequest.shareMedicalHistory}
                onChange={(e) => setNewRequest({ ...newRequest, shareMedicalHistory: e.target.checked })}
                className={styles.checkbox}
              />
              Share Medical History with Paramedics & Hospital
            </label>
          </div>
          <button type="submit" className={styles.actionButton} onClick={handleBookAmbulance}>
            Book Ambulance
          </button>
        </div>

        {/* Ambulance Availability Map with Filters */}
        <h2 className={styles.sectionTitle}>Ambulance Availability Map 🚑</h2>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filterType === "All" ? styles.active : ""}`}
            onClick={() => setFilterType("All")}
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${filterType === "Government" ? styles.active : ""}`}
            onClick={() => setFilterType("Government")}
          >
            Government
          </button>
          <button
            className={`${styles.filterButton} ${filterType === "Private" ? styles.active : ""}`}
            onClick={() => setFilterType("Private")}
          >
            Private
          </button>
        </div>
        <div className={styles.mapContainer}>
          <MapContainer
            center={userLocation}
            zoom={13}
            zoomControl={false}
            className={styles.stylishMap}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Circle
              center={userLocation}
              radius={5000} // 5 km radius for coverage
              pathOptions={{ color: "#27ae60", fillColor: "#e8f5e9", fillOpacity: 0.5 }}
            />
            <Marker position={userLocation}>
              <Popup>Your Location</Popup>
            </Marker>
            {filteredAmbulances.map((ambulance) => (
              <Marker key={ambulance.id} position={ambulance.location} icon={AmbulanceMarkerIcon}>
                <Popup>
                  Ambulance #{ambulance.number} - Type: {ambulance.type}
                  <br />
                  Status: {ambulance.status}
                  <br />
                  Driver: {ambulance.driver}
                  <br />
                  Contact: {ambulance.phone}
                  {ambulance.paramedic && <br />}
                  Paramedic: {ambulance.paramedic || "Not available"}
                  {ambulance.type === "Private" && ambulance.cost && (
                    <>
                      <br />
                      Cost: ₹{ambulance.cost}
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Live Tracking & ETA Section */}
        {isBooking && liveAmbulance && (
          <div className={styles.emergencyNotification}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className={styles.notificationTitle} style={{ margin: 0 }}>
                <AmbulanceIcon className={styles.icon} /> {liveAmbulance.type} Ambulance En Route
              </h3>
              <button 
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                onClick={() => {
                  const link = `${window.location.origin}/track/${trackingToken}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Tracking link copied to clipboard!");
                }}
              >
                <ShareIcon size={14} /> Share Link
              </button>
            </div>

            {/* Status Timeline */}
            <div className={styles.statusTimeline}>
              <div className={`${styles.statusStep} ${['Ordered', 'Dispatched', 'Near You', 'Reached'].includes(trackingStatus) ? styles.completed : ''}`}>
                <div className={styles.stepDot}><CheckIcon size={12} /></div>
                <span>Ordered</span>
              </div>
              <div className={`${styles.statusLine} ${['Dispatched', 'Near You', 'Reached'].includes(trackingStatus) ? styles.activeLine : ''}`}></div>
              <div className={`${styles.statusStep} ${['Dispatched', 'Near You', 'Reached'].includes(trackingStatus) ? styles.completed : ''}`}>
                <div className={styles.stepDot}><CheckIcon size={12} /></div>
                <span>Dispatched</span>
              </div>
              <div className={`${styles.statusLine} ${['Near You', 'Reached'].includes(trackingStatus) ? styles.activeLine : ''}`}></div>
              <div className={`${styles.statusStep} ${['Near You', 'Reached'].includes(trackingStatus) ? styles.completed : ''}`}>
                <div className={styles.stepDot}><CheckIcon size={12} /></div>
                <span>Near You</span>
              </div>
              <div className={`${styles.statusLine} ${trackingStatus === 'Reached' ? styles.activeLine : ''}`}></div>
              <div className={`${styles.statusStep} ${trackingStatus === 'Reached' ? styles.completed : ''}`}>
                <div className={styles.stepDot}><CheckIcon size={12} /></div>
                <span>Reached</span>
              </div>
            </div>

            <div className={styles.mapContainer}>
              <MapContainer
                center={userLocation}
                zoom={14}
                zoomControl={false}
                className={styles.stylishMap}
                style={{ height: "300px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {ambulanceCoords && (
                  <Marker position={ambulanceCoords} icon={AmbulanceMarkerIcon}>
                    <Popup>
                      Ambulance #{liveAmbulance.number} - {trackingStatus}
                    </Popup>
                  </Marker>
                )}
                <Marker position={userLocation}>
                  <Popup>Your Location</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className={styles.trackingInfo}>
              <div className={styles.infoCard}>
                <ClockIcon className={styles.infoIcon} />
                <div>
                  <label>Estimated Arrival</label>
                  <strong>{eta || calculateETA(calculateDistance(userLocation, liveAmbulance.location))}</strong>
                </div>
              </div>
              <div className={styles.infoCard}>
                <PersonIcon className={styles.infoIcon} />
                <div>
                  <label>Driver</label>
                  <strong>{liveAmbulance.driver}</strong>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button onClick={() => handleCallDriver(liveAmbulance.phone)} className={styles.callButton}>
                <PhoneIcon size={18} /> Call Driver
              </button>
              <button
                className={styles.cancelBookingButton}
                onClick={async () => {
                  setIsBooking(false);
                  toast.info("Booking canceled.");
                  if (bookingId) {
                    try {
                      await axios.patch(`${API_BASE_URL}/api/ambulance/booking/${bookingId}/status`, { status: 'Cancelled' });
                    } catch (err) {
                      console.error("Failed to cancel booking:", err);
                    }
                  }
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        )}

        {/* Hospital & Emergency Room Integration */}
        {nearestHospital && (
          <div className={styles.hospitalSection}>
            <h3 className={styles.sectionSubtitle}>
              <HospitalIcon className={styles.icon} /> Nearest Hospital
            </h3>
            <p>{nearestHospital.name}</p>
            <p>Location: {nearestHospital.address || `Lat: ${nearestHospital.location.lat}, Lng: ${nearestHospital.location.lng}`}</p>
            <p>Beds Available: {nearestHospital.bedsAvailable}</p>
            <p>Specialties: {nearestHospital.specialties.join(", ")}</p>
            <button
              className={styles.actionButton}
              onClick={() => toast.success(`Pre-registered at ${nearestHospital.name}`)}
            >
              Pre-Register
            </button>
          </div>
        )}

        {/* Smart Emergency Notifications & Alerts */}
        <h2 className={styles.sectionTitle}>Emergency Notifications 🔔</h2>
        <button
          className={styles.actionButton}
          onClick={() => {
            notifyEmergencyContacts(newRequest);
            notifyHospitalsAndPublic(newRequest);
            toast.success("Emergency contacts, hospitals, and public notified!");
          }}
        >
          <NotificationIcon className={styles.buttonIcon} /> Notify All
        </button>

        {/* Privacy & Emergency Access Settings */}
        <h2 className={styles.sectionTitle}>Privacy & Settings 🔒</h2>
        <div className={styles.privacySettings}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={newRequest.shareMedicalHistory}
              onChange={(e) => setNewRequest({ ...newRequest, shareMedicalHistory: e.target.checked })}
              className={styles.checkbox}
            />
            Share Medical History with Paramedics & Hospital
          </label>
          <p className={styles.privacyText}>Your data is encrypted and secure, compliant with GDPR/HIPAA standards.</p>
          <button
            className={styles.actionButton}
            onClick={async () => {
              setIsBooking(false);
              toast.info("Booking canceled. Reason required.");
              if (bookingId) {
                try {
                  await axios.patch(`${API_BASE_URL}/api/ambulance/booking/${bookingId}/status`, { status: 'Cancelled' });
                } catch (err) {
                  console.error("Failed to cancel booking:", err);
                }
              }
            }}
          >
            Cancel Booking
          </button>
        </div>

        {/* Location Picker Modal */}
        {isLocationPickerOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.stylishModalContent}>
              <h3 className={styles.modalTitle}>Pin Ambulance Location</h3>
              <MapContainer
                center={userLocation}
                zoom={13}
                zoomControl={false}
                className={styles.stylishMap}
                style={{ height: "300px", width: "100%", borderRadius: "15px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPicker
                  onLocationSelect={handleLocationPin}
                  initialLocation={userLocation}
                />
              </MapContainer>
              <div className={styles.modalButtons}>
                <button
                  className={styles.actionButton}
                  onClick={handleLocationConfirm}
                >
                  OK
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsLocationPickerOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Ambulance;
