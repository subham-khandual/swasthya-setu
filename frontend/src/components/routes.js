import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
const { Suspense, lazy } = React;

const ChatBot = lazy(() => import('./Chat/Chatbot'));
const Chat = lazy(() => import('./Chat/SuuSri/SuuSri'));
const AdminDashboard = lazy(() => import('./AdminDashboard/AdminDashboard'));
const AdminLogin = lazy(() => import('./AdminDashboard/AdminLogin'));
const AdminAuthOptions = lazy(() => import('./AdminDashboard/AdminAuthOptions'));
const AdminRegister = lazy(() => import('./AdminDashboard/AdminRegister'));
const DoctorsData = lazy(() => import('./DoctorsData/DoctorsData'));
const Accidents = lazy(() => import('./Doctorspecificscreen/Accidents'));
const DrBloodDonation = lazy(() => import('./Doctorspecificscreen/BloodDonation'));
const DrBloodrequests = lazy(() => import('./Doctorspecificscreen/DrBloodRequests'));
const AccidentDetection = lazy(() => import('./Features/AccidentDetection'));
const BloodDonation = lazy(() => import('./Features/BloodDonation'));
const FetchDonors = lazy(() => import("./Features/FetchDonors"));
const FetchRequest = lazy(() => import('./Features/Fetchrequest'));
const MedicineStore = lazy(() => import('./Map/MedicineStore'));
const Home = lazy(() => import('./Mobile/Home'));
const NavBar = lazy(() => import('./Mobile/NavBar'));
const AccidentAlert = lazy(() => import('./Mobile/pages/Accident/AccidentAlert'));
const Ambulance = lazy(() => import('./Mobile/pages/Ambulance/Ambulance'));
const BloodDonateReceive = lazy(() => import('./Mobile/pages/BloodDonateReceive/BloodDonateReceive'));
const AllLabs = lazy(() => import('./Mobile/pages/BloodTest/AllLabs'));
const BloodTest = lazy(() => import('./Mobile/pages/BloodTest/BloodTest'));
const CheckReport = lazy(() => import('./Mobile/pages/BloodTest/CheckReport'));
const DownloadReport = lazy(() => import('./Mobile/pages/BloodTest/DownloadReport'));
const FollowUp = lazy(() => import('./Mobile/pages/BloodTest/FollowUp'));
const TrackOrder = lazy(() => import('./Mobile/pages/BloodTest/TrackOrder'));
const Nutrition = lazy(() => import('./Mobile/pages/DietChart/Nutrition'));
const Doctors = lazy(() => import('./Mobile/pages/Doctors/Doctors'));
const EHRHealthData = lazy(() => import('./Mobile/pages/EHRData/EHRHealthData'));
const NotFound = lazy(() => import('./Mobile/pages/Error/404'));
const AllHospitals = lazy(() => import('./Mobile/pages/Hospitals/AllHospitals'));
// const AppointmentDetails = lazy(() => import('./Mobile/pages/Hospitals/AppointmentDetails'));
const VideoCall = lazy(() => import('./Features/VideoConsultation'));
const Billing = lazy(() => import('./Mobile/pages/Hospitals/Billing'));
const EmergencyServices = lazy(() => import('./Mobile/pages/Hospitals/EmergencyServices'));
const HospitalDashboard = lazy(() => import('./Mobile/pages/Hospitals/Hospital'));
const MedicalRecords = lazy(() => import('./Mobile/pages/Hospitals/MedicalRecords'));
const AllMedicineStore = lazy(() => import('./Mobile/pages/MedicineStore/AllMedicineStore'));
const Medicine = lazy(() => import('./Mobile/pages/MedicineStore/Medicine'));
const MedicineAll = lazy(() => import('./Mobile/pages/MedicineStore/MedicineAll'));
const MedicineStorePage = lazy(() => import('./Medicines/MedicineStore'));
const CartPage = lazy(() => import('./Medicines/CartPage'));
const Checkout = lazy(() => import('./Medicines/Checkout'));
const OrderConfirmation = lazy(() => import('./Medicines/OrderConfirmation'));
const OrderHistory = lazy(() => import('./Medicines/OrderHistory'));
const ManageMedicines = lazy(() => import('./AdminDashboard/ManageMedicines'));
const Profile = lazy(() => import('./Mobile/pages/Profile/Profile'));
const Notifications = lazy(() => import('./Mobile/pages/Notifications/Notifications'));
const Welcome = lazy(() => import('./Mobile/Welcome'));
const MedicineTimeTable = lazy(() => import('./Mobile/pages/MedicineTimeTable/MedicineTimeTable'));
const PatientsData = lazy(() => import('./Patientdata/PatientsData'));
const PatientProfile = lazy(() => import('./PatientProfile/PatientProfile'));
const Doctorheader = lazy(() => import('./RegisterasDoctor/Doctorheader'));
const DoctorLogin = lazy(() => import('./RegisterasDoctor/DoctorLogin'));
const DoctorRegister = lazy(() => import('./RegisterasDoctor/DoctorRegister'));
const Login = lazy(() => import('./RegisterasUser/Login'));
const Register = lazy(() => import('./RegisterasUser/Register'));
const RoleSelection = lazy(() => import('./RegisterasUser/RoleSelection'));
const Dashboard = lazy(() => import('./Screens/Dashboard'));
const Doctorpage = lazy(() => import('./Screens/Doctorpage'));
const Header = lazy(() => import('./Screens/Header'));
const Authpage = lazy(() => import('./Screens/Authpage'));
const AppointmentDetails = lazy(() => import('./Mobile/pages/Hospitals/AppointmentDetails'));
const NutritionistDietPlan = lazy(() => import('./Mobile/pages/Nutritionists/NutritionistDietPlan'));
const NutritionistAppointments = lazy(() => import('./Mobile/pages/Nutritionists/NutritionistAppointments'));
const EHRManagement = lazy(() => import('./AdminDashboard/EHRManagement'));
const MedicalHistory = lazy(() => import('./Mobile/pages/EHRData/MedicineHistory'));
const PublicTracker = lazy(() => import('./Public/PublicTracker'));

