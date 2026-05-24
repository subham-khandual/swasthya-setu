import API_BASE_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Droplets, 
  AlertTriangle, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  BarChart3, 
  Bell, 
  CreditCard, 
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Calendar,
  Search,
  Plus,
  Download
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../assets/SwasthyaSetuLogo.png';
import styles from './AdminDashboard.module.css';
import adminImage from '../../assets/admin-login-main.png';
import AmbulanceTracker from './AmbulanceTracker';

// Mock data for new sections
const MOCK_USERS = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', type: 'Patient', status: 'Active' },
    { id: 2, name: 'Dr. Priya Das', email: 'priya@example.com', type: 'Doctor', status: 'Pending' },
    { id: 3, name: 'Subham Khandual', email: 'subham@example.com', type: 'Donor', status: 'Active' },
];

const MOCK_EMERGENCIES = [
    { id: 101, location: 'Baramunda, Bhubaneswar', type: 'Accident', time: '5 mins ago', status: 'Assigning' },
    { id: 102, location: 'Jaydev Vihar', type: 'Medical Emergency', time: '12 mins ago', status: 'Ambulance Enroute' },
];

const MOCK_DONORS = [
    { id: 1, name: 'Anjali Mohanty', bloodType: 'O+', location: 'Cuttack', status: 'Verified' },
    { id: 2, name: 'Vikram Singh', bloodType: 'A-', location: 'Bhubaneswar', status: 'Pending' },
];

const MOCK_DOCTORS = [
    { id: 1, name: 'Dr. Alok Verma', specialty: 'Cardiology', hospital: 'Apollo', status: 'Approved' },
    { id: 2, name: 'Dr. Meera Jha', specialty: 'Pediatrics', hospital: 'AIIMS', status: 'Pending' },
];

const MOCK_MEDICINES = [
    { id: 1, name: 'Paracetamol 500mg', pharmacy: 'MedPlus', stock: 150, price: '₹40' },
    { id: 2, name: 'Amoxicillin', pharmacy: 'Apollo Pharmacy', stock: 45, price: '₹120' },
];

const MOCK_TESTS = [
    { id: 1, patient: 'Subham Khandual', test: 'Complete Blood Count', lab: 'PathLab', status: 'Report Pending' },
    { id: 2, patient: 'Rahul Sharma', test: 'Lipid Profile', lab: 'SRL Diagnostics', status: 'Completed' },
];

