import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Public & Feature Pages
import LandingPage from './pages/LandingPage';
import P3FraudDetection from './pages/P3FraudDetection';
import P4RegistryPanel from './pages/P4RegistryPanel';
import P4AcLandPanel from './pages/P4AcLandPanel';
import P5CitizenVerify from './pages/P5CitizenVerify';
import PaymentPage from './pages/PaymentPage';
import QRVerifyPage from './pages/QRVerifyPage';

// Auth & 4 Role Dashboards
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import UserDashboard from './pages/UserDashboard';
import RegisterOfficeDashboard from './pages/RegisterOfficeDashboard';
import AcLandDashboard from './pages/AcLandDashboard';
import MinistryAdminDashboard from './pages/MinistryAdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen animated-bg grid-bg">
          <Navbar />
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<P5CitizenVerify />} />
            <Route path="/payment/:record_id" element={<PaymentPage />} />
            <Route path="/qr-verify/:qr_code_id" element={<QRVerifyPage />} />

            {/* Protected Internal Modules */}
            <Route
              path="/p3-fraud"
              element={
                <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                  <P3FraudDetection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registry"
              element={
                <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                  <P4RegistryPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ac-land"
              element={
                <ProtectedRoute allowedRoles={['AC Land Office', 'Super Admin']}>
                  <P4AcLandPanel />
                </ProtectedRoute>
              }
            />

            {/* Auth Single Login & Register */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />

            {/* 4 Separate Dashboards Based on Role */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute allowedRoles={['User', 'Super Admin']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/register-office/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Register Office', 'Super Admin']}>
                  <RegisterOfficeDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ac-land/dashboard"
              element={
                <ProtectedRoute allowedRoles={['AC Land Office', 'Super Admin']}>
                  <AcLandDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <MinistryAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