// Helper to wrap protected routes
const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function RoutesOfThePage() {
    return (
        <Router>
            <div className="App">
                <Suspense fallback={
                    <div className="d-flex justify-content-center align-items-center vh-100">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                }>
                <Routes>
                    {/* Public routes - no login required */}
                    <Route path='/Landingpage' element={<><Header /><Dashboard /></>} />
                    <Route path='/' element={<><Header /><Authpage /></>} />
                    <Route path="/login-as-user" element={<><Header /><Login /></>} />
                    <Route path="/register-as-user" element={<><Header /><Register /></>} />
                    <Route path="/select-role" element={<><Header /><RoleSelection /></>} />
                    <Route path="/login-as-doctor" element={<><Header /><DoctorLogin /></>} />
                    <Route path="/register-as-doctor" element={<><Header /><DoctorRegister /></>} />
                    <Route path="/login-as-admin" element={<><Header /><AdminLogin /></>} />
                    <Route path="/admin-auth-options" element={<><Header /><AdminAuthOptions /></>} />
                    <Route path="/register-as-admin" element={<><Header /><AdminRegister /></>} />
                    <Route path='/Welcome' element={<><Welcome /></>} />
                    <Route path='/track/:token' element={<PublicTracker />} />

                    {/* Protected routes - login required */}
                    <Route path="/admin-dashboard" element={<P><AdminDashboard /></P>} />
                    <Route path="/dashboard" element={<P><><Header /><Dashboard /></></P>} />
                    <Route path="/blood-donation" element={<P><><BloodDonateReceive /><NavBar /></></P>} />
                    <Route path="/blood-donation-check" element={<P><><Header /><FetchDonors /></></P>} />
                    <Route path="/accident-detection" element={<P><><Header /><AccidentDetection /></></P>} />
                    <Route path='/blood-request-check' element={<P><><Header /><FetchRequest /></></P>} />
                    <Route path="/map" element={<P><><Header /><MedicineStore /></></P>} />

                    {/* Doctor page routes */}
                    <Route path='/blood-donations-dr-page' element={<P><><Doctorheader /><DrBloodDonation /></></P>} />
                    <Route path='/blood-requests-dr-page' element={<P><><Doctorheader /><DrBloodrequests /></></P>} />
                    <Route path='/accident-dr-page' element={<P><><Doctorheader /><Accidents /></></P>} />

                    {/* Patient Data */}
                    <Route path='/PatientsData' element={<P><><Header /><PatientsData /></></P>} />
                    <Route path='/Patient' element={<P><><Header /><PatientProfile patientId="67c35f1c8b405ef1defec414" /></></P>} />
                    <Route
                        path='/doctor-screen'
                        element={
                            <P>
                                <>
                                    <Doctorheader />
                                    <div className="container mt-4">
                                        <Doctorpage />
                                    </div>
                                </>
                            </P>
                        }
                    />
                    <Route path='/DoctorsData' element={<P><><Doctorheader /><DoctorsData /></></P>} />
                    <Route path='/Doctor' element={<P><><Doctorheader /><PatientProfile patientId="67c35f1c8b405ef1defec414" /></></P>} />

                    {/* Mobile Routes */}
                    <Route path='/home' element={<P><><Home /><NavBar /></></P>} />
                    <Route path='/medicine-timetable' element={<P><><MedicineTimeTable /><NavBar /></></P>} />
                    <Route path='/profile' element={<P><><Profile /><NavBar /></></P>} />
                    <Route path='/blood-donate-receive' element={<P><><BloodDonateReceive /><NavBar /></></P>} />
                    <Route path='/accident-alert' element={<P><><AccidentAlert /><NavBar /></></P>} />
                    <Route path='/blood-test' element={<P><><BloodTest /><NavBar /></></P>} />
                    <Route path="/all-labs" element={<P><><AllLabs /><NavBar /></></P>} />
                    <Route path='/medicine' element={<P><><Medicine /><NavBar /></></P>} />
                    <Route path='/medicine-stores' element={<P><><AllMedicineStore /><NavBar /></></P>} />
                    <Route path='/medicine-all' element={<P><><MedicineAll /><NavBar /></></P>} />
                    <Route path='/medicine-history' element={<P><><MedicalHistory /><NavBar /></></P>} />
                    <Route path='/medicines' element={<P><><Header /><MedicineStorePage /></></P>} />
                    <Route path='/cart' element={<P><><Header /><CartPage /></></P>} />
                    <Route path='/checkout' element={<P><><Header /><Checkout /></></P>} />
                    <Route path='/order-confirmation/:id' element={<P><><Header /><OrderConfirmation /></></P>} />
                    <Route path='/order-history' element={<P><><Header /><OrderHistory /></></P>} />
                    <Route path='/admin/medicines' element={<P><><Header /><ManageMedicines /></></P>} />
                    <Route path='/ehr-management' element={<P><><Header /><EHRManagement /></></P>} />
                    <Route path="/doctors" element={<P><Doctors /></P>} />
                    <Route path="/check-report" element={<P><><CheckReport /><NavBar /></></P>} />
                    <Route path="/download-report" element={<P><><DownloadReport /><NavBar /></></P>} />
                    <Route path="/follow-up" element={<P><><FollowUp /><NavBar /></></P>} />
                    <Route path="/track-order" element={<P><><TrackOrder /></></P>} />
                    <Route path="/nutrition" element={<P><><Nutrition /><NavBar /></></P>} />
                    <Route path="/EHRHealthData" element={<P><><EHRHealthData patientId="67ccc44c671f5aa635f458e1" /><NavBar /></></P>} />
                    <Route path='/ambulance' element={<P><><Ambulance /><NavBar /></></P>} />
                    <Route path='/suusri' element={<P><><Chat /><NavBar /></></P>} />
                    <Route path='/hospitals' element={<P><><HospitalDashboard /><NavBar /></></P>} />
                    <Route path="/all-hospitals" element={<P><><AllHospitals /><NavBar /></></P>} />
                    <Route
                      path="/medical-records"
                      element={<P><><EHRManagement /></></P>}
                    />
                    <Route path="/emergency-services" element={<P><><EmergencyServices /><NavBar /></></P>} />
                    <Route path="/billing" element={<P><><Billing /><NavBar /></></P>} />
                    <Route path="/appointment/:bookingId" element={<P><AppointmentDetails /></P>} />
                    <Route path="/nutritionists" element={<P><><NutritionistDietPlan /><NavBar /></></P>} />
                    <Route path="/nutritionist-appointments" element={<P><><NutritionistAppointments /><NavBar /></></P>} />
                    <Route path='/vedio-calling' element={<P><VideoCall /></P>} />
                    <Route path='/notifications' element={<P><Notifications /></P>} />

                    {/* 404 page */}
                    <Route path='*' element={<NotFound />} />
                </Routes>
                </Suspense>
            </div>
        </Router>
    );
}

export default RoutesOfThePage;
