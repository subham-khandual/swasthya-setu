import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Welcome.module.css";
import logo from "../assets/SwasthyaSetuLogo.png";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <img src={logo} alt="Logo" className={styles.logo} fetchpriority="high" decoding="async" />
    </div>
  );
};

export default Welcome;
