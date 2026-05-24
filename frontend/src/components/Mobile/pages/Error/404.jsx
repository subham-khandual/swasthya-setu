import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./404.module.css";
import fnf from '../../../assets/404.gif';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Animated Background Decor */}
      <div className={`${styles.backgroundCircle} ${styles.circle1}`}></div>
      <div className={`${styles.backgroundCircle} ${styles.circle2}`}></div>

      <div className={styles.glassCard}>
        <div className={styles.gifContainer}>
          <img src={fnf} alt="Not Found" className={styles.gif} loading="lazy" decoding="async" />
        </div>
        
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Oops! Even Suusri can't find this page.</h2>
        <p className={styles.description}>
          The link you followed might be broken, or the page may have been moved. 
          Don't worry, even the best health journeys have a few detours!
        </p>

        <div className={styles.actions}>
          <Link to="/home" className={styles.primaryButton}>
            Go To Home
          </Link>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.secondaryButton}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
