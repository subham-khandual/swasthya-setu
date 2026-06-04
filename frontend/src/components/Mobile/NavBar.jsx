"use client";

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import {
  Droplet,
  TestTube,
  Bot,
  Home as HomeIcon,
  HeartPulse as MedicalServices,
} from "lucide-react";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const screens = [
    "/dashboard",            // Home/Dashboard screen
    "/blood-donate-receive", // Donate screen
    "/sayraa",               // Sayraa (AI Chat Bot) screen
    "/blood-test",           // Test screen
    "/medicine",             // Medicine screen
  ];

  // Derive which tab is active directly from the current path
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/Landingpage") return 0; // Home
    if (path.includes("/blood-donate-receive")) return 1; // Donate
    if (path.includes("/sayraa")) return 2; // Sayraa (Center button)
    if (path.includes("/blood-test")) return 3; // Test
    if (path.includes("/medicine")) return 4; // Medicine
    return -1; // No tab selected
  };

  const activeIndex = getActiveIndex();

  const handleNavigation = (index) => {
    navigate(screens[index]);
    window.scrollTo(0, 0); // Ensure user is at the top of the new page
  };

  return (
    <div className={styles.navBarContainer}>
      <div className={styles.navBar}>
        <div
          className={`${styles.navItem} ${activeIndex === 0 ? styles.selected : ""}`}
          onClick={() => handleNavigation(0)}
          role="button"
          tabIndex={0}
          aria-label="Home"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigation(0); }}
        >
          <HomeIcon className={styles.navIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Home</span>
        </div>

        <div
          className={`${styles.navItem} ${activeIndex === 1 ? styles.selected : ""}`}
          onClick={() => handleNavigation(1)}
          role="button"
          tabIndex={0}
          aria-label="Donate Blood"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigation(1); }}
        >
          <Droplet className={styles.navIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Donate</span>
        </div>

        <div
          className={`${styles.navItem} ${activeIndex === 2 ? styles.selected : ""}`}
          onClick={() => handleNavigation(2)}
          role="button"
          tabIndex={0}
          aria-label="Sayraa Chat Bot"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigation(2); }}
        >
          <Bot className={styles.navIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Sayraa</span>
        </div>

        <div
          className={`${styles.navItem} ${activeIndex === 3 ? styles.selected : ""}`}
          onClick={() => handleNavigation(3)}
          role="button"
          tabIndex={0}
          aria-label="Blood Test"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigation(3); }}
        >
          <TestTube className={styles.navIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Test</span>
        </div>

        <div
          className={`${styles.navItem} ${activeIndex === 4 ? styles.selected : ""}`}
          onClick={() => handleNavigation(4)}
          role="button"
          tabIndex={0}
          aria-label="Medicine"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigation(4); }}
        >
          <MedicalServices className={styles.navIcon} aria-hidden="true" />
          <span className={styles.navLabel}>Medicine</span>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
