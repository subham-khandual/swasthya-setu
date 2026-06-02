import API_BASE_URL from '../../../../apiConfig';
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pill, Search, MapPin, FileText, Clock, CreditCard, Truck, CheckCircle, AlertCircle, ChevronRight, Star, Upload } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css"; // Reuse BloodTest.module.css for consistency
import medicineStoreData from "../../../assets/Data/medicine_store_list.json"; // Import JSON data
import { useCart } from "../../../../context/CartContext";
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Helper: Convert first page of PDF to an image URL
const pdfToImage = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
};

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

// Get top-rated pharmacies based on proximity (and optionally a rating if added to JSON)
const getTopRatedPharmacies = (stores, userLoc) => {
  if (!userLoc || !stores.length) return [];
  return stores
    .map(store => ({
      ...store,
      distance: calculateDistance(userLoc[0], userLoc[1], store.Latitude, store.Longitude),
    }))
    .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
    .slice(0, 4);
};

// Component to handle map clicks
const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setDeliveryAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      setDeliveryAddress("Fetching address...");
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: {
          'User-Agent': 'SwasthyaSetu-Medical-App'
        }
      })
        .then(response => response.json())
        .then(data => setDeliveryAddress(data.display_name || "Unknown location"))
        .catch(() => setDeliveryAddress("Unable to fetch address (API rate limit or network issue)"));
    },
  });
  return null;
};

