import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './DoctorsData.module.css';
import { FaTrash } from 'react-icons/fa';

const DoctorsData = () => {
  const initialFormData = {
    firstName: '',
    lastName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    dob: '',
    gender: '',
    profilePhoto: null,
    profilePhotoConfirmed: false,
    profilePhotoPreview: null,
    medicalRegNumber: '',
    degrees: [{ degree: '', otherDegree: '' }],
    yearsOfExperience: '',
    specialization: '',
    subSpecialization: '',
    additionalCertifications: [],
    medCouncilCert: null,
    medCouncilCertConfirmed: false,
    currentWorkplaces: [],
    clinicDetails: [{ name: '', address: '', yearsOfStay: '' }],
    workSchedule: [{ day: '', timeSlots: [] }],
    consultationModes: [],
    languagesSpoken: [],
    otherLanguages: '',
    consultationFeeOnline: '',
    consultationFeeOffline: '',
    feeVariesByComplexity: false,
    feeVariationDetails: '',
    emergencyAvailability: false,
    availability24_7: false,
    onCallConsultation: false,
    onCallHours: '',
    maxPatientsPerDay: '',
    followUpDiscount: false,
    followUpDiscountPercentage: '',
    referralProgram: false,
    referralCode: '',
    connectedHospitalDatabase: false,
    hospitalDatabaseDetails: '',
    medicalRecordAccess: false,
    medicalRecordAccessDetails: '',
    allowPatientReviews: false,
    publicProfileVisibility: false,
    medicalLicense: null,
    medicalLicenseConfirmed: false,
    digitalSignature: null,
    digitalSignatureConfirmed: false,
    digitalSignaturePreview: null,
    idProof: null,
    idProofConfirmed: false,
    agreementConsent: false,
    bankDetails: { name: '', accountNo: '', ifscCode: '' },
    upiId: '',
    paymentModesAccepted: [],
    preferredCommunication: '',
    remarksForAdmin: '',
  };

  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.userType === 'admin') {
      setIsAdmin(true);
    } else {
      alert("Access Denied: Only admins can access this page.");
      navigate('/');
    }
  }, [navigate]);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      if (['agreementConsent', 'feeVariesByComplexity', 'availability24_7', 'onCallConsultation',
        'followUpDiscount', 'referralProgram', 'connectedHospitalDatabase', 'medicalRecordAccess',
        'allowPatientReviews', 'publicProfileVisibility'].includes(name)) {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        const updatedValues = formData[name].includes(value)
          ? formData[name].filter(item => item !== value)
          : [...formData[name], value];
        setFormData(prev => ({ ...prev, [name]: updatedValues }));
      }
    } else if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file,
        [`${name}Preview`]: file ? URL.createObjectURL(file) : null,
        [`${name}Confirmed`]: false,
      }));
    } else if (type === 'radio' && (value === 'true' || value === 'false')) {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First Name is required';
    if (!formData.lastName) newErrors.lastName = 'Last Name is required';
    if (!formData.phone || !/^\+91\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone Number must be in +91 XXXXXXXXXX format';
    if (formData.whatsappNumber && !/^\+91\d{10}$/.test(formData.whatsappNumber)) newErrors.whatsappNumber = 'WhatsApp Number must be in +91 XXXXXXXXXX format';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid Email Address is required';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.medicalRegNumber) newErrors.medicalRegNumber = 'Medical Registration Number is required';
    if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = 'Years of Experience cannot be negative';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.agreementConsent) newErrors.agreementConsent = 'You must agree to the Terms of Service and Privacy Policy';
    return newErrors;
  };

  const addDegree = () => setFormData(prev => ({ ...prev, degrees: [...prev.degrees, { degree: '', otherDegree: '' }] }));
  const updateDegree = (index, field, value) => {
    const updatedDegrees = formData.degrees.map((deg, i) => i === index ? { ...deg, [field]: value } : deg);
    setFormData(prev => ({ ...prev, degrees: updatedDegrees }));
  };
  const removeDegree = (index) => setFormData(prev => ({ ...prev, degrees: prev.degrees.filter((_, i) => i !== index) }));

  const addCertification = () => setFormData(prev => ({ ...prev, additionalCertifications: [...prev.additionalCertifications, ''] }));
  const updateCertification = (index, value) => {
    const updatedCertifications = formData.additionalCertifications.map((cert, i) => i === index ? value : cert);
    setFormData(prev => ({ ...prev, additionalCertifications: updatedCertifications }));
  };
  const removeCertification = (index) => setFormData(prev => ({ ...prev, additionalCertifications: prev.additionalCertifications.filter((_, i) => i !== index) }));

  const addClinicDetail = () => setFormData(prev => ({ ...prev, clinicDetails: [...prev.clinicDetails, { name: '', address: '', yearsOfStay: '' }] }));
  const updateClinicDetail = (index, field, value) => {
    const updatedDetails = formData.clinicDetails.map((detail, i) => i === index ? { ...detail, [field]: value } : detail);
    setFormData(prev => ({ ...prev, clinicDetails: updatedDetails }));
  };
  const removeClinicDetail = (index) => setFormData(prev => ({ ...prev, clinicDetails: prev.clinicDetails.filter((_, i) => i !== index) }));

  const addWorkSchedule = () => setFormData(prev => ({ ...prev, workSchedule: [...prev.workSchedule, { day: '', timeSlots: [] }] }));
  const updateWorkSchedule = (index, field, value) => {
    const updatedSchedule = formData.workSchedule.map((schedule, i) => i === index ? { ...schedule, [field]: value } : schedule);
    setFormData(prev => ({ ...prev, workSchedule: updatedSchedule }));
  };
  const removeWorkSchedule = (index) => setFormData(prev => ({ ...prev, workSchedule: prev.workSchedule.filter((_, i) => i !== index) }));

  const toggleTimeSlot = (index, slot) => {
    const updatedSchedule = [...formData.workSchedule];
    const timeSlots = updatedSchedule[index].timeSlots;
    updatedSchedule[index].timeSlots = timeSlots.includes(slot) ? timeSlots.filter(s => s !== slot) : [...timeSlots, slot];
    setFormData(prev => ({ ...prev, workSchedule: updatedSchedule }));
  };

  const confirmUpload = (field) => setFormData(prev => ({ ...prev, [`${field}Confirmed`]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        formDataToSend.append(key, value);
      } else if (Array.isArray(value) || typeof value === 'object') {
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        formDataToSend.append(key, value || '');
      }
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/doctor/doctor-registration`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      console.log('Form Data Submitted:', response.data);
      alert('Doctor Registration Saved Successfully');
      setFormData(initialFormData); // Reset form after success
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.status === 404
        ? 'Server endpoint not found. Ensure the server is running on port 2000.'
        : err.response?.data?.error || err.message;
      setErrors({ submit: `Error submitting form: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      {/* 1. Personal & Contact Details */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Personal & Contact Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              First Name <span>*</span>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`${styles.textInput} ${errors.firstName ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Last Name <span>*</span>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`${styles.textInput} ${errors.lastName ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Phone Number <span>*</span>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\+91\d{0,10}$/.test(value) || value === '') handleChange(e);
                }}
                placeholder="+91 XXXXXXXXXX"
                className={`${styles.textInput} ${errors.phone ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              WhatsApp Number
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\+91\d{0,10}$/.test(value) || value === '') handleChange(e);
                }}
                placeholder="+91 XXXXXXXXXX"
                className={`${styles.textInput} ${errors.whatsappNumber ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.whatsappNumber && <span className={styles.error}>{errors.whatsappNumber}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Email Address <span>*</span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`${styles.textInput} ${errors.email ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Date of Birth <span>*</span>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                className={`${styles.textInput} ${errors.dob ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.dob && <span className={styles.error}>{errors.dob}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Gender <span>*</span>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className={`${styles.selectInput} ${errors.gender ? styles.errorInput : ''}`}
                disabled={loading}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className={styles.error}>{errors.gender}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Profile Photo Upload
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData(prev => ({
                        ...prev,
                        profilePhoto: file,
                        profilePhotoPreview: URL.createObjectURL(file),
                        profilePhotoConfirmed: false,
                      }));
                    }
                  }}
                  accept=".jpg,.png"
                  className={styles.fileInput}
                  disabled={loading}
                />
                <span className={styles.fileInputLabel}>
                  {formData.profilePhoto ? 'Replace Photo' : 'Upload Profile Photo (JPG/PNG)'}
                </span>
              </div>
              {formData.profilePhotoPreview && (
                <div className={styles.profilePhotoPreview}>
                  <img src={formData.profilePhotoPreview} alt="Profile Preview" loading="lazy" decoding="async" />
                  {!formData.profilePhotoConfirmed ? (
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => confirmUpload('profilePhoto')}
                      disabled={loading}
                    >
                      ✅ Confirm
                    </button>
                  ) : (
                    <span className={styles.confirmedText}>✅ Confirmed</span>
                  )}
                </div>
              )}
              <small className={styles.note}>Note: Photo will be cropped/resized to 150x150px</small>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Medical Credentials & Specialization */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Medical Credentials & Specialization</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Medical Registration Number <span>*</span>
              <input
                type="text"
                name="medicalRegNumber"
                required
                value={formData.medicalRegNumber}
                onChange={handleChange}
                className={`${styles.textInput} ${errors.medicalRegNumber ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.medicalRegNumber && <span className={styles.error}>{errors.medicalRegNumber}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Degree & Qualification
              {formData.degrees.map((deg, index) => (
                <div key={index} className={styles.dynamicEntry}>
                  <select
                    value={deg.degree}
                    onChange={(e) => updateDegree(index, 'degree', e.target.value)}
                    className={styles.selectInput}
                    disabled={loading}
                  >
                    <option value="">Select Degree</option>
                    <option value="MBBS">MBBS</option>
                    <option value="MD">MD</option>
                    <option value="MS">MS</option>
                    <option value="DM">DM</option>
                    <option value="MCh">MCh</option>
                    <option value="DNB">DNB</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                  {deg.degree === 'Other' && (
                    <input
                      type="text"
                      value={deg.otherDegree}
                      onChange={(e) => updateDegree(index, 'otherDegree', e.target.value)}
                      className={styles.textInput}
                      placeholder="Specify Other Degree"
                      disabled={loading}
                    />
                  )}
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeDegree(index)}
                    disabled={formData.degrees.length === 1 || loading}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addDegree} className={styles.addButton} disabled={loading}>
                Add Another Degree
              </button>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Years of Experience
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value >= 0 || value === '') handleChange(e);
                }}
                className={`${styles.textInput} ${errors.yearsOfExperience ? styles.errorInput : ''}`}
                disabled={loading}
              />
              {errors.yearsOfExperience && <span className={styles.error}>{errors.yearsOfExperience}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Specialization <span>*</span>
              <select
                name="specialization"
                required
                value={formData.specialization}
                onChange={handleChange}
                className={`${styles.selectInput} ${errors.specialization ? styles.errorInput : ''}`}
                disabled={loading}
              >
                <option value="">Select</option>
                <option value="Ayurveda">Ayurveda</option>
                <option value="Breast Cancer Clinic">Breast Cancer Clinic</option>
                <option value="Burns n Plastic Surgery">Burns n Plastic Surgery</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Cardiothoracic and Vascular Surgery">Cardiothoracic and Vascular Surgery</option>
                <option value="CFM Immunization (Tikakaran)">CFM Immunization (Tikakaran)</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="ENT">ENT</option>
                <option value="Gastroenterology and Human Nutrition">Gastroenterology and Human Nutrition</option>
                <option value="Gastrointestinal Surgery">Gastrointestinal Surgery</option>
                <option value="Hematology">Hematology</option>
                <option value="Homeopathy">Homeopathy</option>
                <option value="Medical Oncology">Medical Oncology</option>
                <option value="Medicine">Medicine</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Neurology">Neurology</option>
                <option value="Neuro Surgery">Neuro Surgery</option>
                <option value="Nuclear Medicine Therapy Clinic">Nuclear Medicine Therapy Clinic</option>
                <option value="Obstetrics and Gynaecology">Obstetrics and Gynaecology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="PAC and Pain Clinic">PAC and Pain Clinic</option>
                <option value="Paediatrics">Paediatrics</option>
                <option value="Paediatric Surgery">Paediatric Surgery</option>
                <option value="Plastic Surgery">Plastic Surgery</option>
                <option value="PMR">PMR</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Pulmonary Medicine">Pulmonary Medicine</option>
                <option value="Radiotherapy">Radiotherapy</option>
                <option value="Siddha">Siddha</option>
                <option value="Surgery">Surgery</option>
                <option value="Unani">Unani</option>
                <option value="Urology">Urology</option>
                <option value="Yoga">Yoga</option>
                <option value="Other">Other</option>
              </select>
              {errors.specialization && <span className={styles.error}>{errors.specialization}</span>}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Sub-Specialization (if applicable)
              <select
                name="subSpecialization"
                value={formData.subSpecialization}
                onChange={handleChange}
                className={styles.selectInput}
                disabled={loading}
              >
                <option value="">Select</option>
                {formData.specialization === 'Cardiology' && (
                  <>
                    <option value="Interventional Cardiology">Interventional Cardiology</option>
                    <option value="Electrophysiology">Electrophysiology</option>
                    <option value="Heart Failure">Heart Failure</option>
                  </>
                )}
                {formData.specialization === 'Neurology' && (
                  <>
                    <option value="Pediatric Neurology">Pediatric Neurology</option>
                    <option value="Neurophysiology">Neurophysiology</option>
                    <option value="Stroke Specialist">Stroke Specialist</option>
                  </>
                )}
                {formData.specialization === 'Paediatrics' && (
                  <>
                    <option value="Neonatology">Neonatology</option>
                    <option value="Pediatric Cardiology">Pediatric Cardiology</option>
                    <option value="Pediatric Oncology">Pediatric Oncology</option>
                  </>
                )}
                {formData.specialization === 'Orthopaedics' && (
                  <>
                    <option value="Spine Surgery">Spine Surgery</option>
                    <option value="Joint Replacement">Joint Replacement</option>
                    <option value="Sports Medicine">Sports Medicine</option>
                  </>
                )}
                {!['Cardiology', 'Neurology', 'Paediatrics', 'Orthopaedics'].includes(formData.specialization) && (
                  <option value="General">General</option>
                )}
              </select>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Additional Certifications
              {formData.additionalCertifications.map((cert, index) => (
                <div key={index} className={styles.dynamicEntry}>
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => updateCertification(index, e.target.value)}
                    className={styles.textInput}
                    placeholder="e.g., ACLS, BLS"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeCertification(index)}
                    disabled={formData.additionalCertifications.length === 1 || loading}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addCertification} className={styles.addButton} disabled={loading}>
                Add Another Certification
              </button>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Medical Council Registration Certificate
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="medCouncilCert"
                  onChange={(e) => handleChange({ target: { name: 'medCouncilCert', files: e.target.files } })}
                  accept=".pdf,.jpg"
                  className={styles.fileInput}
                  disabled={loading}
                />
                <span className={styles.fileInputLabel}>
                  {formData.medCouncilCert ? 'Replace File' : 'Upload Certificate (PDF/JPG)'}
                </span>
              </div>
              {formData.medCouncilCert && (
                <div>
                  <span className={styles.fileName}>{formData.medCouncilCert.name}</span>
                  {!formData.medCouncilCertConfirmed ? (
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => confirmUpload('medCouncilCert')}
                      disabled={loading}
                    >
                      ✅ Confirm
                    </button>
                  ) : (
                    <span className={styles.confirmedText}>✅ Confirmed</span>
                  )}
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* 3. Practice & Work Details */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Practice & Work Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Current Workplace</p>
            <div className={styles.checkboxGroup}>
              {['Hospital', 'Clinic', 'Online Only'].map(workplace => (
                <label key={workplace} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="currentWorkplaces"
                    value={workplace}
                    checked={formData.currentWorkplaces.includes(workplace)}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {workplace}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Clinic/Hospital Name & Address
              {formData.clinicDetails.map((detail, index) => (
                <div key={index} className={styles.dynamicEntry}>
                  <input
                    type="text"
                    value={detail.name}
                    onChange={(e) => updateClinicDetail(index, 'name', e.target.value)}
                    className={`${styles.textInput} ${styles.clinicInput}`}
                    placeholder="Clinic/Hospital Name"
                    disabled={loading}
                  />
                  <textarea
                    value={detail.address}
                    onChange={(e) => updateClinicDetail(index, 'address', e.target.value)}
                    className={`${styles.textInput} ${styles.clinicTextarea}`}
                    placeholder="Address"
                    rows="4"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    value={detail.yearsOfStay}
                    onChange={(e) => updateClinicDetail(index, 'yearsOfStay', e.target.value)}
                    className={styles.textInput}
                    placeholder="Years of Stay"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeClinicDetail(index)}
                    disabled={formData.clinicDetails.length === 1 || loading}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addClinicDetail} className={styles.addButton} disabled={loading}>
                Add Another Clinic/Hospital
              </button>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Work Schedule</p>
            {formData.workSchedule.map((schedule, index) => (
              <div key={index} className={styles.scheduleEntry}>
                <select
                  value={schedule.day}
                  onChange={(e) => updateWorkSchedule(index, 'day', e.target.value)}
                  className={styles.selectInput}
                  disabled={loading}
                >
                  <option value="">Select Day</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <div className={styles.checkboxGroup}>
                  {['Morning', 'Afternoon', 'Evening'].map(slot => (
                    <label key={slot} className={styles.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={schedule.timeSlots.includes(slot)}
                        onChange={() => toggleTimeSlot(index, slot)}
                        disabled={loading}
                      />
                      {slot}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeWorkSchedule(index)}
                  disabled={formData.workSchedule.length === 1 || loading}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button type="button" onClick={addWorkSchedule} className={styles.addButton} disabled={loading}>
              Add Another Schedule Entry
            </button>
          </div>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Consultation Mode</p>
            <div className={styles.checkboxGroup}>
              {['In-Clinic', 'Video Consultation', 'Home Visit'].map(mode => (
                <label key={mode} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="consultationModes"
                    value={mode}
                    checked={formData.consultationModes.includes(mode)}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {mode}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Languages Spoken</p>
            <div className={styles.checkboxGroup}>
              {['Odia', 'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali'].map(lang => (
                <label key={lang} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="languagesSpoken"
                    value={lang}
                    checked={formData.languagesSpoken.includes(lang)}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {lang}
                </label>
              ))}
              <label className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  name="languagesSpoken"
                  value="Other"
                  checked={formData.languagesSpoken.includes('Other')}
                  onChange={handleChange}
                  disabled={loading}
                />
                Other
              </label>
            </div>
            {formData.languagesSpoken.includes('Other') && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Specify Other Languages
                  <input
                    type="text"
                    name="otherLanguages"
                    value={formData.otherLanguages}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., Kannada, Marathi"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Consultation & Service Details */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Consultation & Service Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Consultation Fee - Online (₹)
              <input
                type="number"
                name="consultationFeeOnline"
                value={formData.consultationFeeOnline}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Consultation Fee - Offline (₹)
              <input
                type="number"
                name="consultationFeeOffline"
                value={formData.consultationFeeOffline}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Does Fee Vary by Complexity/Duration?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="feeVariesByComplexity"
                    checked={formData.feeVariesByComplexity}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.feeVariesByComplexity && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Fee Variation Details
                  <textarea
                    name="feeVariationDetails"
                    value={formData.feeVariationDetails}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., Higher fees for complex cases or extended sessions"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Emergency Availability?</p>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="emergencyAvailability"
                  value="true"
                  checked={formData.emergencyAvailability}
                  onChange={handleChange}
                  disabled={loading}
                />
                Yes
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="emergencyAvailability"
                  value="false"
                  checked={!formData.emergencyAvailability}
                  onChange={handleChange}
                  disabled={loading}
                />
                No
              </label>
            </div>
          </div>
          {formData.consultationModes.includes('Home Visit') && (
            <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
              <label className={styles.inputLabel}>
                Home Visit Charges (₹)
                <input
                  type="number"
                  name="homeVisitCharges"
                  value={formData.homeVisitCharges || ''}
                  onChange={handleChange}
                  className={styles.textInput}
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 5. Emergency & On-Call Availability */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Emergency & On-Call Availability</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              24/7 Availability?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="availability24_7"
                    checked={formData.availability24_7}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              On-Call Consultation?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="onCallConsultation"
                    checked={formData.onCallConsultation}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.onCallConsultation && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  On-Call Availability Hours
                  <input
                    type="text"
                    name="onCallHours"
                    value={formData.onCallHours}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., Mon-Fri: 8 PM - 11 PM"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Patient Handling & Care */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Patient Handling & Care</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Maximum Patients Per Day
              <input
                type="number"
                name="maxPatientsPerDay"
                value={formData.maxPatientsPerDay}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value >= 0 || value === '') handleChange(e);
                }}
                className={styles.textInput}
                placeholder="e.g., 20"
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Follow-Up Consultation Discount?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="followUpDiscount"
                    checked={formData.followUpDiscount}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.followUpDiscount && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Discount Percentage (%)
                  <input
                    type="number"
                    name="followUpDiscountPercentage"
                    value={formData.followUpDiscountPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value >= 0 && value <= 100 || value === '') handleChange(e);
                    }}
                    className={styles.textInput}
                    placeholder="e.g., 10"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Referral Program?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="referralProgram"
                    checked={formData.referralProgram}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.referralProgram && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Referral Code
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., DOC123"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Integration with Hospital Management Systems */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Integration with Hospital Management Systems</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Connected Hospital Database?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="connectedHospitalDatabase"
                    checked={formData.connectedHospitalDatabase}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.connectedHospitalDatabase && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Hospital Database Details
                  <textarea
                    name="hospitalDatabaseDetails"
                    value={formData.hospitalDatabaseDetails}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., Apollo Hospital EMR System"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Medical Record Access?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="medicalRecordAccess"
                    checked={formData.medicalRecordAccess}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
            {formData.medicalRecordAccess && (
              <div className={styles.conditionalSection}>
                <label className={styles.inputLabel}>
                  Access Details
                  <textarea
                    name="medicalRecordAccessDetails"
                    value={formData.medicalRecordAccessDetails}
                    onChange={handleChange}
                    className={styles.textInput}
                    placeholder="e.g., Access to past patient history with consent"
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. Ratings & Reviews */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Ratings & Reviews</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Allow Patient Reviews?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="allowPatientReviews"
                    checked={formData.allowPatientReviews}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Public Profile Visibility?
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="publicProfileVisibility"
                    checked={formData.publicProfileVisibility}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Yes
                </label>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 9. Medical & Legal Compliance */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Medical & Legal Compliance</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Medical License Upload
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="medicalLicense"
                  onChange={(e) => handleChange({ target: { name: 'medicalLicense', files: e.target.files } })}
                  accept=".pdf,.jpg"
                  className={styles.fileInput}
                  disabled={loading}
                />
                <span className={styles.fileInputLabel}>
                  {formData.medicalLicense ? 'Replace File' : 'Upload License (PDF/JPG)'}
                </span>
              </div>
              {formData.medicalLicense && (
                <div>
                  <span className={styles.fileName}>{formData.medicalLicense.name}</span>
                  {!formData.medicalLicenseConfirmed ? (
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => confirmUpload('medicalLicense')}
                      disabled={loading}
                    >
                      ✅ Confirm
                    </button>
                  ) : (
                    <span className={styles.confirmedText}>✅ Confirmed</span>
                  )}
                </div>
              )}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Digital Signature Upload
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="digitalSignature"
                  onChange={(e) => handleChange({ target: { name: 'digitalSignature', files: e.target.files } })}
                  accept=".png,.jpg"
                  className={styles.fileInput}
                  disabled={loading}
                />
                <span className={styles.fileInputLabel}>
                  {formData.digitalSignature ? 'Replace Signature' : 'Upload Digital Signature (PNG/JPG)'}
                </span>
              </div>
              {formData.digitalSignaturePreview && (
                <div className={styles.signaturePreview}>
                  <img src={formData.digitalSignaturePreview} alt="Signature Preview" loading="lazy" decoding="async" />
                  {!formData.digitalSignatureConfirmed ? (
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => confirmUpload('digitalSignature')}
                      disabled={loading}
                    >
                      ✅ Confirm
                    </button>
                  ) : (
                    <span className={styles.confirmedText}>✅ Confirmed</span>
                  )}
                </div>
              )}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              ID Proof (Aadhaar/PAN/Passport)
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="idProof"
                  onChange={(e) => handleChange({ target: { name: 'idProof', files: e.target.files } })}
                  accept=".pdf,.jpg"
                  className={styles.fileInput}
                  disabled={loading}
                />
                <span className={styles.fileInputLabel}>
                  {formData.idProof ? 'Replace File' : 'Upload ID Proof (PDF/JPG)'}
                </span>
              </div>
              {formData.idProof && (
                <div>
                  <span className={styles.fileName}>{formData.idProof.name}</span>
                  {!formData.idProofConfirmed ? (
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => confirmUpload('idProof')}
                      disabled={loading}
                    >
                      ✅ Confirm
                    </button>
                  ) : (
                    <span className={styles.confirmedText}>✅ Confirmed</span>
                  )}
                </div>
              )}
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.checkboxOption}>
              <input
                type="checkbox"
                name="agreementConsent"
                checked={formData.agreementConsent}
                onChange={handleChange}
                disabled={loading}
              />
              I agree to the Terms of Service and Data Privacy Policy
              {errors.agreementConsent && <span className={styles.error}>{errors.agreementConsent}</span>}
            </label>
          </div>
        </div>
      </div>

      {/* 10. Payment & Payout Details */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Payment & Payout Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Bank Account Holder Name
              <input
                type="text"
                name="bankDetails.name"
                value={formData.bankDetails.name}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Account Number
              <input
                type="text"
                name="bankDetails.accountNo"
                value={formData.bankDetails.accountNo}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              IFSC Code
              <input
                type="text"
                name="bankDetails.ifscCode"
                value={formData.bankDetails.ifscCode}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              UPI ID (Optional)
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                className={styles.textInput}
                disabled={loading}
              />
            </label>
          </div>
          <div className={styles.inputGroup}>
            <p className={styles.inputLabel}>Payment Modes Accepted</p>
            <div className={styles.checkboxGroup}>
              {['Bank Transfer', 'UPI', 'Wallet'].map(mode => (
                <label key={mode} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    name="paymentModesAccepted"
                    value={mode}
                    checked={formData.paymentModesAccepted.includes(mode)}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {mode}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 11. Additional Notes & Preferences */}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Additional Notes & Preferences</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Preferred Mode of Communication
              <select
                name="preferredCommunication"
                value={formData.preferredCommunication}
                onChange={handleChange}
                className={styles.selectInput}
                disabled={loading}
              >
                <option value="">Select</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
              </select>
            </label>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Remarks for Admin Approval
              <textarea
                name="remarksForAdmin"
                value={formData.remarksForAdmin}
                onChange={handleChange}
                className={styles.textInput}
                rows="3"
                placeholder="Any specific requests or notes for admin"
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Submit Section */}
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Doctor Registration'}
        </button>
        {errors.submit && <span className={styles.error}>{errors.submit}</span>}
      </div>
    </form>
  );
};

export default DoctorsData;
