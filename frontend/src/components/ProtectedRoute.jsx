import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#94a3b8',
        fontSize: '16px'
      }}>
        লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '30px', textAlign: 'center' }} className="glass-card">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171', marginBottom: '10px' }}>
          অননুমোদিত প্রবেশাধিকার
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
          আপনার বর্তমান রোল (<strong>{user.role}</strong>) এই ড্যাশবোর্ড ব্যবহারের অনুমতিপ্রাপ্ত নয়।
        </p>
        <a
          href="/"
          className="btn-primary"
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          হোমে ফিরে যান
        </a>
      </div>
    );
  }

  return children;
}
