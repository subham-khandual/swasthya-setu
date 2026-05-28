import API_BASE_URL from '../../apiConfig';
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import usericon from "../assets/user1.jpg";
import {
  AlertTriangle as Alert,
  HeartPulse as MedicalServices,
  Star,
  ChevronRight,
  Droplet,
  TestTube,
  FileText,
  Apple,
  Clock,
  Ambulance,
  Building2,
  Syringe as Vial,
  Store,
  Utensils,
  MessageCircle as Bot,
} from "lucide-react";
import doctor1 from "../assets/demodoctor/doctor1.jpg";
import doctor2 from "../assets/demodoctor/doctor2.jpg";
import doctor3 from "../assets/demodoctor/doctor3.jpg";
import doctor4 from "../assets/demodoctor/doctor4.jpg";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();

  const doctors = [
    { img: doctor1, name: "Dr. A K Swain", specialization: "Cardiologist", rating: "4.3" },
    { img: doctor2, name: "Dr. P K Swain", specialization: "Dermatologist", rating: "4.5" },
    { img: doctor3, name: "Dr. K Ray", specialization: "Opthalmologist", rating: "4.9" },
    { img: doctor4, name: "Dr. R K Pani", specialization: "Medicine Specialist", rating: "4.8" },
  ];

  const navigateTo = (path) => navigate(path);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
          const userId = user.userId || user._id;
          if (!userId || userId === 'undefined') return;
          
          const response = await axios.get(`${API_BASE_URL}/api/notifications/${userId}`);
          const unread = response.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnreadCount();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      setUserName(user.userName || user.name || "User");
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Hello {userName}</h1>
        <div className={styles.headerActions}>
          <div 
            className={styles.notificationBell} 
            onClick={() => navigateTo("/notifications")}
            role="button"
            tabIndex={0}
            aria-label="Notifications"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/notifications"); }}
          >
            <Bell size={24} color="#2c3e50" aria-hidden="true" />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </div>
          <div 
            className={styles.avatar}
            onClick={() => navigateTo("/profile")}
            role="button"
            tabIndex={0}
            aria-label="User Profile"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/profile"); }}
          >
            <img 
                src={usericon} 
                alt="User Profile" 
                fetchpriority="high"
                decoding="async"
                width="80"
                height="80"
              />
          </div>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <div 
          className={`${styles.card} ${styles.purpleCard}`} 
          onClick={() => navigateTo("/blood-donate-receive")}
          role="button"
          tabIndex={0}
          aria-label="Blood Donate & Receive"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/blood-donate-receive"); }}
        >
          <div className={styles.iconContainer}>
            <Droplet className={styles.greenIcon} aria-hidden="true" />
          </div>
          <h3 className={styles.cardTitle}>Blood Donate & Receive</h3>
          <p className={styles.cardSubtitle}>Donate or Request Blood</p>
        </div>

        <div 
          className={`${styles.card} ${styles.greenCard}`} 
          onClick={() => navigateTo("/accident-alert")}
          role="button"
          tabIndex={0}
          aria-label="Accident Alert"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/accident-alert"); }}
        >
          <div className={styles.iconContainer}>
            <Alert className={styles.purpleIcon} aria-hidden="true" />
          </div>
          <h3 className={styles.cardTitle}>Accident Alert</h3>
          <p className={styles.cardSubtitle}>Emergency Response</p>
        </div>

        <div 
          className={`${styles.card} ${styles.greenCard}`} 
          onClick={() => navigateTo("/blood-test")}
          role="button"
          tabIndex={0}
          aria-label="Blood Test"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/blood-test"); }}
        >
          <div className={styles.iconContainer}>
            <TestTube className={styles.purpleIcon} aria-hidden="true" />
          </div>
          <h3 className={styles.cardTitle}>Blood Test</h3>
          <p className={styles.cardSubtitle}>Book an Appointment</p>
        </div>

        <div 
          className={`${styles.card} ${styles.purpleCard}`} 
          onClick={() => navigateTo("/medicine")}
          role="button"
          tabIndex={0}
          aria-label="Medicine"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo("/medicine"); }}
        >
          <div className={styles.iconContainer}>
            <MedicalServices className={styles.greenIcon} aria-hidden="true" />
          </div>
          <h3 className={styles.cardTitle}>Medicine</h3>
          <p className={styles.cardSubtitle}>Order Online Medicine</p>
        </div>
      </div>

      <div className={styles.doctorsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Popular Doctors</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigateTo("/doctors")}>
            See more <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.doctorsGrid}>
          {doctors.map((doctor, index) => (
            <div key={index} className={styles.doctorCard}>
              <div className={styles.doctorAvatar}>
                <img src={doctor.img} alt={`Doctor ${doctor.name}`} loading="lazy" decoding="async" width="60" height="60" />
              </div>
              <h3 className={styles.doctorName}>{doctor.name}</h3>
              <p className={styles.doctorSpecialty}>{doctor.specialization}</p>
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} aria-hidden="true" />
                <span className={styles.rating} aria-label={`Rating ${doctor.rating}`}>{doctor.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reordered SectionCard components as per the provided order */}

      <SectionCard
        icon={<Bot />}
        iconColor="#4A90E2"
        backgroundColor="#5DADE2"
        title="AI Chat Bot SUUSRI"
        subtitle="Get instant health assistance"
        onClick={() => navigateTo("/suusri")}
      />

      <SectionCard
        icon={<Clock />}
        iconColor="#8E44AD"
        backgroundColor="#9B59B6"
        title="Medicine Time Table"
        subtitle="Smart schedule & reminders"
        onClick={() => navigateTo("/medicine-timetable")}
      />

      <SectionCard
        icon={<FileText />}
        iconColor="#27AE60"
        backgroundColor="#2ECC71"
        title="Previous Reports & Prescriptions"
        subtitle="Access your medical history"
        onClick={() => navigateTo("/medicine")}
      />

      <SectionCard
        icon={<Apple />}
        iconColor="#F39C12"
        backgroundColor="#F1C40F"
        title="Nutrition Diet Chart"
        subtitle="Personalized meal plans"
        onClick={() => navigateTo("/nutrition")}
      />

      <SectionCard
        icon={<Ambulance />}
        iconColor="#D35400"
        backgroundColor="#E67E22"
        title="Ambulance"
        subtitle="Emergency medical transport"
        onClick={() => navigateTo("/ambulance")}
      />

      <SectionCard
        icon={<Building2 />}
        iconColor="#2980B9"
        backgroundColor="#3498DB"
        title="Hospitals"
        subtitle="Find nearby hospitals"
        onClick={() => navigateTo("/hospitals")}
      />

      <SectionCard
        icon={<Vial />}
        iconColor="#16A085"
        backgroundColor="#1ABC9C"
        title="Blood Test Agency"
        subtitle="Book blood tests"
        onClick={() => navigateTo("/blood-test")}
      />

      <SectionCard
        icon={<Store />}
        iconColor="#7F8C8D"
        backgroundColor="#95A5A6"
        title="Medicine Store"
        subtitle="Find nearby pharmacies"
        onClick={() => navigateTo("/medicine-stores")}
      />

      <SectionCard
        icon={<Utensils />}
        iconColor="#D35400"
        backgroundColor="#E67E22"
        title="Nutritionist"
        subtitle="Consult with diet experts"
        onClick={() => navigateTo("/nutritionists")}
      />
    </div>
  );
};

const SectionCard = ({ icon, iconColor, backgroundColor, title, subtitle, onClick }) => {
  return (
    <div 
      className={styles.sectionCard} 
      style={{ backgroundColor }} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <div className={styles.sectionIconContainer}>
        <div className={styles.sectionIcon} style={{ color: iconColor }} aria-hidden="true">
          {icon}
        </div>
      </div>
      <div className={styles.sectionContent}>
        <h3 className={styles.sectionCardTitle}>{title}</h3>
        <p className={styles.sectionCardSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
};

export default Home;
