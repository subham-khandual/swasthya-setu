import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import userIcon from "../../../assets/user1.jpg"; // Assuming the same user icon is used
import {
  User as PersonIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  MapPin,
  Lock as LockIcon,
  Bell as NotificationIcon,
  ShieldCheck as PrivacyIcon,
  Globe as LanguageIcon,
  Calendar as CalendarIcon,
  FileText as MedicalRecordIcon,
  HeartPulse as HealthIcon,
  Pill,
  Droplet as BloodIcon,
  Ambulance as AmbulanceIcon,
  PhoneCall as EmergencyIcon,
  Clock as AppointmentIcon,
  Video as VideoIcon,
  Package as DeliveryIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Stethoscope, // Added Stethoscope icon
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();

  const handleEdit = (field) => {
    console.log(`Editing ${field}`);
    navigate(`/PatientsData`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Profile</h1>
        <div className={styles.avatar}>
          <img src={userIcon} alt="User Profile" loading="lazy" decoding="async" />
        </div>
      </div>

      <div className={styles.content}>
        {/* Personal Information */}
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.infoGrid}>
          <ProfileInfoCard
            icon={<PersonIcon />}
            title="Full Name"
            subtitle="gudud"
            onEdit={() => handleEdit("Name")}
          />
          <ProfileInfoCard
            icon={<CalendarIcon />}
            title="Date of Birth & Gender"
            subtitle="Nov 07, 2005 | Male"
            onEdit={() => handleEdit("DateOfBirthGender")}
          />
          <ProfileInfoCard
            icon={<BloodIcon />}
            title="Blood Group & Rh Factor"
            subtitle="O+"
            onEdit={() => handleEdit("BloodGroup")}
          />
          <ProfileInfoCard
            icon={<PhoneIcon />}
            title="Phone Number"
            subtitle="+1 123 456 7890"
            onEdit={() => handleEdit("Phone")}
          />
          <ProfileInfoCard
            icon={<EmailIcon />}
            title="Email"
            subtitle="gudu@example.com"
            onEdit={() => handleEdit("Email")}
          />
          <ProfileInfoCard
            icon={<MapPin />}
            title="Address"
            subtitle="123 Street, City, Country (Current & Permanent)"
            onEdit={() => handleEdit("Address")}
          />
        </div>

      </div>
      </div>
  );
};

const ProfileInfoCard = ({ icon, title, subtitle, onEdit }) => {
  return (
    <div className={styles.infoCard}>
      <div className={styles.iconContainer}>{icon}</div>
      <div className={styles.infoContent}>
        <h3 className={styles.infoTitle}>{title}</h3>
        <p className={styles.infoSubtitle}>{subtitle}</p>
      </div>
      <button className={styles.editButton} onClick={onEdit}>
        Edit
      </button>
    </div>
  );
};

const SettingsCard = ({ icon, iconColor, backgroundColor, title, onClick }) => {
  return (
    <div
      className={styles.settingsCard}
      style={{ backgroundColor }}
      onClick={onClick}
    >
      <div className={styles.settingsIconContainer}>
        <span className={styles.settingsIcon} style={{ color: iconColor }}>
          {icon}
        </span>
      </div>
      <h3 className={styles.settingsTitle}>{title}</h3>
    </div>
  );
};

export default Profile;
