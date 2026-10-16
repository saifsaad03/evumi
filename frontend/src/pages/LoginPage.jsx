import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Lock, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardRoute } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registeredSuccess
      ? location.state?.message || '🎉 আপনার রেজিস্ট্রেশন সফল হয়েছে! অনুগ্রহ করে এখন পাসওয়ার্ড দিয়ে লগইন করুন।'
      : null
  );

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      const targetRoute = getDashboardRoute(res.user.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.status === 500 ? 'সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : null)
        || (err.response?.status === 401 ? 'ভুল ইমেইল বা পাসওয়ার্ড!' : null)
        || (err.message && !err.message.includes('status code') ? err.message : null)
        || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: 'calc(100vh - 62px)',
      minHeight: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      position: 'relative',
      backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.93) 0%, rgba(240, 253, 244, 0.89) 50%, rgba(255, 255, 255, 0.94) 100%), url('/images/bg.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '18px',
        padding: '24px 24px 20px',
        boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        boxSizing: 'border-box'
      }} className="login-card-animate">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img 
            src="/images/logo.png" 
            alt="e-ভূমি লোগো" 
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain',
              margin: '0 auto 8px',
              display: 'block'
            }} 
          />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 12px',
            borderRadius: '999px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#15803d',
            fontSize: '11px',
            fontWeight: '700',
            marginBottom: '6px',
          }}>
            <ShieldCheck size={12} /> সুরক্ষিত সরকারি প্রবেশদ্বার
          </div>

          <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 3px', lineHeight: 1.2 }}>
            ই-ভূমি সিস্টেমে লগইন
          </h1>
          <p style={{ color: '#64748b', fontSize: '11.5px', margin: 0 }}>
            আপনার ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
          </p>
        </div>

        {/* Success Alert from Registration Verification */}
        {successMessage && (
          <div style={{
            padding: '8px 12px',
            background: '#ecfdf5',
            border: '1.5px solid #86efac',
            borderRadius: '8px',
            color: '#15803d',
            fontSize: '11.5px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
          }}>
            <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '8px 12px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '11.5px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11.5px',
              color: '#374151',
              marginBottom: '3px',
              fontWeight: '700',
            }}>
              ইমেইল ঠিকানা
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                autoFocus
                className="input-field"
                placeholder="নাম@gov.bd বা email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', height: '38px', paddingLeft: '34px', fontSize: '12.5px', borderRadius: '8px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1' }}
              />
              <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11.5px',
              color: '#374151',
              marginBottom: '3px',
              fontWeight: '700',
            }}>
              পাসওয়ার্ড
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="input-field"
                placeholder="আপনার পাসওয়ার্ড লিখুন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', height: '38px', paddingLeft: '34px', fontSize: '12.5px', borderRadius: '8px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1' }}
              />
              <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '10px',
              height: '40px',
              fontSize: '13.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
              width: '100%',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              cursor: 'pointer'
            }}
          >
            {loading ? (
              <><span className="loader" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }} /> যাচাই হচ্ছে...</>
            ) : (
              <><LogIn size={16} /> লগইন করুন</>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div style={{
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
        }}>
          নতুন নাগরিক অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" style={{ color: '#047857', fontWeight: '800', textDecoration: 'none' }}>
            নিবন্ধন করুন
          </Link>
        </div>

        {/* Security Note */}
        <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.4 }}>
          🔒 বাংলাদেশ সরকারের ভূমি মন্ত্রণালয় অনুমোদিত সুরক্ষিত প্রবেশদ্বার।
        </p>
      </div>
    </div>
  );
}
