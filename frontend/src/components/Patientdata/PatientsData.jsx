import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './PatientsData.module.css';

const PatientsData = () => {
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

    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        gender: '',
        bloodType: '',
        phone: '',
        emergencyName: '',
        emergencyPhone: '',
        address: '',
        occupation: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceFile: null,
        lastDonationDate: '',
        totalDonations: 0,
        eligibleForDonation: true,
        bloodPressure: '',
        weight: '',
        height: '',
        chronicConditions: [],
        surgeries: false,
        surgeryDetails: '',
        medicationAllergies: [],
        otherAllergies: '',
        familyHistory: [],
        otherFamilyHistory: '',
        currentMeds: false,
        medsList: [],
        pastMeds: '',
        ongoingTherapies: [],
        ongoingTherapiesOthers: '',
        bloodReport: null,
        imagingReport: null,
        geneticOrBiopsyTest: false,
        polioVaccine: false,
        tetanusShot: '',
        covidVaccine: '',
        covidBooster: false,
        smokingStatus: '',
        cigarettesPerDay: '',
        exerciseFrequency: '',
        sleepHours: '',
        dietType: [],
        dietTypeOther: '',
        alcoholConsumption: '',
        alcoholFrequency: '',
        primarySymptoms: '',
        initialDiagnosis: '',
        followUpRequired: false,
        followUpDate: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'checkbox') {
            const updatedValues = formData[name].includes(value)
                ? formData[name].filter(item => item !== value)
                : [...formData[name], value];
            setFormData(prev => ({ ...prev, [name]: updatedValues }));
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'radio' && (value === 'true' || value === 'false')) {
            setFormData(prev => ({ ...prev, [name]: value === 'true' }));
            if (name === 'surgeries' && value === 'true') {
                setFormData(prev => ({ ...prev, surgeryDetails: '' }));
            } else if (name === 'currentMeds' && value === 'true') {
                setFormData(prev => ({ ...prev, medsList: [] }));
            } else if (name === 'followUpRequired' && value === 'true') {
                setFormData(prev => ({ ...prev, followUpDate: '' }));
            } else if (name === 'smokingStatus' && value === 'Current') {
                setFormData(prev => ({ ...prev, cigarettesPerDay: '' }));
            } else if (name === 'alcoholConsumption' && ['Occasionally', 'Regularly'].includes(value)) {
                setFormData(prev => ({ ...prev, alcoholFrequency: '' }));
            }
        } else if (name === 'surgeryDetails' && formData.surgeries) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else if (name === 'medsList' && formData.currentMeds) {
            setFormData(prev => ({ ...prev, [name]: value.split(', ').filter(Boolean) }));
        } else if (name === 'chronicConditions' && value === 'Others') {
            const updatedConditions = formData.chronicConditions.includes('Others')
                ? formData.chronicConditions.filter(c => c !== 'Others')
                : [...formData.chronicConditions, 'Others'];
            setFormData(prev => ({ ...prev, chronicConditions: updatedConditions }));
        } else if (name === 'medicationAllergies' && value === 'Other') {
            const updatedAllergies = formData.medicationAllergies.includes('Other')
                ? formData.medicationAllergies.filter(a => a !== 'Other')
                : [...formData.medicationAllergies, 'Other'];
            setFormData(prev => ({ ...prev, medicationAllergies: updatedAllergies }));
        } else if (name === 'familyHistory' && value === 'Others') {
            const updatedHistory = formData.familyHistory.includes('Others')
                ? formData.familyHistory.filter(f => f !== 'Others')
                : [...formData.familyHistory, 'Others'];
            setFormData(prev => ({ ...prev, familyHistory: updatedHistory }));
        } else if (name === 'ongoingTherapies' && value === 'Others') {
            const updatedTherapies = formData.ongoingTherapies.includes('Others')
                ? formData.ongoingTherapies.filter(t => t !== 'Others')
                : [...formData.ongoingTherapies, 'Others'];
            setFormData(prev => ({ ...prev, ongoingTherapies: updatedTherapies }));
        } else if (name === 'dietType' && value === 'Other') {
            const updatedDiet = formData.dietType.includes('Other')
                ? formData.dietType.filter(d => d !== 'Other')
                : [...formData.dietType, 'Other'];
            setFormData(prev => ({ ...prev, dietType: updatedDiet }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const nameRegex = /^[A-Za-z]{2,}(?:\s+[A-Za-z]+)+$/;
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!formData.name) {
            newErrors.name = 'Full Name is required';
        } else if (!nameRegex.test(formData.name.trim())) {
            newErrors.name = 'Please enter a valid Full Name (First and Last name, letters only)';
        }

        if (!formData.dob) newErrors.dob = 'Date of Birth is required';

        if (!formData.phone) {
            newErrors.phone = 'Phone Number is required';
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Phone Number must be exactly 10 digits and start with 6, 7, 8, or 9';
        }

        if (!formData.emergencyName) newErrors.emergencyName = 'Emergency Contact Name is required';

        if (!formData.emergencyPhone) {
            newErrors.emergencyPhone = 'Emergency Phone is required';
        } else if (!phoneRegex.test(formData.emergencyPhone)) {
            newErrors.emergencyPhone = 'Emergency Phone must be exactly 10 digits and start with 6, 7, 8, or 9';
        }

        if (!formData.bloodType) newErrors.bloodType = 'Blood Type is required';
        if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Weight must be a positive number (kg)';
        if (!formData.height || formData.height <= 0) newErrors.height = 'Height must be a positive number (cm)';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Normalize Insurance fields: if empty, 'no', or any case of 'n/a', set to 'N/A'
        let insuranceProviderVal = formData.insuranceProvider ? formData.insuranceProvider.trim() : '';
        if (!insuranceProviderVal || insuranceProviderVal.toLowerCase() === 'no' || insuranceProviderVal.toLowerCase() === 'n/a') {
            insuranceProviderVal = 'N/A';
        }

        let insurancePolicyNumberVal = formData.insurancePolicyNumber ? formData.insurancePolicyNumber.trim() : '';
        if (!insurancePolicyNumberVal || insurancePolicyNumberVal.toLowerCase() === 'no' || insurancePolicyNumberVal.toLowerCase() === 'n/a') {
            insurancePolicyNumberVal = 'N/A';
        }

        const normalizedFormData = {
            ...formData,
            insuranceProvider: insuranceProviderVal,
            insurancePolicyNumber: insurancePolicyNumberVal
        };

        // Update state to show the normalized values in the UI
        setFormData(prev => ({
            ...prev,
            insuranceProvider: insuranceProviderVal,
            insurancePolicyNumber: insurancePolicyNumberVal
        }));

        const formDataToSend = new FormData();
        Object.keys(normalizedFormData).forEach(key => {
            if (normalizedFormData[key] instanceof File) {
                formDataToSend.append(key, normalizedFormData[key]);
            } else if (Array.isArray(normalizedFormData[key])) {
                formDataToSend.append(key, JSON.stringify(normalizedFormData[key]));
            } else {
                formDataToSend.append(key, normalizedFormData[key] || '');
            }
        });

        try {
            const response = await axios.post(`${API_BASE_URL}/api/patients`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            console.log('Form Data Submitted:', response.data);
            alert('Patient data saved successfully');
        } catch (err) {
            console.error(err);
            alert('Error submitting form: ' + (err.response?.data?.error || err.message));
        }
    };

    if (!isAdmin) return null;

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            {/* Patient Demographics */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Patient Demographics</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Full Name <span>*</span>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className={`${styles.textInput} ${errors.name ? styles.errorInput : ''}`}
                            />
                            {errors.name && <span className={styles.error}>{errors.name}</span>}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Date of Birth (DOB) <span>*</span>
                            <input
                                type="date"
                                name="dob"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                                className={`${styles.textInput} ${errors.dob ? styles.errorInput : ''}`}
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
                                className={styles.selectInput}
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Blood Group <span>*</span>
                            <select
                                name="bloodType"
                                required
                                value={formData.bloodType}
                                onChange={handleChange}
                                className={`${styles.selectInput} ${errors.bloodType ? styles.errorInput : ''}`}
                            >
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.bloodType && <span className={styles.error}>{errors.bloodType}</span>}
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
                                     if (value === '' || /^[6-9]\d{0,9}$/.test(value)) {
                                         handleChange(e);
                                     }
                                 }}
                                placeholder="e.g. 9876543210"
                                className={`${styles.textInput} ${errors.phone ? styles.errorInput : ''}`}
                            />
                            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Emergency Contact Name <span>*</span>
                            <input
                                type="text"
                                name="emergencyName"
                                required
                                value={formData.emergencyName}
                                onChange={handleChange}
                                placeholder="Contact Name"
                                className={`${styles.textInput} ${errors.emergencyName ? styles.errorInput : ''}`}
                            />
                            {errors.emergencyName && <span className={styles.error}>{errors.emergencyName}</span>}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Emergency Contact Phone <span>*</span>
                            <input
                                type="tel"
                                name="emergencyPhone"
                                required
                                value={formData.emergencyPhone}
                                onChange={(e) => {
                                     const value = e.target.value;
                                     if (value === '' || /^[6-9]\d{0,9}$/.test(value)) {
                                         handleChange(e);
                                     }
                                 }}
                                placeholder="e.g. 9876543210"
                                className={`${styles.textInput} ${errors.emergencyPhone ? styles.errorInput : ''}`}
                            />
                            {errors.emergencyPhone && <span className={styles.error}>{errors.emergencyPhone}</span>}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Address (City, State, ZIP)
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={styles.textInput}
                                rows="2"
                                placeholder="e.g., 123 Main St, City, State, 12345"
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Occupation
                            <select
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="">Select</option>
                                <option value="Self-employed">Self-employed</option>
                                <option value="Student">Student</option>
                                <option value="Retired">Retired</option>
                                <option value="Employed">Employed</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Insurance Provider
                            <input
                                type="text"
                                name="insuranceProvider"
                                value={formData.insuranceProvider}
                                onChange={handleChange}
                                placeholder="Type provider or 'N/A' if none"
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Insurance Policy Number
                            <input
                                type="text"
                                name="insurancePolicyNumber"
                                value={formData.insurancePolicyNumber}
                                onChange={handleChange}
                                placeholder="Type policy number or 'N/A' if none"
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Insurance Document (Upload)
                            <div className={styles.fileInputWrapper}>
                                <input
                                    type="file"
                                    name="insuranceFile"
                                    onChange={(e) => handleChange({ target: { name: 'insuranceFile', files: e.target.files } })}
                                    accept=".pdf,.jpg,.png"
                                    className={styles.fileInput}
                                />
                                <span className={styles.fileInputLabel}>
                                    {formData.insuranceFile ? 'Replace File' : 'Upload Insurance Document'}
                                </span>
                            </div>
                            {formData.insuranceFile && (
                                <span className={styles.fileName}>{formData.insuranceFile.name}</span>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            {/* Blood Donation & Basic Vitals */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Blood Donation & Basic Vitals</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Last Blood Donation Date
                            <input
                                type="date"
                                name="lastDonationDate"
                                value={formData.lastDonationDate}
                                onChange={handleChange}
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Total Blood Donations
                            <input
                                type="number"
                                name="totalDonations"
                                value={formData.totalDonations}
                                onChange={handleChange}
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Intrested for Donate Blood?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="eligibleForDonation"
                                    value="true"
                                    checked={formData.eligibleForDonation}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="eligibleForDonation"
                                    value="false"
                                    checked={!formData.eligibleForDonation}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Blood Pressure (BP)
                            <input
                                type="text"
                                name="bloodPressure"
                                value={formData.bloodPressure}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,3}\/\d{0,3}\s?mmHg$/.test(value) || value === '') {
                                        handleChange(e);
                                    }
                                }}
                                placeholder="e.g., 120/80 mmHg"
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Weight (kg)
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= 0 || value === '') {
                                        handleChange(e);
                                    }
                                }}
                                className={`${styles.textInput} ${errors.weight ? styles.errorInput : ''}`}
                            />
                            {errors.weight && <span className={styles.error}>{errors.weight}</span>}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Height (cm)
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= 0 || value === '') {
                                        handleChange(e);
                                    }
                                }}
                                className={`${styles.textInput} ${errors.height ? styles.errorInput : ''}`}
                            />
                            {errors.height && <span className={styles.error}>{errors.height}</span>}
                        </label>
                    </div>
                </div>
            </div>

            {/* Medical History */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Medical History</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Chronic Conditions</p>
                        <div className={styles.checkboxGroup}>
                            {['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Cancer', 'Kidney Disease'].map(condition => (
                                <label key={condition} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        name="chronicConditions"
                                        value={condition}
                                        checked={formData.chronicConditions.includes(condition)}
                                        onChange={handleChange}
                                    />
                                    {condition}
                                </label>
                            ))}
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    name="chronicConditions"
                                    value="Others"
                                    checked={formData.chronicConditions.includes('Others')}
                                    onChange={handleChange}
                                />
                                Others
                                {formData.chronicConditions.includes('Others') && (
                                    <input
                                        type="text"
                                        name="chronicConditionsOthers"
                                        value={formData.chronicConditionsOthers || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            chronicConditions: [...prev.chronicConditions.filter(c => c !== 'Others'), 'Others'],
                                            chronicConditionsOthers: e.target.value
                                        }))}
                                        className={styles.textInput}
                                        placeholder="Specify other conditions"
                                    />
                                )}
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Previous Surgeries?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="surgeries"
                                    value="true"
                                    checked={formData.surgeries}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="surgeries"
                                    value="false"
                                    checked={!formData.surgeries}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                    {formData.surgeries && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <label className={styles.inputLabel}>
                                Surgery Details (Type & Year)
                                <textarea
                                    name="surgeryDetails"
                                    value={formData.surgeryDetails}
                                    onChange={handleChange}
                                    className={styles.textInput}
                                    rows="3"
                                    placeholder="e.g., Appendectomy, 2020"
                                />
                            </label>
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Medication Allergies?</p>
                        <div className={styles.checkboxGroup}>
                            {['Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa'].map(allergy => (
                                <label key={allergy} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        name="medicationAllergies"
                                        value={allergy}
                                        checked={formData.medicationAllergies.includes(allergy)}
                                        onChange={handleChange}
                                    />
                                    {allergy}
                                </label>
                            ))}
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    name="medicationAllergies"
                                    value="Other"
                                    checked={formData.medicationAllergies.includes('Other')}
                                    onChange={handleChange}
                                />
                                Other
                                {formData.medicationAllergies.includes('Other') && (
                                    <input
                                        type="text"
                                        name="otherAllergies"
                                        value={formData.otherAllergies || ''}
                                        onChange={handleChange}
                                        className={styles.textInput}
                                        placeholder="Specify other allergies"
                                    />
                                )}
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Family History of Diseases?</p>
                        <div className={styles.checkboxGroup}>
                            {['Diabetes', 'Heart Disease', 'Cancer', 'Stroke'].map(disease => (
                                <label key={disease} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        name="familyHistory"
                                        value={disease}
                                        checked={formData.familyHistory.includes(disease)}
                                        onChange={handleChange}
                                    />
                                    {disease}
                                </label>
                            ))}
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    name="familyHistory"
                                    value="Others"
                                    checked={formData.familyHistory.includes('Others')}
                                    onChange={handleChange}
                                />
                                Others
                                {formData.familyHistory.includes('Others') && (
                                    <input
                                        type="text"
                                        name="otherFamilyHistory"
                                        value={formData.otherFamilyHistory || ''}
                                        onChange={handleChange}
                                        className={styles.textInput}
                                        placeholder="Specify other diseases"
                                    />
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medications & Treatment */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Medications & Treatment</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Currently Taking Medications?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="currentMeds"
                                    value="true"
                                    checked={formData.currentMeds}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="currentMeds"
                                    value="false"
                                    checked={!formData.currentMeds}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                    {formData.currentMeds && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <label className={styles.inputLabel}>
                                Medication Name & Dosage
                                <textarea
                                    name="medsList"
                                    value={formData.medsList.join(', ')}
                                    onChange={(e) => setFormData(prev => ({ ...prev, medsList: e.target.value.split(', ').filter(Boolean) }))}
                                    className={styles.textInput}
                                    rows="3"
                                    placeholder="e.g., Aspirin 325mg, Metformin 500mg"
                                />
                            </label>
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Past Medications Used
                            <textarea
                                name="pastMeds"
                                value={formData.pastMeds}
                                onChange={handleChange}
                                className={styles.textInput}
                                rows="3"
                                placeholder="e.g., Antibiotics, Painkillers"
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Ongoing Therapies?</p>
                        <div className={styles.checkboxGroup}>
                            {['Chemotherapy', 'Dialysis', 'Physiotherapy'].map(therapy => (
                                <label key={therapy} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        name="ongoingTherapies"
                                        value={therapy}
                                        checked={formData.ongoingTherapies.includes(therapy)}
                                        onChange={handleChange}
                                    />
                                    {therapy}
                                </label>
                            ))}
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    name="ongoingTherapies"
                                    value="Others"
                                    checked={formData.ongoingTherapies.includes('Others')}
                                    onChange={handleChange}
                                />
                                Others
                                {formData.ongoingTherapies.includes('Others') && (
                                    <input
                                        type="text"
                                        name="ongoingTherapiesOthers"
                                        value={formData.ongoingTherapiesOthers || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            ongoingTherapies: [...prev.ongoingTherapies.filter(t => t !== 'Others'), 'Others'],
                                            ongoingTherapiesOthers: e.target.value
                                        }))}
                                        className={styles.textInput}
                                        placeholder="Specify other therapies"
                                    />
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lab & Imaging Reports */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Lab & Imaging Reports</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Latest Blood Test Results (Upload)
                            <div className={styles.fileInputWrapper}>
                                <input
                                    type="file"
                                    name="bloodReport"
                                    onChange={(e) => handleChange({ target: { name: 'bloodReport', files: e.target.files } })}
                                    accept=".pdf,.jpg,.png"
                                    className={styles.fileInput}
                                />
                                <span className={styles.fileInputLabel}>
                                    {formData.bloodReport ? 'Replace File' : 'Upload Blood Test Results'}
                                </span>
                            </div>
                            {formData.bloodReport && (
                                <span className={styles.fileName}>{formData.bloodReport.name}</span>
                            )}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Latest Imaging Reports (X-ray, MRI, CT Scan) (Upload)
                            <div className={styles.fileInputWrapper}>
                                <input
                                    type="file"
                                    name="imagingReport"
                                    onChange={(e) => handleChange({ target: { name: 'imagingReport', files: e.target.files } })}
                                    accept=".dicom,.pdf,.jpg,.png"
                                    className={styles.fileInput}
                                />
                                <span className={styles.fileInputLabel}>
                                    {formData.imagingReport ? 'Replace File' : 'Upload Imaging Reports'}
                                </span>
                            </div>
                            {formData.imagingReport && (
                                <span className={styles.fileName}>{formData.imagingReport.name}</span>
                            )}
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Any Genetic or Biopsy Test Done?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="geneticOrBiopsyTest"
                                    value="true"
                                    checked={formData.geneticOrBiopsyTest}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="geneticOrBiopsyTest"
                                    value="false"
                                    checked={!formData.geneticOrBiopsyTest}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Immunizations & Vaccinations */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Immunizations & Vaccinations</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Polio Vaccine Received?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="polioVaccine"
                                    value="true"
                                    checked={formData.polioVaccine}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="polioVaccine"
                                    value="false"
                                    checked={!formData.polioVaccine}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Last Tetanus Shot Date (dd-mm-yyyy)
                            <input
                                type="date"
                                name="tetanusShot"
                                value={formData.tetanusShot}
                                onChange={handleChange}
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            COVID-19 Vaccine Status
                            <select
                                name="covidVaccine"
                                value={formData.covidVaccine}
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="">Select</option>
                                <option value="Fully Vaccinated">Fully Vaccinated</option>
                                <option value="Partially">Partially</option>
                                <option value="Not Vaccinated">Not Vaccinated</option>
                            </select>
                        </label>
                    </div>
                    {['Fully Vaccinated', 'Partially'].includes(formData.covidVaccine) && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <p className={styles.inputLabel}>Booster Dose Received?</p>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="covidBooster"
                                        value="true"
                                        checked={formData.covidBooster}
                                        onChange={handleChange}
                                    />
                                    Yes
                                </label>
                                <label className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="covidBooster"
                                        value="false"
                                        checked={!formData.covidBooster}
                                        onChange={handleChange}
                                    />
                                    No
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lifestyle & Nutrition */}
            <div className={`${styles.formSection} ${styles.lifestyleSection}`}>
                <h2 className={styles.sectionTitle}>Lifestyle & Nutrition</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Smoking Status</p>
                        <div className={styles.radioGroup}>
                            {['Never', 'Former', 'Current'].map(status => (
                                <label key={status} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="smokingStatus"
                                        value={status}
                                        checked={formData.smokingStatus === status}
                                        onChange={handleChange}
                                    />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </div>
                    {formData.smokingStatus === 'Current' && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <label className={styles.inputLabel}>
                                Cigarettes per Day
                                <input
                                    type="number"
                                    name="cigarettesPerDay"
                                    value={formData.cigarettesPerDay}
                                    onChange={handleChange}
                                    className={styles.textInput}
                                    placeholder="e.g., 5"
                                />
                            </label>
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Exercise Frequency</p>
                        <div className={styles.radioGroup}>
                            {['Daily', 'Weekly', 'Monthly', 'Rarely'].map(freq => (
                                <label key={freq} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="exerciseFrequency"
                                        value={freq}
                                        checked={formData.exerciseFrequency === freq}
                                        onChange={handleChange}
                                    />
                                    {freq}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={`${styles.inputGroup} ${styles.sleepHours}`}>
                        <label className={styles.inputLabel}>
                            Daily Sleep Hours
                            <input
                                type="number"
                                name="sleepHours"
                                value={formData.sleepHours}
                                onChange={handleChange}
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Diet Type</p>
                        <div className={styles.checkboxGroup}>
                            {['Vegetarian', 'Vegan', 'Non-Veg', 'Keto'].map(diet => (
                                <label key={diet} className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        name="dietType"
                                        value={diet}
                                        checked={formData.dietType.includes(diet)}
                                        onChange={handleChange}
                                    />
                                    {diet}
                                </label>
                            ))}
                            <label className={styles.checkboxOption}>
                                <input
                                    type="checkbox"
                                    name="dietType"
                                    value="Other"
                                    checked={formData.dietType.includes('Other')}
                                    onChange={handleChange}
                                />
                                Other
                                {formData.dietType.includes('Other') && (
                                    <input
                                        type="text"
                                        name="dietTypeOther"
                                        value={formData.dietTypeOther || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            dietType: [...prev.dietType.filter(d => d !== 'Other'), 'Other'],
                                            dietTypeOther: e.target.value
                                        }))}
                                        className={styles.textInput}
                                        placeholder="Specify other diet"
                                    />
                                )}
                            </label>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Alcohol Consumption?</p>
                        <div className={styles.radioGroup}>
                            {['Never', 'Occasionally', 'Regularly'].map(option => (
                                <label key={option} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="alcoholConsumption"
                                        value={option}
                                        checked={formData.alcoholConsumption === option}
                                        onChange={handleChange}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    </div>
                    {['Occasionally', 'Regularly'].includes(formData.alcoholConsumption) && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <label className={styles.inputLabel}>
                                Frequency (per week/month)
                                <input
                                    type="text"
                                    name="alcoholFrequency"
                                    value={formData.alcoholFrequency}
                                    onChange={handleChange}
                                    className={styles.textInput}
                                    placeholder="e.g., 2 times/week or 1 time/month"
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Doctor’s Initial Observations */}
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Doctor’s Initial Observations</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Primary Symptoms & Complaints
                            <textarea
                                name="primarySymptoms"
                                value={formData.primarySymptoms}
                                onChange={handleChange}
                                className={styles.textInput}
                                rows="3"
                                placeholder="e.g., Fever, Fatigue, Pain (comma-separated)"
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Doctor’s Initial Diagnosis (if available)
                            <textarea
                                name="initialDiagnosis"
                                value={formData.initialDiagnosis}
                                onChange={handleChange}
                                className={styles.textInput}
                                rows="3"
                                placeholder="e.g., Hypertension, Suspected Diabetes"
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <p className={styles.inputLabel}>Follow-Up Required?</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="followUpRequired"
                                    value="true"
                                    checked={formData.followUpRequired}
                                    onChange={handleChange}
                                />
                                Yes
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="followUpRequired"
                                    value="false"
                                    checked={!formData.followUpRequired}
                                    onChange={handleChange}
                                />
                                No
                            </label>
                        </div>
                    </div>
                    {formData.followUpRequired && (
                        <div className={`${styles.inputGroup} ${styles.conditionalSection}`}>
                            <label className={styles.inputLabel}>
                                Follow-Up Date
                                <input
                                    type="date"
                                    name="followUpDate"
                                    value={formData.followUpDate}
                                    onChange={handleChange}
                                    className={styles.textInput}
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Section */}
            <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                    Save Medical Profile
                </button>
            </div>
        </form>
    );
};

export default PatientsData;