const MOCK_TRANSACTIONS = [
    { id: 'TXN001', user: 'Subham Khandual', amount: '₹1250', date: '2026-03-20', status: 'Success' },
    { id: 'TXN002', user: 'Rahul Sharma', amount: '₹450', date: '2026-03-21', status: 'Success' },
];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ totalUsers: 0, totalDoctors: 0, emergencyCases: 12, bloodRequests: 8 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Live data states
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [emergencies, setEmergencies] = useState([]);
    const [donors, setDonors] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || user.userType !== 'admin') {
                    toast.error('Access Denied: Admin privileges required.');
                    navigate('/');
                    return;
                }

                // Fetch stats
                try {
                    const statsRes = await axios.get(`${API_BASE_URL}/api/admin/stats`, { withCredentials: true });
                    if (statsRes.data.success) {
                        setStats(prev => ({ ...prev, ...statsRes.data.stats }));
                    }
                } catch (e) { console.warn("Stats API failed"); }

                // Fetch Medicines
                try {
                    const medRes = await axios.get(`${API_BASE_URL}/api/medicines`);
                    setMedicines(medRes.data);
                } catch (e) { console.warn("Medicines API failed"); }

                // Fetch Orders
                try {
                    const orderRes = await axios.get(`${API_BASE_URL}/api/orders`);
                    setOrders(orderRes.data);
                } catch (e) { console.warn("Orders API failed"); }

                // Fetch Transactions/Bills
                try {
                    const billRes = await axios.get(`${API_BASE_URL}/api/billing`);
                    setTransactions(billRes.data);
                } catch (e) { console.warn("Billing API failed"); }

                // Fetch Emergencies
                try {
                    const emergencyRes = await axios.get(`${API_BASE_URL}/api/accident/accidents`);
                    setEmergencies(emergencyRes.data.accidents || []);
                } catch (e) { console.warn("Emergency API failed"); }

                // Fetch Users
                try {
                    const userRes = await axios.get(`${API_BASE_URL}/api/admin/users`);
                    setUsers(userRes.data);
                } catch (e) { console.warn("Users API failed"); }

                // Fetch Doctors
                try {
                    const docRes = await axios.get(`${API_BASE_URL}/api/admin/doctors`);
                    setDoctors(docRes.data);
                } catch (e) { console.warn("Doctors API failed"); }

                // Fetch Donors
                try {
                    const donorRes = await axios.get(`${API_BASE_URL}/api/blood/donations`);
                    setDonors(donorRes.data);
                } catch (e) { console.warn("Donors API failed"); }

            } catch (err) {
                console.error('Error fetching admin data:', err);
                setError('Data loading error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        toast.info("Logged out successfully");
        navigate('/');
    };

    const handleShowOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleTrackPosition = (alert) => {
        setSelectedAlert(alert);
        setIsTrackingModalOpen(true);
    };

    const downloadInvoice = (txn) => {
        // Generate QR code data URL from hidden canvas
        const qrCanvas = document.getElementById(`qr-gen-${txn._id || txn.id}`);
        const qrDataUrl = qrCanvas ? qrCanvas.toDataURL("image/png") : null;

        Promise.all([
          import("jspdf"),
          import("jspdf-autotable")
        ]).then(([jsPDFModule, autoTableModule]) => {
          try {
            const { jsPDF } = jsPDFModule;
            const doc = new jsPDF();
            
            // Header with Logo
            const img = new Image();
            img.src = logo;
            doc.addImage(img, 'PNG', 10, 10, 30, 30);
            
            doc.setFontSize(22);
            doc.setTextColor(27, 85, 139); // Match theme color
            doc.text("MEDICAL INVOICE", 105, 25, { align: "center" });
            
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text("Swasthya Setu Healthcare", 105, 35, { align: "center" });
            
            // Transaction Details
            doc.setFontSize(10);
            doc.setTextColor(127, 140, 141);
            doc.text(`Transaction ID: ${txn._id || txn.id}`, 14, 55);
            doc.text(`Date: ${txn.date ? new Date(txn.date).toLocaleDateString() : 'N/A'}`, 14, 62);
            doc.text(`Status: ${txn.status}`, 14, 69);

            // Add QR Code if available
            if (qrDataUrl) {
                doc.addImage(qrDataUrl, 'PNG', 160, 45, 35, 35);
                doc.setFontSize(8);
                doc.text("Scan to Verify", 177, 83, { align: "center" });
            }
      
            // Bill Details Table
            const autoTable = autoTableModule.default || autoTableModule;
            autoTable(doc, {
              startY: 90,
              head: [['Description', 'Amount']],
              body: [
                [txn.service || 'Medical Service', `₹${txn.amount.toString().replace('₹', '')}`],
              ],
              foot: [['Total Amount', `₹${txn.amount.toString().replace('₹', '')}`]],
              theme: 'grid',
              headStyles: { fillColor: [27, 85, 139] },
              footStyles: { fillColor: [46, 204, 113] }
            });
      
            // Footer
            doc.setFontSize(10);
            doc.setTextColor(149, 165, 166);
            const finalY = (doc.previousAutoTable && doc.previousAutoTable.finalY) || (doc.lastAutoTable && doc.lastAutoTable.finalY) || 120;
            doc.text("This is a computer-generated invoice.", 105, finalY + 20, { align: "center" });
      
            // Download PDF
            doc.save(`Invoice_${(txn._id || txn.id).substring(0, 10)}.pdf`);
            toast.success("Invoice downloaded!");
          } catch (internalErr) {
            console.error("PDF generation error:", internalErr);
            toast.error(`PDF generation failed: ${internalErr.message}`);
          }
        }).catch(err => {
          console.error("Failed to load PDF libraries:", err);
          toast.error(`Module loading failed: ${err.message}`);
        });
    };

    const handleUpdateEmergencyStatus = async (id, newStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/api/accident/accidents/${id}`, { status: newStatus });
            toast.success(`Emergency status updated to ${newStatus}`);
            // Refresh emergencies
            const emergencyRes = await axios.get(`${API_BASE_URL}/api/accident/accidents`);
            setEmergencies(emergencyRes.data.accidents || []);
        } catch (err) {
            console.error("Failed to update status:", err);
            toast.error("Failed to update status");
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
        { id: 'users', label: 'User Management', icon: <Users size={20} /> },
        { id: 'blood', label: 'Blood Donation', icon: <Droplets size={20} /> },
        { id: 'emergency', label: 'Emergency Alerts', icon: <AlertTriangle size={20} /> },
        { id: 'doctors', label: 'Doctors & Hospitals', icon: <Stethoscope size={20} /> },
        { id: 'tests', label: 'Tests & Reports', icon: <FlaskConical size={20} /> },
        { id: 'pharmacy', label: 'Medicine Stores', icon: <Pill size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'billing', label: 'Payment & Billing', icon: <CreditCard size={20} /> },
        { id: 'system', label: 'System Control', icon: <Settings size={20} /> },
    ];

    if (loading) return <div className={styles.loading}>Loading Admin Panel...</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><BarChart3 className="me-2" /> System Analytics</h2>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon} style={{ color: '#1b558b' }}><Users /></div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats.totalUsers}</span>
                                    <span className={styles.statLabel}>Total Users</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon} style={{ color: '#00b894' }}><Stethoscope /></div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats.totalDoctors}</span>
                                    <span className={styles.statLabel}>Active Doctors</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon} style={{ color: '#e74c3c' }}><AlertTriangle /></div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats.emergencyCases}</span>
                                    <span className={styles.statLabel}>Emergency Cases</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon} style={{ color: '#ff7675' }}><Droplets /></div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats.bloodRequests}</span>
                                    <span className={styles.statLabel}>Blood Requests</span>
                                </div>
                            </div>
                        </div>

                        <div className="row mt-4">
                            <div className="col-md-6">
                                <div className={styles.statCard} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <h4 className="mb-3">Disease Trends (Monthly)</h4>
                                    <div className="w-100" style={{ height: '120px', background: 'linear-gradient(90deg, #1b558b 0%, #3498db 100%)', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', bottom: 10, left: 20, color: '#fff', fontSize: '12px' }}>Viral Fever - 45%</div>
                                        <div style={{ position: 'absolute', bottom: 30, left: 20, color: '#fff', fontSize: '12px' }}>Diabetes - 20%</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className={styles.statCard} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <h4 className="mb-3">User Distribution</h4>
                                    <div className="d-flex w-100 align-items-center justify-content-center" style={{ height: '120px' }}>
                                        <div style={{ height: '80px', width: '80px', borderRadius: '50%', border: '15px solid #1b558b', borderRightColor: '#eee' }}></div>
                                        <div className="ms-3">
                                            <div className="small"><span style={{ color: '#1b558b' }}>●</span> Male: 65%</div>
                                            <div className="small"><span style={{ color: '#eee' }}>●</span> Female: 35%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className={styles.section}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className={styles.sectionTitle} style={{ margin: 0 }}><Users className="me-2" /> User Management</h2>
                            <div className="d-flex gap-2">
                                <button className={styles.actionBtn} style={{ background: '#1b558b', color: '#fff' }} onClick={() => navigate('/register-as-user')}><Plus size={16} /> Add User</button>
                                <div className="position-relative">
                                    <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: '#718096' }} />
                                    <input type="text" placeholder="Search..." style={{ padding: '8px 10px 8px 35px', borderRadius: '8px', border: '1px solid #edf2f7' }} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(users.length > 0 ? users : MOCK_USERS).map(user => (
                                        <tr key={user._id || user.id}>
                                            <td style={{ fontWeight: '600' }}>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td><span className="badge bg-light text-dark">{user.userType || user.type}</span></td>
                                            <td><span className={`${styles.statusBadge} ${(user.status || 'Active') === 'Active' ? styles.activeBadge : styles.pendingBadge}`}>{user.status || 'Active'}</span></td>
                                            <td>
                                                <button className={`${styles.actionBtn} ${styles.approve}`} title="Approve"><CheckCircle size={14} /></button>
                                                <button className={`${styles.actionBtn} ${styles.block}`} title="Block"><ShieldAlert size={14} /></button>
                                                <button className={`${styles.actionBtn} ${styles.delete}`} title="Delete"><XCircle size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'blood':
                return (
                    <div className={styles.section}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className={styles.sectionTitle} style={{ margin: 0 }}><Droplets className="me-2" /> Blood Management</h2>
                            <span className="badge bg-primary">A+ Stock: Normal</span>
                        </div>
                        <div className="row">
                            <div className="col-md-8">
                                <div className={styles.tableContainer}>
                                    <table className={styles.adminTable}>
                                        <thead>
                                            <tr>
                                                <th>Donor</th>
                                                <th>Group</th>
                                                <th>Location</th>
                                                <th>Verification</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(donors.length > 0 ? donors : MOCK_DONORS).map(donor => (
                                                <tr key={donor._id || donor.id}>
                                                    <td>{donor.donaerName || donor.name}</td>
                                                    <td><strong className="text-danger">{donor.bloodType}</strong></td>
                                                    <td>{donor.location}</td>
                                                    <td><span className={styles.activeBadge}>{donor.status || 'Verified'}</span></td>
                                                    <td><button className="btn btn-sm btn-outline-primary">Match Donor</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm p-3">
                                    <h6>Quick Match</h6>
                                    <select className="form-select mb-2">
                                        <option>Select Patient Query</option>
                                        <option>Rahul (B- Need)</option>
                                    </select>
                                    <button className="btn btn-sm btn-danger w-100">Find Compatible Donors</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'emergency':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><AlertTriangle className="me-2" /> Emergency Control Room</h2>
                        <div className="alerts-feed mt-3">
                            {(emergencies.length > 0 ? emergencies : MOCK_EMERGENCIES).map(alert => (
                                <div key={alert._id || alert.id} className={styles.alertItem} style={{ borderLeftColor: (alert.status || 'Assigning') === 'Assigning' ? '#e74c3c' : '#3498db', background: (alert.status || 'Assigning') === 'Assigning' ? '#fff5f5' : '#f0f7ff' }}>
                                    <div>
                                        <h5 className="mb-1" style={{ fontWeight: '700' }}>{alert.type || 'Accident'} Alert</h5>
                                        <p className="mb-0 text-muted small"><Search size={12} /> {alert.location} • {alert.time || new Date(alert.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-end">
                                        <span className={`badge mb-2 ${(alert.status || 'Assigning') === 'Assigning' ? 'bg-danger' : (alert.status === 'Completed' ? 'bg-success' : 'bg-primary')}`} style={{ display: 'block' }}>{alert.status || 'Assigning'}</span>
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button className="btn btn-sm btn-dark" style={{ fontSize: '11px' }} onClick={() => handleTrackPosition(alert)}>Track</button>
                                            {alert.status !== 'Completed' && (
                                                <button className="btn btn-sm btn-success" style={{ fontSize: '11px' }} onClick={() => handleUpdateEmergencyStatus(alert._id, 'Completed')}>Complete</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'doctors':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Stethoscope className="me-2" /> Professional Management</h2>
                        <div className="table-responsive">
                            <table className={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th>Doctor Name</th>
                                        <th>Specialty</th>
                                        <th>Hospital</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(doctors.length > 0 ? doctors : MOCK_DOCTORS).map(doc => (
                                        <tr key={doc._id || doc.id}>
                                            <td className="fw-bold">{doc.name}</td>
                                            <td>{doc.specialty}</td>
                                            <td>{doc.hospital || 'Private Clinic'}</td>
                                            <td><span className={(doc.status || 'Approved') === 'Approved' ? styles.activeBadge : styles.pendingBadge}>{doc.status || 'Approved'}</span></td>
                                            <td>
                                                <button className={`${styles.actionBtn} ${styles.approve}`} title="Manage Schedule"><Calendar size={14} /></button>
                                                <button className={`${styles.actionBtn} ${styles.block}`} title="Remove"><XCircle size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'tests':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><FlaskConical className="me-2" /> Blood Tests & Reports</h2>
                        <div className={styles.tableContainer}>
                            <table className={styles.adminTable}>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Name</th>
                                        <th>Laboratory</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_TESTS.map(test => (
                                        <tr key={test.id}>
                                            <td>{test.patient}</td>
                                            <td>{test.test}</td>
                                            <td>{test.lab}</td>
                                            <td><span className={test.status === 'Completed' ? styles.activeBadge : styles.pendingBadge}>{test.status}</span></td>
                                            <td>{test.status === 'Report Pending' && <button className="btn btn-sm btn-primary py-0" style={{ fontSize: '11px' }}>Verify Report</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'pharmacy':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Pill className="me-2" /> Medicine Store Control</h2>
                        
                        <div className="mb-4">
                            <h6>Live Inventory</h6>
                            <div className={styles.tableContainer}>
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Price</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(medicines.length > 0 ? medicines : MOCK_MEDICINES).map(med => (
                                            <tr key={med._id || med.id}>
                                                <td className="fw-bold">{med.name}</td>
                                                <td>{med.category || 'Pharmacy'}</td>
                                                <td><span className={med.stock < 10 ? 'text-danger fw-bold' : ''}>{med.stock} units</span></td>
                                                <td>₹{med.price}</td>
                                                <td><button className="btn btn-sm btn-outline-dark py-0" style={{ fontSize: '11px' }}>Edit</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h6>Recent Customer Orders</h6>
                            <div className={styles.tableContainer}>
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? orders.map(order => (
                                            <tr key={order._id}>
                                                <td><code>{order._id.substring(0, 8)}</code></td>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td>₹{order.totalAmount}</td>
                                                <td><span className={styles.activeBadge}>{order.status}</span></td>
                                                <td><button 
                                                    className="btn btn-sm btn-link py-0" 
                                                    style={{ fontSize: '11px' }}
                                                    onClick={() => handleShowOrderDetails(order)}
                                                >
                                                    Details</button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan="5" className="text-center py-3 text-muted">No recent orders found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Bell className="me-2" /> Global Broadcast System</h2>
                        <div className="card border-0 p-4" style={{ background: '#f8fafc', borderRadius: '15px' }}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Broadcast Title</label>
                                <input type="text" className="form-control" placeholder="Critical Update / Announcement" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Message Content</label>
                                <textarea className="form-control" rows="3" placeholder="Write message..."></textarea>
                            </div>
                            <button className="btn btn-primary fw-bold" onClick={() => toast.success("Broadcast Dispatched!")}>
                                Dispatch Broadcast
                            </button>
                        </div>
                    </div>
                );

            case 'billing':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><CreditCard className="me-2" /> Financial Records</h2>
                        <div className={styles.tableContainer}>
                            <table className={styles.adminTable}>
                                <thead>
                                        <tr>
                                            <th>Transaction ID</th>
                                            <th>Service</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(transactions.length > 0 ? transactions : MOCK_TRANSACTIONS).map(txn => (
                                            <tr key={txn._id || txn.id}>
                                                <td><code>{(txn._id || txn.id).substring(0, 10)}</code></td>
                                                <td>{txn.service || 'Appointment'}</td>
                                                <td className="fw-bold">₹{txn.amount}</td>
                                                <td>{txn.date ? new Date(txn.date).toLocaleDateString() : txn.date}</td>
                                                <td><span className={styles.activeBadge}>{txn.status}</span></td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                                        onClick={() => downloadInvoice(txn)}
                                                        style={{ fontSize: '11px', borderRadius: '8px' }}
                                                    >
                                                        <Download size={14} /> Invoice
                                                    </button>
                                                    <div style={{ display: 'none' }}>
                                                        <QRCodeCanvas 
                                                            id={`qr-gen-${txn._id || txn.id}`} 
                                                            value={JSON.stringify({ id: txn._id || txn.id, amount: txn.amount, date: txn.date })} 
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'system':
                return (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Settings className="me-2" /> System Preferences</h2>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="card p-3 border-0 bg-light">
                                    <h6>API Integrity</h6>
                                    <div className="d-flex justify-content-between">
                                        <span>Server Uptime</span>
                                        <span className="text-success">99.9%</span>
                                    </div>
                                    <button className="btn btn-dark btn-sm mt-3">Reset API Gateway</button>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card p-3 border-0 bg-light">
                                    <h6>Security Logs</h6>
                                    <p className="small text-muted mb-2">3 failed login attempts from IP 192.168.1.1</p>
                                    <button className="btn btn-danger btn-sm">Clear Logs</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-5 text-muted">
                        <BarChart3 size={40} className="mb-3 opacity-25" />
                        <p>Please select a valid module from the sidebar.</p>
                    </div>
                );
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className={styles.sidebar}>
                <div className={styles.profileSection}>
                    <img src={adminImage} alt="Admin" className={styles.adminImg} fetchpriority="high" decoding="async" />
                    <h3 className="mb-1" style={{ fontSize: '18px', fontWeight: '700' }}>Admin Panel</h3>
                    <p className="small mb-0 opacity-75">Swasthya Setu HQ</p>
                </div>
                
                <nav className={styles.navLinks}>
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.activeNavItem : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className={styles.logoutBtn}>
                    <button className={styles.navItem} style={{ width: '100%', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }} onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div>
                        <h1 className="mb-1">Control Center</h1>
                        <p className="text-muted small mb-0">Managing the health of the community with precision.</p>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <div className="text-end d-none d-md-block">
                            <span className="badge bg-success" style={{ fontSize: '10px' }}>SYSTEM ONLINE</span>
                            <p className="small text-muted mb-0">{new Date().toLocaleDateString()}</p>
                        </div>
                        <img src={adminImage} alt="Profile" loading="lazy" decoding="async" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    </div>
                </header>

                {renderContent()}

                {/* Modal for Order Details */}
                {isDetailsModalOpen && selectedOrder && (
                    <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
                                <div className="modal-header bg-dark text-white" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                    <h5 className="modal-title">Order Details: {selectedOrder._id.substring(0, 8)}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setIsDetailsModalOpen(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-4 d-flex justify-content-between">
                                        <div>
                                            <p className="text-muted small mb-0">Customer ID</p>
                                            <p className="fw-bold mb-0">{selectedOrder.userId}</p>
                                        </div>
                                        <div className="text-end">
                                            <p className="text-muted small mb-0">Status</p>
                                            <p className="badge bg-success mb-0">{selectedOrder.status}</p>
                                        </div>
                                    </div>
                                    
                                    <h6 className="border-bottom pb-2">Medicine Items</h6>
                                    <div className="list-group list-group-flush mb-4">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <div>
                                                    <p className="mb-0 fw-bold">{item.name || 'Medicine Item'}</p>
                                                    <p className="mb-0 text-muted small">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="mb-0 fw-bold">₹{item.price * item.quantity}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                        <h5 className="mb-0">Total Amount</h5>
                                        <h5 className="mb-0 text-success">₹{selectedOrder.totalAmount}</h5>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                                    <button className="btn btn-secondary w-100" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tracking Modal */}
                {isTrackingModalOpen && selectedAlert && (
                    <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.7)", zIndex: 1070 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '900px' }}>
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", height: '650px' }}>
                                <div className="modal-header bg-danger text-white p-4" style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }}>
                                    <div>
                                        <h5 className="modal-title d-flex align-items-center">
                                            <AlertTriangle className="me-2" /> Live Tracking: {selectedAlert.type || 'Emergency'}
                                        </h5>
                                        <p className="mb-0 small opacity-75">{selectedAlert.location}, {selectedAlert.city}</p>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setIsTrackingModalOpen(false)}></button>
                                </div>
                                <div className="modal-body p-0" style={{ flexGrow: 1 }}>
                                    <AmbulanceTracker alert={selectedAlert} onClose={() => setIsTrackingModalOpen(false)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
