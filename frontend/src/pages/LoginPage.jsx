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
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      background: '#f0f4f8',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in-up">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Logo */}
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px',
            boxShadow: '0 4px 14px rgba(26,107,60,0.35)',
          }}>🏛️</div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#15803d',
            fontSize: '11px',
            fontWeight: '700',
            marginBottom: '14px',
            letterSpacing: '0.02em',
          }}>
            <ShieldCheck size={12} /> সুরক্ষিত সরকারি প্রবেশদ্বার · e-ভূমি বাংলাদেশ
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            ই-ভূমি সিস্টেমে লগইন করুন
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.65, margin: 0 }}>
            আপনার ইমেইল ও পাসওয়ার্ড দিন। সিস্টেম রোল অনুযায়ী স্বয়ংক্রিয়ভাবে পোর্টালে নিয়ে যাবে।
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px' }}>

          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>🔐</div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>একক লগইন পোর্টাল</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>স্বয়ংক্রিয় রোল-ভিত্তিক রিডাইরেক্ট</p>
            </div>
          </div>

          {/* Success Alert from Registration Verification */}
          {successMessage && (
            <div style={{
              padding: '12px 14px',
              background: '#ecfdf5',
              border: '1.5px solid #86efac',
              borderRadius: '10px',
              color: '#15803d',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
            }}>
              <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div style={{
              padding: '11px 14px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#374151',
                marginBottom: '6px',
                fontWeight: '600',
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
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#374151',
                marginBottom: '6px',
                fontWeight: '600',
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
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '13px',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                width: '100%',
              }}
            >
              {loading ? (
                <><span className="loader" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }} /> যাচাই হচ্ছে...</>
              ) : (
                <><LogIn size={17} /> লগইন করুন</>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b',
          }}>
            নতুন নাগরিক অ্যাকাউন্ট নেই?{' '}
            <Link to="/register" style={{ color: '#1a6b3c', fontWeight: '700', textDecoration: 'none' }}>
              নিবন্ধন করুন
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '20px', lineHeight: 1.6 }}>
          🔒 এই পোর্টালটি বাংলাদেশ সরকারের অনুমোদিত সংস্থার জন্য সংরক্ষিত।
          অননুমোদিত প্রবেশ আইনত দণ্ডনীয়।
        </p>
      </div>
    </div>
  );
}
