import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SearchIcon, Star, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import pathoLabData from "../../../assets/Data/PathoLab_store_list.json";
import styles from "../BloodTest/BloodTest.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LabIcon = (size) => L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: size,
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0, -10],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
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

// Component to handle map clicks
const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setLocationName }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setLocationName(data.display_name || "Unknown location"))
        .catch(() => setLocationName("Unable to fetch location"));
    },
  });
  return null;
};

const DEFAULT_LOCATION = [20.333, 85.821];

const AllLabs = () => {
  const location = useLocation();
  const userLocation = React.useMemo(() => location.state?.userLocation || DEFAULT_LOCATION, [location.state?.userLocation]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    price: "",
    nablCertified: false,
    homeCollection: false,
  });
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");

  const tests = [
    { name: "Complete Blood Count (CBC)", price: 299, category: "Basic" },
    { name: "Lipid Profile", price: 599, category: "Basic" },
    { name: "Thyroid Profile", price: 499, category: "Comprehensive" },
    { name: "Diabetic Profile", price: 399, category: "Comprehensive" },
    { name: "Kidney Function Test", price: 449, category: "Comprehensive" },
    { name: "Full Body Checkup", price: 1999, category: "Specialized" },
    { name: "Mini Health Package", price: 799, category: "Specialized" },
    { name: "Fever Panel", price: 599, category: "Basic" },
    { name: "Basic Health Check", price: 499, category: "Basic" },
    { name: "Complete Health Check", price: 1499, category: "Specialized" },
    { name: "Immunity Health Check", price: 899, category: "Specialized" },
    { name: "Self Individual Test", price: 199, category: "Basic" },
  ];


  useEffect(() => {
    let filtered = pathoLabData;
    if (searchQuery) {
      filtered = filtered.filter((lab) =>
        lab["Patholab Name"].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filters.price) {
      filtered = filtered.filter((lab) =>
        lab.Services.some((service) => service.Price <= parseInt(filters.price))
      );
    }
    if (filters.nablCertified) {
      filtered = filtered.filter((lab) => lab["NABL Certified"]);
    }
    if (filters.homeCollection) {
      filtered = filtered.filter((lab) => lab.HomeCollection);
    }

    const labsWithDistance = filtered.map((lab) => ({
      ...lab,
      distance: calculateDistance(userLocation[0], userLocation[1], lab.Latitude, lab.Longitude),
    }));

    const sortedLabs = labsWithDistance.sort((a, b) => {
      if (b.Rating !== a.Rating) return b.Rating - a.Rating;
      return a.distance - b.distance;
    });

    setFilteredLabs(sortedLabs);
  }, [searchQuery, filters, userLocation]);

  const handleBookNow = (lab) => {
    setSelectedLab(lab);
    setIsBookingPopupOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedTests.length || (!pinLocation && !locationName)) {
      toast.error("Please select tests and provide a location!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (email && !gmailRegex.test(email.toLowerCase())) {
      toast.error("Please enter a valid Gmail address (e.g., name@gmail.com)!");
      return;
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { _id: "guest", name: userName, email: email };

    const reportReadyAt = new Date(Date.now() + 45000); // Ready in 45 seconds for demo

    const bookingData = {
      userId: user._id || user.userId || "guest",
      patientName: userName || user.name || "Guest",
      email: email || user.email || "guest@example.com",
      tests: selectedTests.map(t => ({ name: t.label.split(" @")[0], price: parseInt(t.label.split("₹")[1]) })),
      reportReadyAt,
      location: {
        latitude,
        longitude,
        address: locationName
      },
      labName: selectedLab?.["Patholab Name"] || "Central Lab"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/blood-tests/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        toast.success("Blood test booked! Report will be ready in 45 seconds.");
        setIsBookingPopupOpen(false);
      } else {
        toast.error("Failed to book test.");
      }
    } catch (error) {
      console.error("Error booking test:", error);
      toast.error("Server error.");
    }
  };

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>All Pathology Labs</h1>
      </div>
      <div className={styles.labsSection}>
        <div className="input-group mb-3">
          <span className="input-group-text">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ borderRadius: "10px" }}
          />
        </div>
        <div className="mb-3">
          <input
            type="number"
            placeholder="Max Price"
            value={filters.price}
            onChange={(e) => setFilters({ ...filters, price: e.target.value })}
            className="form-control mb-2"
            style={{ borderRadius: "10px" }}
          />
          <div className="form-check">
            <input
              type="checkbox"
              checked={filters.nablCertified}
              onChange={(e) => setFilters({ ...filters, nablCertified: e.target.checked })}
              className="form-check-input"
              id="nablCertified"
            />
            <label className="form-check-label" htmlFor="nablCertified" style={{ color: "#2c3e50", fontFamily: "Open Sans, sans-serif" }}>NABL Certified</label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              checked={filters.homeCollection}
              onChange={(e) => setFilters({ ...filters, homeCollection: e.target.checked })}
              className="form-check-input"
              id="homeCollection"
            />
            <label className="form-check-label" htmlFor="homeCollection" style={{ color: "#2c3e50", fontFamily: "Open Sans, sans-serif" }}>Home Collection</label>
          </div>
        </div>
        <div className={styles.labsGrid}>
          {filteredLabs.map((lab, index) => (
            <div key={index} className={styles.labCard}>
              <div className={styles.labAvatar}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt={lab["Patholab Name"]} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.labName}>{lab["Patholab Name"]}</h3>
              <p className={styles.labDistance}>Distance: {lab.distance ? lab.distance.toFixed(2) : "N/A"} km</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>Price: ₹{lab.Services[0]?.Price || "N/A"}</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>{lab.HomeCollection ? "Home Collection" : "Lab Visit"}</p>
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>{lab.Rating}</span>
              </div>
              <button
                className="btn"
                style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px", width: "100%", marginTop: "10px" }}
                onClick={() => handleBookNow(lab)}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Book Your Test</h5>
                <button type="button" className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <p style={{ fontFamily: "Open Sans, sans-serif" }}>Selected Lab: {selectedLab?.["Patholab Name"] || "Please select a lab"}</p>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Choose Tests</label>
                  <Select
                    options={tests.map(t => ({ value: t.name.toLowerCase().replace(" ", ""), label: `${t.name} @ ₹${t.price}` }))}
                    value={selectedTests}
                    onChange={setSelectedTests}
                    placeholder="Select tests..."
                    isMulti
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Visit Date</label>
                  <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Select Location</label>
                  <MapContainer
                    center={userLocation || [20.333, 85.821]}
                    zoom={15}
                    style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={LabIcon([40, 40])} />}
                    <MapClickHandler setPinLocation={setPinLocation} setLatitude={setLatitude} setLongitude={setLongitude} setLocationName={setLocationName} />
                  </MapContainer>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={latitude}
                      readOnly
                      className="form-control mb-2"
                      style={{ borderRadius: "10px" }}
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={longitude}
                      readOnly
                      className="form-control mb-2"
                      style={{ borderRadius: "10px" }}
                    />
                    <input
                      type="text"
                      placeholder="Location Name"
                      value={locationName}
                      readOnly
                      className="form-control"
                      style={{ borderRadius: "10px" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button className="btn" style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} onClick={handleConfirmOrder}>Confirm Order</button>
                <button className="btn" style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} onClick={() => setIsBookingPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AllLabs;