const Medicine = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedMedicine = location.state?.selectedMedicine || null;

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stores] = useState(medicineStoreData); // Use JSON data
  const [medicines, setMedicines] = useState([]);
  const { cartItems: cart, addToCart: contextAddToCart, removeFromCart: contextRemoveFromCart, clearCart: contextClearCart } = useCart();
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(preSelectedMedicine);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [recentOrder, setRecentOrder] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Prescription Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [scannedMedicines, setScannedMedicines] = useState([]);
  const [extractedDiagnosis, setExtractedDiagnosis] = useState("");
  const [extractedDosage, setExtractedDosage] = useState([]);
  const [isPrescription, setIsPrescription] = useState(true);

  // Medicine categories
  const categories = [
    { value: "General Physician", label: "General Physician", icon: <Pill size={20} /> },
    { value: "Pediatrician", label: "Pediatrician", icon: <Pill size={20} /> },
    { value: "Cardiologist", label: "Cardiologist", icon: <Pill size={20} /> },
    { value: "Neurologist", label: "Neurologist", icon: <Pill size={20} /> },
    { value: "Orthopedic Surgeon", label: "Orthopedic Surgeon", icon: <Pill size={20} /> },
    { value: "Gynecologist", label: "Gynecologist", icon: <Pill size={20} /> },
    { value: "Dermatologist", label: "Dermatologist", icon: <Pill size={20} /> },
    { value: "Psychiatrist", label: "Psychiatrist", icon: <Pill size={20} /> },
    { value: "ENT Specialist", label: "ENT Specialist", icon: <Pill size={20} /> },
    { value: "Oncologist", label: "Oncologist", icon: <Pill size={20} /> },
    { value: "pain-relief", label: "Pain Relief", icon: <Pill size={20} /> },
    { value: "antibiotics", label: "Antibiotics", icon: <Pill size={20} /> },
    { value: "diabetes", label: "Diabetes", icon: <Pill size={20} /> },
    { value: "hypertension", label: "Hypertension", icon: <Pill size={20} /> },
    { value: "otc", label: "OTC Medicines", icon: <Pill size={20} /> },
  ];

  // Load medicines from JSON and get user location
  useEffect(() => {
    const allMedicines = stores.flatMap(store => store.Medicines);
    setMedicines(allMedicines);

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
  }, [stores]);

  // Add to cart with store information
  const addToCart = (medicine) => {
    contextAddToCart(medicine);
    toast.success(`${medicine.Name || medicine.name} added to cart!`);
  };

  // Remove from cart
  const removeFromCart = (medicineId) => {
    contextRemoveFromCart(medicineId);
    toast.info("Item removed from cart!");
  };

  // Toggle generic alternative
  const toggleGeneric = (medicine) => {
    const generic = {
      ...medicine,
      Name: medicine.GenericAlternative.Name,
      Price: medicine.GenericAlternative.Price,
      isGeneric: true,
    };
    const medId = medicine.MedicineId || medicine.medicineId;
    const existing = cart.find(item => item.medicineId === medId);
    if (existing) {
      removeFromCart(medId);
      addToCart(generic);
      toast.info(`Switched to ${generic.Name} for ₹${generic.Price}`);
    } else {
      addToCart(generic);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    if (!cart.length || !userName || !email || !deliveryAddress || !pinLocation || !paymentMethod) {
      toast.error("Please fill in all fields and select a payment method!");
      return;
    }

    const nameRegex = /^[A-Za-z]{2,}(?:\s[A-Za-z]{2,})+$/;
    if (!nameRegex.test(userName.trim())) {
      toast.error("Please enter a valid Full Name (First and Last name, alphabets only)!");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email.toLowerCase())) {
      toast.error("Please enter a valid Gmail address (e.g., name@gmail.com)!");
      return;
    }

    if (paymentMethod.value === "Card" && (!cardNumber || !cvv || !expiryDate)) {
      toast.error("Please enter mock card details!");
      return;
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { _id: "651abcd1234abcd1234abcd1", role: "patient" };
    const userId = user._id || user.userId || "651abcd1234abcd1234abcd1";
    const userModel = user.role || "patient";

    const orderData = {
      userId,
      userModel,
      items: cart.map(item => ({
        medicine: item.medicineId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod: paymentMethod.value,
      paymentDetails: paymentMethod.value === "Card" ? { cardNumber: "****" + cardNumber.slice(-4) } : null,
      paymentIntentId: "pi_MOCK_" + Date.now(), // Simulated payment intent for mobile flow
      shippingAddress: {
        street: deliveryAddress,
        city: "Default City", // Map data doesn't provide city separately easily
        state: "Default State",
        postalCode: "000000"
      }
    };

    try {
      setOrderStatus("processing");
      const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData);
      
      if (response.status === 200 || response.status === 201) {
        setRecentOrder(response.data.order || response.data);
        setOrderStatus("confirmed");
        toast.success("Order confirmed and stored! Tracking started.");
        contextClearCart(); // Clear cart after successful order
        // Keep popup open to show success/tracking
        setTimeout(() => setOrderStatus("delivering"), 3000);
        setTimeout(() => setOrderStatus("delivered"), 6000);
      } else {
        toast.error("Failed to store order.");
        setOrderStatus("pending");
      }
    } catch (err) {
      console.error("Order error:", err);
      toast.error("Server error while placing order.");
      setOrderStatus("pending");
    }
  };

  // Handle Prescription Upload and Scan
  const handlePrescriptionUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsScanning(true);
    setScannedMedicines([]);
    setScanStatus("Processing file...");

    try {
      let imageSource;
      const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        setScanStatus("Converting PDF to image...");
        imageSource = await pdfToImage(selectedFile);
      } else {
        imageSource = URL.createObjectURL(selectedFile);
      }

      setScanStatus("Extracting text from prescription...");
      
      // 1. Run local OCR using Tesseract to extract raw text
      const { data: { text: extractedText } } = await Tesseract.recognize(imageSource, 'eng');
      if (!isPdf) URL.revokeObjectURL(imageSource);
      
      if (!extractedText || extractedText.trim().length < 5) {
        toast.error("Invalid file detected. Could not read any text.");
        setIsPrescription(false);
        setIsScanning(false);
        return;
      }

      setScanStatus("Analyzing with Medical AI...");

      // 2. Send the extracted text to Groq's super-fast TEXT model
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert medical AI pharmacist. You analyze OCR text from prescriptions. You MUST identify the disease or diagnosis."
            },
            {
              role: "user",
              content: `Analyze this raw OCR text extracted from an uploaded document:\n\n"${extractedText}"\n\nSTEP 1: Is this a valid medical prescription (containing medicine names, doctor name, hospital name, or dosage instructions)?\nIf it is obviously NOT a prescription (random text, certificate, ID card, invoice, or irrelevant), reply with EXACTLY the word "INVALID" and nothing else.\n\nSTEP 2: If it IS a valid prescription, you MUST:\n- Identify the disease/diagnosis from the prescription. Look for words like "Diagnosis:", "Complaint:", "For:", or infer the disease from the medicines prescribed (e.g. Paracetamol + Azithromycin = Fever/Infection).\n- Extract every medicine with its dosage and timing.\n\nReturn a JSON object (NOT an array) with this exact format:\n{"disease": "the disease name", "medicines": [{"name": "medicine name", "dose": "dosage", "time": "08:00 AM", "type": "Morning"}]}\n\nThe "disease" field is MANDATORY. If not explicitly written, infer it from the medicines. Do not include any markdown. Just the raw JSON object.`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (data.error) {
          toast.error("AI API Error: " + data.error.message);
          setIsScanning(false);
          return;
      }

      let aiReply = data.choices[0].message.content.trim();
      
      if (aiReply.toUpperCase().includes("INVALID") || aiReply === "INVALID") {
         toast.error("Invalid file detected. Please upload a valid medical prescription.");
         setIsPrescription(false);
      } else {
         // Parse JSON and remove markdown if AI hallucinated it
         aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
         const parsed = JSON.parse(aiReply);
         
         // Support both old array format and new {disease, medicines} format
         let medList = [];
         let detectedDisease = "Unknown";
         
         if (Array.isArray(parsed)) {
            medList = parsed;
            detectedDisease = parsed[0]?.disease || "Unknown";
         } else if (parsed.medicines && Array.isArray(parsed.medicines)) {
            medList = parsed.medicines;
            detectedDisease = parsed.disease || "Unknown";
         }
         
         if (medList.length > 0) {
            // Find matches in local store DB to get pricing
            const allMedicines = stores.flatMap(store => store.Medicines);
            
            const verifiedMeds = medList.map(med => {
              // Try to find the exact medicine in the local database
              const matchedMed = allMedicines.find(m => m.Name.toLowerCase().includes(med.name.toLowerCase()));
              return {
                 MedicineId: matchedMed ? matchedMed.MedicineId : `MANUAL_${Date.now()}_${Math.random()}`,
                 Name: med.name || "Unknown Med",
                 Price: matchedMed ? matchedMed.Price : 50, // Default price if not in DB
                 verified: true,
                 dosage: med.dose || "N/A",
                 time: med.time || ""
              };
            });
            
            setScannedMedicines(verifiedMeds);
            setExtractedDosage(verifiedMeds.map(m => m.dosage));
            setExtractedDiagnosis(detectedDisease);
            setIsPrescription(true);
            toast.success("Scanning complete!");

            // Save scanned prescription to localStorage for Medical History view
            try {
              const savedPrescriptions = localStorage.getItem("scannedPrescriptions");
              let prescriptionsList = [];
              if (savedPrescriptions) {
                const parsed = JSON.parse(savedPrescriptions);
                if (Array.isArray(parsed)) {
                  prescriptionsList = parsed;
                }
              }

              const storedUser = localStorage.getItem("user");
              let patientName = "Subham Khandual";
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.name) {
                  patientName = parsedUser.name;
                }
              }

              const newRecord = {
                id: `SCAN_${Date.now()}`,
                patientName: patientName,
                ageGender: "28 / Male",
                date: new Date().toISOString().split("T")[0],
                doctor: "AI Secure Scan (Self Uploaded)",
                diagnosis: detectedDisease || "General Consultation",
                summary: `This prescription was securely scanned, verified, and digitized via Swasthya Setu AI.`,
                detailedMedicines: verifiedMeds.map(med => ({
                  name: med.Name,
                  dosage: med.dosage || "1 tablet",
                  frequency: med.time || "Once a day",
                  duration: "As prescribed"
                })),
                status: "Completed"
              };

              prescriptionsList.unshift(newRecord);
              localStorage.setItem("scannedPrescriptions", JSON.stringify(prescriptionsList));
              
              // Automatically redirect to Medical History page after 1.5 seconds so user can see toast
              setTimeout(() => {
                setIsUploadModalOpen(false);
                navigate("/medicine-history");
              }, 1500);
            } catch (e) {
              console.error("Failed to save prescription to history:", e);
            }
          } else {
            toast.error("Could not extract medicines. Please try a clearer picture.");
            setIsPrescription(false);
          }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to scan prescription. Please try again.");
    } finally {
      setIsScanning(false);
      setScanStatus("");
    }
  };

  const addScannedToCart = (medicine) => {
    addToCart(medicine);
  };

  // Payment methods
  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "credit", label: "Credit/Debit Card" },
    { value: "wallet", label: "Wallet" },
    { value: "cod", label: "Cash on Delivery" },
  ];

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  return (
    <div className={styles.container}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medicine Ordering</h1>
      </div>

      {/* Home Page Dashboard Grid */}
      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => setIsOrderPopupOpen(true)}>
          <div className={styles.iconContainer}>
            <Pill className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Order Medicine</h3>
          <p className={styles.cardSubtitle}>Shop for medicines</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/medicine-stores", { state: { stores, userLocation } })}>
          <div className={styles.iconContainer}>
            <MapPin className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Nearby Pharmacies</h3>
          <p className={styles.cardSubtitle}>Locate pharmacies</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/order-history")}>
          <div className={styles.iconContainer}>
            <Clock className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Order History</h3>
          <p className={styles.cardSubtitle}>View past purchases</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/medicine-history")}>
          <div className={styles.iconContainer}>
            <FileText className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Medical History</h3>
          <p className={styles.cardSubtitle}>Consultations & Prescriptions</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => setIsUploadModalOpen(true)}>
          <div className={styles.iconContainer}>
            <FileText className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Secure Scan</h3>
          <p className={styles.cardSubtitle}>Upload Prescription</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/track-order")}>
          <div className={styles.iconContainer}>
            <Truck className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Track Order</h3>
          <p className={styles.cardSubtitle}>Monitor delivery</p>
        </div>
      </div>

      {/* Top Rated Pharmacies */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Rated Pharmacies</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine-stores", { state: { stores, userLocation } })}>
            See more <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {getTopRatedPharmacies(stores, userLocation).map((store, index) => (
            <div key={index} className={styles.labCard} onClick={() => navigate("/medicine-all", { state: { medicines: store.Medicines, storeName: store.StoreName } })}>
              <div className={styles.labAvatar}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt={store.StoreName} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.labName}>{store.StoreName}</h3>
              <p className={styles.labDistance}>Distance: {store.distance.toFixed(2)} km</p>
              {/* Rating could be added to JSON for better sorting */}
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>N/A</span> {/* Placeholder; add Rating to JSON if available */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Popup */}
      {isOrderPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
                  {recentOrder && cart.length === 0 ? "Latest Medicine Order" : "Order Medicine"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsOrderPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Choose Medicines</label>
                  <Select
                    options={medicines.map(m => ({ value: m.MedicineId, label: `${m.Name} @ ₹${m.Price} (${m.Offers})` }))}
                    value={cart.map(item => ({ value: item.medicineId, label: `${item.name} @ ₹${item.price}` }))}
                    onChange={(selected) => {
                      const newIds = selected ? selected.map(s => s.value) : [];
                      const oldIds = cart.map(item => item.medicineId);
                      
                      // Add new ones
                      newIds.forEach(id => {
                        if (!oldIds.includes(id)) {
                          const med = medicines.find(m => m.MedicineId === id);
                          if (med) contextAddToCart(med);
                        }
                      });
                      
                      // Remove old ones
                      oldIds.forEach(id => {
                        if (!newIds.includes(id)) {
                          contextRemoveFromCart(id);
                        }
                      });
                    }}
                    placeholder="Select medicines..."
                    isMulti
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} pattern="^[A-Za-z]{2,}(?:\s[A-Za-z]{2,})+$" title="Please enter at least a First and Last name (alphabets only)." />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email (@gmail.com)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} placeholder="example@gmail.com" />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Delivery Location</label>
                  <MapContainer
                    center={userLocation || [20.333, 85.821]}
                    zoom={15}
                    style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={PharmacyIcon([40, 40])} />}
                    <MapClickHandler setPinLocation={setPinLocation} setLatitude={setLatitude} setLongitude={setLongitude} setDeliveryAddress={setDeliveryAddress} />
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
                      placeholder="Delivery Address"
                      value={deliveryAddress}
                      readOnly
                      className="form-control"
                      style={{ borderRadius: "10px" }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Payment Method</label>
                  <Select
                    options={paymentOptions}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Choose payment method..."
                    styles={selectStyles}
                  />
                </div>
                {paymentMethod?.value === "Card" && (
                  <div className="p-3 mb-3" style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <h6 className="mb-3" style={{ color: "#4a5568" }}>Mock Card Details</h6>
                    <input
                      type="text"
                      placeholder="Card Number (e.g. 1234 5678 9012 3456)"
                      className="form-control mb-2"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div className="d-flex gap-2">
                       <input
                        type="text"
                        placeholder="MM/YY"
                        className="form-control"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="form-control"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {selectedMedicine && (
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="generic"
                      checked={cart.some(item => item.medicineId === (selectedMedicine.MedicineId || selectedMedicine.medicineId) && item.isGeneric)}
                      onChange={() => toggleGeneric(selectedMedicine)}
                    />
                    <label className="form-check-label" htmlFor="generic" style={{ color: "#2c3e50" }}>
                      Use Generic Alternative
                    </label>
                  </div>
                )}
                {orderStatus === "delivering" && (
                  <div className="alert alert-info" role="alert">
                    <Truck className="me-2" size={20} /> Your order is being delivered. Track live below:
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div className="progress-bar bg-success" style={{ width: "60%" }} role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                        60%
                      </div>
                    </div>
                  </div>
                )}
                {orderStatus === "delivered" && (
                  <div className="alert alert-success" role="alert">
                    <CheckCircle className="me-2" size={20} /> Order delivered successfully!
                  </div>
                )}
                {recentOrder && cart.length === 0 && (orderStatus === "pending" || orderStatus === "confirmed" || orderStatus === "delivering" || orderStatus === "delivered") && (
                  <div className="order-summary-box p-3" style={{ background: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd", marginBottom: "15px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                       <h6 className="fw-bold m-0" style={{ color: "#0369a1" }}>Recent Order #{recentOrder._id ? recentOrder._id.slice(-6).toUpperCase() : "SUCCESS"}</h6>
                       <span className={`badge ${orderStatus === "delivered" ? "bg-success" : "bg-info"}`} style={{ borderRadius: "20px" }}>{orderStatus.toUpperCase()}</span>
                    </div>
                    <p className="mb-1 small text-muted">Items: <strong>{recentOrder.items ? recentOrder.items.length : 0}</strong></p>
                    <p className="mb-3 small text-muted">Total Paid: <strong>₹{recentOrder.totalAmount}</strong></p>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-primary flex-grow-1" 
                        style={{ borderRadius: "8px" }}
                        onClick={() => { setIsOrderPopupOpen(false); navigate("/track-order"); }}
                      >
                        Track Live
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary" 
                        style={{ borderRadius: "8px" }}
                        onClick={() => { setIsOrderPopupOpen(false); navigate("/order-history"); }}
                      >
                        History
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button
                  className="btn"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={handleConfirmOrder}
                  disabled={orderStatus === "delivering" || orderStatus === "delivered"}
                >
                  Confirm Order
                </button>
                <button
                  className="btn"
                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={() => setIsOrderPopupOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.7)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "20px", border: "none", overflow: "hidden" }}>
              <div className="modal-header" style={{ background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)", color: "#fff", border: "none" }}>
                <h5 className="modal-title" style={{ fontWeight: "700", fontFamily: "Montserrat, sans-serif" }}>Secure Prescription Upload</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setIsUploadModalOpen(false); setScannedMedicines([]); setSelectedFile(null); }}></button>
              </div>
              <div className="modal-body" style={{ padding: "30px", textAlign: "center" }}>
                {!isScanning && scannedMedicines.length === 0 && (
                  <div className="upload-container">
                    <label 
                      htmlFor="fileInput" 
                      className="upload-zone d-flex flex-column align-items-center justify-content-center" 
                      style={{ 
                        border: selectedFile ? "2px solid #6a11cb" : "2px dashed #cbd5e0", 
                        borderRadius: "15px", 
                        padding: "40px 20px", 
                        background: selectedFile ? "#f0ebff" : "#f8fafc", 
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {selectedFile ? (
                        <CheckCircle size={48} color="#6a11cb" style={{ marginBottom: "15px" }} />
                      ) : (
                        <Upload size={48} color="#4a5568" style={{ marginBottom: "15px" }} />
                      )}
                      <p style={{ fontWeight: "700", color: "#2d3748", margin: 0 }}>
                        {selectedFile ? selectedFile.name : "Click to select Prescription (PDF/DOC)"}
                      </p>
                      {selectedFile && <p className="text-muted small mt-1">Ready to scan this file</p>}
                      <input 
                        id="fileInput" 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={(e) => setSelectedFile(e.target.files[0])} 
                        style={{ display: "none" }} 
                      />
                    </label>
                    
                    <button 
                      className="btn mt-4 w-100" 
                      style={{ 
                        background: selectedFile ? "#6a11cb" : "#cbd5e0", 
                        color: "#fff", 
                        borderRadius: "12px", 
                        padding: "12px 25px",
                        fontWeight: "700",
                        boxShadow: selectedFile ? "0 4px 6px rgba(106, 17, 203, 0.2)" : "none"
                      }} 
                      onClick={handlePrescriptionUpload}
                      disabled={!selectedFile}
                    >
                      {selectedFile ? "Start Secure AI Scan" : "Please Select a File First"}
                    </button>
                  </div>
                )}

                {isScanning && (
                  <div className="scanning-container" style={{ padding: "20px" }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: "3.5rem", height: "3.5rem", borderWidth: "0.3em", color: "#6a11cb" }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4 className="mt-4" style={{ fontWeight: "700", color: "#2d3748" }}>AI Scanning in Progress...</h4>
                    <p className="text-primary fw-bold" style={{ fontSize: "1.1rem" }}>{scanStatus}</p>
                    <p className="text-muted small">We are analyzing your prescription using advanced OCR and medical knowledge bases.</p>
                    <div className="progress mt-4" style={{ height: "10px", borderRadius: "5px", background: "#edf2f7" }}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ 
                        width: scanStatus.includes("Initializing") ? "20%" : 
                               scanStatus.includes("Uploading") ? "40%" : 
                               scanStatus.includes("OCR") ? "70%" : "90%", 
                        background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)" 
                      }}></div>
                    </div>
                  </div>
                )}

                {scannedMedicines.length > 0 && (
                  <div className="results-container">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", color: "#2ecc71" }}>
                      <CheckCircle size={28} style={{ marginRight: "10px" }} />
                      <h4 style={{ margin: 0, fontWeight: "700" }}>Extraction Complete!</h4>
                    </div>
                    {!isPrescription && (
                      <div className="alert alert-warning mb-4" style={{ borderRadius: "12px" }}>
                        <AlertCircle size={20} className="me-2" />
                        This document does not look like a valid medical prescription.
                      </div>
                    )}
                    {extractedDiagnosis && isPrescription && (
                      <div className="mb-4 p-3" style={{ background: "#f0fdf4", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                        <h6 style={{ fontWeight: "700", color: "#166534", marginBottom: "5px" }}>Extracted Diagnosis</h6>
                        <p style={{ margin: 0, color: "#15803d", fontWeight: "600" }}>{extractedDiagnosis}</p>
                      </div>
                    )}
                    <div className="mb-4 text-center">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => {
                          if (selectedFile) {
                            const url = URL.createObjectURL(selectedFile);
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        <FileText size={16} className="me-2" /> View Uploaded File
                      </button>
                    </div>
                    <p className="text-muted mb-4">We found these medicines in your prescription:</p>
                    <div className="list-group" style={{ textAlign: "left" }}>
                      {scannedMedicines.map((med, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center" style={{ borderRadius: "12px", marginBottom: "10px", border: med.verified ? "1px solid #d1fae5" : "1px solid #fee2e2", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              {med.verified ? (
                                <CheckCircle size={20} color="#10b981" />
                              ) : (
                                <AlertCircle size={20} color="#ef4444" />
                              )}
                            </div>
                            <div>
                              <span style={{ fontWeight: "700", color: "#2d3748", display: "block" }}>{med.Name || med.name}</span>
                              <span className="text-muted small" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                ₹{med.Price || med.price} • {med.verified ? "Verified Prescription" : "Check Required"}
                                {extractedDosage[index] && ` • Dosage: ${extractedDosage[index]}`}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="btn btn-sm" 
                            style={{ 
                              background: med.verified ? "#2ecc71" : "#edf2f7", 
                              color: med.verified ? "#fff" : "#4a5568", 
                              borderRadius: "8px",
                              fontWeight: "600"
                            }} 
                            onClick={() => addScannedToCart(med)}
                          >
                            {cart.some(item => item.MedicineId === med.MedicineId) ? "In Cart" : "Add to Cart"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4" style={{ display: "flex", gap: "10px" }}>
                      <button className="btn w-100" style={{ background: "#cbd5e0", color: "#4a5568", borderRadius: "10px", fontWeight: "600" }} onClick={() => { setScannedMedicines([]); setSelectedFile(null); }}>
                        Scan Another
                      </button>
                      <button className="btn w-100" style={{ background: "#6a11cb", color: "#fff", borderRadius: "10px", fontWeight: "600" }} onClick={() => { setIsUploadModalOpen(false); setIsOrderPopupOpen(true); }}>
                        View Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      <ToastContainer />
    </div>
  );
};

export default Medicine;
