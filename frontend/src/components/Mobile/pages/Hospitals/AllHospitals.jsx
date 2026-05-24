import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SearchIcon, Star } from "lucide-react";
import hospitalData from "../../../assets/Data/Hospitallist.json";
import styles from "../BloodTest/BloodTest.module.css"; // Reusing BloodTest styles
import HospitalBookingSlip from "./HospitalBookingSlip"; // Import booking slip component

const AllHospitals = () => {
  const location = useLocation();
  const userLocation = location.state?.userLocation || [20.2961, 85.8245]; // Default to Bhubaneswar center

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    specialty: "",
    maxPrice: "",
    hasEmergency: false,
  });
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [showBookingSlip, setShowBookingSlip] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const specialties = [
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "oncology", label: "Oncology" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "nephrology", label: "Nephrology" },
    { value: "urology", label: "Urology" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "ophthalmology", label: "Ophthalmology" },
    { value: "critical care", label: "Critical Care" },
    { value: "surgery", label: "Surgery" },
    { value: "infertility", label: "Infertility" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  // Distance calculation function
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let filtered = hospitalData;

    if (searchQuery) {
      filtered = filtered.filter((hospital) =>
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.specialty) {
      filtered = filtered.filter((hospital) =>
        hospital.specialties.some((s) => s.toLowerCase() === filters.specialty.toLowerCase())
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((hospital) =>
        hospital.services.some((service) => service.price <= parseInt(filters.maxPrice))
      );
    }

    if (filters.hasEmergency) {
      filtered = filtered.filter((hospital) => hospital.emergencyServices.available);
    }

    const hospitalsWithDistance = filtered.map((hospital) => ({
      ...hospital,
      distance: calculateDistance(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude),
    }));

    const sortedHospitals = hospitalsWithDistance.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating; // Sort by rating first
      return a.distance - b.distance; // Then by distance
    });

    setFilteredHospitals(sortedHospitals);
  }, [searchQuery, filters, userLocation]);

  const handleBookNow = (hospital) => {
    setSelectedHospital(hospital);
    setIsBookingPopupOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedSpecialty || !appointmentDate || !selectedTime || !userName || !email || !gender || !age || !mobileNo) {
      toast.error("Please fill all required fields!");
      return;
    }

    const bookingData = {
      patientName: userName,
      hospitalName: selectedHospital.name,
      specialty: selectedSpecialty.label,
      doctorName: "Dr. Assigned", // Placeholder; replace with actual doctor data if available
      appointmentDate,
      appointmentTime: selectedTime.label,
      bookingId: `APPT${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      patientId: `PAT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email,
    };

    // Load existing appointments from localStorage
    const existingAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const updatedAppointments = [...existingAppointments, bookingData];
    
    // Save to localStorage
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));

    // Trigger a storage event to notify other tabs/pages
    window.dispatchEvent(new Event("storage"));

    toast.success(`Appointment booked at ${selectedHospital.name}!`);
    setBookingDetails(bookingData);
    setShowBookingSlip(true);
    setIsBookingPopupOpen(false);

    // Reset form fields
    setSelectedSpecialty(null);
    setAppointmentDate("");
    setSelectedTime(null);
    setUserName("");
    setEmail("");
    setGender("");
    setAge("");
    setMobileNo("");
  };

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
      zIndex: 1051, // Ensure menu is above other elements
      borderRadius: "10px",
      marginTop: "2px",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      fontFamily: "Georgia, serif",
      color: "#2c3e50",
      backgroundColor: isFocused ? "#e6f3ff" : "white", // Light blue background for selected/hovered option
      "&:active": { backgroundColor: "#e6f3ff" },
    }),
    singleValue: (base) => ({
      ...base,
      color: "#2c3e50",
      fontFamily: "Georgia, serif",
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
    }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>All Hospitals in Bhubaneswar</h1>
      </div>

      <div className={styles.labsSection}>
        {/* Search Bar */}
        <div className="input-group mb-3">
          <span className="input-group-text">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ borderRadius: "10px" }}
          />
        </div>

        {/* Filters */}
        <div className="mb-3">
          <Select
            options={specialties}
            value={specialties.find((s) => s.value === filters.specialty) || null}
            onChange={(selected) => setFilters({ ...filters, specialty: selected ? selected.value : "" })}
            placeholder="Filter by Specialty"
            styles={selectStyles}
            className="mb-2"
          />
          <input
            type="number"
            placeholder="Max Service Price (₹)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="form-control mb-2"
            style={{ borderRadius: "10px" }}
          />
          <div className="form-check">
            <input
              type="checkbox"
              checked={filters.hasEmergency}
              onChange={(e) => setFilters({ ...filters, hasEmergency: e.target.checked })}
              className="form-check-input"
              id="hasEmergency"
            />
            <label className="form-check-label" htmlFor="hasEmergency" style={{ color: "#2c3e50", fontFamily: "Open Sans, sans-serif" }}>
              Emergency Services Available
            </label>
          </div>
        </div>

        {/* Hospital List */}
        <div className={styles.labsGrid}>
          {filteredHospitals.map((hospital, index) => (
            <div key={index} className={styles.labCard}>
              <div className={styles.labAvatar}>
                <img src={hospital.imageUrl} alt={hospital.name} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.labName}>{hospital.name}</h3>
              <p className={styles.labDistance}>Distance: {hospital.distance ? hospital.distance.toFixed(2) : "N/A"} km</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Specialties: {hospital.specialties.join(", ")}
              </p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Beds: {hospital.bedAvailability.general} (General), {hospital.bedAvailability.icu} (ICU)
              </p>
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>{hospital.rating}</span>
              </div>
              <button
                className="btn"
                style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px", width: "100%", marginTop: "10px" }}
                onClick={() => handleBookNow(hospital)}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
                  Book Appointment
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <p style={{ fontFamily: "Open Sans, sans-serif" }}>
                  Selected Hospital: {selectedHospital?.name || "Please select a hospital"}
                </p>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Choose Specialty
                  </label>
                  <Select
                    options={specialties.filter((s) =>
                      selectedHospital.specialties.map((spec) => spec.toLowerCase()).includes(s.value)
                    )}
                    value={selectedSpecialty}
                    onChange={setSelectedSpecialty}
                    placeholder="Select specialty..."
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Gender
                  </label>
                  <Select
                    options={genderOptions}
                    value={genderOptions.find((g) => g.value === gender) || null}
                    onChange={(selected) => setGender(selected ? selected.value : "")}
                    placeholder="Select gender..."
                    styles={selectStyles}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Age
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    placeholder="e.g., 35 years"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>
                    Mobile No.
                  </label>
                  <input
                    type="tel"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    placeholder="e.g., 9876543210"
                    required
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
                    required
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
                    required
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button
                  className="btn"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={handleConfirmBooking}
                >
                  Confirm Booking
                </button>
                <button
                  className="btn"
                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={() => setIsBookingPopupOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Booking Slip After Confirmation */}
      {showBookingSlip && <HospitalBookingSlip bookingDetails={bookingDetails} />}

      <ToastContainer />
    </div>
  );
};

export default AllHospitals;
