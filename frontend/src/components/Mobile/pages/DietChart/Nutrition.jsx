import React, { useState, useEffect } from "react";
import styles from "./Nutrition.module.css";
import { 
  Calendar, Utensils, Droplet, BarChart2,
  AlertCircle, Clock, TestTube, Stethoscope, HeartPulse, 
  Leaf, Activity, Loader
} from "lucide-react";
import nutritionImage from "../../../assets/Swasthyasetu/nutrition.jpg"; // Ensure this path is correct

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const Nutrition = () => {
  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    weight: "",
    height: "",
    diseases: "",
    goal: "Maintain Weight",
    dietPreference: "Veg",
    language: "English"
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0); // in glasses
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem("aiDietPlan");
    if (savedPlan) {
      try {
        setAiData(JSON.parse(savedPlan));
      } catch(e) {}
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateDietPlan = async () => {
    if (!formData.age || !formData.weight || !formData.height) {
      setError("Please fill in Age, Weight, and Height.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    const systemMessage = `Act as an expert AI Nutritionist. 
You will receive the user's data: Age, Gender, Weight(kg), Height(cm), Medical Conditions, Goals, Diet Preference, and Language.
Calculate their BMI. Generate a strictly valid JSON response (no markdown, no extra text, just the raw JSON object) with this exact structure:
{
  "bmi": 24.5,
  "dailyCalorieTarget": 2000,
  "waterIntakeGlasses": 8,
  "healthStatus": "Normal",
  "lifestyleSuggestions": ["Sleep 8 hours", "Walk 30 mins"],
  "diseaseAlerts": ["Avoid high sugar foods due to Diabetes"],
  "dietPlan": [
    {
      "id": 1,
      "meal": "Breakfast",
      "time": "08:00 AM",
      "items": "Oats with nuts",
      "calories": 350,
      "nutrients": { "protein": 12, "fats": 10, "carbs": 45, "vitaminD": 2 },
      "restrictedFoods": ["Refined sugar"],
      "swapOptions": ["Boiled Eggs"]
    },
    { "id": 2, "meal": "Lunch", "time": "01:00 PM", "items": "...", "calories": 500, "nutrients": {"protein": 20, "fats": 15, "carbs": 60, "vitaminD": 5}, "restrictedFoods": [], "swapOptions": [] },
    { "id": 3, "meal": "Snacks", "time": "04:30 PM", "items": "...", "calories": 200, "nutrients": {"protein": 5, "fats": 5, "carbs": 20, "vitaminD": 0}, "restrictedFoods": [], "swapOptions": [] },
    { "id": 4, "meal": "Dinner", "time": "08:00 PM", "items": "...", "calories": 450, "nutrients": {"protein": 25, "fats": 10, "carbs": 40, "vitaminD": 2}, "restrictedFoods": [], "swapOptions": [] }
  ]
}
Ensure accurate nutritional data, proper calorie distribution based on the goal (Weight loss/gain/maintain), and strict adherence to medical restrictions (${formData.diseases}) and diet preference (${formData.dietPreference}). Language for output should be ${formData.language}.`;

    const userPrompt = `Age: ${formData.age}, Gender: ${formData.gender}, Weight: ${formData.weight}kg, Height: ${formData.height}cm, Diseases: ${formData.diseases || "None"}, Goal: ${formData.goal}, Preference: ${formData.dietPreference}, Language: ${formData.language}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      const parsedData = JSON.parse(aiResponse);
      
      setAiData(parsedData);
      localStorage.setItem("aiDietPlan", JSON.stringify(parsedData));
      setWaterIntake(0); // Reset water tracking
    } catch (err) {
      console.error(err);
      setError("Failed to generate diet plan. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const handleAddWater = () => {
    if (aiData && waterIntake < aiData.waterIntakeGlasses) {
        setWaterIntake((prev) => prev + 1);
    }
  };

  const closePopup = () => {
    setSelectedMeal(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>AI Nutrition Plan</h1>
      </div>

      <div className={styles.imageSection}>
        <img
          src={nutritionImage}
          alt="Nutrition Banner"
          className={styles.nutritionImage}
          loading="lazy"
        />
      </div>

      {/* AI Generator Form */}
      <div className={styles.generatorSection}>
        <h2 className={styles.sectionTitle}><Activity size={20} /> Personalize Your Diet</h2>
        <div className={styles.formGrid}>
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleInputChange} className={styles.inputField} />
          <select name="gender" value={formData.gender} onChange={handleInputChange} className={styles.selectField}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
          <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleInputChange} className={styles.inputField} />
          <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleInputChange} className={styles.inputField} />
          
          <input type="text" name="diseases" placeholder="Diseases/Conditions (e.g. Diabetes, Anemia)" value={formData.diseases} onChange={handleInputChange} className={styles.inputFieldFull} />
          
          <select name="goal" value={formData.goal} onChange={handleInputChange} className={styles.selectField}>
            <option>Weight Loss</option><option>Maintain Weight</option><option>Weight Gain</option>
          </select>
          <select name="dietPreference" value={formData.dietPreference} onChange={handleInputChange} className={styles.selectField}>
            <option>Veg</option><option>Non-Veg</option><option>Vegan</option><option>Keto</option>
          </select>
          <select name="language" value={formData.language} onChange={handleInputChange} className={styles.selectFieldFull}>
            <option>English</option><option>Hindi</option><option>Spanish</option>
          </select>
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button className={styles.generateBtn} onClick={generateDietPlan} disabled={isGenerating}>
          {isGenerating ? <><Loader className={styles.spinIcon} size={18} /> Generating...</> : <><HeartPulse size={18} /> Generate Smart Diet Plan</>}
        </button>
      </div>

      {aiData && (
        <>
          <div className={styles.labsSection} style={{marginTop: '20px'}}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={20} /> Today’s AI Diet Plan
            </h2>
            <div className={styles.healthStatsBar}>
              <span><strong>BMI:</strong> {aiData.bmi}</span>
              <span><strong>Target:</strong> {aiData.dailyCalorieTarget} kcal</span>
              <span className={styles.healthStatusLabel}>{aiData.healthStatus}</span>
            </div>
            
            {aiData.diseaseAlerts && aiData.diseaseAlerts.length > 0 && (
              <div className={styles.diseaseAlertsBox}>
                <AlertCircle size={18} />
                <ul>
                  {aiData.diseaseAlerts.map((alert, idx) => <li key={idx}>{alert}</li>)}
                </ul>
              </div>
            )}

            <div className={styles.labsGrid}>
              {aiData.dietPlan?.map((meal) => (
                <div
                  key={meal.id}
                  className={styles.labCard}
                  onClick={() => handleMealClick(meal)}
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
                  {meal.restrictedFoods && meal.restrictedFoods.length > 0 && (
                    <span className={styles.restricted}>
                      Avoid: {meal.restrictedFoods.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.trackingSection}>
            <h3 className={styles.subTitle}>
              <BarChart2 size={20} /> Wellness Tracking
            </h3>
            <div className={styles.trackingGrid}>
              <div className={styles.trackingCard}>
                <p><strong>Water Intake</strong></p>
                <p>{waterIntake} / {aiData.waterIntakeGlasses} glasses</p>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${Math.min(100, (waterIntake/aiData.waterIntakeGlasses)*100)}%` }}></div>
                </div>
                <button className={styles.waterButton} onClick={handleAddWater}>
                  <Droplet size={16} /> Add Water
                </button>
              </div>
              <div className={styles.trackingCard}>
                <p><strong>Lifestyle Suggestions</strong></p>
                <ul className={styles.lifestyleList}>
                  {aiData.lifestyleSuggestions?.map((sug, idx) => (
                    <li key={idx}><Leaf size={12}/> {sug}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

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
              <span>Nutrients</span> <span>P: {selectedMeal.nutrients?.protein}g | F: {selectedMeal.nutrients?.fats}g | C: {selectedMeal.nutrients?.carbs}g</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Time</span> <span>{selectedMeal.time}</span>
            </p>
            {selectedMeal.restrictedFoods && selectedMeal.restrictedFoods.length > 0 && (
              <p className={styles.popupDetail}>
                <span>Restricted</span> <span>{selectedMeal.restrictedFoods.join(", ")}</span>
              </p>
            )}
            {selectedMeal.swapOptions && selectedMeal.swapOptions.length > 0 && (
              <p className={styles.popupDetail}>
                <span>Swap Options</span> <span>{selectedMeal.swapOptions.join(" or ")}</span>
              </p>
            )}
            <div className={styles.popupButtons}>
              <button className={styles.closeButton} onClick={closePopup} style={{width: '100%'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className={styles.navbar}>
        <a className={`${styles.navLink} ${window.location.pathname === "/blood-test" ? styles.active : ""}`} href="/blood-test">
          <TestTube className={styles.navIcon} /> Test
        </a>
        <button className={styles.suusriButton} onClick={() => window.location.href = "/suusri"}>
          Suusri
        </button>
        <a className={`${styles.navLink} ${window.location.pathname === "/doctors" ? styles.active : ""}`} href="/doctors">
          <Stethoscope className={styles.navIcon} /> Doctor
        </a>
        <a className={`${styles.navLink} ${window.location.pathname === "/nutrition" ? styles.active : ""}`} href="/nutrition">
          <Utensils className={styles.navIcon} /> Nutrition
        </a>
      </nav>
    </div>
  );
};

export default Nutrition;
