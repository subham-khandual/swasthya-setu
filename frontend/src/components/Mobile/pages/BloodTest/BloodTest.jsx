import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  MapPin,
  Star,
  ChevronRight,
  FileText,
  Clock,
  TestTube,
  Calendar,
  AlertCircle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import pathoLabData from "../../../assets/Data/PathoLab_store_list.json";
import styles from "./BloodTest.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

import pathologyLab2 from "../../../../assets/pathology_lab_2.png";

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
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getTopRatedNearestLabs = (labs, userLoc) => {
  if (!userLoc || !labs.length) return [];
  return labs
    .map(lab => ({
      ...lab,
      distance: calculateDistance(userLoc[0], userLoc[1], lab.Latitude, lab.Longitude),
    }))
    .sort((a, b) => b.Rating !== a.Rating ? b.Rating - a.Rating : a.distance - b.distance)
    .slice(0, 4);
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

const BloodTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedLab = location.state?.selectedLab || null;

  const [pathoLabs] = useState(pathoLabData);
  const [selectedLab, setSelectedLab] = useState(preSelectedLab);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        err => setError("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  }, []);

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  const [activeTests, setActiveTests] = useState([]);
  const [testRecords, setTestRecords] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchTests = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { _id: "guest" }; // Fallback for demo
    try {
      const response = await fetch(`${API_BASE_URL}/api/blood-tests/my-tests/${user._id || user.userId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveTests(data.filter(t => t.status === "Pending"));
        setTestRecords(data.filter(t => t.status === "Completed"));
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      // toast.error("Failed to fetch tests"); // Optional: reduce noise
    }
  };

  useEffect(() => {
    fetchTests();
    const interval = setInterval(() => {
      fetchTests();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
        fetchTests();
      } else {
        toast.error("Failed to book test.");
      }
    } catch (error) {
      console.error("Error booking test:", error);
      toast.error("Server error.");
    }
  };

  const downloadPDF = (test) => {
    import("jspdf").then((jsPDFModule) => {
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.text("Blood Test Report", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.text(`Patient: ${test.patientName}`, 20, 40);
      doc.text(`Lab: ${test.labName}`, 20, 50);
      doc.text(`Date: ${new Date(test.createdAt).toLocaleDateString()}`, 20, 60);
      
      doc.setFontSize(16);
      doc.text("Results:", 20, 80);
      
      doc.setFontSize(12);
      let currentY = 95;
      if (test.reportData.rbc) {
        doc.text(`RBC Count: ${test.reportData.rbc} million/uL`, 30, currentY);
        currentY += 10;
      }
      if (test.reportData.wbc) {
        doc.text(`WBC Count: ${test.reportData.wbc} /uL`, 30, currentY);
        currentY += 10;
      }
      if (test.reportData.platelets) {
        doc.text(`Platelets: ${test.reportData.platelets} /uL`, 30, currentY);
        currentY += 10;
      }
      if (test.reportData.hemoglobin) {
        doc.text(`Hemoglobin: ${test.reportData.hemoglobin} g/dL`, 30, currentY);
        currentY += 10;
      }
      if (test.reportData.glucose) {
        doc.text(`Blood Glucose (Fasting): ${test.reportData.glucose} mg/dL`, 30, currentY);
        currentY += 10;
      }
      if (test.reportData.cholesterol) {
        doc.text(`Cholesterol: ${test.reportData.cholesterol} mg/dL`, 30, currentY);
        currentY += 10;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Disclaimer: This is a demo-generated report for testing purposes only.", 105, 280, { align: "center" });
      
      doc.save(`Report_${test.patientName}_${test._id.substr(-6)}.pdf`);
      toast.success("Report downloaded!");
    });
  };

  return (
    <div className={styles.container}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className={styles.header}>
        <h1 className={styles.greeting}>Blood Test</h1>
      </div>

      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/all-labs", { state: { userLocation } })}>
          <div className={styles.iconContainer}>
            <MapPin className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Labs Near Me</h3>
          <p className={styles.cardSubtitle}>Find nearby labs</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => setIsBookingPopupOpen(true)}>
          <div className={styles.iconContainer}>
            <Calendar className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Book Appointment</h3>
          <p className={styles.cardSubtitle}>Schedule a test</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => setShowAllReportsModal(true)}>
          <div className={styles.iconContainer}>
            <FileText className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Test Records</h3>
          <p className={styles.cardSubtitle}>View past reports</p>
        </div>

        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/track-order")}>
          <div className={styles.iconContainer}>
            <Clock className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Track Order</h3>
          <p className={styles.cardSubtitle}>Monitor status</p>
        </div>
      </div>

      {/* Active Tests Section */}
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Active Tests ⏳</h2>
        <div className={styles.labsGrid}>
          {activeTests.length === 0 ? (
            <p className="text-muted ps-3">No active tests pending.</p>
          ) : (
            activeTests.map((test, index) => (
              <div key={index} className={styles.labCard} style={{ borderLeft: "5px solid #f1c40f" }}>
                <div style={{ padding: "15px" }}>
                  <h3 className={styles.labName}>{test.tests?.map(t => t.name).join(", ") || "Unknown Test"}</h3>
                  <p className="mb-1"><strong>Lab:</strong> {test.labName}</p>
                  <p className="mb-1"><strong>Status:</strong> <span className="badge bg-warning">Pending</span></p>
                  <p className="text-danger mt-2" style={{ fontSize: "0.9rem" }}>Report not available yet</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Rated Labs</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/all-labs", { state: { userLocation } })}>
            See more <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {getTopRatedNearestLabs(pathoLabs, userLocation).map((lab, index) => {
            const labPhotos = [
              "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800",
              pathologyLab2,
              "https://images.pexels.com/photos/3735709/pexels-photo-3735709.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/2280547/pexels-photo-2280547.jpeg?auto=compress&cs=tinysrgb&w=800"
            ];
            const labImg = labPhotos[index % labPhotos.length];
            
            return (
              <div 
                key={index} 
                className={styles.labCard} 
                onClick={() => { setSelectedLab(lab); setIsBookingPopupOpen(true); }}
                style={{ 
                  overflow: "hidden", 
                  padding: "0", 
                  display: "flex", 
                  flexDirection: "column",
                  borderRadius: "15px"
                }}
              >
                <div className={styles.labAvatar} style={{ width: "100%", height: "140px", borderRadius: "0", margin: "0", border: "none" }}>
                  <img src={labImg} alt={lab["Patholab Name"]} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "15px", width: "100%" }}>
                  <h3 className={styles.labName} style={{ textAlign: "left", fontSize: "1rem", fontWeight: "700", marginBottom: "5px" }}>{lab["Patholab Name"]}</h3>
                  <p className={styles.labDistance} style={{ textAlign: "left", marginBottom: "8px" }}>Distance: {lab.distance.toFixed(2)} km</p>
                  <div className={styles.ratingContainer} style={{ justifyContent: "flex-start" }}>
                    <Star className={styles.starIcon} />
                    <span className={styles.rating}>{lab.Rating}</span>
                  </div>
                </div>
              </div>
            );
          })}
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
                <p style={{ fontFamily: "Open Sans, sans-serif" }}>Selected Lab: {selectedLab?.["Patholab Name"] || "Central Lab"}</p>
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

      {/* Report View Modal */}
      {showReportModal && selectedReport && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px" }}>
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Blood Test Report</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <p className="mb-1"><strong>Patient Name:</strong> {selectedReport.patientName}</p>
                  <p className="mb-1"><strong>Lab:</strong> {selectedReport.labName}</p>
                  <p className="mb-1"><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                </div>
                <hr />
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Test Parameter</th>
                        <th>Result</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.reportData.rbc && (
                        <tr>
                          <td>RBC Count</td>
                          <td>{selectedReport.reportData.rbc} million/uL</td>
                          <td>4.5 - 5.5</td>
                        </tr>
                      )}
                      {selectedReport.reportData.wbc && (
                        <tr>
                          <td>WBC Count</td>
                          <td>{selectedReport.reportData.wbc} /uL</td>
                          <td>4000 - 11000</td>
                        </tr>
                      )}
                      {selectedReport.reportData.platelets && (
                        <tr>
                          <td>Platelets</td>
                          <td>{selectedReport.reportData.platelets} /uL</td>
                          <td>150,000 - 450,000</td>
                        </tr>
                      )}
                      {selectedReport.reportData.hemoglobin && (
                        <tr>
                          <td>Hemoglobin</td>
                          <td>{selectedReport.reportData.hemoglobin} g/dL</td>
                          <td>13.0 - 17.0</td>
                        </tr>
                      )}
                      {selectedReport.reportData.glucose && (
                        <tr>
                          <td>Glucose (Fasting)</td>
                          <td>{selectedReport.reportData.glucose} mg/dL</td>
                          <td>70 - 100</td>
                        </tr>
                      )}
                      {selectedReport.reportData.cholesterol && (
                        <tr>
                          <td>Cholesterol</td>
                          <td>{selectedReport.reportData.cholesterol} mg/dL</td>
                          <td>&lt; 200</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-2 bg-light border-start border-4 border-primary">
                  <p className="mb-0 small"><AlertCircle size={14} /> <strong>Disclaimer:</strong> This is a demo-generated report for testing purposes only.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => downloadPDF(selectedReport)}>Download PDF</button>
                <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      
      {/* Temporary Debug Section */}
      <div style={{ padding: "10px", marginTop: "20px", background: "#eee", fontSize: "0.8rem", borderRadius: "10px" }}>
        <p><strong>Debug Info:</strong></p>
        <p>User ID: {JSON.parse(localStorage.getItem("user"))?._id || JSON.parse(localStorage.getItem("user"))?.userId || "guest"}</p>
        <p>Active: {activeTests.length} | Records: {testRecords.length}</p>
      </div>
      {/* All Reports List Modal */}
      {showAllReportsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 15px 35px rgba(0,0,0,0.2)" }}>
              <div className="modal-header" style={{ borderBottom: "none", padding: "25px" }}>
                <h5 className="modal-title" style={{ fontWeight: "700", color: "#2c3e50", fontSize: "1.5rem" }}>Past Test Records</h5>
                <button type="button" className="btn-close" onClick={() => setShowAllReportsModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "0 25px 25px" }}>
                {testRecords.length === 0 ? (
                  <div className="text-center py-5">
                    <FileText size={48} className="text-muted mb-3" />
                    <p className="text-muted">No completed reports found.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {testRecords.map((test, index) => (
                      <div key={index} className="col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "15px", backgroundColor: "#f8f9fa", transition: "transform 0.2s" }}>
                          <div className="card-body p-3">
                            <h6 className="card-title fw-bold mb-1" style={{ fontSize: "0.95rem", color: "#2c3e50" }}>
                              {test.tests?.map(t => t.name).join(", ") || "Report"}
                            </h6>
                            <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>{new Date(test.createdAt).toLocaleDateString()}</p>
                            <div className="d-flex gap-2 mt-auto">
                              <button 
                                className="btn btn-sm btn-outline-success flex-grow-1"
                                onClick={() => { setSelectedReport(test); setShowReportModal(true); }}
                              >
                                View
                              </button>
                              <button 
                                className="btn btn-sm btn-success flex-grow-1"
                                onClick={() => downloadPDF(test)}
                              >
                                PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default BloodTest;
