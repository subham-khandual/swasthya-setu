import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  AlertTriangle,
  Stethoscope,
  TestTube,
  Pill,
  Heart,
  Ambulance,
  Hospital,
  Apple,
  FileText,
  User,
  Smile
} from 'lucide-react';

// Assets from components/assets
import img1 from "../assets/1.png"; // Blood Donation
import img2 from "../assets/2.png"; // Accident Alert
import nutriImg from "../assets/Swasthyasetu/nutrition.jpg";
import hospImg from "../assets/Swasthyasetu/emergency.jpg";
import recordImg from "../assets/interactional-dialogue.png";
import profileImg from "../assets/user1.jpg";
import logoImg from "../assets/SwasthyaSetuLogo.png";

// Assets from src/assets (Generated)
import docsImg from "../../assets/doctors_banner.png";
import bloodTestImg from "../../assets/blood_test_banner.png";
import medicineStoreImg from "../../assets/medicine_store_banner.png";
import ehrImg from "../../assets/ehr_health_data_banner.png";
import ambImg from "../../assets/ambulance_banner.png";

import styles from './Dashboard.module.css';
import ChatBot from '../Chat/Chatbot';

function Dashboard() {
  const dashboardItems = [
    { 
      title: "Blood Donation", 
      path: "/blood-donate-receive", 
      icon: <Droplet />, 
      desc: "Manage blood donation and receiving", 
      img: img1 
    },
    { 
      title: "Accident Alert", 
      path: "/accident-alert", 
      icon: <AlertTriangle />, 
      desc: "Monitor emergency accident alerts", 
      img: img2 
    },
    { 
      title: "Doctors", 
      path: "/doctors", 
      icon: <Stethoscope />, 
      desc: "Find and consult with doctors", 
      img: docsImg 
    },
    { 
      title: "Blood Test", 
      path: "/blood-test", 
      icon: <TestTube />, 
      desc: "Schedule and track blood tests", 
      img: bloodTestImg 
    },
    { 
      title: "Medicine Store", 
      path: "/medicine-stores", 
      icon: <Pill />, 
      desc: "Browse medicine stores", 
      img: medicineStoreImg 
    },
    { 
      title: "EHR Health Data", 
      path: "/EHRHealthData", 
      icon: <Heart />, 
      desc: "View health records", 
      img: ehrImg 
    },
    { 
      title: "Ambulance", 
      path: "/ambulance", 
      icon: <Ambulance />, 
      desc: "Request emergency services",
      img: ambImg
    },
    { 
      title: "Hospitals", 
      path: "/hospitals", 
      icon: <Hospital />, 
      desc: "Explore hospital services",
      img: hospImg
    },
    { 
      title: "Nutrition", 
      path: "/nutrition", 
      icon: <Apple />, 
      desc: "Access diet plans",
      img: nutriImg
    },
    { 
      title: "Medical History", 
      path: "/medicine", 
      icon: <FileText />, 
      desc: "Review your medical records",
      img: recordImg
    },
    { 
      title: "Profile", 
      path: "/profile", 
      icon: <User />, 
      desc: "Manage your account",
      img: profileImg
    },
    { 
      title: "Welcome", 
      path: "/welcome", 
      icon: <Smile />, 
      desc: "Start your journey with us",
      img: logoImg
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.mainContent}>
        <h1 className={styles.dashboardHeader}>Dashboard</h1>
        
        <div className={styles.featureGrid}>
          {dashboardItems.map((item, index) => (
            <Link to={item.path} key={index} className={styles.featureCard}>
              <div className={styles.cardHeader}>
                <div className={styles.featureIcon}>
                  {React.cloneElement(item.icon, { size: 24 })}
                </div>
                <h3 className={styles.featureTitle}>{item.title}</h3>
              </div>
              <p className={styles.featureDesc}>{item.desc}</p>
              
              <div className={styles.imageWrapper}>
                {item.img ? (
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="225"
                    className={styles.cardImage} 
                    style={{
                      ...(item.title === 'Profile' ? { objectPosition: 'top' } : {}),
                      ...(item.title === 'Welcome' ? { objectFit: 'contain' } : {})
                    }}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    {React.cloneElement(item.icon, { size: 64, className: styles.placeholderIcon, color: '#94a3b8' })}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px', opacity: 0.5, color: '#1b558b' }}>{item.title.toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className={styles.goBtn}>
                Go to {item.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <ChatBot />
    </div>
  );
}

export default Dashboard;
