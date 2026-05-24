import React, { useState } from "react";
import styles from "./Nutrition.module.css";
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
  TestTube, 
  Stethoscope, 
  HeartPulse, 
  Leaf 
} from "lucide-react";
import nutritionImage from "../../../assets/Swasthyasetu/nutrition.jpg"; // Ensure this path is correct

const Nutrition = () => {
  // Define the structure of a meal for better type safety (optional, for TypeScript or clarity)
  const initialDietPlan = [
    {
      id: 1,
      meal: "Breakfast",
      items: "Greek Yogurt",
      calories: 350,
      nutrients: { protein: 12, fats: 8, carbs: 60, vitaminD: 5 },
      time: "08:00 AM",
      restrictedFoods: ["Dairy", "Gluten"],
      swapOptions: ["Oatmeal", "Gluten-Free Bread"],
    },
    {
      id: 2,
      meal: "Lunch",
      items: "Grilled Chicken Salad, Quinoa",
      calories: 450,
      nutrients: { protein: 30, fats: 15, carbs: 40, vitaminD: 10 },
      time: "12:00 PM",
      restrictedFoods: ["Nuts", "Shellfish"],
      swapOptions: ["Tofu Salad", "Brown Rice"],
    },
    {
      id: 3,
      meal: "Snacks",
      items: "Carrots",
      calories: 200,
      nutrients: { protein: 5, fats: 10, carbs: 25, vitaminD: 2 },
      time: "03:00 PM",
      restrictedFoods: ["Peanuts", "Citrus"],
      swapOptions: ["Apple", "Seeds"],
    },
    {
      id: 4,
      meal: "Dinner",
      items: "Baked Salmon, Steamed Veggies",
      calories: 400,
      nutrients: { protein: 25, fats: 20, carbs: 30, vitaminD: 15 },
      time: "07:00 PM",
      restrictedFoods: ["Soy", "Eggs"],
      swapOptions: ["Cod Fish", "Roasted Veggies"],
    },
  ];

  const [dietPlan, setDietPlan] = useState(initialDietPlan);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0); // in glasses

  // Handlers
  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const handleAddWater = () => {
    setWaterIntake((prev) => prev + 1);
    alert("Added 1 glass of water");
  };

  const handleBookConsultation = () => {
    alert("Booking nutritionist consultation...");
  };

  const handleGenerateGroceryList = () => {
    alert("Generated grocery list based on diet plan");
  };

  const handleMealDelivery = () => {
    alert("Suggested nearby healthy meal delivery services");
  };

  const handleSwapMeal = (meal, newOption) => {
    if (!meal || !newOption) {
      alert("Error: Invalid meal or swap option selected.");
      return;
    }
    alert(`Swapped ${meal.meal} (${meal.items}) with ${newOption}`);
    const updatedPlan = dietPlan.map((m) =>
      m.id === meal.id ? { ...m, items: newOption } : m
    );
    setDietPlan(updatedPlan);
  };

  const handleViewReport = () => {
    alert("Viewing diet progress report...");
  };

  const closePopup = () => {
    setSelectedMeal(null);
  };

  // Calculations
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
      return "Low protein intake detected. Consider adding protein-rich foods like beans or eggs.";
    } else if (totalNutrients.vitaminD < 15) {
      return "Low Vitamin D intake detected. Include fortified foods or supplements.";
    }
    return null;
  };

  // Activity and Mood Trackers
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const handleActivityChange = (level) => {
    if (!level) return; // Prevent empty selection
    setActivityLevel(level);
    alert(`Activity level updated to ${level}`);
  };

  const [mood, setMood] = useState("Good");
  const handleMoodChange = (newMood) => {
    if (!newMood) return; // Prevent empty selection
    setMood(newMood);
    alert(`Mood updated to ${newMood}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Today’s Diet Plan</h1>
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
              aria-label={`View details for ${meal.meal}`} // Accessibility
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
            <p>Weight & BMI Progress</p>
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

      <div className={styles.globalActions}>
        <h3 className={styles.globalTitle}>
          <Leaf size={20} /> Nutrition Services
        </h3>
        <div className={styles.actionButtons}>
          <button className={styles.consultButton} onClick={handleBookConsultation}>
            <Video size={16} /> Book Nutritionist
          </button>
          <button className={styles.groceryButton} onClick={handleGenerateGroceryList}>
            <ShoppingCart size={16} /> Grocery List
          </button>
          <button className={styles.deliveryButton} onClick={handleMealDelivery}>
            <Utensils size={16} /> Meal Delivery
          </button>
        </div>
      </div>

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

      <nav className={styles.navbar}>
        <a 
          className={`${styles.navLink} ${window.location.pathname === "/blood-test" ? styles.active : ""}`} 
          href="/blood-test"
          aria-label="Navigate to Blood Test"
        >
          <TestTube className={styles.navIcon} />
          Test
        </a>
        <button 
          className={styles.suusriButton} 
          onClick={() => alert("Suusri clicked!")}
          aria-label="Suusri button"
        >
          Suusri
        </button>
        <a 
          className={`${styles.navLink} ${window.location.pathname === "/doctors" ? styles.active : ""}`} 
          href="/doctors"
          aria-label="Navigate to Doctors"
        >
          <Stethoscope className={styles.navIcon} />
          Doctor
        </a>
        <a 
          className={`${styles.navLink} ${window.location.pathname === "/nutrition" ? styles.active : ""}`} 
          href="/nutrition"
          aria-label="Navigate to Nutrition"
        >
          <Utensils className={styles.navIcon} />
          Nutrition
        </a>
      </nav>
    </div>
  );
};

export default Nutrition;
