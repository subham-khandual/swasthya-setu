import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Activity, Pill, Stethoscope, FileText, CreditCard, User, History, Plus, Save, Trash2 } from 'lucide-react';
import styles from './EHRManagement.module.css';

const API_URL = `${API_BASE_URL}/api`;

const EHRManagement = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/patients`);
      setPatients(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch patients.');
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({ ...patient });
    setActiveTab('basic');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Generic Array Handler (for chronic conditions, allergies, etc.)
  const handleArrayChange = (name, value) => {
    const arrayValues = value.split(',').map(item => item.trim());
    setFormData({ ...formData, [name]: arrayValues });
  };

  // Add items to complex arrays
  const addArrayItem = (fieldName, emptyItem) => {
    const currentArray = formData[fieldName] || [];
    setFormData({ ...formData, [fieldName]: [...currentArray, emptyItem] });
  };

  const updateArrayItem = (fieldName, index, key, value) => {
    const newArray = [...(formData[fieldName] || [])];
    newArray[index][key] = value;
    setFormData({ ...formData, [fieldName]: newArray });
  };

  const removeArrayItem = (fieldName, index) => {
    const newArray = [...(formData[fieldName] || [])];
    newArray.splice(index, 1);
    setFormData({ ...formData, [fieldName]: newArray });
  };

  // File handling
  const handleFileChange = (e) => {
    setUploadFiles({
      ...uploadFiles,
      [e.target.name]: e.target.files[0]
    });
  };

  const savePatientRecord = async () => {
    // Client-side validations
    const nameRegex = /^[A-Za-z]{2,}(?:\s+[A-Za-z]+)+$/;
    const phoneRegex = /^(?:\+91)?[6789]\d{9}$/;

    if (!formData.name || !nameRegex.test(formData.name.trim())) {
      toast.error('Please enter a valid Full Name (First and Last name, letters only).');
      return;
    }

    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      toast.error('Contact Number must be 10 digits, start with 6/7/8/9, and contain no leading zeros or special characters.');
      return;
    }

    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone)) {
      toast.error('Emergency Contact Number must be a valid 10-digit number like the Contact Number.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Append all normal keys (stringify arrays/objects)
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null && !(formData[key] instanceof Date)) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key] || '');
        }
      });

      // Append files
      if (uploadFiles.bloodReport) formDataToSend.append('bloodReport', uploadFiles.bloodReport);
      if (uploadFiles.imagingReport) formDataToSend.append('imagingReport', uploadFiles.imagingReport);
      if (uploadFiles.insuranceFile) formDataToSend.append('insuranceFile', uploadFiles.insuranceFile);

      let response;
      if (selectedPatient._id) {
        response = await axios.put(`${API_URL}/patients/${selectedPatient._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Patient record updated successfully');
      } else {
        response = await axios.post(`${API_URL}/patients`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('New patient record created');
      }

      fetchPatients();
      setSelectedPatient(response.data.patient);
      setFormData(response.data.patient);
      if (response.data.patient && response.data.patient._id) {
        localStorage.setItem('lastEditedPatientId', response.data.patient._id);
      }
      setUploadFiles({});
    } catch (error) {
      console.error(error);
      toast.error('Failed to save patient record: ' + (error.response?.data?.error || error.message));
    }
  };

  const deletePatientRecord = async () => {
    if (!selectedPatient._id) return;
    if (!window.confirm(`Are you sure you want to delete the EHR record for ${selectedPatient.name}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/patients/${selectedPatient._id}`);
      toast.success('Patient record deleted successfully');
      
      // Clear selection and state
      setSelectedPatient(null);
      setFormData({});
      localStorage.removeItem('lastEditedPatientId');
      setUploadFiles({});
      // Refresh list
      fetchPatients();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete patient record: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="text-center mt-5">Loading Patient Database...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.headerTitle}>Hospital EHR Dashboard</h1>
      
      <div className="row">
        {/* Left Sidebar: Patient List */}
        <div className="col-md-3">
          <div className={styles.patientListContainer}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="m-0">Patients</h4>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => handleSelectPatient({ 
                  name: '', dob: '', gender: 'Male', bloodType: 'A+', phone: '', emergencyName: '', emergencyPhone: '',
                  doctorVisits: [], prescriptions: [], vitals: [], billingRecords: [] 
                })}
              >
                + New
              </button>
            </div>
            
            <input type="text" className="form-control mb-3" placeholder="Search patients..." />
            
            <div className={styles.patientList}>
              {patients.map(p => (
                <div 
                  key={p._id} 
                  className={`${styles.patientCard} ${selectedPatient?._id === p._id ? styles.selected : ''}`}
                  onClick={() => handleSelectPatient(p)}
                >
                  <div className={styles.patientInitial}>{p.name.charAt(0)}</div>
                  <div className={styles.patientInfo}>
                    <strong>{p.name}</strong>
                    <small>{p.phone} • {p.bloodType}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Area: EHR Detail */}
        <div className="col-md-9">
          {selectedPatient ? (
            <div className={styles.ehrEditorContainer}>
              <div className={styles.ehrHeader}>
                <h2>{selectedPatient._id ? `Editing Record: ${formData.name}` : `New Patient Record`}</h2>
                <div className="d-flex gap-2">
                  {selectedPatient._id && (
                    <button className="btn btn-danger d-flex align-items-center" onClick={deletePatientRecord}>
                      <Trash2 size={18} className="me-2" /> Remove Record
                    </button>
                  )}
                  <button className="btn btn-success d-flex align-items-center" onClick={savePatientRecord}>
                    <Save size={18} className="me-2" /> Save Record
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className={styles.tabsContainer}>
                <button className={`${styles.tabBtn} ${activeTab === 'basic' ? styles.active : ''}`} onClick={() => setActiveTab('basic')}><User size={16} /> Basic Info</button>
                <button className={`${styles.tabBtn} ${activeTab === 'history' ? styles.active : ''}`} onClick={() => setActiveTab('history')}><History size={16} /> Medical History</button>
                <button className={`${styles.tabBtn} ${activeTab === 'visits' ? styles.active : ''}`} onClick={() => setActiveTab('visits')}><Stethoscope size={16} /> Doctor Visits</button>
                <button className={`${styles.tabBtn} ${activeTab === 'prescriptions' ? styles.active : ''}`} onClick={() => setActiveTab('prescriptions')}><Pill size={16} /> Prescriptions</button>
                <button className={`${styles.tabBtn} ${activeTab === 'labs' ? styles.active : ''}`} onClick={() => setActiveTab('labs')}><FileText size={16} /> Lab Reports</button>
                <button className={`${styles.tabBtn} ${activeTab === 'vitals' ? styles.active : ''}`} onClick={() => setActiveTab('vitals')}><Activity size={16} /> Vitals</button>
                <button className={`${styles.tabBtn} ${activeTab === 'billing' ? styles.active : ''}`} onClick={() => setActiveTab('billing')}><CreditCard size={16} /> Billing</button>
                <button className={`${styles.tabBtn} ${activeTab === 'lifestyle' ? styles.active : ''}`} onClick={() => setActiveTab('lifestyle')}><Activity size={16} /> Lifestyle & Vaccines</button>
              </div>

              {/* Tab Contents */}
              <div className={styles.tabContent}>
                
                {/* 1. Basic Info */}
                {activeTab === 'basic' && (
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Nick Name</label>
                      <input type="text" className="form-control" name="nickname" value={formData.nickname || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" className="form-control" name="dob" value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''} onChange={handleChange} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Gender</label>
                      <select className="form-select" name="gender" value={formData.gender || ''} onChange={handleChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Blood Group</label>
                      <input type="text" className="form-control" name="bloodType" value={formData.bloodType || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact Phone</label>
                      <input type="text" className="form-control" name="phone" value={formData.phone || ''} onChange={handleChange} required />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" name="address" value={formData.address || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Emergency Contact Name</label>
                      <input type="text" className="form-control" name="emergencyName" value={formData.emergencyName || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Emergency Contact Phone</label>
                      <input type="text" className="form-control" name="emergencyPhone" value={formData.emergencyPhone || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Occupation</label>
                      <input type="text" className="form-control" name="occupation" value={formData.occupation || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Insurance Provider</label>
                      <input type="text" className="form-control" name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Insurance Policy Number</label>
                      <input type="text" className="form-control" name="insurancePolicyNumber" value={formData.insurancePolicyNumber || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" className="form-control" name="weight" value={formData.weight || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Height (cm)</label>
                      <input type="number" className="form-control" name="height" value={formData.height || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Blood Pressure</label>
                      <input type="text" className="form-control" name="bloodPressure" placeholder="120/80" value={formData.bloodPressure || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Total Donations</label>
                      <input type="number" className="form-control" name="totalDonations" value={formData.totalDonations || 0} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Donation Date</label>
                      <input type="date" className="form-control" name="lastDonationDate" value={formData.lastDonationDate ? new Date(formData.lastDonationDate).toISOString().split('T')[0] : ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mt-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="eligibleForDonation" checked={formData.eligibleForDonation !== false} onChange={handleChange} id="eligibleForDonation" />
                        <label className="form-check-label" htmlFor="eligibleForDonation">Eligible for Blood Donation</label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Medical History */}
                {activeTab === 'history' && (
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label">Chronic Conditions (comma separated)</label>
                      <input type="text" className="form-control" name="chronicConditions" value={(formData.chronicConditions || []).join(', ')} onChange={(e) => handleArrayChange('chronicConditions', e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Medication Allergies (comma separated)</label>
                      <input type="text" className="form-control" name="medicationAllergies" value={(formData.medicationAllergies || []).join(', ')} onChange={(e) => handleArrayChange('medicationAllergies', e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Other Allergies</label>
                      <input type="text" className="form-control" name="otherAllergies" value={formData.otherAllergies || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Family History (comma separated)</label>
                      <input type="text" className="form-control" name="familyHistory" value={(formData.familyHistory || []).join(', ')} onChange={(e) => handleArrayChange('familyHistory', e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Other Family History Details</label>
                      <input type="text" className="form-control" name="otherFamilyHistory" value={formData.otherFamilyHistory || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mt-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="currentMeds" checked={formData.currentMeds || false} onChange={handleChange} id="currentMeds" />
                        <label className="form-check-label" htmlFor="currentMeds">Currently taking Medications</label>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Medications List (comma separated)</label>
                      <input type="text" className="form-control" name="medsList" value={(formData.medsList || []).join(', ')} onChange={(e) => handleArrayChange('medsList', e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Past Medications</label>
                      <input type="text" className="form-control" name="pastMeds" value={formData.pastMeds || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Ongoing Therapies (comma separated)</label>
                      <input type="text" className="form-control" name="ongoingTherapies" value={(formData.ongoingTherapies || []).join(', ')} onChange={(e) => handleArrayChange('ongoingTherapies', e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Other Therapies</label>
                      <input type="text" className="form-control" name="ongoingTherapiesOthers" value={formData.ongoingTherapiesOthers || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mt-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="surgeries" checked={formData.surgeries || false} onChange={handleChange} id="hasSurgeries" />
                        <label className="form-check-label" htmlFor="hasSurgeries">Previous Surgeries</label>
                      </div>
                    </div>
                    {formData.surgeries && (
                      <div className="col-md-12">
                        <label className="form-label">Surgery Details</label>
                        <textarea className="form-control" name="surgeryDetails" value={formData.surgeryDetails || ''} onChange={handleChange} rows="2"></textarea>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Doctor Visits */}
                {activeTab === 'visits' && (
                  <div>
                    <div className="row g-3 mb-4 p-3 bg-light rounded border">
                      <h5>Current Observations</h5>
                      <div className="col-md-6">
                        <label className="form-label">Primary Symptoms</label>
                        <input type="text" className="form-control" name="primarySymptoms" value={formData.primarySymptoms || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Initial Diagnosis</label>
                        <input type="text" className="form-control" name="initialDiagnosis" value={formData.initialDiagnosis || ''} onChange={handleChange} />
                      </div>
                      <div className="col-md-4 mt-4">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" name="followUpRequired" checked={formData.followUpRequired || false} onChange={handleChange} id="followUpRequired" />
                          <label className="form-check-label" htmlFor="followUpRequired">Follow-Up Required</label>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Follow-Up Date</label>
                        <input type="date" className="form-control" name="followUpDate" value={formData.followUpDate ? new Date(formData.followUpDate).toISOString().split('T')[0] : ''} onChange={handleChange} disabled={!formData.followUpRequired} />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <h4>Consultation History</h4>
                      <button className="btn btn-sm btn-outline-primary shadow-sm" onClick={() => addArrayItem('doctorVisits', { doctorName: '', visitDate: '', diagnosis: '', notes: '' })}>
                        <Plus size={16} /> Add Visit
                      </button>
                    </div>
                    {(formData.doctorVisits || []).map((visit, index) => (
                      <div key={index} className={styles.dynamicCard}>
                        <div className="row g-2">
                          <div className="col-md-5">
                            <input type="text" className="form-control" placeholder="Doctor Name" value={visit.doctorName || ''} onChange={(e) => updateArrayItem('doctorVisits', index, 'doctorName', e.target.value)} />
                          </div>
                          <div className="col-md-4">
                            <input type="date" className="form-control" value={visit.visitDate ? new Date(visit.visitDate).toISOString().split('T')[0] : ''} onChange={(e) => updateArrayItem('doctorVisits', index, 'visitDate', e.target.value)} />
                          </div>
                          <div className="col-md-3 text-end">
                            <button className="btn btn-sm btn-danger" onClick={() => removeArrayItem('doctorVisits', index)}>Remove</button>
                          </div>
                          <div className="col-md-12 mt-2">
                            <input type="text" className="form-control" placeholder="Diagnosis" value={visit.diagnosis || ''} onChange={(e) => updateArrayItem('doctorVisits', index, 'diagnosis', e.target.value)} />
                          </div>
                          <div className="col-md-12 mt-2">
                            <textarea className="form-control" placeholder="Consultation Notes" value={visit.notes || ''} onChange={(e) => updateArrayItem('doctorVisits', index, 'notes', e.target.value)} rows="2"></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!formData.doctorVisits || formData.doctorVisits.length === 0) && <p className="text-muted">No visits recorded.</p>}
                  </div>
                )}

                {/* 4. Prescriptions */}
                {activeTab === 'prescriptions' && (
                  <div>
                    <div className="d-flex justify-content-between mb-3">
                      <h4>Medication Directives</h4>
                      <button className="btn btn-sm btn-outline-primary shadow-sm" onClick={() => addArrayItem('prescriptions', { medicineName: '', dosage: '', duration: '' })}>
                        <Plus size={16} /> Add Medicine
                      </button>
                    </div>
                    <div className="row g-2 font-weight-bold mb-2">
                      <div className="col-md-5">Medicine</div>
                      <div className="col-md-3">Dosage</div>
                      <div className="col-md-3">Duration</div>
                    </div>
                    {(formData.prescriptions || []).map((med, index) => (
                      <div key={index} className="row g-2 mb-2 align-items-center">
                        <div className="col-md-5">
                          <input type="text" className="form-control" placeholder="Paracetamol 500mg" value={med.medicineName || ''} onChange={(e) => updateArrayItem('prescriptions', index, 'medicineName', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <input type="text" className="form-control" placeholder="1-0-1" value={med.dosage || ''} onChange={(e) => updateArrayItem('prescriptions', index, 'dosage', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <input type="text" className="form-control" placeholder="5 Days" value={med.duration || ''} onChange={(e) => updateArrayItem('prescriptions', index, 'duration', e.target.value)} />
                        </div>
                        <div className="col-md-1 text-center">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeArrayItem('prescriptions', index)}>X</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Lab Reports */}
                {activeTab === 'labs' && (
                  <div className="row g-4">
                    <div className="col-md-12 mb-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="geneticOrBiopsyTest" checked={formData.geneticOrBiopsyTest || false} onChange={handleChange} id="geneticOrBiopsyTest" />
                        <label className="form-check-label" htmlFor="geneticOrBiopsyTest">Genetic or Biopsy Test Conducted</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className={styles.fileUploadCard}>
                        <h5>Blood Test Report</h5>
                        {formData.bloodReport && (
                           <div className="mb-2">
                             <a href={`${API_BASE_URL}${formData.bloodReport}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">View Current File</a>
                           </div>
                        )}
                        <input type="file" className="form-control" name="bloodReport" accept="application/pdf,image/*" onChange={handleFileChange} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className={styles.fileUploadCard}>
                        <h5>X-Ray / MRI Imaging Report</h5>
                        {formData.imagingReport && (
                           <div className="mb-2">
                             <a href={`${API_BASE_URL}${formData.imagingReport}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">View Current File</a>
                           </div>
                        )}
                        <input type="file" className="form-control" name="imagingReport" accept="application/pdf,image/*" onChange={handleFileChange} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Vitals & Health Data */}
                {activeTab === 'vitals' && (
                  <div>
                    <div className="d-flex justify-content-between mb-3">
                      <h4>Health Vitals Tracker</h4>
                      <button className="btn btn-sm btn-outline-primary shadow-sm" onClick={() => addArrayItem('vitals', { date: new Date().toISOString().split('T')[0], bloodPressure: '', sugarLevel: '', heartRate: '', temperature: '' })}>
                        <Plus size={16} /> Record Vitals
                      </button>
                    </div>
                    
                    <div className="row g-2 font-weight-bold mb-2 d-none d-md-flex">
                      <div className="col-md-2">Date</div>
                      <div className="col-md-2">BP (mmHg)</div>
                      <div className="col-md-2">Sugar (mg/dL)</div>
                      <div className="col-md-2">Heart (bpm)</div>
                      <div className="col-md-2">Temp (°F)</div>
                    </div>

                    {(formData.vitals || []).map((vital, index) => (
                      <div key={index} className="row g-2 mb-3 bg-light p-2 rounded align-items-center">
                        <div className="col-md-2">
                          <input type="date" className="form-control form-control-sm" value={vital.date ? new Date(vital.date).toISOString().split('T')[0] : ''} onChange={(e) => updateArrayItem('vitals', index, 'date', e.target.value)} />
                        </div>
                        <div className="col-md-2">
                          <input type="text" className="form-control form-control-sm" placeholder="120/80" value={vital.bloodPressure || ''} onChange={(e) => updateArrayItem('vitals', index, 'bloodPressure', e.target.value)} />
                        </div>
                        <div className="col-md-2">
                          <input type="number" className="form-control form-control-sm" placeholder="Sugar" value={vital.sugarLevel || ''} onChange={(e) => updateArrayItem('vitals', index, 'sugarLevel', e.target.value)} />
                        </div>
                        <div className="col-md-2">
                          <input type="number" className="form-control form-control-sm" placeholder="Heart Rate" value={vital.heartRate} onChange={(e) => updateArrayItem('vitals', index, 'heartRate', e.target.value)} />
                        </div>
                        <div className="col-md-2">
                          <input type="number" className="form-control form-control-sm" placeholder="Temp" value={vital.temperature} onChange={(e) => updateArrayItem('vitals', index, 'temperature', e.target.value)} />
                        </div>
                        <div className="col-md-2 text-center text-md-end">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeArrayItem('vitals', index)}>Rm</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. Billing & Payments */}
                {activeTab === 'billing' && (
                  <div>
                    <div className="d-flex justify-content-between mb-3">
                      <h4>Transaction History</h4>
                      <button className="btn btn-sm btn-outline-primary shadow-sm" onClick={() => addArrayItem('billingRecords', { date: new Date().toISOString().split('T')[0], consultationFee: '', medicinePurchase: '', paymentStatus: 'Pending' })}>
                        <Plus size={16} /> Add Bill
                      </button>
                    </div>
                    {(formData.billingRecords || []).map((bill, index) => (
                      <div key={index} className={styles.dynamicCard}>
                        <div className="row g-2 align-items-center">
                          <div className="col-md-3">
                            <label className="form-label" style={{fontSize:'12px'}}>Date</label>
                            <input type="date" className="form-control" value={bill.date ? new Date(bill.date).toISOString().split('T')[0] : ''} onChange={(e) => updateArrayItem('billingRecords', index, 'date', e.target.value)} />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label" style={{fontSize:'12px'}}>Consultation (₹)</label>
                            <input type="number" className="form-control" placeholder="500" value={bill.consultationFee} onChange={(e) => updateArrayItem('billingRecords', index, 'consultationFee', e.target.value)} />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label" style={{fontSize:'12px'}}>Medicine (₹)</label>
                            <input type="number" className="form-control" placeholder="1200" value={bill.medicinePurchase} onChange={(e) => updateArrayItem('billingRecords', index, 'medicinePurchase', e.target.value)} />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label" style={{fontSize:'12px'}}>Status</label>
                            <select className="form-select status-select" value={bill.paymentStatus} onChange={(e) => updateArrayItem('billingRecords', index, 'paymentStatus', e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </div>
                          <div className="col-md-1 d-flex align-items-end justify-content-center pt-4">
                            <button className="btn btn-sm btn-danger" onClick={() => removeArrayItem('billingRecords', index)}>X</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. Lifestyle & Vaccines */}
                {activeTab === 'lifestyle' && (
                  <div className="row g-3">
                    <h5>Lifestyle Factors</h5>
                    <div className="col-md-4">
                      <label className="form-label">Smoking Status</label>
                      <select className="form-select" name="smokingStatus" value={formData.smokingStatus || ''} onChange={handleChange}>
                        <option value="">Select Status</option>
                        <option value="Never">Never</option>
                        <option value="Former">Former</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                    {formData.smokingStatus === 'Current' && (
                      <div className="col-md-4">
                        <label className="form-label">Cigarettes per Day</label>
                        <input type="number" className="form-control" name="cigarettesPerDay" value={formData.cigarettesPerDay || ''} onChange={handleChange} />
                      </div>
                    )}
                    <div className="col-md-4">
                      <label className="form-label">Exercise Frequency</label>
                      <select className="form-select" name="exerciseFrequency" value={formData.exerciseFrequency || ''} onChange={handleChange}>
                        <option value="">Select Frequency</option>
                        <option value="Never">Never</option>
                        <option value="Rarely">Rarely</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Regularly">Regularly</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Sleep Hours / Day</label>
                      <input type="number" className="form-control" name="sleepHours" value={formData.sleepHours || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Diet Type (comma separated)</label>
                      <input type="text" className="form-control" name="dietType" value={(formData.dietType || []).join(', ')} onChange={(e) => handleArrayChange('dietType', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Other Diet Details</label>
                      <input type="text" className="form-control" name="dietTypeOther" value={formData.dietTypeOther || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Alcohol Consumption</label>
                      <select className="form-select" name="alcoholConsumption" value={formData.alcoholConsumption || ''} onChange={handleChange}>
                        <option value="">Select Consumption</option>
                        <option value="Never">Never</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Regularly">Regularly</option>
                      </select>
                    </div>
                    {['Occasionally', 'Regularly'].includes(formData.alcoholConsumption) && (
                      <div className="col-md-4">
                        <label className="form-label">Alcohol Frequency</label>
                        <input type="text" className="form-control" name="alcoholFrequency" value={formData.alcoholFrequency || ''} onChange={handleChange} />
                      </div>
                    )}

                    <hr className="my-4" />
                    <h5>Immunizations & Vaccines</h5>
                    <div className="col-md-3 mt-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="polioVaccine" checked={formData.polioVaccine || false} onChange={handleChange} id="polioVaccine" />
                        <label className="form-check-label" htmlFor="polioVaccine">Polio Vaccine</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Tetanus Shot</label>
                      <input type="date" className="form-control" name="tetanusShot" value={formData.tetanusShot ? new Date(formData.tetanusShot).toISOString().split('T')[0] : ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">COVID-19 Vaccine</label>
                      <input type="text" className="form-control" name="covidVaccine" value={formData.covidVaccine || ''} onChange={handleChange} />
                    </div>
                    <div className="col-md-3 mt-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name="covidBooster" checked={formData.covidBooster || false} onChange={handleChange} id="covidBooster" />
                        <label className="form-check-label" htmlFor="covidBooster">COVID Booster</label>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Activity size={48} className="text-secondary mb-3" />
              <h3>Select a patient to view and edit EHR</h3>
              <p>Or click "+ New" to add a new patient record to the system.</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default EHRManagement;
