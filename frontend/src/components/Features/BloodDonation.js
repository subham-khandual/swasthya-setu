import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function BloodDonation() {
  // State for Donate Blood form
  const [donateBloodType, setDonateBloodType] = useState('');
  const [donateQuantity, setdonateQuantity] = useState('');
  const [donateLocation, setDonateLocation] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');

  // State for Request Blood form
  const [requestBloodType, setRequestBloodType] = useState('');
  const [requestQuantity, setRequestQuantity] = useState('');
  const [requestLocation, setRequestLocation] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [priority, setPriority] = useState('');

  // State to hold request data
  const [, setRequests] = useState([]);

  // Handle Donation
  const handleDonation = async (e) => {
    e.preventDefault();

    const donationData = {
      bloodType: donateBloodType,
      quantity: donateQuantity,
      location: donateLocation,
      name: donorName,
      contact: donorContact,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/blood/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Response:', errorData);
        toast.error(errorData.error || 'Failed to submit donation.');
      } else {
        const result = await response.json();
        toast.success(result.message || 'Thank you for your donation!');
      }
    } catch (err) {
      console.error('Error during donation:', err);
      toast.error('An error occurred. Please try again.');
    }
  };

  // Handle Request
  const handleRequest = async (e) => {
    e.preventDefault();

    const requestData = {
      bloodType: requestBloodType,
      quantity: requestQuantity,
      location: requestLocation,
      patientName: patientName,
      contact: patientContact,
      priority: priority,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/blood/request-blood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Response:', errorData);
        toast.error(errorData.error || 'Failed to submit request.');
      } else {
        const result = await response.json();
        toast.success(result.message || 'Request submitted successfully!');
        // Fetch updated request data after successful submission
        const requestResponse = await fetch(`${API_BASE_URL}/api/blood/request-blood`, { credentials: 'include' });
        if (requestResponse.ok) {
          const requestData = await requestResponse.json();
          setRequests(requestData);
        }
      }
    } catch (err) {
      console.error('Error during request:', err);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4" style={{ color: '#1b558b' }}>
        Blood Donation & Request
      </h2>
      <div className="row">
        {/* Donate Blood Section */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-lg rounded-3 border-0">
            <div className="card-body">
              <h3 className="card-title" style={{ color: '#1b558b' }}>
                Donate Blood
              </h3>
              <form onSubmit={handleDonation}>
                {/* Form fields for donation */}
                <div className="form-group mb-3">
                  <label htmlFor="donateBloodType" style={{ color: '#1b558b' }}>
                    Blood Type
                  </label>
                  <select
                    className="form-control"
                    id="donateBloodType"
                    value={donateBloodType}
                    onChange={(e) => setDonateBloodType(e.target.value)}
                    required
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="donateQuantity" style={{ color: '#1b558b' }}>
                    Quantity (ml)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="donateQuantity"
                    value={donateQuantity}
                    onChange={(e) => setdonateQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="donorName" style={{ color: '#1b558b' }}>
                    Donor Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="donorName"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="donorContact" style={{ color: '#1b558b' }}>
                    Contact Information
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="donorContact"
                    value={donorContact}
                    onChange={(e) => setDonorContact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="donateLocation" style={{ color: '#1b558b' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="donateLocation"
                    value={donateLocation}
                    onChange={(e) => setDonateLocation(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    backgroundColor: '#1b558b',
                    color: 'white',
                    width: '100%',
                    padding: '10px',
                  }}
                >
                  Donate
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Request Blood Section */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-lg rounded-3 border-0">
            <div className="card-body">
              <h3 className="card-title" style={{ color: '#1b558b' }}>
                Request Blood
              </h3>
              <form onSubmit={handleRequest}>
                {/* Form fields for request */}
                <div className="form-group mb-3">
                  <label htmlFor="requestBloodType" style={{ color: '#1b558b' }}>
                    Blood Type
                  </label>
                  <select
                    className="form-control"
                    id="requestBloodType"
                    value={requestBloodType}
                    onChange={(e) => setRequestBloodType(e.target.value)}
                    required
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="requestQuantity" style={{ color: '#1b558b' }}>
                    Quantity (ml)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="requestQuantity"
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="patientName" style={{ color: '#1b558b' }}>
                    Patient Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="patientLocation" style={{ color: '#1b558b' }}>
                    Location (Hospital)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="patientLocation"
                    value={requestLocation}
                    onChange={(e) => setRequestLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="patientContact" style={{ color: '#1b558b' }}>
                    Contact Information
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="patientContact"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="requestPriority" style={{ color: '#1b558b' }}>
                    Priority
                  </label>
                  <select
                    className="form-control"
                    id="requestPriority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    backgroundColor: '#1b558b',
                    color: 'white',
                    width: '100%',
                    padding: '10px',
                  }}
                >
                  Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default BloodDonation;
