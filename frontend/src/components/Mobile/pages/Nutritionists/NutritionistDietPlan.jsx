import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Calendar,
  Utensils,
  Droplet,
  BarChart2,
  Video,
  ShoppingCart,
  Bell,
  AlertCircle,
  Clock,
  Leaf,
} from "lucide-react";
import styles from "./NutritionistDietPlan.module.css";
import nutritionImage from "../../../assets/Swasthyasetu/nutrition.jpg";
import nutritionistsData from "../../../assets/Data/Nutritionists.json"; // Import JSON

// Simulated health data
const mockHealthData = {
  hemoglobin: 12.5,
  cholesterol: 190,
  bloodSugar: 110,
  weight: 70,
  bmi: 24.5,
  dietPreference: "Vegetarian",
};

// Simulated diet plan
const initialDietPlan = [
  {
    id: 1,
    meal: "Breakfast",
    items: "Oatmeal with Almonds & Berries",
    calories: 350,
    nutrients: { protein: 12, fats: 8, carbs: 60, vitaminD: 5 },
    time: "08:00 AM",
    restrictedFoods: ["Dairy", "Gluten"],
    swapOptions: ["Greek Yogurt", "Gluten-Free Bread"],
  },
  {
    id: 2,
    meal: "Lunch",
    items: "Quinoa Salad with Chickpeas",
    calories: 500,
    nutrients: { protein: 30, fats: 15, carbs: 40, vitaminD: 10 },
    time: "12:00 PM",
    restrictedFoods: ["Nuts", "Shellfish"],
    swapOptions: ["Tofu Salad", "Brown Rice"],
  },
  {
    id: 3,
    meal: "Snack",
    items: "Greek Yogurt with Honey",
    calories: 150,
    nutrients: { protein: 5, fats: 10, carbs: 25, vitaminD: 2 },
    time: "03:00 PM",
    restrictedFoods: ["Peanuts", "Citrus"],
    swapOptions: ["Apple", "Carrots"],
  },
  {
    id: 4,
    meal: "Dinner",
    items: "Grilled Paneer with Steamed Veggies",
    calories: 450,
    nutrients: { protein: 25, fats: 20, carbs: 30, vitaminD: 15 },
    time: "07:00 PM",
    restrictedFoods: ["Soy", "Eggs"],
    swapOptions: ["Baked Salmon", "Roasted Veggies"],
  },
];

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NutritionistIcon = (size) => L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3079/3079305.png",
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

// Map click handler
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

