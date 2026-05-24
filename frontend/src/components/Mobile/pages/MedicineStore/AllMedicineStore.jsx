import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, ChevronRight, Star } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css"; // Reuse BloodTest.module.css for consistency
import medicineStoreData from "../../../assets/Data/medicine_store_list.json"; // Import JSON data

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PharmacyIcon = (size) => L.icon({
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

// Distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const AllMedicineStore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stores = medicineStoreData, userLocation } = location.state || {};

  // State management
  const [pharmacyStores] = useState(stores);
  const [userLoc, setUserLoc] = useState(userLocation);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user location if not provided via state
  useEffect(() => {
    if (!userLoc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLoc([latitude, longitude]);
        },
        err => setError("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else if (!userLoc) {
      setError("Geolocation is not supported by this browser");
    }
  }, [userLoc]);

  // Filter stores based on search query
  const filteredStores = pharmacyStores
    .map(store => ({
      ...store,
      distance: userLoc ? calculateDistance(userLoc[0], userLoc[1], store.Latitude, store.Longitude) : null,
    }))
    .filter(store => 
      store.StoreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.Address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance - b.distance); // Sort by distance if user location is available

  return (
    <div className={styles.container}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className={styles.header}>
        <h1 className={styles.greeting}>All Medicine Stores</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by store name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
          style={{ borderRadius: "10px", padding: "10px" }}
        />
      </div>

      {/* Map Section */}
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Store Locations</h2>
        <MapContainer
          center={userLoc || [20.333, 85.821]} // Default center if no user location
          zoom={12}
          style={{ height: "400px", borderRadius: "10px", border: "2px solid #27ae60" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {userLoc && <Marker position={userLoc} icon={UserIcon}>
            <Popup>Your Location</Popup>
          </Marker>}
          {filteredStores.map((store, index) => (
            <Marker
              key={index}
              position={[store.Latitude, store.Longitude]}
              icon={PharmacyIcon([40, 40])}
            >
              <Popup>
                <strong>{store.StoreName}</strong><br />
                {store.Address}<br />
                Distance: {store.distance ? `${store.distance.toFixed(2)} km` : "N/A"}<br />
                Contact: {store.ContactNumber || "N/A"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Store List Section */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Nearby Pharmacies</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine")}>
            Back to Medicine <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {filteredStores.map((store, index) => (
            <div
              key={index}
              className={styles.labCard}
              onClick={() => navigate("/medicine-all", { state: { medicines: store.Medicines, storeName: store.StoreName } })}
            >
              <div className={styles.labAvatar}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt={store.StoreName} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.labName}>{store.StoreName}</h3>
              <p className={styles.labDistance}>
                Distance: {store.distance ? `${store.distance.toFixed(2)} km` : "N/A"}
              </p>
              <p style={{ fontSize: "0.9rem", color: "#2c3e50" }}>
                Contact: {store.ContactNumber || "N/A"}
              </p>
              {/* Rating placeholder; add to JSON if available */}
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>N/A</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllMedicineStore;
