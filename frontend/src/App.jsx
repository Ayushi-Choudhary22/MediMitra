import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import VideoCall from './pages/VideoCall';
import PatientRegister from './pages/PatientRegister';
import PublicHistory from './pages/PublicHistory';

// Receptionist
import ReceptionistLayout from './pages/receptionist/Layout';
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import TestInfo from './pages/receptionist/TestInfo';
import QueueView from './pages/receptionist/QueueView';
import ReceptionistHistory from './pages/receptionist/History';
import BedAvailability from './pages/receptionist/Beds';

// Doctor
import DoctorLayout from './pages/doctor/Layout';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatients from './pages/doctor/Patients';
import DoctorHistory from './pages/doctor/History';
import QRScanner from './pages/doctor/QRScanner';

// Patient
import PatientLayout from './pages/patient/Layout';
import PatientDashboard from './pages/patient/Dashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'receptionist') return <Navigate to="/receptionist" />;
  if (user.role === 'doctor') return <Navigate to="/doctor" />;
  if (user.role === 'patient') return <Navigate to="/patient" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<PatientRegister />} />
          <Route path="/history/:patientId" element={<PublicHistory />} />

          {/* Receptionist */}
          <Route path="/receptionist" element={
            <ProtectedRoute role="receptionist"><ReceptionistLayout /></ProtectedRoute>
          }>
            <Route index element={<ReceptionistDashboard />} />
            <Route path="register-patient" element={<RegisterPatient />} />
            <Route path="queue" element={<QueueView />} />
            <Route path="history" element={<ReceptionistHistory />} />
            <Route path="beds" element={<BedAvailability />} />
            <Route path="tests" element={<TestInfo />} />
          </Route>

          {/* Doctor */}
          <Route path="/doctor" element={
            <ProtectedRoute role="doctor"><DoctorLayout /></ProtectedRoute>
          }>
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="history" element={<DoctorHistory />} />
            <Route path="scanner" element={<QRScanner />} />
          </Route>

          {/* Patient */}
          <Route path="/patient" element={
            <ProtectedRoute role="patient"><PatientLayout /></ProtectedRoute>
          }>
            <Route index element={<PatientDashboard />} />
          </Route>
          {/* Video Call — public route, opens camera */}
          <Route path="/video-call" element={<VideoCall />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