const NutritionistDietPlan = () => {
  const navigate = useNavigate();
  const [nutritionists] = useState(nutritionistsData);
  const [healthData] = useState(mockHealthData);
  const [dietPlan, setDietPlan] = useState(initialDietPlan);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedNutritionist, setSelectedNutritionist] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [waterIntake, setWaterIntake] = useState(0);
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [mood, setMood] = useState("Good");
  const [bookedAppointments, setBookedAppointments] = useState([]); // Store booked appointments
  const [isProgressPopupOpen, setIsProgressPopupOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        err => toast.error("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // Load booked appointments from localStorage
    const savedAppointments = JSON.parse(localStorage.getItem("nutritionistAppointments")) || [];
    setBookedAppointments(savedAppointments);
  }, []);

  // Add a listener to update appointments when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedAppointments = JSON.parse(localStorage.getItem("nutritionistAppointments")) || [];
      setBookedAppointments(savedAppointments);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  // AI-Powered Recommendations
  const getNutritionRecommendations = () => {
    const recommendations = [];
    if (healthData.hemoglobin < 13) recommendations.push("Increase iron-rich foods (e.g., spinach, lentils) for anemia.");
    if (healthData.cholesterol > 200) recommendations.push("Reduce saturated fats; opt for oats and nuts.");
    if (healthData.bloodSugar > 100) recommendations.push("Choose low-GI foods like whole grains; avoid sugary drinks.");
    return recommendations.length > 0 ? recommendations : ["Maintain a balanced diet with whole foods."];
  };

  const totalCalories = dietPlan.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalNutrients = dietPlan.reduce(
    (acc, meal) => ({
      protein: acc.protein + (meal.nutrients.protein || 0),
      fats: acc.fats + (meal.nutrients.fats || 0),
      carbs: acc.carbs + (meal.nutrients.carbs || 0),
      vitaminD: acc.vitaminD + (meal.nutrients.vitaminD || 0),
    }),
    { protein: 0, fats: 0, carbs: 0, vitaminD: 0 }
  );

  const checkNutrientAlert = () => {
    if (totalNutrients.protein < 50) {
      return "Low protein intake detected. Consider adding protein-rich foods like beans or paneer.";
    } else if (totalNutrients.vitaminD < 15) {
      return "Low Vitamin D intake detected. Include fortified foods or supplements.";
    }
    return null;
  };

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const handleAddWater = () => {
    setWaterIntake((prev) => prev + 1);
    toast.success("Added 1 glass of water!");
  };

  const handleBookConsultation = () => {
    if (!userName || !email || !appointmentType || !appointmentDate || !appointmentTime) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (appointmentType.value === "inPerson" && !pinLocation) {
      toast.error("Please select a location for in-person consultation!");
      return;
    }

    const newAppointment = {
      nutritionistId: selectedNutritionist.id,
      nutritionistName: selectedNutritionist.name,
      type: appointmentType.value,
      date: appointmentDate,
      time: appointmentTime.label,
      userName,
      email,
      location: appointmentType.value === "inPerson" ? { latitude, longitude, address } : null,
      fees: appointmentType.value === "online" ? selectedNutritionist.fees.online : selectedNutritionist.fees.offline,
      bookingId: `NUT${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };

    const updatedAppointments = [...bookedAppointments, newAppointment];
    setBookedAppointments(updatedAppointments);
    localStorage.setItem("nutritionistAppointments", JSON.stringify(updatedAppointments));
    window.dispatchEvent(new Event("storage"));

    const ehrEntry = `Nutritionist consultation recommended on ${appointmentDate}, referred to ${selectedNutritionist.name}.`;
    console.log("EHR Update:", ehrEntry);
    toast.success(`Consultation booked with ${selectedNutritionist.name}! Fee: ₹${newAppointment.fees}`);
    setIsBookingPopupOpen(false);

    // Reset form fields
    setUserName("");
    setEmail("");
    setAppointmentType(null);
    setAppointmentDate("");
    setAppointmentTime(null);
    setPinLocation(null);
    setLatitude("");
    setLongitude("");
    setAddress("");
  };

  const handleGenerateGroceryList = () => {
    toast.success("Generated grocery list based on diet plan!");
  };

  const handleMealDelivery = () => {
    toast.success("Suggested nearby healthy meal delivery services!");
  };

  const handleSwapMeal = (meal, newOption) => {
    if (!meal || !newOption) {
      toast.error("Invalid meal or swap option selected.");
      return;
    }
    const updatedPlan = dietPlan.map((m) =>
      m.id === meal.id ? { ...m, items: newOption } : m
    );
    setDietPlan(updatedPlan);
    toast.success(`Swapped ${meal.meal} (${meal.items}) with ${newOption}`);
  };

  const handleViewReport = () => {
    setIsProgressPopupOpen(true);
  };

  const handleActivityChange = (level) => {
    if (!level) return;
    setActivityLevel(level);
    toast.success(`Activity level updated to ${level}`);
  };

  const handleMoodChange = (newMood) => {
    if (!newMood) return;
    setMood(newMood);
    toast.success(`Mood updated to ${newMood}`);
  };

  const closePopup = () => {
    setSelectedMeal(null);
    setIsBookingPopupOpen(false);
  };

  // Filter available slots based on appointment type
  const getAvailableSlots = () => {
    if (!selectedNutritionist || !appointmentType) return [];
    const slots = appointmentType.value === "online"
      ? selectedNutritionist.availability.onlineSlots
      : selectedNutritionist.availability.offlineSlots;
    return slots.map(slot => ({
      value: `${slot.date} ${slot.time}`,
      label: `${slot.date} ${slot.time}`,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Nutrition & Diet Plan</h1>
      </div>

      <div className={styles.imageSection}>
        <img
          src={nutritionImage}
          alt="Nutrition Banner"
          className={styles.nutritionImage}
          loading="lazy"
          decoding="async"
          onError={(e) => console.error("Failed to load nutrition image:", e)}
        />
      </div>

      {/* Today's Diet Plan */}
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={20} /> Today’s Diet Plan
        </h2>
        <div className={styles.labsGrid}>
          {dietPlan.map((meal) => (
            <div
              key={meal.id}
              className={styles.labCard}
              onClick={() => handleMealClick(meal)}
              aria-label={`View details for ${meal.meal}`}
            >
              <div className={styles.iconContainer}>
                <Utensils className={styles.purpleIcon} />
              </div>
              <div className={styles.mealHeader}>
                <h3 className={styles.mealName}>{meal.meal}</h3>
                <span className={styles.calories}>{meal.calories} kcal</span>
              </div>
              <p className={styles.schedule}>
                <Clock size={16} /> {meal.time} - {meal.items}
              </p>
              <span className={styles.restricted}>
                Avoid: {meal.restrictedFoods.join(", ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>AI Nutrition Recommendations</h2>
        <div className={styles.recommendationCard}>
          <ul>
            {getNutritionRecommendations().map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Find a Nutritionist */}
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Find a Nutritionist</h2>
        <div className={styles.labsGrid}>
          {nutritionists.map((nutritionist) => (
            <div
              key={nutritionist.id}
              className={styles.labCard}
              onClick={() => {
                setSelectedNutritionist(nutritionist);
                setIsBookingPopupOpen(true);
              }}
            >
              <div className={styles.iconContainer}>
                <img
                  src={nutritionist.imageUrl}
                  alt={nutritionist.name}
                  loading="lazy"
                  decoding="async"
                className="diet-tip-image"
                onError={(e) => (e.target.src = "https://placehold.co/60x60")} // Fallback image
              />
              </div>
              <div className={styles.mealHeader}>
                <h3 className={styles.mealName}>{nutritionist.name}</h3>
              </div>
              <p className={styles.schedule}>{nutritionist.specialty} - {nutritionist.experience}</p>
              <p className={styles.schedule}>{nutritionist.location.address}</p>
              <span className={styles.restricted}>
                {nutritionist.availability.online && nutritionist.availability.offline
                  ? "Online & Offline"
                  : nutritionist.availability.online
                  ? "Online Only"
                  : "Offline Only"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Diet & Wellness Tracking */}
      <div className={styles.trackingSection}>
        <h3 className={styles.subTitle}>
          <BarChart2 size={20} /> Diet & Wellness Tracking
        </h3>
        <div className={styles.trackingGrid}>
          <div className={styles.trackingCard}>
            <p>Total Calories: {totalCalories} kcal</p>
            <p>Protein: {totalNutrients.protein}g, Fats: {totalNutrients.fats}g, Carbs: {totalNutrients.carbs}g, Vitamin D: {totalNutrients.vitaminD} IU</p>
            {checkNutrientAlert() && (
              <p className={styles.alert}>
                <AlertCircle size={16} /> {checkNutrientAlert()}
              </p>
            )}
          </div>
          <div className={styles.trackingCard}>
            <p>Water Intake: {waterIntake} glasses</p>
            <button className={styles.waterButton} onClick={handleAddWater}>
              <Droplet size={16} /> Add Water
            </button>
          </div>
          <div className={styles.trackingCard}>
            <p>Health Indicators</p>
            <p>Hemoglobin: {healthData.hemoglobin} g/dL</p>
            <p>Cholesterol: {healthData.cholesterol} mg/dL</p>
            <p>Blood Sugar: {healthData.bloodSugar} mg/dL</p>
          </div>
          <div className={styles.trackingCard}>
            <p>Weight & BMI</p>
            <p>Weight: {healthData.weight} kg, BMI: {healthData.bmi}</p>
            <button className={styles.reportButton} onClick={handleViewReport}>
              <BarChart2 size={16} /> View Progress
            </button>
          </div>
          <div className={styles.trackingCard}>
            <p>Activity Level: {activityLevel}</p>
            <select
              className={styles.activitySelect}
              value={activityLevel}
              onChange={(e) => handleActivityChange(e.target.value)}
              aria-label="Select activity level"
            >
              <option value="Sedentary">Sedentary</option>
              <option value="Moderate">Moderate</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <div className={styles.trackingCard}>
            <p>Mood Today: {mood}</p>
            <select
              className={styles.moodSelect}
              value={mood}
              onChange={(e) => handleMoodChange(e.target.value)}
              aria-label="Select mood"
            >
              <option value="Good">Good</option>
              <option value="Neutral">Neutral</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>
      </div>


      {/* Meal Details Popup */}
      {selectedMeal && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>{selectedMeal.meal}</h3>
            <p className={styles.popupDetail}>
              <span>Items</span> <span>{selectedMeal.items}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Calories</span> <span>{selectedMeal.calories} kcal</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Nutrients</span> <span>Protein: {selectedMeal.nutrients.protein}g, Fats: {selectedMeal.nutrients.fats}g, Carbs: {selectedMeal.nutrients.carbs}g, Vitamin D: {selectedMeal.nutrients.vitaminD || 0} IU</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Time</span> <span>{selectedMeal.time}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Restricted Foods</span> <span>{selectedMeal.restrictedFoods.join(", ")}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Swap Options</span> <span>{selectedMeal.swapOptions.join(" or ")}</span>
            </p>
            <div className={styles.popupButtons}>
              <button className={styles.swapButton} onClick={() => handleSwapMeal(selectedMeal, selectedMeal.swapOptions[0])}>
                <Leaf size={16} /> Swap Meal
              </button>
              <button className={styles.closeButton} onClick={closePopup}>
                Close
              </button>
            </div>
            <p className={styles.reminder}>
              <Bell size={16} /> Reminder: Eat at {selectedMeal.time}. Drink water!
            </p>
          </div>
        </div>
      )}

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>Book Consultation with {selectedNutritionist?.name}</h3>
            <div className="mb-3">
              <label className={styles.popupLabel}>Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="form-control"
                style={{ borderRadius: "10px" }}
              />
            </div>
            <div className="mb-3">
              <label className={styles.popupLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                style={{ borderRadius: "10px" }}
              />
            </div>
            <div className="mb-3">
              <label className={styles.popupLabel}>Consultation Type</label>
              <Select
                options={[
                  ...(selectedNutritionist?.availability.online ? [{ value: "online", label: `Online (₹${selectedNutritionist.fees.online})` }] : []),
                  ...(selectedNutritionist?.availability.offline ? [{ value: "inPerson", label: `In-Person (₹${selectedNutritionist.fees.offline})` }] : []),
                ]}
                value={appointmentType}
                onChange={setAppointmentType}
                placeholder="Choose consultation type..."
                styles={selectStyles}
              />
            </div>
            <div className="mb-3">
              <label className={styles.popupLabel}>Date & Time Slot</label>
              <Select
                options={getAvailableSlots().filter(slot => {
                  const [dateStr] = slot.label.split(" ");
                  return dateStr >= new Date().toISOString().split("T")[0];
                })}
                value={appointmentTime}
                onChange={(selected) => {
                  setAppointmentTime(selected);
                  if (selected) {
                    const [date, ...timeParts] = selected.label.split(" ");
                    setAppointmentDate(date);
                    setAppointmentTime({ value: selected.value, label: timeParts.join(" ") });
                  }
                }}
                placeholder="Choose a time slot..."
                styles={selectStyles}
              />
            </div>
            {appointmentType?.value === "inPerson" && (
              <div className="mb-3">
                <label className={styles.popupLabel}>Your Location</label>
                <MapContainer
                  center={userLocation || [20.333, 85.821]}
                  zoom={15}
                  style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                  {pinLocation && <Marker position={pinLocation} icon={NutritionistIcon([40, 40])} />}
                  <MapClickHandler
                    setPinLocation={setPinLocation}
                    setLatitude={setLatitude}
                    setLongitude={setLongitude}
                    setAddress={setAddress}
                  />
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
                    placeholder="Address"
                    value={address}
                    readOnly
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
              </div>
            )}
            <div className={styles.popupButtons}>
              <button className={styles.swapButton} onClick={handleBookConsultation}>
                Book Consultation
              </button>
              <button className={styles.closeButton} onClick={closePopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Report Popup */}
      {isProgressPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent} style={{ textAlign: "left", padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#2575fc", fontWeight: "700" }}><BarChart2 size={24} style={{ marginRight: "10px" }} /> Wellness Report</h3>
              <button onClick={() => setIsProgressPopupOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#a0aec0" }}>✖</button>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "1.1rem", color: "#4a5568", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", marginBottom: "15px" }}>Daily Nutrition Goals</h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: "#718096" }}>Calories Consumed:</span>
                <span style={{ fontWeight: "bold", color: "#2d3748" }}>{totalCalories} / 2000 kcal</span>
              </div>
              <div style={{ width: "100%", background: "#edf2f7", borderRadius: "10px", height: "8px", marginBottom: "20px" }}>
                <div style={{ width: `${Math.min((totalCalories / 2000) * 100, 100)}%`, background: "#48bb78", height: "100%", borderRadius: "10px" }}></div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#ebf8ff", padding: "10px", borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#3182ce" }}>Protein</p>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#2b6cb0" }}>{totalNutrients.protein}g</p>
                </div>
                <div style={{ background: "#fff5f5", padding: "10px", borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#c53030" }}>Carbs</p>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#9b2c2c" }}>{totalNutrients.carbs}g</p>
                </div>
                <div style={{ background: "#fffff0", padding: "10px", borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#b7791f" }}>Fats</p>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#975a16" }}>{totalNutrients.fats}g</p>
                </div>
                <div style={{ background: "#f0fff4", padding: "10px", borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#2f855a" }}>Water</p>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#276749" }}>{waterIntake} glasses</p>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "1.1rem", color: "#4a5568", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", marginBottom: "15px" }}>Health Metrics</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #edf2f7" }}>
                  <span style={{ color: "#718096" }}>BMI</span>
                  <span style={{ fontWeight: "bold", color: healthData.bmi > 25 ? "#e53e3e" : "#38a169" }}>{healthData.bmi} ({healthData.bmi > 25 ? "Overweight" : "Normal"})</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #edf2f7" }}>
                  <span style={{ color: "#718096" }}>Cholesterol</span>
                  <span style={{ fontWeight: "bold", color: healthData.cholesterol > 200 ? "#e53e3e" : "#38a169" }}>{healthData.cholesterol} mg/dL</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ color: "#718096" }}>Blood Sugar</span>
                  <span style={{ fontWeight: "bold", color: healthData.bloodSugar > 100 ? "#e53e3e" : "#38a169" }}>{healthData.bloodSugar} mg/dL</span>
                </li>
              </ul>
            </div>
            
            <button className={styles.swapButton} onClick={() => setIsProgressPopupOpen(false)} style={{ width: "100%", marginTop: "20px" }}>
              Close Report
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default NutritionistDietPlan;
